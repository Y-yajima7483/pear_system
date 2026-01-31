<?php

namespace App\Http\Controllers\PrepBoard;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\PrepBoard\UpdateOrderItemPreparedRequest;
use App\Services\PrepBoard\UpdateOrderItemPreparedService;
use Illuminate\Http\JsonResponse;

class UpdateOrderItemPreparedController extends AbstractController
{
    public function __construct(
        private readonly UpdateOrderItemPreparedService $service
    ) {}

    /**
     * 注文アイテムの準備状態を更新
     */
    public function __invoke(
        UpdateOrderItemPreparedRequest $request,
        int $orderId,
        int $productId
    ): JsonResponse {
        $data = array_merge($request->validated(), [
            'order_id' => $orderId,
            'product_id' => $productId,
        ]);

        $result = $this->service->execute($data);

        return response()->json($result);
    }
}
