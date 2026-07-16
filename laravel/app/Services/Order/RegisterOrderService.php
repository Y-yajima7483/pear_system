<?php

namespace App\Services\Order;

use App\Http\Resources\Order\RegisterOrderResource;
use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Services\AbstractService;
use App\Services\Order\Exceptions\UnexpectedOrderException;

class RegisterOrderService extends AbstractService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly RegisterOrderResource $response
    ) {}

    /**
     * 店頭受け取り注文新規登録
     */
    public function execute(array $data): array
    {
        try {
            // リポジトリで注文を作成
            $order = $this->orderRepository->createOrder($data);

            // レスポンスデータを整形して返す
            return $this->response->execute(['order' => $order]);
        } catch (\Throwable $e) {
            report($e);

            throw UnexpectedOrderException::register($e);
        }
    }
}
