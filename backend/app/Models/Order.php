<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Legacy `orders` table. No timestamp columns. `cart` is a PHP-serialize()d
 * blob (the line items); `metadata` is JSON. There is no status column — a
 * v1 "cancel" sets `reason` + a flag inside `metadata`.
 */
class Order extends Model
{
    protected $table = 'orders';

    public $timestamps = false;

    protected $casts = [
        'metadata' => 'array',
        'is_processed' => 'boolean',
        'is_shipped' => 'boolean',
        'is_paid' => 'boolean',
        'is_pre_financed' => 'boolean',
        'total' => 'float',
        'total_vat' => 'float',
        'total_excluding_vat' => 'float',
    ];

    protected $fillable = [
        'metadata',
        'reason',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'by_user', 'to_user');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscription_id', 'id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'prod_id', 'prod_id');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(OrderAdjustment::class, 'order_id', 'id');
    }

    /** A v1 order is "cancelled" when the metadata flag is set. */
    public function getIsCancelledAttribute(): bool
    {
        return (bool) data_get($this->metadata, 'cancelled', false);
    }

    /**
     * Unserialize the PHP-serialized `cart` blob into a normalized array of
     * line items (objects coerced to associative arrays). Safe for display.
     */
    public function getCartItemsAttribute(): array
    {
        $raw = $this->attributes['cart'] ?? null;
        if (blank($raw)) {
            return [];
        }

        $data = @unserialize($raw, ['allowed_classes' => true]);
        if ($data === false) {
            return [];
        }

        // Coerce any stdClass / incomplete objects into plain arrays.
        return json_decode(json_encode($data), true) ?: [];
    }
}
