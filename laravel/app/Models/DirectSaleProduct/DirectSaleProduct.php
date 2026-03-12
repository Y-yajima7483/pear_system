<?php

namespace App\Models\DirectSaleProduct;

use App\Models\Product\Product;
use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectSaleProduct extends Model
{
    protected $table = 'direct_sale_products';

    protected $fillable = [
        'shipment_record_detail_id',
        'product_id',
        'fruit_quantity',
        'box_quantity',
    ];

    protected $casts = [
        'fruit_quantity' => 'integer',
        'box_quantity' => 'integer',
    ];

    public function shipmentRecordDetail(): BelongsTo
    {
        return $this->belongsTo(ShipmentRecordDetail::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
