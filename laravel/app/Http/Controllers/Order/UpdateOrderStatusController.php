<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Services\Order\Exceptions\UnexpectedOrderException;
use App\Services\Order\UpdateOrderStatusService;
use Illuminate\Http\JsonResponse;

class UpdateOrderStatusController extends AbstractController
{
    public function __invoke(int $orderId, UpdateOrderStatusRequest $request, UpdateOrderStatusService $service): JsonResponse
    {
        try {
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
