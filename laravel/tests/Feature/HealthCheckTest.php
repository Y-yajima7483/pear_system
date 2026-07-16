<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_check_returns_database_status(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'db' => 'connected',
            ]);
    }
}
