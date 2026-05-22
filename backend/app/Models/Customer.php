<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table      = 'customer_profile';
    protected $primaryKey = 'to_user';
    public    $timestamps = false;

    protected $casts = [
        'do_not_call'        => 'boolean',
        'difficult_customer' => 'boolean',
        'want_newsletter'    => 'boolean',
        'comments'           => 'array',
        'ledgers'            => 'array',
        'blocked_fees'       => 'array',
    ];
}
