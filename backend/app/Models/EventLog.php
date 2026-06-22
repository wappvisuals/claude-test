<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Legacy `event_log` — subscription/customer event trail (`sub_id` links a
 * subscription). No Laravel timestamps (uses `date_added`).
 */
class EventLog extends Model
{
    public $timestamps = false;

    protected $table = 'event_log';

    protected $fillable = [
        'date_added',
        'user_id',
        'ref',
        'prod_id',
        'type',
        'company_type',
        'data',
        'sub_id',
        'initiator',
    ];
}
