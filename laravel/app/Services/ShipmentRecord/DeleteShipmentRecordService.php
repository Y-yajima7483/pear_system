<?php

namespace App\Services\ShipmentRecord;

use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;

class DeleteShipmentRecordService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
    ) {}

    /**
     * 指定日の出荷種別スコープを削除
     */
    public function execute(array $data): array
    {
        try {
            $result = $this->shipmentRecordRepository->deleteByType(
                $data['date'],
                (int) $data['shipment_type_id']
            );

            if (! $result['deleted']) {
                return [
                    'success' => false,
                    'message' => '削除対象の出荷記録が見つかりません。',
                ];
            }

            return [
                'success' => true,
                'message' => '出荷記録を削除しました。',
                'record_deleted' => $result['record_deleted'],
            ];
        } catch (\Throwable $e) {
            report($e);

            throw UnexpectedShipmentRecordException::delete($e);
        }
    }
}
