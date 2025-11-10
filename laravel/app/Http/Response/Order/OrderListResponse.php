<?php

namespace App\Http\Response\Order;

use App\Http\Response\AbstractResponse;

class OrderListResponse extends AbstractResponse
{
    /**
     * 注文一覧のレスポンスデータを整形
     * - 表示期間（対象日付から1週間）の全日付をキーとして含む
     * - 各日付キー: その日の注文データの配列（注文がない場合は空配列）
     * - unreserved_data: pickup_dateがnullの注文の配列
     */
    public function execute(array $data, ?string $targetDate = null): array
    {
        // 表示期間を生成（対象日付から1週間分）
        $baseDate = $targetDate ? \Carbon\Carbon::parse($targetDate) : now();
        $startDate = $baseDate->copy()->startOfDay();
        $result = [];

        // 全7日分の日付キーを初期化（空配列で）
        for ($i = 0; $i < 7; $i++) {
            $dateKey = $startDate->copy()->addDays($i)->format('Y-m-d');
            $result[$dateKey] = [];
        }
        
        // 注文データを日付ごとに振り分け
        $unreservedData = [];

        foreach ($data as $order) {
            if (! empty($order['pickup_date'])) {
                $dateKey = $order['pickup_date'];
                
                // 表示期間内の日付であれば追加
                if (isset($result[$dateKey])) {
                    $result[$dateKey][] = $order;
                }
            } else {
                // pickup_dateがnullの場合は unreserved_data にまとめる
                $unreservedData[] = $order;
            }
        }

        // unreserved_data を最後に追加
        $result['unreserved_data'] = $unreservedData;

        return $result;
    }
}
