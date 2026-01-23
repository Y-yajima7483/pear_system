<?php

namespace App\Services\Order;

use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Services\AbstractService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UpdateOrderStatusService extends AbstractService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {}

    /**
     * 店頭受け取り注文ステータス変更
     */
    public function execute(array $data): array
    {
        try {
            $orderId = $data['order_id'];
            $status = $data['status'];

            $order = $this->orderRepository->updateOrderStatus($orderId, $status);

            return [
                'success' => true,
                'message' => 'ステータスを更新しました。',
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'updated_at' => $order->updated_at->format('Y-m-d H:i:s'),
                ],
            ];
        } catch (ModelNotFoundException $e) {
            return [
                'success' => false,
                'message' => '指定された注文が見つかりません。',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'ステータスの更新に失敗しました: ' . $e->getMessage(),
            ];
        }
    }
}
