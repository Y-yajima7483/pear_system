<?php

namespace App\Models\ShipmentRecord\Repository;

use App\Models\ShipmentRecord\ShipmentRecord;

class ShipmentRecordRepository implements ShipmentRecordRepositoryInterface
{
    /**
     * 出荷記録一覧を取得する
     *
     * @param  int  $year  対象年
     * @param  int|null  $month  対象月（任意）
     */
    public function getShipmentRecordList(int $year, ?int $month = null): array
    {
        $query = ShipmentRecord::query();

        // record_year（GENERATED STORED列）でフィルタ
        $query->where('record_year', $year);

        // 月フィルタ（任意）
        if ($month !== null) {
            $query->whereMonth('record_date', $month);
        }

        // details を Eager Load
        $query->with('details');

        // record_date 降順
        $query->orderBy('record_date', 'desc');

        return $query->get()->map(function (ShipmentRecord $record) {
            $quantitiesByType = [];

            foreach ($record->details as $detail) {
                $typeId = $detail->shipment_type_id;
                $quantitiesByType[$typeId] = ($quantitiesByType[$typeId] ?? 0) + $detail->quantity;
            }

            return [
                'id' => $record->id,
                'record_date' => $record->record_date->format('Y-m-d'),
                'total_quantity' => $record->total_quantity,
                'quantities_by_type' => $quantitiesByType,
                'notes' => $record->notes,
            ];
        })->toArray();
    }
}
