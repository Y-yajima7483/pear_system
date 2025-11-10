<?php

namespace App\Models\Order\Repository;

use Illuminate\Support\Facades\DB;
use App\Models\Order\Order;
use Carbon\Carbon;

class OrderRepository implements OrderRepositoryInterface
{
    /**
     * 店頭受け取り注文一覧を取得する
     *
     * @param  string  $targetDate  対象日付 (Y-m-d形式)
     * @param  string|null  $customerName  お客様名（部分一致検索用）
     */
    public function getOrderList(string $targetDate, ?string $customerName = null): array
    {
        $query = Order::query();

        // target_dateから1週間の期間で検索 または pickup_dateがnullのデータを取得
        $date = Carbon::parse($targetDate);
        $startDate = $date->copy();
        $endDate = $date->copy()->addWeeks(1);

        $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('pickup_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
              ->orWhereNull('pickup_date');
        });

        // customer_nameによる部分一致検索
        if (! empty($customerName)) {
            $query->where('customer_name', 'LIKE', '%'.$customerName.'%');
        }

        // 必要なリレーションをEager Loading
        $query->with(['orderItems.product.variety']);

        // pickup_dateの昇順でソート（nullは最後）
        $query->orderByRaw('pickup_date IS NULL, pickup_date ASC');

        return $query->get()->map(function ($order) {
            return [
                'id' => $order->id,
                'customer_name' => $order->customer_name,
                'pickup_date' => $order->pickup_date ? $order->pickup_date : null,
                'pickup_time' => $order->pickup_time,
                'notes' => $order->notes,
                'status' => $order->status,
                'items' => $order->orderItems->map(function ($item) {
                    return [
                        'variety_id' => $item->product->variety->id ?? null,
                        'variety' => $item->product->variety->name ?? '',
                        'product_id' => $item->product->id ?? null,
                        'item' => $item->product->name ?? '',
                        'quantity' => $item->quantity,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * 注文を作成する
     *
     * @param  array  $orderData  注文データ
     */
    public function createOrder(array $orderData): Order
    {
        // トランザクション処理で注文とその明細を作成
        return DB::transaction(function () use ($orderData) {
            // 注文の基本情報を作成
            $order = Order::create([
                'customer_name' => $orderData['customer_name'],
                'pickup_date' => $orderData['pickup_date'] ?? null,
                'pickup_time' => $orderData['pickup_time'] ?? null,
                'notes' => $orderData['notes'] ?? null,
                'status' => 'pending',
            ]);

            // 注文明細を作成
            foreach ($orderData['items'] as $varietyGroup) {
                foreach ($varietyGroup['items'] as $item) {
                    $order->orderItems()->create([
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            // リレーションをロードして返す
            return $order->load('orderItems.product.variety');
        });
    }
}
