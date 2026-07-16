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
     * 直売出荷記録を upsert する（日付キーで直売スコープを丸ごと置換）
     */
    public function upsertDirectSale(array $data): array;

    /**
     * JA出荷の既存データを取得する
     */
    public function getJaShipmentData(int $varietyId, string $startDate, string $endDate): array;

    /**
     * JA出荷記録を一括 upsert する（対象日×品種のJA明細を置換）
     */
    public function upsertJaShipment(array $data): array;

    /**
     * 日別詳細を取得する
     */
    public function findDaily(string $date): ?array;

    /**
     * 指定日の出荷種別スコープを削除する
     */
    public function deleteByType(string $date, int $shipmentTypeId): array;

    /**
     * 年次サマリー（品種別・等級別・ロス率）を取得する
     */
    public function getSummary(int $year, ?int $month = null, ?int $varietyId = null): array;
}
