<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\Order\UpdatePickupDateRequest;
use App\Services\Order\UpdatePickupDateService;
use Illuminate\Http\JsonResponse;

class UpdateOrderPickupDateController extends AbstractController
{
    /**
     * Update the pickup date of an order.
     *
     * @param UpdatePickupDateRequest $request
     * @param int $orderId
     * @return JsonResponse
     */
    public function __invoke(UpdatePickupDateRequest $request, int $orderId, UpdatePickupDateService $service): JsonResponse
    {
        return $service->execute($orderId, $request->validated());
    }
}