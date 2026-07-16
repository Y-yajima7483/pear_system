<?php

namespace Tests\Feature;

use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\StatefulGuard;
use Mockery;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_csrf_cookie_endpoint_is_available(): void
    {
        $this->get('/sanctum/csrf-cookie')->assertNoContent();
    }

    public function test_order_endpoint_rejects_unauthenticated_requests(): void
    {
        $this->getJson('/api/order')->assertUnauthorized();
    }

    public function test_invalid_credentials_remain_unauthorized(): void
    {
        $guard = Mockery::mock(StatefulGuard::class);
        $guard->shouldReceive('attempt')->once()->andReturnFalse();
        $auth = Mockery::mock(AuthFactory::class);
        $auth->shouldReceive('guard')->with('web')->once()->andReturn($guard);
        $this->app->instance(AuthFactory::class, $auth);

        $this->postJson('/api/login', [
            'email' => 'nobody@example.test',
            'password' => 'invalid-password',
        ])->assertUnauthorized()
            ->assertJson([
                'message' => 'ログイン情報が間違っています。',
            ]);
    }

    public function test_unexpected_login_error_returns_generic_500(): void
    {
        $auth = Mockery::mock(AuthFactory::class);
        $auth->shouldReceive('guard')
            ->with('web')
            ->once()
            ->andThrow(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(AuthFactory::class, $auth);

        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.test',
            'password' => 'invalid-password',
        ])->assertStatus(500)
            ->assertJson([
                'message' => 'ログイン処理に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }
}
