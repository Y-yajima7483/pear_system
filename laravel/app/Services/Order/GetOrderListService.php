<?php

namespace App\Services\Order;

use App\Http\Response\Order\OrderListResponse;
use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Services\AbstractService;

class GetOrderListService extends AbstractService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly OrderListResponse $response
    ) {}

    /**
     * 店頭受け取り注文一覧を取得
     */
    public function execute(array $data): array
    {
        // target_dateは必須、customer_nameはオプション
        $targetDate = $data['target_date'] ?? date('Y-m-d');
        $customerName = $data['customer_name'] ?? null;

        $result = $this->orderRepository->getOrderList($targetDate, $customerName);

        return $this->response->execute($result, $targetDate);
    }
}
