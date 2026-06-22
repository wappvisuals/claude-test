<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Local-DB invoice management. An invoice's `invoice_id` equals the order id.
 * Legacy due-date / payment-link changes fire partner `InvoiceUpdated` events;
 * here those are local-only (no partner gateway) — see plan §5.
 */
class InvoiceService
{
    /** Invoices for an order (invoice_id == order id). */
    public function listForOrder(int $orderId): Collection
    {
        if (! Order::query()->whereKey($orderId)->exists()) {
            throw new RuntimeException("Order not found: $orderId");
        }

        return Invoice::query()
            ->where('invoice_id', (string) $orderId)
            ->orderByDesc('id')
            ->get();
    }

    public function getDetails(int $id): Invoice
    {
        return $this->find($id)->load('customer');
    }

    /** Change the due date (local update; partner event stubbed). */
    public function alterDueDate(int $id, string $dueDate): Invoice
    {
        $invoice = $this->find($id);
        $invoice->update(['due_date' => $dueDate]);

        return $invoice->fresh();
    }

    /** Regenerate the payment link (stub: stores a local placeholder link). */
    public function regeneratePaymentLink(int $id): Invoice
    {
        $invoice = $this->find($id);

        $metadata = $invoice->metadata ?? [];
        $metadata['payment_link'] = 'https://pay.local/'.Str::uuid();
        $invoice->update(['metadata' => $metadata]);

        return $invoice->fresh();
    }

    /** Reminder history for the invoice's customer (workflow_logs). */
    public function remindersList(int $id): Collection
    {
        $invoice = $this->find($id);

        return $invoice->reminders()
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();
    }

    private function find(int $id): Invoice
    {
        $invoice = Invoice::query()->find($id);

        if (! $invoice) {
            throw new RuntimeException("Invoice not found: $id");
        }

        return $invoice;
    }
}
