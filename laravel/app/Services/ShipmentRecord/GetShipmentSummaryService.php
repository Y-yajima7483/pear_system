<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\ShipmentSummaryResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;

class GetShipmentSummaryService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly ShipmentSummaryResource $response
    ) {}

    /**
     * 出荷サマリー（品種別・等級別・ロス率）を取得
     */
    public function execute(array $data): array
    {
        try {
            $summary = $this->shipmentRecordRepository->getSummary(
                (int) $data['year'],
                isset($data['month']) ? (int) $data['month'] : null,
                isset($data['variety_id']) ? (int) $data['variety_id'] : null,
            );

            return $this->response->execute($summary);
        } catch (\Throwable $e) {
            report($e);

            throw UnexpectedShipmentRecordException::summaryFetch($e);
        }
    }
}
