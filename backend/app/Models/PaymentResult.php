<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentResult extends Model
{
    protected $table = 'payment_results';

    protected $fillable = [
        'payment_id',
        'invoice_id',
        'remote_payment_id',
        'amount',
        'rebate',
        'balance',
        'status',
        'is_sent',
    ];

    protected $casts = [
        'amount' => 'float',
        'rebate' => 'float',
        'balance' => 'float',
        'is_sent' => 'boolean',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'id');
    }
}
