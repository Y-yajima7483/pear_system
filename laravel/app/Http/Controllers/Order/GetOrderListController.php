<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\GetOrderListRequest;
use App\Services\Order\GetOrderListService;

class GetOrderListController extends AbstractController
{
    public function __invoke(GetOrderListRequest $request, GetOrderListService $service)
    {
        return $this->executeApi($request, $service);
    }
}
