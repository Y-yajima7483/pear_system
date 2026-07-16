<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\ShowShipmentRecordDailyResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;

class GetShipmentRecordDailyService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly ShowShipmentRecordDailyResource $response
    ) {}

    /**
     * 日別詳細を取得
     */
    public function execute(array $data): array
    {
        try {
            $record = $this->shipmentRecordRepository->findDaily($data['date']);

            if ($record === null) {
                return [
                    'success' => false,
                    'message' => '指定日の出荷記録が見つかりません。',
                ];
            }

            return $this->response->execute($record);
        } catch (\Throwable $e) {
            report($e);

            throw UnexpectedShipmentRecordException::dailyFetch($e);
        }
    }
}
