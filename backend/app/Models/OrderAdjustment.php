<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Legacy `order_adjustments` table. Only `created_at` (no `updated_at`).
 * `metadata` JSON holds the adjusted cart + signed `adj_total`.
 */
class OrderAdjustment extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'order_adjustments';

    protected $fillable = [
        'order_id',
        'type',
        'metadata',
        'comment',
        'origin',
        'initiator',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator', 'id');
    }
}
