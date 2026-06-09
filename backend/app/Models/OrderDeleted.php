<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Legacy `orders_deleted` mirror. Bound read-only — used only to count a
 * subscription's historical (removed) orders for the commitment progress.
 */
class OrderDeleted extends Model
{
    protected $table = 'orders_deleted';

    public $timestamps = false;
}
