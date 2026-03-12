<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\RegisterJaShipmentRequest;
use App\Services\ShipmentRecord\RegisterJaShipmentService;

class RegisterJaShipmentController extends AbstractController
{
    public function __invoke(RegisterJaShipmentRequest $request, RegisterJaShipmentService $service)
    {
        return $this->executeApi($request, $service);
    }
}
