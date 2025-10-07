<?php

namespace App\Http\Response\Order;

use App\Http\Response\AbstractResponse;

class OrderListResponse extends AbstractResponse
{
    /**
     * 注文一覧のレスポンスデータを整形
     */
    public function execute(array $data): array
    {
        // pickup_dateの有無で分類
        $reservedData = [];
        $unreservedData = [];

        foreach ($data as $order) {
            if (! empty($order['pickup_date'])) {
                $reservedData[] = $order;
            } else {
                $unreservedData[] = $order;
            }
        }

        return [
            'reserved_data' => $reservedData,
            'unreserved_data' => $unreservedData,
        ];
    }
}
