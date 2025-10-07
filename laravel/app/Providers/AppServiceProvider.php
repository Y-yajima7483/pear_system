<?php

namespace App\Providers;

use App\Models\Order\Repository\OrderRepository;
use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Models\Product\Repository\ProductRepository;
use App\Models\Product\Repository\ProductRepositoryInterface;
use App\Models\Variety\Repository\VarietyRepository;
use App\Models\Variety\Repository\VarietyRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(VarietyRepositoryInterface::class, VarietyRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
