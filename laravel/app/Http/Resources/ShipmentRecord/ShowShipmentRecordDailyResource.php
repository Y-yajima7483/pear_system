<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class ShowShipmentRecordDailyResource extends AbstractResource
{
    /**
     * 日別詳細のレスポンスデータを整形
     * - 出荷種別ごとに details（品種・等級名解決済み）をグルーピング
     * - 直売明細には direct_sale_products（商品名・玉数・箱数）を含める
     */
    public function execute(array $data): array
    {
        $shipments = [];

        foreach ($data['details'] ?? [] as $detail) {
            $typeId = $detail['shipment_type_id'];

            if (! isset($shipments[$typeId])) {
                $shipments[$typeId] = [
                    'shipment_type_id' => $typeId,
                    'total_quantity' => 0,
                    'details' => [],
                ];
            }

            $products = array_map(fn (array $dsp) => [
                'product_id' => $dsp['product_id'],
                'product_name' => $dsp['product']['name'] ?? '',
                'fruit_quantity' => $dsp['fruit_quantity'],
                'box_quantity' => $dsp['box_quantity'],
            ], $detail['direct_sale_products'] ?? []);
            $productQuantity = array_sum(array_column($products, 'box_quantity'));
            $manualQuantity = max(0, (int) $detail['quantity'] - $productQuantity);

            $shipments[$typeId]['details'][] = [
                'variety_id' => $detail['variety_id'],
                'variety_name' => $detail['variety']['name'] ?? '',
                'grade_id' => $detail['grade_id'],
                'grade_name' => $detail['grade']['name'] ?? '',
                'quantity' => $detail['quantity'],
                'product_quantity' => $productQuantity,
                'manual_quantity' => $manualQuantity,
                'products' => $products,
            ];
            $shipments[$typeId]['total_quantity'] += $detail['quantity'];
        }

        return [
            'success' => true,
            'record' => [
                'id' => $data['id'],
                'record_date' => $data['record_date'],
                'notes' => $data['notes'],
                'shipments' => array_values($shipments),
            ],
        ];
    }
}
