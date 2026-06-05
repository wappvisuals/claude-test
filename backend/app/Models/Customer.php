<?php

namespace App\Models;

use App\Traits\CustomerChangeLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    use CustomerChangeLogger;

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
        'birthdate',
        'comments',
        'reminders',
        'organization_id',
    ];

    public function organization()
    {
        return $this->belongsTo(CustomerOrganization::class, 'organization_id', 'id');
    }

    /** GDPR record for this customer (one-to-one). */
    public function gdpr(): HasOne
    {
        return $this->hasOne(GdprCustomer::class, 'customer_id', 'to_user');
    }

    /** Audit-trail entries for this customer. */
    public function changes(): HasMany
    {
        return $this->hasMany(CustomerChange::class, 'change_user_id', 'to_user');
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
