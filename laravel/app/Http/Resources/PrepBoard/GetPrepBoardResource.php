<?php

namespace App\Http\Resources\PrepBoard;

use App\Http\Resources\AbstractResource;
use Carbon\Carbon;

class GetPrepBoardResource extends AbstractResource
{
    /**
     * 準備ボードのレスポンスデータを整形
     *
     * @param  array  $data  注文データ
     * @param  string|null  $targetDate  対象日付
     * @param  array  $rowHeaders  行ヘッダー用の品種・商品リスト
     */
    public function execute(array $data, ?string $targetDate = null, array $rowHeaders = []): array
    {
        $baseDate = $targetDate ? Carbon::parse($targetDate) : now();
        $startDate = $baseDate->copy()->startOfDay();
        $orders = [];

        // 2日分の日付キーを初期化（空配列で）
        for ($i = 0; $i < 2; $i++) {
            $dateKey = $startDate->copy()->addDays($i)->format('Y-m-d');
            $orders[$dateKey] = [];
        }

        // 注文データを日付ごとに振り分け、itemsをマップ形式に変換
        foreach ($data as $order) {
            if (! empty($order['pickup_date'])) {
                $dateKey = $order['pickup_date'];

                // 対象期間内の日付であれば追加
                if (isset($orders[$dateKey])) {
                    // itemsをproduct_idをキーにしたマップ形式に変換
                    $itemsMap = [];
                    foreach ($order['items'] as $item) {
                        $productId = $item['product_id'];
                        $itemsMap[$productId] = [
                            'quantity' => $item['quantity'],
                            'is_prepared' => $item['is_prepared'],
                        ];
                    }

                    $orders[$dateKey][] = [
                        'id' => $order['id'],
                        'customer_name' => $order['customer_name'],
                        'status' => $order['status'],
                        'items' => $itemsMap,
                    ];
                }
            }
        }

        return [
            'row_headers' => $rowHeaders,
            'orders' => $orders,
        ];
    }
}
