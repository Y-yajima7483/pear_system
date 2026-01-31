<?php

namespace App\Services\PrepBoard;

use App\Http\Resources\PrepBoard\GetPrepBoardResource;
use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Models\Variety\Variety;
use App\Services\AbstractService;

class GetPrepBoardService extends AbstractService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly GetPrepBoardResource $response
    ) {}

    /**
     * 準備ボード情報を取得
     */
    public function execute(array $data): array
    {
        $targetDate = $data['target_date'] ?? date('Y-m-d');

        // 注文データを取得
        $orders = $this->orderRepository->getPrepBoard($targetDate);

        // 注文に含まれる商品IDを抽出
        $orderedProductIds = $this->extractOrderedProductIds($orders);

        // 行ヘッダー用の品種・商品リストを取得（注文がある商品のみ）
        $rowHeaders = $this->getRowHeaders($orderedProductIds);

        return $this->response->execute($orders, $targetDate, $rowHeaders);
    }

    /**
     * 注文データから商品IDを抽出
     *
     * @param  array  $orders  注文データ
     * @return array 商品IDの配列
     */
    private function extractOrderedProductIds(array $orders): array
    {
        $productIds = [];

        foreach ($orders as $order) {
            foreach ($order['items'] as $item) {
                $productIds[$item['product_id']] = true;
            }
        }

        return array_keys($productIds);
    }

    /**
     * 行ヘッダー用の品種・商品リストを取得
     *
     * @param  array  $orderedProductIds  注文に含まれる商品IDの配列
     */
    private function getRowHeaders(array $orderedProductIds): array
    {
        // 注文がない場合は空配列を返す
        if (empty($orderedProductIds)) {
            return [];
        }

        return Variety::with(['products' => function ($query) use ($orderedProductIds) {
            $query->where('is_active', true)
                  ->whereIn('id', $orderedProductIds)
                  ->orderBy('id', 'ASC');
        }])
        ->orderBy('id', 'ASC')
        ->get()
        ->map(function ($variety) {
            return [
                'variety_id' => $variety->id,
                'variety_name' => $variety->name,
                'products' => $variety->products->map(function ($product) {
                    return [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                    ];
                })->toArray(),
            ];
        })
        ->filter(function ($variety) {
            // 注文がある商品を持つ品種のみ返す
            return count($variety['products']) > 0;
        })
        ->values()
        ->toArray();
    }
}
