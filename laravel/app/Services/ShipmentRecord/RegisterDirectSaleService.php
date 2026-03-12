<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\RegisterDirectSaleResource;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;

class RegisterDirectSaleService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly RegisterDirectSaleResource $response
    ) {}

    /**
     * 直売出荷記録の登録
     */
    public function execute(array $data): array
    {
        try {
            $record = $this->shipmentRecordRepository->registerDirectSale($data);

            return $this->response->execute(['record' => $record]);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => '直売出荷記録の登録に失敗しました: '.$e->getMessage(),
            ];
        }
    }
}
