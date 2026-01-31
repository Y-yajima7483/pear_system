<?php

namespace App\Models\OrderItem;

use App\Models\Order\Order;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * 対応テーブル
     */
    protected $table = 'order_items';

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'is_prepared',
    ];

    /**
     * 型キャスト
     */
    protected $casts = [
        'quantity' => 'integer',
        'is_prepared' => 'boolean',
    ];

    /**
     * 親注文（order_items.order_id -> orders.id）
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 商品（order_items.product_id -> products.id）
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 小計（product.price × quantity）を取得するアクセサ
     * priceがnullの場合はnullを返す
     */
    public function getSubtotalAttribute(): ?int
    {
        // productリレーション未ロード時は必要に応じて遅延ロードされます
        $price = optional($this->product)->price;

        return is_null($price)
            ? null
            : (int) $price * (int) $this->quantity;
    }
}
