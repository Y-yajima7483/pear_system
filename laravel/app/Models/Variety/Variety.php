<?php

namespace App\Models\Variety;

use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Variety\Variety
 *
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Product[] $products
 */
class Variety extends Model
{
    use HasFactory;

    protected $table = 'varieties';

    protected $fillable = [
        'name',
    ];

    /**
     * タイムスタンプはマイグレーションで created_at / updated_at を定義しているため true のままでOK
     * （デフォルト true）
     */
    public $timestamps = true;

    /**
     * キャスト（明示しておくと安心）
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * リレーション: Variety (1) - (多) Product
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'variety_id');
    }
}
