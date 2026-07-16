<?php

namespace App\Services\ShipmentRecord;

use App\Http\Resources\ShipmentRecord\GetJaShipmentDataResource;
use App\Models\Grade\Repository\GradeRepositoryInterface;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Services\AbstractService;

class GetJaShipmentDataService extends AbstractService
{
    public function __construct(
        private readonly ShipmentRecordRepositoryInterface $shipmentRecordRepository,
        private readonly GradeRepositoryInterface $gradeRepository,
        private readonly GetJaShipmentDataResource $response
    ) {}

    /**
     * JA出荷の既存データを取得
     */
    public function execute(array $data): array
    {
        try {
            $entries = $this->shipmentRecordRepository->getJaShipmentData(
                (int) $data['variety_id'],
                $data['start_date'],
                $data['end_date']
            );

            $grades = $this->gradeRepository->getOption();

            return $this->response->execute([
                'grades' => $grades,
                'entries' => $entries,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return [
                'success' => false,
                'message' => 'JA出荷データの取得に失敗しました。',
            ];
        }
    }
}
