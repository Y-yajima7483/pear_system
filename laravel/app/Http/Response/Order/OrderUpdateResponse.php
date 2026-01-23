<?php

namespace App\Http\Response\Order;

use App\Http\Response\AbstractResponse;
use App\Models\Order\Order;

class OrderUpdateResponse extends AbstractResponse
{
    /**
     * 注文更新のレスポンスデータを整形
     */
    public function execute(array $data): array
    {
        $order = $data['order'] ?? null;

        if (! $order instanceof Order) {
            return [
                'success' => false,
                'message' => '注文の更新に失敗しました。',
            ];
        }

        return [
            'success' => true,
            'message' => '注文を更新しました。',
            'order' => [
                'id' => $order->id,
                'customer_name' => $order->customer_name,
                'pickup_date' => $order->pickup_date,
                'pickup_time' => $order->pickup_time,
                'notes' => $order->notes,
                'status' => $order->status,
                'updated_at' => $order->updated_at->format('Y-m-d H:i:s'),
                'items' => $order->orderItems->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name ?? '',
                        'variety_id' => $item->product->variety_id ?? null,
                        'variety_name' => $item->product->variety->name ?? '',
                        'quantity' => $item->quantity,
                    ];
                })->toArray(),
            ],
        ];
    }
}
