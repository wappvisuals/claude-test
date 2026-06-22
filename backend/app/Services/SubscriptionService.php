<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\EventLog;
use App\Models\ProductInternational;
use App\Models\Subscription;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Local-DB subscription management. Mirrors the legacy Store/SubscriptionService
 * surface needed by the admin UI: per-customer list, detail, edit
 * (next-shipment), and deactivate-with-reason. Legacy churn-date recalculation,
 * winback, invoice-partner side effects, and order deletion are intentionally
 * out of scope here (see plan §6.3).
 */
class SubscriptionService
{
    private const EMPTY_DATE = '0000-00-00';

    /**
     * Per-customer subscriptions, grouped by `remote_id` like the legacy
     * customer profile (single-item groups fall into "default" and render as
     * standalone rows). Supports brand + status filters and adds commitment
     * progress (order_count / product.time+1).
     *
     * @return array{data: array, meta: array}
     */
    public function getListForCustomer(int $customerId, array $params = []): array
    {
        $customer = Customer::query()->where('to_user', $customerId)->first();
        if (! $customer) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        $perPage = min((int) ($params['per_page'] ?? 100), 500);
        $dir = strtolower((string) ($params['sort_dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Subscription::query()
            ->with('product', 'cancelReason')
            ->withCount(['orders', 'ordersDeleted'])
            ->where('user_id', $customerId);

        // Brand filter (products.brand)
        if (! empty($params['brand']) && strtolower((string) $params['brand']) !== 'all') {
            $query->whereHas('product', fn ($q) => $q->where('brand', $params['brand']));
        }

        // Status filter: All (default) / Active / Cancelled
        $status = strtolower((string) ($params['status'] ?? 'all'));
        if ($status === 'active') {
            $query->where('active', 1);
        } elseif ($status === 'cancelled') {
            $query->where('active', 0);
        }

        $total = (clone $query)->count();
        $subscriptions = $query->orderBy('id', $dir)->limit($perPage)->get();

        $names = $this->resolveNames($subscriptions, $customer->region_code);
        $groups = $this->group($subscriptions, $names);

        return [
            'data' => $groups,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'returned' => $subscriptions->count(),
                'group_count' => count($groups),
            ],
        ];
    }

    /** Map prod_id => region-specific name for the customer's region. */
    private function resolveNames(Collection $subscriptions, ?string $region): Collection
    {
        $prodIds = $subscriptions->pluck('subscription_id')->filter()->unique()->values();
        if ($prodIds->isEmpty()) {
            return collect();
        }

        return ProductInternational::query()
            ->where('region_code', $region)
            ->whereIn('product_id', $prodIds)
            ->pluck('name', 'product_id');
    }

    /** Build a subscription row (incl. commitment progress). */
    private function item(Subscription $s, Collection $names): array
    {
        $commitment = (int) ($s->product->time ?? 0) + 1;
        $orderCount = (int) $s->orders_count + (int) $s->orders_deleted_count;

        return [
            'id' => $s->id,
            'remote_id' => $s->remote_id,
            'prod_id' => $s->subscription_id,
            'product_name' => $names[$s->subscription_id] ?? null,
            'brand' => $s->product->brand ?? null,
            'active' => (int) $s->active,
            'status' => $s->active ? 'Active' : 'Inactive',
            'order_count' => $orderCount,
            'commitment' => $commitment,
            'next_shipment' => $this->date($s->next_shipment),
            'date_started' => $this->date($s->date_started),
            'date_cancelled' => $this->date($s->date_cancelled),
            'date_churned' => $this->date($s->date_churned),
            'date_inactivated' => $this->date($s->date_inactivated),
            'days' => $this->daysUntil($s->next_shipment),
            'reference' => $s->ref,
            'cancel_method' => $s->cancel_method,
            'cancel_reason' => $s->cancelReason->name ?? null,
            'final_invoice' => $this->date($s->final_invoice),
            'is_pre_financed' => (bool) $s->is_pre_financed,
            'pre_finance_count' => (int) $s->pre_finance_count,
        ];
    }

    /**
     * Group by remote_id; multi-item groups keep their key, single-item groups
     * collapse into standalone (is_group=false) rows — matching the legacy
     * CustomerProfileService remote_id aggregation.
     */
    private function group(Collection $subscriptions, Collection $names): array
    {
        $byRemote = $subscriptions->groupBy(fn ($s) => $s->remote_id ?: 'default');

        $multi = [];
        $singles = collect();

        foreach ($byRemote as $key => $group) {
            if ($key === 'default' || $group->count() === 1) {
                $singles = $singles->merge($group);

                continue;
            }
            $multi[$key] = $group;
        }

        $groups = [];

        foreach ($multi as $key => $group) {
            $items = $group->sortBy('id')->values()
                ->map(fn ($s, $i) => $this->item($s, $names) + ['sequence' => $i + 1])
                ->all();

            $groups[] = [
                'group_key' => (string) $key,
                'is_group' => true,
                'label' => $items[0]['product_name'] ?? ('#'.$key),
                'brand' => $items[0]['brand'] ?? null,
                'items' => $items,
            ];
        }

        foreach ($singles->sortBy('id')->values() as $s) {
            $item = $this->item($s, $names) + ['sequence' => null];
            $groups[] = [
                'group_key' => 'default-'.$s->id,
                'is_group' => false,
                'label' => $item['product_name'],
                'brand' => $item['brand'],
                'items' => [$item],
            ];
        }

        return $groups;
    }

    /** Active / cancelled counts for the customer profile stat card. */
    public function statsForCustomer(int $customerId): array
    {
        $base = Subscription::query()->where('user_id', $customerId);

        return [
            'active' => (clone $base)->where('active', 1)->count(),
            'cancelled' => (clone $base)->where('active', 0)->count(),
        ];
    }

    public function getDetails(int $id): Subscription
    {
        return $this->find($id)->load('product', 'cancelReason', 'customer');
    }

    /** Edit: change the next-shipment date. */
    public function alter(int $id, array $data): Subscription
    {
        $subscription = $this->find($id);
        $subscription->update(['next_shipment' => $data['next_shipment']]);

        return $subscription->fresh(['product', 'cancelReason']);
    }

    /** Deactivate with a reason (sets active=0 + cancel fields + dates). */
    public function deactivate(int $id, array $data): Subscription
    {
        $subscription = $this->find($id);

        $today = now()->toDateString();
        $subscription->update([
            'active' => 0,
            'cancel_reason' => $data['reason_id'] ?? $subscription->cancel_reason,
            'cancel_method' => $data['method'] ?? $subscription->cancel_method,
            'date_inactivated' => $today,
            'date_cancelled' => $subscription->date_cancelled && $subscription->date_cancelled !== self::EMPTY_DATE
                ? $subscription->date_cancelled
                : $today,
        ]);

        return $subscription->fresh(['product', 'cancelReason']);
    }

    /** Reactivate a deactivated subscription (clears cancel state). */
    public function reactivate(int $id): Subscription
    {
        $subscription = $this->find($id);
        $subscription->update([
            'active' => 1,
            'cancel_method' => null,
            'cancel_category' => null,
            'cancel_reception' => null,
            'cancel_reason' => null,
            'date_cancelled' => null,
            'date_churned' => null,
            'date_inactivated' => null,
        ]);

        return $subscription->fresh(['product', 'cancelReason']);
    }

    /** Set or unset the final-invoice flag (date when set, null when unset). */
    public function setFinalInvoice(int $id, string $action, array $data = []): Subscription
    {
        $subscription = $this->find($id);
        $subscription->update([
            'final_invoice' => $action === 'set' ? ($data['date'] ?? now()->toDateString()) : null,
        ]);

        return $subscription->fresh(['product', 'cancelReason']);
    }

    /** Subscription event trail (event_log by sub_id, newest first). */
    public function eventLog(int $id): Collection
    {
        $this->find($id);

        return EventLog::query()
            ->where('sub_id', $id)
            ->orderByDesc('date_added')
            ->orderByDesc('id')
            ->limit(100)
            ->get();
    }

    private function find(int $id): Subscription
    {
        $subscription = Subscription::query()->find($id);

        if (! $subscription) {
            throw new RuntimeException("Subscription not found: $id");
        }

        return $subscription;
    }

    /** Normalize legacy '0000-00-00' sentinels to null. */
    private function date(?string $value): ?string
    {
        return ($value === null || $value === self::EMPTY_DATE) ? null : $value;
    }

    /** Whole days from today until the given date (null if no valid date). */
    private function daysUntil(?string $value): ?int
    {
        $date = $this->date($value);
        if (! $date) {
            return null;
        }

        return (int) floor(now()->startOfDay()->diffInDays($date, false));
    }
}
