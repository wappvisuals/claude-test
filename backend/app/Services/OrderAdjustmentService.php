<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderAdjustment;
use RuntimeException;

/**
 * Local-DB order adjustments. Legacy Store/OrderAdjustmentService branches per
 * invoice partner (zoho/riverty/capway) creating payments + invoice events; v1
 * persists a single adjustment row with a signed total (see plan §6.3). No
 * partner side effects.
 */
class OrderAdjustmentService
{
    public function store(int $orderId, array $data): OrderAdjustment
    {
        if (! Order::query()->whereKey($orderId)->exists()) {
            throw new RuntimeException("Order not found: $orderId");
        }

        $type = $data['type']; // fee | discount
        $amount = (float) $data['amount'];
        // Discounts are stored as a negative total; fees positive.
        $adjTotal = $type === 'discount' ? -abs($amount) : abs($amount);

        $origin = $type === 'discount' ? 'manual_remove_fee' : 'manual_added_fee';

        return OrderAdjustment::query()->create([
            'order_id' => $orderId,
            'type' => $type,
            // Target a specific cart line so the UI can show it per product.
            'metadata' => array_filter([
                'adj_total' => $adjTotal,
                'rowid' => $data['rowid'] ?? null,
                'prod_id' => $data['prod_id'] ?? null,
                'product_name' => $data['product_name'] ?? null,
            ], fn ($v) => $v !== null),
            'comment' => $data['comment'] ?? null,
            'origin' => $origin,
            'initiator' => null, // no auth yet
        ]);
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
