<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Cancel-reason lookup (hierarchical via parent_id). Bound read-only.
 */
class SubscriptionInactivationMenu extends Model
{
    protected $table = 'subscription_inactivation_menus';

    public $timestamps = false;

    protected $casts = [
        'status' => 'integer',
    ];
}
