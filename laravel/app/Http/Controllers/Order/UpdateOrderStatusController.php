<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Services\Order\UpdateOrderStatusService;

class UpdateOrderStatusController extends AbstractController
{
    public function __invoke(int $orderId, UpdateOrderStatusRequest $request, UpdateOrderStatusService $service)
    {
        $data = array_merge($request->toArray(), ['order_id' => $orderId]);

        $response = $service->execute($data);

        return response()->json($response);
    }
}
