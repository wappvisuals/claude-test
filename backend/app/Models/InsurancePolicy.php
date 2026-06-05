<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsurancePolicy extends Model
{
    protected $table = 'insurance_policy';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'customer_id',
        'request_id',
        'external_customer_id',
        'product',
        'start_date',
        'end_date',
        'partner_reference',
        'metadata',
        'relationship',
        'status',
        'status_message',
        'source',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'to_user');
    }

    public function setSourceAttribute($value): void
    {
        $this->attributes['source'] = $value ?: 'manual';
    }
}
