<?php

namespace App\Models\Order;

use App\Models\OrderItem\OrderItem;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    /**
     * 対応テーブル
     */
    protected $table = 'orders';

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'customer_name',
        'pickup_date',
        'pickup_time',
        'status',
        'notes',
        'user_id',
    ];

    /**
     * 型キャスト
     */
    protected $casts = [
        'pickup_date' => 'date',
        'status' => 'string',
    ];

    /**
     * 日付型の属性
     */
    protected $dates = [];

    /**
     * pickup_dateアクセサ
     */
    public function getPickupDateAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('Y-m-d') : null;
    }

    /**
     * pickup_dateミューテータ
     */
    public function setPickupDateAttribute($value)
    {
        $this->attributes['pickup_date'] = $value;
    }

    /**
     * 注文明細（orders.id -> order_items.order_id）
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * 担当ユーザー（orders.user_id -> users.id, NULL許可）
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 合計数量（明細の quantity 合計）
     */
    public function getTotalQuantityAttribute(): int
    {
        if ($this->relationLoaded('orderItems')) {
            return (int) $this->orderItems->sum('quantity');
        }

        // 未ロード時はクエリで集計
        return (int) $this->orderItems()->sum('quantity');
    }

    /**
     * 合計金額（各明細の product.price × quantity の合計）
     * product.price が null の明細は 0 として計算
     *
     * ※ N+1 を避けるには with('orderItems.product') で事前ロード推奨
     */
    public function getTotalPriceAttribute(): int
    {
        if (! $this->relationLoaded('orderItems')) {
            // 必要に応じて product を同時ロード
            $this->loadMissing('orderItems.product');
        }

        return (int) $this->orderItems->sum(function ($item) {
            $price = optional($item->product)->price ?? 0;

            return (int) $price * (int) $item->quantity;
        });
    }

    /**
     * ステータス変更ヘルパ
     */
    public function markPickedUp(): bool
    {
        return $this->update(['status' => 'picked_up']);
    }

    public function cancel(): bool
    {
        return $this->update(['status' => 'canceled']);
    }

    /**
     * クエリスコープ
     */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopePickupOn(Builder $query, $date): Builder
    {
        return $query->whereDate('pickup_date', $date);
    }
}
