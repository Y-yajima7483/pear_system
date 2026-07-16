<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\GetShipmentSummaryRequest;
use App\Services\ShipmentRecord\Exceptions\UnexpectedShipmentRecordException;
use App\Services\ShipmentRecord\GetShipmentSummaryService;
use Illuminate\Http\JsonResponse;

class GetShipmentSummaryController extends AbstractController
{
    public function __invoke(GetShipmentSummaryRequest $request, GetShipmentSummaryService $service): JsonResponse
    {
        try {
            $response = $service->execute($request->validated());

            return response()->json($response);
        } catch (UnexpectedShipmentRecordException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->responseMessage(),
            ], 500);
        }
    }
}
