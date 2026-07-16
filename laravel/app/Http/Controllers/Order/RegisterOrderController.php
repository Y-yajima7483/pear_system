<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\RegisterOrderRequest;
use App\Services\Order\Exceptions\UnexpectedOrderException;
use App\Services\Order\RegisterOrderService;
use Illuminate\Http\JsonResponse;

class RegisterOrderController extends AbstractController
{
    public function __invoke(RegisterOrderRequest $request, RegisterOrderService $service): JsonResponse
    {
        try {
            $response = $service->execute($request->validated());

            return response()->json($response);
        } catch (UnexpectedOrderException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->responseMessage(),
            ], 500);
        }
    }
}
