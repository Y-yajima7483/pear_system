<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\RegisterJaShipmentResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;

class RegisterJaShipmentService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly RegisterJaShipmentResource $response
    ) {}

    /**
     * JA出荷記録の一括登録
     */
    public function execute(array $data): array
    {
        try {
            $result = $this->shipmentRecordRepository->upsertJaShipment($data);

            return $this->response->execute($result);
        } catch (\Throwable $e) {
            report($e);

            return [
                'success' => false,
                'message' => 'JA出荷記録の登録に失敗しました。',
            ];
        }
    }
}
