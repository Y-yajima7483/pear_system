<?php

namespace App\Models\ShipmentType;

use Illuminate\Database\Eloquent\Model;

class ShipmentType extends Model
{
    protected $table = 'shipment_types';

    protected $fillable = [
        'name',
        'sort_order',
    ];
}
