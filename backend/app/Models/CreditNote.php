<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditNote extends Model
{
    protected $table = 'credit_notes';

    protected $fillable = [
        'credit_note_id',
        'credit_note_number',
        'total',
        'status',
    ];

    protected $casts = [
        'total' => 'float',
    ];
}
