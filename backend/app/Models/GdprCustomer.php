<?php

namespace App\Models;

use App\Enums\GdprExclusionType;
use App\Enums\GdprStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GdprCustomer extends Model
{
    protected $table = 'gdpr_customers';

    protected $fillable = [
        'uuid',
        'customer_id',
        'status',
        'exclusion_type',
        'flagged_at',
        'anonymized_at',
        'restored_at',
        'encrypted_backup',
        'phone',
        'requested_by',
        'source',
    ];

    protected $casts = [
        'status' => GdprStatus::class,
        'exclusion_type' => GdprExclusionType::class,
        'flagged_at' => 'datetime',
        'anonymized_at' => 'datetime',
        'restored_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'to_user');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by', 'id');
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (self $model) {
            if (!$model->requested_by) {
                $model->requested_by = auth()->id();
            }
        });

        static::updating(static function (self $model) {
            if ($model->isDirty('status') && $model->status instanceof GdprStatus) {
                match ($model->status) {
                    GdprStatus::Anonymized => $model->anonymized_at = now(),
                    GdprStatus::Restored => $model->restored_at = now(),
                    default => null,
                };
            }
        });
    }
}
