<?php

namespace App\Services;

use App\Models\Order;
use RuntimeException;

/**
 * Local-DB refunds. Legacy PaymentRefundService refunds via partner gateways
 * (Capway/Riverty/Zoho) + credit notes; here a refund is recorded locally on
 * the order (`metadata.refunds[]`) — full or partial per line item. Wire a real
 * RefundGateway here when a partner is integrated (see plan §5/§6).
 */
class RefundService
{
    public function refund(int $orderId, array $data): Order
    {
        $order = Order::query()->find($orderId);
        if (! $order) {
            throw new RuntimeException("Order not found: $orderId");
        }

        $mode = $data['mode']; // full | partial
        $lines = $data['lines'] ?? [];

        $amount = $mode === 'full'
            ? (float) $order->total
            : round(array_sum(array_map(fn ($l) => (float) ($l['amount'] ?? 0), $lines)), 2);

        if ($amount <= 0) {
            throw new RuntimeException('Refund amount must be greater than zero.');
        }

        $metadata = $order->metadata ?? [];
        $refunds = $metadata['refunds'] ?? [];
        $refunds[] = [
            'mode' => $mode,
            'amount' => $amount,
            'lines' => $mode === 'partial' ? array_values($lines) : [],
            'reason' => $data['reason'] ?? null,
            'created_at' => now()->toDateTimeString(),
            'initiator' => null,
        ];
        $metadata['refunds'] = $refunds;

        $order->metadata = $metadata;
        $order->save();

        return $order->fresh(['customer', 'product']);
    }
}
