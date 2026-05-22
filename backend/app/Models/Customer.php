<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table      = 'customer_profile';
    protected $primaryKey = 'to_user';
    public    $timestamps = false;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'alternative_email',
        'tel',
        'alternative_tel',
        'careof',
        'adress',
        'post_nr',
        'ort',
        'region_code',
        'sex',
        'pers_nr',
        'comments',
        'reminders',
        'organization_id',
    ];

    public function organization()
    {
        return $this->belongsTo(CustomerOrganization::class, 'organization_id', 'id');
    }

    protected $casts = [
        'do_not_call'        => 'boolean',
        'difficult_customer' => 'boolean',
        'want_newsletter'    => 'boolean',
        'reminders'          => 'boolean',
        'ledgers'            => 'array',
        'blocked_fees'       => 'array',
    ];
}
