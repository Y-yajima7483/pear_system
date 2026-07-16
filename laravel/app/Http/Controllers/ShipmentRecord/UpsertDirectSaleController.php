<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\UpsertDirectSaleRequest;
use App\Services\ShipmentRecord\UpsertDirectSaleService;

class UpsertDirectSaleController extends AbstractController
{
    public function __invoke(UpsertDirectSaleRequest $request, UpsertDirectSaleService $service)
    {
        $response = $service->execute($request->validated());

        return response()->json($response, ($response['success'] ?? false) ? 200 : 500);
    }
}
