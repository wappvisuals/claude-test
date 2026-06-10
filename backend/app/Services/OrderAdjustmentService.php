<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderAdjustment;
use RuntimeException;

/**
 * Local-DB order adjustments. An adjustment changes a cart line's price: the
 * stored metadata keeps the old/new price + the signed delta (`adj_total`), so
 * the UI can show "Price adjusted from X to Y" and recompute the order total.
 * One adjustment per cart line (re-adjusting the same line updates it). Legacy
 * Store/OrderAdjustmentService also runs invoice-partner side effects — out of
 * scope here (see plan §6.3).
 */
class OrderAdjustmentService
{
    public function store(int $orderId, array $data): OrderAdjustment
    {
        if (! Order::query()->whereKey($orderId)->exists()) {
            throw new RuntimeException("Order not found: $orderId");
        }

        $oldPrice = (float) ($data['old_price'] ?? 0);
        $newPrice = (float) ($data['new_price'] ?? 0);
        $adjTotal = round($newPrice - $oldPrice, 2); // negative = discount

        $type = $adjTotal < 0 ? 'discount' : 'fee';
        $origin = $adjTotal < 0 ? 'manual_remove_fee' : 'manual_added_fee';
        $rowid = $data['rowid'] ?? null;

        $metadata = array_filter([
            'adj_total' => $adjTotal,
            'old_price' => $oldPrice,
            'new_price' => $newPrice,
            'rowid' => $rowid,
            'prod_id' => $data['prod_id'] ?? null,
            'product_name' => $data['product_name'] ?? null,
        ], fn ($v) => $v !== null);

        $payload = [
            'type' => $type,
            'metadata' => $metadata,
            'comment' => $data['comment'] ?? null,
            'origin' => $origin,
            'initiator' => null, // no auth yet
        ];

        // Re-adjusting the same cart line updates the existing adjustment.
        $existing = $rowid
            ? OrderAdjustment::query()->where('order_id', $orderId)->where('metadata->rowid', $rowid)->first()
            : null;

        if ($existing) {
            $existing->update($payload);

            return $existing;
        }

        return OrderAdjustment::query()->create($payload + ['order_id' => $orderId]);
    }

    public function delete(int $orderId, int $adjustmentId): void
    {
        $adjustment = OrderAdjustment::query()
            ->where('order_id', $orderId)
            ->whereKey($adjustmentId)
            ->first();

        if (! $adjustment) {
            throw new RuntimeException("Adjustment not found: $adjustmentId");
        }

        $adjustment->delete();
    }
}
