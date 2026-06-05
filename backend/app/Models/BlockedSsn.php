<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedSsn extends Model
{
    protected $table = 'blocked_ssns';

    protected $fillable = [
        'ssn',
        'reason',
        'added_by',
    ];

    /** Whether the given SSN is on the blocklist. */
    public static function isBlocked(?string $ssn): bool
    {
        if (!$ssn) {
            return false;
        }

        return static::query()->where('ssn', $ssn)->exists();
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by', 'id');
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (self $model) {
            if (!$model->added_by) {
                $model->added_by = auth()->id();
            }
        });
    }
}
