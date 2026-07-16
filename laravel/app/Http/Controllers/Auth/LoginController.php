<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\User\GetLoginUserResource;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LoginController extends Controller
{
    public function __construct(
        private readonly AuthFactory $auth,
    ) {}

    /**
     * Handle an authentication attempt.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only(['email', 'password']);

            // ガードを指定して認証を試行
            if ($this->auth->guard('web')->attempt($credentials)) {
                $user = $this->auth->guard('web')->user();
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
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'ログイン処理に失敗しました。',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->auth->guard('web')->logout();

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
