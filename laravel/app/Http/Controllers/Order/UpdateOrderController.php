<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Services\Order\Exceptions\UnexpectedOrderException;
use App\Services\Order\UpdateOrderService;
use Illuminate\Http\JsonResponse;

class UpdateOrderController extends AbstractController
{
    public function __invoke(int $orderId, UpdateOrderRequest $request, UpdateOrderService $service): JsonResponse
    {
        try {
            // リクエストデータにorder_idを追加
            $data = array_merge($request->validated(), ['order_id' => $orderId]);

            $response = $service->execute($data);

            return response()->json($response);
        } catch (UnexpectedOrderException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->responseMessage(),
            ], 500);
        }
    }
}
