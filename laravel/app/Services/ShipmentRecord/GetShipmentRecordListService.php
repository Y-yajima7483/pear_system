<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\ListShipmentRecordResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;

class GetShipmentRecordListService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly ListShipmentRecordResource $response
    ) {}

    /**
     * 出荷記録一覧を取得
     */
    public function execute(array $data): array
    {
        $year = (int) $data['year'];
        $month = isset($data['month']) ? (int) $data['month'] : null;

        $result = $this->shipmentRecordRepository->getShipmentRecordList($year, $month);

        return $this->response->execute($result);
    }
}
