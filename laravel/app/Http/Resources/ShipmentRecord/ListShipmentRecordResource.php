<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class ListShipmentRecordResource extends AbstractResource
{
    /**
     * 出荷記録一覧のレスポンスデータを整形
     * - summary: 合計出荷数、タイプ別出荷数のサマリー
     * - records: 日付降順の出荷記録配列
     */
    public function execute(array $data): array
    {
        $totalQuantity = 0;
        $quantitiesByType = [];

        foreach ($data as $record) {
            $totalQuantity += $record['total_quantity'];
            foreach ($record['quantities_by_type'] as $typeId => $quantity) {
                $quantitiesByType[$typeId] = ($quantitiesByType[$typeId] ?? 0) + $quantity;
            }
        }

        return [
            'summary' => [
                'total_quantity' => $totalQuantity,
                'quantities_by_type' => $quantitiesByType,
            ],
            'records' => $data,
        ];
    }
}
