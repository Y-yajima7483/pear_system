<?php

namespace App\Models\Order\Repository;

use App\Models\Order\Order;

interface OrderRepositoryInterface
{
    /**
     * 店頭受け取り注文一覧を取得する
     *
     * @param  string  $targetDate  対象日付 (Y-m-d形式)
     * @param  string|null  $customerName  お客様名（部分一致検索用）
     */
    public function getOrderList(string $targetDate, ?string $customerName = null): array;

    /**
     * 注文を作成する
     *
     * @param  array  $orderData  注文データ
     */
    public function createOrder(array $orderData): Order;
}
