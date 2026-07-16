<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;
use App\Services\ShipmentRecord\GetShipmentRecordDailyService;
use Illuminate\Http\JsonResponse;

class GetShipmentRecordDailyController extends AbstractController
{
    public function __invoke(string $date, GetShipmentRecordDailyService $service): JsonResponse
    {
        try {
            $response = $service->execute(['date' => $date]);

            return response()->json($response);
        } catch (UnexpectedShipmentRecordException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->responseMessage(),
            ], 500);
        }
    }
}
