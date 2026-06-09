<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Region-specific product naming (legacy ProductHelper::getIntlName). Composite
 * (product_id, region_code) — bound read-only for name lookups.
 */
class ProductInternational extends Model
{
    protected $table = 'products_international';

    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = null;
}
