<?php

namespace App\Http\Controllers\Variety;

use App\Http\Controllers\AbstractController;
use App\Services\Variety\GetVarietyOptionService;
use Illuminate\Http\Request;

class GetVarietyOpionController extends AbstractController
{
    public function __invoke(Request $request, GetVarietyOptionService $service)
    {
        return $this->executeApi($request, $service);
    }
}
