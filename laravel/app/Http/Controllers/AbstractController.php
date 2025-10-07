<?php

namespace App\Http\Controllers;

use App\Services\AbstractService;
use Illuminate\Http\Request;

class AbstractController extends Controller
{
    protected function executeApi(Request $request, AbstractService $service)
    {
        $validated = $request->toArray();
        $response = $service->execute($validated);

        return response()->json($response);
    }
}
