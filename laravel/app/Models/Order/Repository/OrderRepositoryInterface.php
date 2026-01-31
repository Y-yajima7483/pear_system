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

    /**
     * 注文を更新する
     *
     * @param  int  $orderId  注文ID
     * @param  array  $orderData  注文データ
     */
    public function updateOrder(int $orderId, array $orderData): Order;

    /**
     * 注文のステータスを更新する
     *
     * @param  int  $orderId  注文ID
     * @param  int  $status  変更後のステータス
     */
    public function updateOrderStatus(int $orderId, int $status): Order;

    /**
     * 準備ボード情報を取得する
     *
     * @param  string  $targetDate  対象日付 (Y-m-d形式)
     * @return array 対象日付とその翌日の注文データ
     */
    public function getPrepBoard(string $targetDate): array;
}
