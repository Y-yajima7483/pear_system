<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\User\GetLoginUserResource;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * Handle an authentication attempt.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only(['email', 'password']);

            // ガードを指定して認証を試行
            if (Auth::guard('web')->attempt($credentials)) {
                $user = Auth::guard('web')->user();
                // セッションIDを再生成
                $request->session()->regenerate();

                // Cookie::queue('admin_access', 'true', config('session.lifetime'));
                return response()->json(
                    [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    Response::HTTP_OK);
            }

            return response()->json([
                'message' => 'ログイン情報が間違っています。',
            ], Response::HTTP_UNAUTHORIZED);
        } catch (Exception $e) {
            // Exception::getCode() can return non-integer values, so we need to ensure it's a valid HTTP status code
            $statusCode = is_int($e->getCode()) && $e->getCode() >= 100 && $e->getCode() < 600 
                ? $e->getCode() 
                : Response::HTTP_INTERNAL_SERVER_ERROR;
            
            $message = $e->getMessage();

            return response()->json([
                'message' => $message,
            ], $statusCode);
        }
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new GetLoginUserResource($request->user()),
        ]);
    }
}
