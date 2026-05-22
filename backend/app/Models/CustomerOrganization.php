<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerOrganization extends Model
{
    protected $table      = 'customer_organizations';
    protected $primaryKey = 'id';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = ['id', 'name', 'contact_email', 'invoice_email'];
}
