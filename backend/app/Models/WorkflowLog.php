<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Legacy `workflow_logs` — reminder / workflow dispatch history (by customer).
 * Only `created_at` (no updated_at).
 */
class WorkflowLog extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'workflow_logs';

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'created_at' => 'datetime',
    ];
}
