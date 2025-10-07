<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Order\GetOrderListController;
use App\Http\Controllers\Order\RegisterOrderController;
use App\Http\Controllers\Order\UpdateOrderPickupDateController;
use App\Http\Controllers\Variety\GetVarietyOpionController;
use App\Http\Controllers\Product\GetProductOptionController;
use App\Http\Controllers\Auth\LoginController;

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

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
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
    // 店頭受け取り注文の受取日更新API
    Route::put('/order/{orderId}/pickup-date', UpdateOrderPickupDateController::class)->name('order.update.pickup-date');
    /* selectBox用API */
    // 品種一覧取得API
    Route::get('/variety_option', GetVarietyOpionController::class)->name('variety.option');
    // 商品一覧取得API
    Route::get('/product_option', GetProductOptionController::class)->name('product.option');
});
