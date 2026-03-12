<?php

namespace App\Models\ShipmentRecord\Repository;

use App\Enums\ShipmentTypeEnum;
use App\Models\DirectSaleProduct\DirectSaleProduct;
use App\Models\ShipmentRecord\ShipmentRecord;
use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use Illuminate\Support\Facades\DB;

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

    /**
     * 直売出荷記録を登録する
     */
    public function registerDirectSale(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // ヘッダー作成
            $record = ShipmentRecord::create([
                'record_date' => $data['record_date'],
                'total_quantity' => 0,
                'notes' => $data['notes'] ?? null,
            ]);

            // 出荷エントリ（等級別数量）作成
            foreach ($data['shipment_entries'] as $entry) {
                foreach ($entry['grades'] as $grade) {
                    if ($grade['quantity'] <= 0) {
                        continue;
                    }
                    ShipmentRecordDetail::create([
                        'shipment_record_id' => $record->id,
                        'variety_id' => $entry['variety_id'],
                        'shipment_type_id' => ShipmentTypeEnum::Direct->value,
                        'grade_id' => $grade['grade_id'],
                        'quantity' => $grade['quantity'],
                    ]);
                }
            }

            // 直売商品データ作成
            if (! empty($data['direct_sale_items'])) {
                foreach ($data['direct_sale_items'] as $item) {
                    // 対応する detail を取得（直売の品種別）
                    $detail = ShipmentRecordDetail::where('shipment_record_id', $record->id)
                        ->where('variety_id', $item['variety_id'])
                        ->where('shipment_type_id', ShipmentTypeEnum::Direct->value)
                        ->first();

                    if ($detail) {
                        DirectSaleProduct::create([
                            'shipment_record_detail_id' => $detail->id,
                            'product_id' => $item['product_id'],
                            'fruit_quantity' => $item['fruit_quantity'],
                            'box_quantity' => $item['box_quantity'],
                        ]);
                    }
                }
            }

            // total_quantity を計算
            $totalQuantity = $record->details()->sum('quantity');
            $record->update(['total_quantity' => $totalQuantity]);

            return $record->load('details')->toArray();
        });
    }

    /**
     * JA出荷の既存データを取得する
     */
    public function getJaShipmentData(int $varietyId, string $startDate, string $endDate): array
    {
        $records = ShipmentRecord::whereBetween('record_date', [$startDate, $endDate])
            ->with(['details' => function ($query) use ($varietyId) {
                $query->where('variety_id', $varietyId)
                    ->where('shipment_type_id', ShipmentTypeEnum::JA->value);
            }])
            ->orderBy('record_date')
            ->get();

        $entries = [];
        foreach ($records as $record) {
            $dateKey = $record->record_date->format('Y-m-d');
            foreach ($record->details as $detail) {
                $entries[$dateKey][(string) $detail->grade_id] = $detail->quantity;
            }
        }

        return $entries;
    }

    /**
     * JA出荷記録を一括登録（upsert）する
     */
    public function upsertJaShipment(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $varietyId = $data['variety_id'];
            $updatedRecords = [];

            foreach ($data['entries'] as $entry) {
                // ヘッダーupsert
                $record = ShipmentRecord::firstOrCreate(
                    ['record_date' => $entry['record_date']],
                    ['total_quantity' => 0]
                );

                foreach ($entry['grades'] as $grade) {
                    if ($grade['quantity'] <= 0) {
                        continue;
                    }
                    ShipmentRecordDetail::updateOrCreate(
                        [
                            'shipment_record_id' => $record->id,
                            'variety_id' => $varietyId,
                            'shipment_type_id' => ShipmentTypeEnum::JA->value,
                            'grade_id' => $grade['grade_id'],
                        ],
                        [
                            'quantity' => $grade['quantity'],
                        ]
                    );
                }

                // total_quantity を再計算
                $totalQuantity = $record->details()->sum('quantity');
                $record->update(['total_quantity' => $totalQuantity]);

                $updatedRecords[] = $record->record_date->format('Y-m-d');
            }

            return ['updated_dates' => $updatedRecords];
        });
    }
}
