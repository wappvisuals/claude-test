<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductComponent extends Model
{
    use SoftDeletes;

    protected $table = 'products_component';

    public $timestamps = false;
}
