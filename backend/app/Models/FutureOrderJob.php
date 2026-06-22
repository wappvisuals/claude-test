<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FutureOrderJob extends Model
{
    protected $table = 'future_order_jobs';

    protected $fillable = [
        'subscription_id',
        'batch',
        'status',
        'payload',
        'execute_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'execute_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscription_id', 'id');
    }
}
