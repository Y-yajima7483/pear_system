<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Services\ShipmentRecord\DeleteShipmentRecordService;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;
use Illuminate\Http\JsonResponse;

class DeleteShipmentRecordController extends AbstractController
{
    public function __invoke(string $date, int $shipmentTypeId, DeleteShipmentRecordService $service): JsonResponse
    {
        try {
            $response = $service->execute([
                'date' => $date,
                'shipment_type_id' => $shipmentTypeId,
            ]);

            return response()->json($response);
        } catch (UnexpectedShipmentRecordException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->responseMessage(),
            ], 500);
        }
    }
}
