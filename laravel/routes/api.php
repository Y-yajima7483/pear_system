<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Order\GetOrderListController;
use App\Http\Controllers\Order\RegisterOrderController;
use App\Http\Controllers\Order\UpdateOrderController;
use App\Http\Controllers\Order\UpdateOrderPickupDateController;
use App\Http\Controllers\Order\UpdateOrderStatusController;
use App\Http\Controllers\PrepBoard\GetPrepBoardController;
use App\Http\Controllers\PrepBoard\UpdateOrderItemPreparedController;
use App\Http\Controllers\Product\GetProductOptionController;
use App\Http\Controllers\Grade\GetGradeOptionController;
use App\Http\Controllers\ShipmentRecord\DeleteShipmentRecordController;
use App\Http\Controllers\ShipmentRecord\GetJaShipmentDataController;
use App\Http\Controllers\ShipmentRecord\GetShipmentRecordDailyController;
use App\Http\Controllers\ShipmentRecord\GetShipmentRecordListController;
use App\Http\Controllers\ShipmentRecord\GetShipmentSummaryController;
use App\Http\Controllers\ShipmentRecord\RegisterJaShipmentController;
use App\Http\Controllers\ShipmentRecord\UpsertDirectSaleController;
use App\Http\Controllers\Variety\GetVarietyOpionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ヘルスチェックエンドポイント（認証不要）
// 本番運用で使用: Docker healthcheck、外形監視（UptimeRobot等）からの死活確認に利用。
// DB接続も検証し、MySQLが停止している場合は503を返すことで異常を即座に検知可能。
// 以前はdocker-entrypoint.shで動的にルートを追加していたが、正式なルート定義に移行した。
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return response()->json(['status' => 'ok', 'db' => 'connected']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'db' => 'disconnected'], 503);
    }
});

// Authentication routes
Route::post('/login', [LoginController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/auth/me', [LoginController::class, 'me']);
    /* 通常API */
    // 店頭受け取り注文一覧取得API
    Route::get('/order', GetOrderListController::class)->name('order.list');
    // 店頭受け取り注文登録API
    Route::post('/order', RegisterOrderController::class)->name('order.register');
    // 店頭受け取り注文情報編集API
    Route::put('/order/{orderId}', UpdateOrderController::class)->name('order.update');
    // 店頭受け取り注文の受取日更新API
    Route::put('/order/{orderId}/pickup-date', UpdateOrderPickupDateController::class)->name('order.update.pickup-date');
    // 店頭受け取り注文ステータス変更API
    Route::patch('/order/{orderId}/status', UpdateOrderStatusController::class)->name('order.update.status');
    // 準備ボード情報取得API
    Route::get('/prep-board', GetPrepBoardController::class)->name('prep-board.list');
    // 注文アイテム準備状態更新API
    Route::patch('/order-item/{orderId}/{productId}/prepared', UpdateOrderItemPreparedController::class)->name('order-item.update.prepared');
    /* selectBox用API */
    // 品種一覧取得API
    Route::get('/variety_option', GetVarietyOpionController::class)->name('variety.option');
    // 商品一覧取得API
    Route::get('/product_option', GetProductOptionController::class)->name('product.option');
    // 等級一覧取得API
    Route::get('/grade_option', GetGradeOptionController::class)->name('grade.option');
    /* 出荷記録API */
    // ※固定パス（summary/ja/direct-sale/daily）を {date} ワイルドカードより先に定義すること
    // 出荷記録一覧取得API
    Route::get('/shipment-record', GetShipmentRecordListController::class)->name('shipment-record.list');
    // 出荷サマリー取得API（年次・品種別・等級別・ロス率の分析下地）
    Route::get('/shipment-record/summary', GetShipmentSummaryController::class)->name('shipment-record.summary');
    // JA出荷データ取得API
    Route::get('/shipment-record/ja', GetJaShipmentDataController::class)->name('shipment-record.ja.get');
    // JA出荷一括登録API（対象日×品種のJA明細を置換するupsert）
    Route::post('/shipment-record/ja', RegisterJaShipmentController::class)->name('shipment-record.ja.register');
    // 直売出荷記録upsert API（日付キーで直売スコープを丸ごと置換。登録・編集兼用）
    Route::put('/shipment-record/direct-sale', UpsertDirectSaleController::class)->name('shipment-record.direct-sale.upsert');
    // 日別詳細取得API
    Route::get('/shipment-record/daily/{date}', GetShipmentRecordDailyController::class)
        ->where('date', '\d{4}-\d{2}-\d{2}')
        ->name('shipment-record.daily.show');
    // 出荷種別単位削除API（明細が空になったらヘッダーも削除）
    Route::delete('/shipment-record/daily/{date}/{shipmentTypeId}', DeleteShipmentRecordController::class)
        ->where(['date' => '\d{4}-\d{2}-\d{2}', 'shipmentTypeId' => '\d+'])
        ->name('shipment-record.daily.delete');
});
