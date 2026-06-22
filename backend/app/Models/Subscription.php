<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Legacy `subscriptions` table. Has working created_at/updated_at. Several
 * date columns use the sentinel '0000-00-00' — normalize to null in resources.
 * `cancel_reason` is an int FK to subscription_inactivation_menus.id.
 */
class Subscription extends Model
{
    protected $table = 'subscriptions';

    protected $fillable = [
        'active',
        'next_shipment',
        'cancel_method',
        'cancel_category',
        'cancel_reception',
        'cancel_reason',
        'date_cancelled',
        'date_inactivated',
        'date_churned',
        'final_invoice',
    ];

    protected $casts = [
        'active' => 'integer',
        'i' => 'integer',
        'is_pre_financed' => 'integer',
        'pre_finance_count' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'user_id', 'to_user');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'subscription_id', 'prod_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'subscription_id', 'id');
    }

    public function ordersDeleted(): HasMany
    {
        return $this->hasMany(OrderDeleted::class, 'subscription_id', 'id');
    }

    public function cancelReason(): BelongsTo
    {
        return $this->belongsTo(SubscriptionInactivationMenu::class, 'cancel_reason', 'id');
    }
}
