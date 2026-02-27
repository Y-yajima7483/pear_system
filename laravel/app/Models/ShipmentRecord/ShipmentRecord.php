<?php

namespace App\Models\ShipmentRecord;

use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShipmentRecord extends Model
{
    protected $table = 'shipment_records';

    protected $fillable = [
        'record_date',
        'total_quantity',
        'notes',
    ];

    protected $casts = [
        'record_date' => 'date:Y-m-d',
        'total_quantity' => 'integer',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(ShipmentRecordDetail::class);
    }
}
