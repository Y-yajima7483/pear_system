<?php

namespace App\Services\Order;

use App\Http\Response\Order\OrderUpdateResponse;
use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Services\AbstractService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UpdateOrderService extends AbstractService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly OrderUpdateResponse $response
    ) {}

    /**
     * 店頭受け取り注文情報更新
     */
    public function execute(array $data): array
    {
        try {
            $orderId = $data['order_id'];

            // リポジトリで注文を更新
            $order = $this->orderRepository->updateOrder($orderId, $data);

            // レスポンスデータを整形して返す
            return $this->response->execute(['order' => $order]);
        } catch (ModelNotFoundException $e) {
            return [
                'success' => false,
                'message' => '指定された注文が見つかりません。',
            ];
        } catch (\Exception $e) {
            // エラー時のレスポンス
            return [
                'success' => false,
                'message' => '注文の更新に失敗しました: '.$e->getMessage(),
            ];
        }
    }
}
