<?php

namespace App\Services\PrepBoard;

use App\Models\OrderItem\OrderItem;
use App\Services\AbstractService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UpdateOrderItemPreparedService extends AbstractService
{
    /**
     * 注文アイテムの準備状態を更新
     *
     * @param  array  $data  更新データ（order_id, product_id, is_prepared を含む）
     * @return array 更新結果
     *
     * @throws ModelNotFoundException
     */
    public function execute(array $data): array
    {
        $orderItem = OrderItem::where('order_id', $data['order_id'])
            ->where('product_id', $data['product_id'])
            ->firstOrFail();

        $orderItem->update([
            'is_prepared' => $data['is_prepared'],
        ]);

        return [
            'id' => $orderItem->id,
            'order_id' => $orderItem->order_id,
            'product_id' => $orderItem->product_id,
            'quantity' => $orderItem->quantity,
            'is_prepared' => $orderItem->is_prepared,
        ];
    }
}
