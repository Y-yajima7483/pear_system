<?php

namespace App\Models\Product;

use App\Models\OrderItem\OrderItem;
use App\Models\Variety\Variety;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $sku
 * @property string $name
 * @property int|null $price
 * @property bool $is_shipping
 * @property bool $is_active
 * @property int|null $variety_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder|static active()
 * @method static \Illuminate\Database\Eloquent\Builder|static shippable()
 */
class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    /** 一括代入を許可する属性 */
    protected $fillable = [
        'sku',
        'name',
        'price',
        'is_shipping',
        'is_active',
        'variety_id',
    ];

    /** 型キャスト */
    protected $casts = [
        'price' => 'integer',
        'is_shipping' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 品種（varieties）へのリレーション
     */
    public function variety(): BelongsTo
    {
        return $this->belongsTo(Variety::class, 'variety_id');
    }

    /**
     * 注文商品（order_items）へのリレーション
     */
    public function orderItem()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * 販売可能商品のみ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 配送可能商品のみ
     */
    public function scopeShippable($query)
    {
        return $query->where('is_shipping', true);
    }
}
