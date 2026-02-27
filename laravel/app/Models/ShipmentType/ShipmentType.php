<?php

namespace App\Models\ShipmentType;

use Illuminate\Database\Eloquent\Model;

class ShipmentType extends Model
{
    const TYPE_DIRECT = 1;

    const TYPE_JA = 2;

    protected $table = 'shipment_types';

    protected $fillable = [
        'name',
        'sort_order',
    ];
}
