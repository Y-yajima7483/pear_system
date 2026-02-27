<?php

namespace App\Http\Controllers\Grade;

use App\Http\Controllers\AbstractController;
use App\Services\Grade\GetGradeOptionService;
use Illuminate\Http\Request;

class GetGradeOptionController extends AbstractController
{
    public function __invoke(Request $request, GetGradeOptionService $service)
    {
        return $this->executeApi($request, $service);
    }
}
