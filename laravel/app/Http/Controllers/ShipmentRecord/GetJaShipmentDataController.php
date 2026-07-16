<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\GetJaShipmentDataRequest;
use App\Services\ShipmentRecord\GetJaShipmentDataService;

class GetJaShipmentDataController extends AbstractController
{
    public function __invoke(GetJaShipmentDataRequest $request, GetJaShipmentDataService $service)
    {
        $response = $service->execute($request->validated());

        return response()->json($response, ($response['success'] ?? false) ? 200 : 500);
    }
}
