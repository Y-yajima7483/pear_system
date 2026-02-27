<?php

namespace App\Models\ShipmentRecordDetail;

use App\Models\ShipmentRecord\ShipmentRecord;
use App\Models\ShipmentType\ShipmentType;
use App\Models\Variety\Variety;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentRecordDetail extends Model
{
    protected $table = 'shipment_record_details';

    protected $fillable = [
        'shipment_record_id',
        'variety_id',
        'shipment_type_id',
        'grade_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function shipmentRecord(): BelongsTo
    {
        return $this->belongsTo(ShipmentRecord::class);
    }

    public function shipmentType(): BelongsTo
    {
        return $this->belongsTo(ShipmentType::class);
    }

    public function variety(): BelongsTo
    {
        return $this->belongsTo(Variety::class);
    }
}
