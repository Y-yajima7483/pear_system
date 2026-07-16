<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\UpsertDirectSaleResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;

class UpsertDirectSaleService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly UpsertDirectSaleResource $response
    ) {}

    /**
     * 直売出荷記録の upsert（日付キーで直売スコープを丸ごと置換）
     */
    public function execute(array $data): array
    {
        try {
            $record = $this->shipmentRecordRepository->upsertDirectSale($data);

            return $this->response->execute(['record' => $record]);
        } catch (\Throwable $e) {
            report($e);

            return [
                'success' => false,
                'message' => '直売出荷記録の保存に失敗しました。',
            ];
        }
    }
}
