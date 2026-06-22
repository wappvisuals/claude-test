<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * Legacy `invoices` table. `invoice_id` (the invoice number) equals the
 * order id, so an invoice links to its order via invoice_id → orders.id.
 * Payments are reached through payment_results (HasManyThrough).
 */
class Invoice extends Model
{
    protected $table = 'invoices';

    protected $fillable = [
        'due_date',
        'balance',
        'status',
        'metadata',
    ];

    protected $casts = [
        'total' => 'float',
        'balance' => 'float',
        'metadata' => 'array',
        'date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'invoice_id', 'id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'to_user');
    }

    public function paymentResults(): HasMany
    {
        return $this->hasMany(PaymentResult::class, 'invoice_id', 'id');
    }

    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Payment::class,
            PaymentResult::class,
            'invoice_id', // FK on payment_results → invoices.id
            'id',         // local key on payments
            'id',         // local key on invoices
            'payment_id'  // FK on payment_results → payments.id
        );
    }

    /** Reminder history is keyed by the invoice's customer. */
    public function reminders(): HasMany
    {
        return $this->hasMany(WorkflowLog::class, 'customer_id', 'customer_id');
    }
}
