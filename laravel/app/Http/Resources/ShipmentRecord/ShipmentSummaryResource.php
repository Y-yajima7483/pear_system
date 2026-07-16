<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class ShipmentSummaryResource extends AbstractResource
{
    /**
     * 出荷サマリーのレスポンスデータを整形
     * - by_variety: 品種別（出荷タイプ別内訳付き）の出荷数
     * - by_grade: 等級別の出荷数
     * - loss_rate: 非販売数量 / 全体数量（全体0件時は null）
     */
    public function execute(array $data): array
    {
        // 品種別: variety_id ごとにタイプ別内訳をネスト
        $byVariety = [];
        foreach ($data['by_variety'] as $row) {
            $varietyId = $row['variety_id'];
            if (! isset($byVariety[$varietyId])) {
                $byVariety[$varietyId] = [
                    'variety_id' => $varietyId,
                    'variety_name' => $row['variety_name'],
                    'total_quantity' => 0,
                    'quantities_by_type' => [],
                ];
            }
            $quantity = (int) $row['quantity'];
            $byVariety[$varietyId]['quantities_by_type'][$row['shipment_type_id']] = $quantity;
            $byVariety[$varietyId]['total_quantity'] += $quantity;
        }

        $byGrade = array_map(fn (array $row) => [
            'grade_id' => $row['grade_id'],
            'grade_name' => $row['grade_name'],
            'grade_type' => $row['grade_type'],
            'quantity' => (int) $row['quantity'],
        ], $data['by_grade']);

        $totalQuantity = $data['total_quantity'];
        $nonSalesQuantity = $data['non_sales_quantity'];

        return [
            'success' => true,
            'summary' => [
                'total_quantity' => $totalQuantity,
                'non_sales_quantity' => $nonSalesQuantity,
                'loss_rate' => $totalQuantity > 0
                    ? round($nonSalesQuantity / $totalQuantity, 4)
                    : null,
                'by_variety' => array_values($byVariety),
                'by_grade' => $byGrade,
            ],
        ];
    }
}
