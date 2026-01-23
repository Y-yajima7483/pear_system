<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Services\Order\UpdateOrderService;

class UpdateOrderController extends AbstractController
{
    public function __invoke(int $orderId, UpdateOrderRequest $request, UpdateOrderService $service)
    {
        // リクエストデータにorder_idを追加
        $data = array_merge($request->toArray(), ['order_id' => $orderId]);

        $response = $service->execute($data);

        return response()->json($response);
    }
}
