<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\GetShipmentRecordListRequest;
use App\Services\ShipmentRecord\GetShipmentRecordListService;

class GetShipmentRecordListController extends AbstractController
{
    public function __invoke(GetShipmentRecordListRequest $request, GetShipmentRecordListService $service)
    {
        return $this->executeApi($request, $service);
    }
}
