<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\ProductInternational;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Local-DB order management. The legacy Store/OrderService moves rows to
 * orders_deleted and runs invoice-partner credit/recover on cancel; here v1
 * marks the order cancelled via a metadata flag + `reason` (see plan §6.4).
 * No partner side effects.
 */
class OrderService
{
    /**
     * Per-customer orders, grouped by region-specific product name like the
     * legacy customer profile (aggregateBy=product). Supports a brand filter.
     *
     * @return array{data: array, meta: array}
     */
    public function getListForCustomer(int $customerId, array $params = []): array
    {
        if (! Customer::query()->where('to_user', $customerId)->exists()) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        $perPage = min((int) ($params['per_page'] ?? 100), 500);

        $query = $this->baseQuery($params)->where('by_user', $customerId);

        if (! empty($params['brand']) && strtolower((string) $params['brand']) !== 'all') {
            $query->whereHas('product', fn ($q) => $q->where('brand', $params['brand']));
        }

        $total = (clone $query)->count();
        $orders = $query->limit($perPage)->get();

        $names = $this->resolveNames($orders);
        $groups = $this->groupByProduct($orders, $names);

        return [
            'data' => $groups,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'returned' => $orders->count(),
                'group_count' => count($groups),
            ],
        ];
    }

    /** Map "prod_id-region" => region-specific product name. */
    private function resolveNames(Collection $orders): Collection
    {
        $prodIds = $orders->pluck('prod_id')->filter()->unique()->values();
        if ($prodIds->isEmpty()) {
            return collect();
        }

        return ProductInternational::query()
            ->whereIn('product_id', $prodIds)
            ->get(['product_id', 'region_code', 'name'])
            ->keyBy(fn ($r) => $r->product_id.'-'.$r->region_code)
            ->map(fn ($r) => $r->name);
    }

    /** Group orders under their product name (header), preserving row order. */
    private function groupByProduct(Collection $orders, Collection $names): array
    {
        $name = fn (Order $o) => $names[$o->prod_id.'-'.$o->region_code] ?? ('#'.$o->prod_id);

        $grouped = $orders->groupBy($name);

        $groups = [];
        foreach ($grouped as $label => $group) {
            $first = $group->first();
            $groups[] = [
                'group_key' => (string) $label,
                'label' => (string) $label,
                'brand' => $first->product->brand ?? null,
                'items' => $group->map(fn (Order $o) => [
                    'id' => $o->id,
                    'prod_id' => $o->prod_id,
                    'product_name' => $name($o),
                    'subscription_id' => $o->subscription_id,
                    'date_added' => $o->date_added,
                    'total' => (float) $o->total,
                    'is_shipped' => (bool) $o->is_shipped,
                    'is_paid' => (bool) $o->is_paid,
                    'is_cancelled' => $o->is_cancelled,
                    'returned' => (bool) data_get($o->metadata, 'returned', false),
                    'ref' => $o->ref,
                    'ref1' => $o->ref1,
                    'region_code' => $o->region_code,
                    'reason' => $o->reason,
                ])->values()->all(),
            ];
        }

        return $groups;
    }

    /** Global order list with status + date-range + ref search filters. */
    public function getList(array $params = []): LengthAwarePaginator
    {
        $query = $this->baseQuery($params)->with('customer');

        if (! empty($params['date_from'])) {
            $query->whereDate('date_added', '>=', $params['date_from']);
        }
        if (! empty($params['date_to'])) {
            $query->whereDate('date_added', '<=', $params['date_to']);
        }
        if (! empty($params['q'])) {
            $q = $params['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('ref', 'like', "%$q%")
                    ->orWhere('ref1', 'like', "%$q%")
                    ->orWhere('id', $q);
            });
        }

        return $query->paginate(min((int) ($params['per_page'] ?? 50), 100));
    }

    /** Approved / pending counts + last order date for the stat card. */
    public function statsForCustomer(int $customerId): array
    {
        $base = Order::query()->where('by_user', $customerId);

        $approved = (clone $base)->where(function ($q) {
            $q->whereNull('metadata')->orWhere('metadata', 'not like', '%"cancelled":true%');
        })->count();

        $lastOrder = (clone $base)->max('date_added');

        return [
            'approved' => $approved,
            'pending' => (clone $base)->where('is_paid', 0)->count(),
            'last_order' => $lastOrder ? substr((string) $lastOrder, 0, 10) : null,
        ];
    }

    public function getDetails(int $id): Order
    {
        $order = Order::query()
            ->with('customer', 'product', 'subscription', 'adjustments.user')
            ->find($id);

        if (! $order) {
            throw new RuntimeException("Order not found: $id");
        }

        return $order;
    }

    /** v1 cancel: flag in metadata + store reason. No partner side effects. */
    public function cancel(int $id, array $data): Order
    {
        $order = $this->findRaw($id);

        $metadata = $order->metadata ?? [];
        $metadata['cancelled'] = true;
        $metadata['cancelled_at'] = now()->toDateTimeString();

        $order->metadata = $metadata;
        $order->reason = $data['reason'] ?? null;
        $order->save();

        return $order->fresh(['customer', 'product']);
    }

    /** Mark / unmark the order as returned (local metadata state). */
    public function setReturn(int $id, string $action, array $data = []): Order
    {
        $order = $this->findRaw($id);
        $metadata = $order->metadata ?? [];

        if ($action === 'set') {
            $metadata['returned'] = true;
            $metadata['return_type'] = $data['type'] ?? null;
            $metadata['returned_at'] = now()->toDateTimeString();
        } else {
            unset($metadata['returned'], $metadata['return_type'], $metadata['returned_at']);
        }

        $order->metadata = $metadata;
        $order->save();

        return $order->fresh(['customer', 'product']);
    }

    /** Append an internal note to the order (local metadata.notes[]). */
    public function addNote(int $id, string $text): Order
    {
        $order = $this->findRaw($id);
        $metadata = $order->metadata ?? [];
        $notes = $metadata['notes'] ?? [];
        $notes[] = ['text' => $text, 'created_at' => now()->toDateTimeString(), 'initiator' => null];
        $metadata['notes'] = $notes;

        $order->metadata = $metadata;
        $order->save();

        return $order->fresh(['customer', 'product']);
    }

    /** Resend the order confirmation email — stubbed (no mailer); records timestamp. */
    public function resendConfirmation(int $id): Order
    {
        $order = $this->findRaw($id);
        $metadata = $order->metadata ?? [];
        $metadata['confirmation_sent_at'] = now()->toDateTimeString();

        $order->metadata = $metadata;
        $order->save();

        return $order->fresh(['customer', 'product']);
    }

    private function findRaw(int $id): Order
    {
        $order = Order::query()->find($id);

        if (! $order) {
            throw new RuntimeException("Order not found: $id");
        }

        return $order;
    }

    private function baseQuery(array $params)
    {
        $query = Order::query()->with('product');

        // status: approved (default, non-cancelled) | cancelled | all
        $status = strtolower((string) ($params['status'] ?? 'approved'));
        if ($status === 'approved') {
            $query->where(function ($q) {
                $q->whereNull('metadata')
                    ->orWhere('metadata', 'not like', '%"cancelled":true%');
            });
        } elseif ($status === 'cancelled') {
            $query->where('metadata', 'like', '%"cancelled":true%');
        }

        $dir = strtolower((string) ($params['sort_dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy('id', $dir);
    }
}
