<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\AbstractController;
use App\Services\Product\GetProductOptionService;
use Illuminate\Http\Request;

class GetProductOptionController extends AbstractController
{
    public function __invoke(Request $request, GetProductOptionService $service)
    {
        return $this->executeApi($request, $service);
    }
}
