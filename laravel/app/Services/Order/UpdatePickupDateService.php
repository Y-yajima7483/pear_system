<?php

namespace App\Services\Order;

use App\Models\Order\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class UpdatePickupDateService
{
    /**
     * 受取日を更新する
     *
     * @param int $orderId
     * @param array $data
     * @return JsonResponse
     */
    public function execute(int $orderId, array $data): JsonResponse
    {
        try {
            return DB::transaction(function () use ($orderId, $data) {
                // 注文を取得
                $order = Order::find($orderId);
                
                if (!$order) {
                    return response()->json([
                        'success' => false,
                        'message' => '指定された注文が見つかりませんでした。',
                    ], 404);
                }
                
                // 受取日を更新
                $order->pickup_date = $data['pickup_date'];
                $order->save();
                
                return response()->json([
                    'success' => true,
                    'message' => '受取日が更新されました。',
                    'data' => [
                        'id' => $order->id,
                        'pickup_date' => $order->pickup_date,
                    ],
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('受取日更新エラー: ' . $e->getMessage(), [
                'orderId' => $orderId,
                'data' => $data,
                'exception' => $e,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '受取日の更新に失敗しました。',
            ], 500);
        }
    }
}