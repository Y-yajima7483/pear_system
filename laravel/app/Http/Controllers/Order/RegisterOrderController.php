<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\RegisterOrderRequest;
use App\Services\Order\RegisterOrderService;

class RegisterOrderController extends AbstractController
{
    public function __invoke(RegisterOrderRequest $request, RegisterOrderService $service)
    {
        return $this->executeApi($request, $service);
    }
}
