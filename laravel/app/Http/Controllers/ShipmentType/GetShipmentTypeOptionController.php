<?php

namespace App\Http\Controllers\ShipmentType;

use App\Http\Controllers\AbstractController;
use App\Services\ShipmentType\GetShipmentTypeOptionService;
use Illuminate\Http\Request;

class GetShipmentTypeOptionController extends AbstractController
{
    public function __invoke(Request $request, GetShipmentTypeOptionService $service)
    {
        return $this->executeApi($request, $service);
    }
}
