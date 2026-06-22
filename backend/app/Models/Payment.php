<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'remote_payment_id',
        'invoice_id',
        'sub_account_id',
        'customer_id',
        'bank_account_id',
        'payer_name',
        'reference',
        'sum',
        'date',
        'source',
        'is_processed',
    ];

    protected $casts = [
        'sum' => 'float',
        'is_processed' => 'boolean',
        'date' => 'date:Y-m-d',
    ];

    public function results(): HasMany
    {
        return $this->hasMany(PaymentResult::class, 'payment_id', 'id');
    }
}
