<?php

namespace App\Models\ShipmentRecord\Repository;

interface ShipmentRecordRepositoryInterface
{
    /**
     * 出荷記録一覧を取得する
     *
     * @param  int  $year  対象年
     * @param  int|null  $month  対象月（任意）
     */
    public function getShipmentRecordList(int $year, ?int $month = null): array;

    /**
     * 直売出荷記録を登録する
     */
    public function registerDirectSale(array $data): array;

    /**
     * JA出荷の既存データを取得する
     */
    public function getJaShipmentData(int $varietyId, string $startDate, string $endDate): array;

    /**
     * JA出荷記録を一括登録（upsert）する
     */
    public function upsertJaShipment(array $data): array;
}
