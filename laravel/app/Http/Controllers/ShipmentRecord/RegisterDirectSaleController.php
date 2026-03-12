<?php

namespace App\Http\Controllers\ShipmentRecord;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\ShipmentRecord\RegisterDirectSaleRequest;
use App\Services\ShipmentRecord\RegisterDirectSaleService;

class RegisterDirectSaleController extends AbstractController
{
    public function __invoke(RegisterDirectSaleRequest $request, RegisterDirectSaleService $service)
    {
        return $this->executeApi($request, $service);
    }
}
