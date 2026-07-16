<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Tests\Support\TestingEnvironment;

class TestingEnvironmentTest extends TestCase
{
    public function test_force_neutralizes_database_url_override(): void
    {
        $maliciousUrl = 'mysql://invalid.example/production';
        putenv("DATABASE_URL={$maliciousUrl}");
        $_ENV['DATABASE_URL'] = $maliciousUrl;
        $_SERVER['DATABASE_URL'] = $maliciousUrl;

        TestingEnvironment::force();

        $this->assertSame('', getenv('DATABASE_URL'));
        $this->assertSame('', $_ENV['DATABASE_URL']);
        $this->assertSame('', $_SERVER['DATABASE_URL']);
        $this->assertSame(TestingEnvironment::DATABASE, getenv('DB_DATABASE'));
    }
}
