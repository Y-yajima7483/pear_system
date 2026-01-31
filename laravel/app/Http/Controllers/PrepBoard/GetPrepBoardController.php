<?php

namespace App\Http\Controllers\PrepBoard;

use App\Http\Controllers\AbstractController;
use App\Http\Requests\PrepBoard\GetPrepBoardRequest;
use App\Services\PrepBoard\GetPrepBoardService;

class GetPrepBoardController extends AbstractController
{
    public function __invoke(GetPrepBoardRequest $request, GetPrepBoardService $service)
    {
        return $this->executeApi($request, $service);
    }
}
