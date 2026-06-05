<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SinfridAccount extends Model
{
    use SoftDeletes;

    protected $table = 'sinfrid_account';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'customer_id',
        'type',
        'plan_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'city',
        'street',
        'zipcode',
        'lang_code',
        'country_code',
        'activation_date',
        'email_confirmed',
        'phone_confirmed',
        'status',
        'last_login_at',
        'deactivated_at',
    ];

    protected $casts = [
        'email_confirmed' => 'bool',
        'phone_confirmed' => 'bool',
        'status' => 'bool',
        'last_login_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    public function getIsActiveAttribute(): bool
    {
        return is_null($this->deactivated_at);
    }

    public function getIsDeactivatedAttribute(): bool
    {
        return !is_null($this->deactivated_at);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'to_user');
    }

    public function familyMembers(): HasMany
    {
        return $this->hasMany(SinfridAccountMember::class, 'account_id', 'id');
    }

    public function alarms(): HasMany
    {
        return $this->hasMany(SinfridMemberAlarm::class, 'account_id', 'id');
    }

    public function reactivate(): bool
    {
        if ($this->is_deactivated) {
            $this->familyMembers->each->reactivate();

            return $this->update(['status' => true, 'deactivated_at' => null]);
        }

        return false;
    }

    public function deactivate(): bool
    {
        if (!$this->is_deactivated) {
            $this->familyMembers->each->deactivate();

            return $this->update(['status' => false, 'deactivated_at' => now()]);
        }

        return false;
    }
}
