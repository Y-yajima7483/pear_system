<?php

namespace App\Models\ShipmentRecord\Repository;

use App\Enums\GradeTypeEnum;
use App\Enums\ShipmentTypeEnum;
use App\Models\DirectSaleProduct\DirectSaleProduct;
use App\Models\Product\Product;
use App\Models\ShipmentRecord\ShipmentRecord;
use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use App\Services\ShipmentRecord\Support\DirectSaleGradeResolver;
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
            $totalQuantity = 0;

            foreach ($record->details as $detail) {
                $typeId = $detail->shipment_type_id;
                $quantitiesByType[$typeId] = ($quantitiesByType[$typeId] ?? 0) + $detail->quantity;
                $totalQuantity += $detail->quantity;
            }

            return [
                'id' => $record->id,
                'record_date' => $record->record_date->format('Y-m-d'),
                'total_quantity' => $totalQuantity,
                'quantities_by_type' => $quantitiesByType,
                'notes' => $record->notes,
            ];
        })->toArray();
    }

    /**
     * 直売出荷記録を upsert する（日付キーでその日の直売スコープを丸ごと置換）
     *
     * 商品明細と商品外数量を完全な入力として受け取り、
     * (品種, 等級) ごとに合算して shipment_record_details を再構築する。
     * 同日のJA明細には触れない。
     */
    public function upsertDirectSale(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // ヘッダーを確保する。notes はキー省略時に既存値を保持し、
            // 明示された null は備考クリアとして扱う。
            $record = ShipmentRecord::firstOrCreate(
                ['record_date' => $data['record_date']],
            );
            if (array_key_exists('notes', $data)) {
                $record->update(['notes' => $data['notes']]);
            }

            // その日の直売スコープを丸ごと削除（direct_sale_products は cascade）
            $record->details()
                ->where('shipment_type_id', ShipmentTypeEnum::Direct->value)
                ->delete();

            // 商品マスタから variety_id / 等級を導出するための情報を取得
            $items = collect($data['direct_sale_items'] ?? [])
                ->filter(fn (array $item) => ($item['box_quantity'] ?? 0) > 0);

            $products = Product::query()
                ->whereIn('id', $items->pluck('product_id')->unique())
                ->get()
                ->keyBy('id');

            // (variety_id, grade_id) ごとにグルーピングする。
            // 商品由来数量と商品外数量は同じ detail.quantity へ合算する。
            $groups = [];
            foreach ($items as $item) {
                $productId = (int) $item['product_id'];
                $product = $products->get($productId);
                if (! $product instanceof Product || $product->variety_id === null) {
                    throw new \LogicException('直売商品に品種が設定されていません。');
                }

                $varietyId = (int) $product->variety_id;
                $gradeId = DirectSaleGradeResolver::resolve($product->sku);
                $key = "{$varietyId}-{$gradeId}";

                $groups[$key] ??= [
                    'variety_id' => $varietyId,
                    'grade_id' => $gradeId,
                    'quantity' => 0,
                    'items' => [],
                ];
                $groups[$key]['quantity'] = ($groups[$key]['quantity'] ?? 0) + $item['box_quantity'];
                $groups[$key]['items'][] = $item;
            }

            foreach ($data['manual_grade_entries'] ?? [] as $entry) {
                if (($entry['quantity'] ?? 0) <= 0) {
                    continue;
                }

                $varietyId = (int) $entry['variety_id'];
                $gradeId = (int) $entry['grade_id'];
                $key = "{$varietyId}-{$gradeId}";

                $groups[$key] ??= [
                    'variety_id' => $varietyId,
                    'grade_id' => $gradeId,
                    'quantity' => 0,
                    'items' => [],
                ];
                $groups[$key]['quantity'] += (int) $entry['quantity'];
            }

            foreach ($groups as $group) {
                $detail = ShipmentRecordDetail::create([
                    'shipment_record_id' => $record->id,
                    'variety_id' => $group['variety_id'],
                    'shipment_type_id' => ShipmentTypeEnum::Direct->value,
                    'grade_id' => $group['grade_id'],
                    'quantity' => $group['quantity'],
                ]);

                foreach ($group['items'] as $item) {
                    DirectSaleProduct::create([
                        'shipment_record_detail_id' => $detail->id,
                        'product_id' => $item['product_id'],
                        'fruit_quantity' => $item['fruit_quantity'],
                        'box_quantity' => $item['box_quantity'],
                    ]);
                }
            }

            $this->synchronizeTotalQuantity($record);
            $this->cleanupEmptyRecord($record);

            return $record->exists
                ? $record->load('details.directSaleProducts')->toArray()
                : ['record_date' => $data['record_date'], 'deleted' => true];
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
     * JA出荷記録を一括 upsert する（対象日×品種のJA明細を置換）
     *
     * 置換方式のため、数量を 0 に変更した等級は明細ごと消える（0クリア対応）。
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
                );

                // 対象日×品種のJA明細を丸ごと置換
                $record->details()
                    ->where('shipment_type_id', ShipmentTypeEnum::JA->value)
                    ->where('variety_id', $varietyId)
                    ->delete();

                foreach ($entry['grades'] as $grade) {
                    if ($grade['quantity'] <= 0) {
                        continue;
                    }
                    ShipmentRecordDetail::create([
                        'shipment_record_id' => $record->id,
                        'variety_id' => $varietyId,
                        'shipment_type_id' => ShipmentTypeEnum::JA->value,
                        'grade_id' => $grade['grade_id'],
                        'quantity' => $grade['quantity'],
                    ]);
                }

                $this->synchronizeTotalQuantity($record);
                $this->cleanupEmptyRecord($record);

                $updatedRecords[] = $record->record_date->format('Y-m-d');
            }

            return ['updated_dates' => $updatedRecords];
        });
    }

    /**
     * 日別詳細を取得する
     *
     * @return array|null 該当日にレコードがなければ null
     */
    public function findDaily(string $date): ?array
    {
        $record = ShipmentRecord::query()
            ->where('record_date', $date)
            ->with([
                'details.variety',
                'details.grade',
                'details.directSaleProducts.product',
            ])
            ->first();

        return $record?->toArray();
    }

    /**
     * 指定日の出荷種別スコープを削除する
     *
     * 明細（cascade で direct_sale_products も）を削除し、
     * details が空になったらヘッダーも削除する。
     *
     * @return array{deleted: bool, record_deleted: bool}
     */
    public function deleteByType(string $date, int $shipmentTypeId): array
    {
        return DB::transaction(function () use ($date, $shipmentTypeId) {
            $record = ShipmentRecord::query()->where('record_date', $date)->first();

            if ($record === null) {
                return ['deleted' => false, 'record_deleted' => false];
            }

            $deletedCount = $record->details()
                ->where('shipment_type_id', $shipmentTypeId)
                ->delete();

            $recordDeleted = false;
            if ($record->details()->doesntExist()) {
                $record->delete();
                $recordDeleted = true;
            } else {
                $this->synchronizeTotalQuantity($record);
            }

            return ['deleted' => $deletedCount > 0, 'record_deleted' => $recordDeleted];
        });
    }

    /**
     * 年次サマリー（品種別・等級別・ロス率）をSQL集計で取得する
     */
    public function getSummary(int $year, ?int $month = null, ?int $varietyId = null): array
    {
        $baseQuery = DB::table('shipment_record_details as d')
            ->join('shipment_records as r', 'r.id', '=', 'd.shipment_record_id')
            ->where('r.record_year', $year);

        if ($month !== null) {
            $baseQuery->whereMonth('r.record_date', $month);
        }
        if ($varietyId !== null) {
            $baseQuery->where('d.variety_id', $varietyId);
        }

        // 品種×出荷タイプ別
        $byVariety = (clone $baseQuery)
            ->join('varieties as v', 'v.id', '=', 'd.variety_id')
            ->selectRaw('d.variety_id, v.name as variety_name, d.shipment_type_id, SUM(d.quantity) as quantity')
            ->groupBy('d.variety_id', 'v.name', 'd.shipment_type_id')
            ->orderBy('d.variety_id')
            ->get()
            ->toArray();

        // 等級別（type を含める: ロス率計算・非販売判定用）
        $byGrade = (clone $baseQuery)
            ->join('grades as g', 'g.id', '=', 'd.grade_id')
            ->selectRaw('d.grade_id, g.name as grade_name, g.type as grade_type, SUM(d.quantity) as quantity')
            ->groupBy('d.grade_id', 'g.name', 'g.type')
            ->orderBy('g.sort_order')
            ->get()
            ->toArray();

        // ロス率（非販売数量 / 全体数量）
        $totals = (clone $baseQuery)
            ->join('grades as g', 'g.id', '=', 'd.grade_id')
            ->selectRaw(
                'SUM(d.quantity) as total_quantity, '
                .'SUM(CASE WHEN g.type = ? THEN d.quantity ELSE 0 END) as non_sales_quantity',
                [GradeTypeEnum::NonSales->value]
            )
            ->first();

        return [
            'by_variety' => array_map(fn ($row) => (array) $row, $byVariety),
            'by_grade' => array_map(fn ($row) => (array) $row, $byGrade),
            'total_quantity' => (int) ($totals->total_quantity ?? 0),
            'non_sales_quantity' => (int) ($totals->non_sales_quantity ?? 0),
        ];
    }

    /**
     * details が空で notes も無いヘッダーを削除する
     */
    private function cleanupEmptyRecord(ShipmentRecord $record): void
    {
        if ($record->details()->doesntExist() && empty($record->notes)) {
            $record->delete();
        }
    }

    /**
     * 非正規化した合計列を明細の現在値へ同期する。
     */
    private function synchronizeTotalQuantity(ShipmentRecord $record): void
    {
        $record->update([
            'total_quantity' => (int) $record->details()->sum('quantity'),
        ]);
    }
}
