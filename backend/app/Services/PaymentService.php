<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentResult;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Local-DB payments. A manual payment creates a `payments` row + a matching
 * `payment_results` row (status fully_matched) and reduces the invoice balance.
 * Legacy enqueues a partner reconciliation job — stubbed here (see plan §5).
 */
class PaymentService
{
    /** Payments applied to an invoice (through payment_results). */
    public function listForInvoice(int $invoiceId): Collection
    {
        $invoice = $this->findInvoice($invoiceId);

        return Payment::query()
            ->whereIn('id', PaymentResult::query()->where('invoice_id', $invoice->id)->pluck('payment_id'))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();
    }

    public function addManual(int $invoiceId, array $data): Payment
    {
        $invoice = $this->findInvoice($invoiceId);

        return DB::transaction(function () use ($invoice, $data) {
            $sum = round((float) $data['sum'], 2);

            $payment = Payment::query()->create([
                'invoice_id' => $invoice->id,
                'sub_account_id' => $invoice->sub_account_id,
                'customer_id' => $invoice->customer_id,
                'payer_name' => $data['payer_name'] ?? null,
                'reference' => $data['reference'] ?? null,
                'sum' => $sum,
                'date' => $data['date'] ?? now()->toDateString(),
                'source' => 'manual',
                'is_processed' => true,
            ]);

            PaymentResult::query()->create([
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $sum,
                'balance' => round(max(0, (float) $invoice->balance - $sum), 2),
                'status' => 'fully_matched',
                'is_sent' => false,
            ]);

            $invoice->update(['balance' => round(max(0, (float) $invoice->balance - $sum), 2)]);

            return $payment;
        });
    }

    private function findInvoice(int $invoiceId): Invoice
    {
        $invoice = Invoice::query()->find($invoiceId);

        if (! $invoice) {
            throw new RuntimeException("Invoice not found: $invoiceId");
        }

        return $invoice;
    }
}
