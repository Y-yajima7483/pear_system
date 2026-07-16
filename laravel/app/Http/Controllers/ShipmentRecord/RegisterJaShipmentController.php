<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\RegisterJaShipmentRequest;
use App\Services\ShipmentRecord\RegisterJaShipmentService;

class RegisterJaShipmentController extends AbstractController
{
    public function __invoke(RegisterJaShipmentRequest $request, RegisterJaShipmentService $service)
    {
        $response = $service->execute($request->validated());

        return response()->json($response, ($response['success'] ?? false) ? 200 : 500);
    }
}
