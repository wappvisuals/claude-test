<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Read-only product reference. `products` has no human `name` column — the
 * display name is resolved from the first non-deleted `products_component`.
 */
class Product extends Model
{
    protected $table = 'products';

    protected $primaryKey = 'prod_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $casts = [
        'is_pre_financed' => 'boolean',
    ];

    public function components(): HasMany
    {
        return $this->hasMany(ProductComponent::class, 'prod_id', 'prod_id');
    }

    public function international(): HasMany
    {
        return $this->hasMany(ProductInternational::class, 'product_id', 'prod_id');
    }

    /** Best-effort display name (first component name), falling back to prod id. */
    public function getDisplayNameAttribute(): string
    {
        $name = $this->components()->whereNull('deleted_at')->value('name');

        return $name ? trim(strip_tags($name)) : (string) $this->prod_id;
    }
}
