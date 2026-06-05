<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SinfridAccountMember extends Model
{
    use SoftDeletes;

    protected $table = 'sinfrid_account_member';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'account_id',
        'ssn',
        'first_name',
        'last_name',
        'email',
        'phone',
        'city',
        'street',
        'zipcode',
        'lang_code',
        'country_code',
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

    public function getIsDeactivatedAttribute(): bool
    {
        return !is_null($this->deactivated_at);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(SinfridAccount::class, 'account_id', 'id');
    }

    public function reactivate(): bool
    {
        if ($this->is_deactivated) {
            return $this->update(['status' => true, 'deactivated_at' => null]);
        }

        return false;
    }

    public function deactivate(): bool
    {
        if (!$this->is_deactivated) {
            return $this->update(['status' => false, 'deactivated_at' => now()]);
        }

        return false;
    }
}
