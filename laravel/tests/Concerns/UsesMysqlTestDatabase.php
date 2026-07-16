<?php

namespace Tests\Concerns;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\TestingEnvironment;

trait UsesMysqlTestDatabase
{
    use RefreshDatabase;

    /**
     * migrate:fresh が開発・本番DBへ向かう事故を防止する。
     */
    protected function beforeRefreshingDatabase(): void
    {
        $connection = (string) config('database.default');
        $driver = (string) config("database.connections.{$connection}.driver");
        $database = (string) config("database.connections.{$connection}.database");
        $databaseUrl = config("database.connections.{$connection}.url");

        if ($driver !== 'mysql') {
            throw new \LogicException('DBを使用するFeatureテストはMySQL専用です。');
        }

        if (! preg_match('/(?:^|_)(?:test|testing)(?:$|_)/', $database)) {
            throw new \LogicException(
                "テスト専用DBではないため migrate:fresh を中止しました: {$database}"
            );
        }

        if ($database !== TestingEnvironment::DATABASE) {
            throw new \LogicException(
                '許可されたテストDBではないため migrate:fresh を中止しました。'
            );
        }

        if ($databaseUrl !== null && $databaseUrl !== '') {
            throw new \LogicException(
                'DATABASE_URLによる接続先上書きがあるため migrate:fresh を中止しました。'
            );
        }

        $databaseConnection = DB::connection($connection);
        $databaseConnection->getPdo();
        $connectedDatabase = $databaseConnection->getDatabaseName();

        if ($connectedDatabase !== TestingEnvironment::DATABASE) {
            throw new \LogicException(
                '実接続先が許可されたテストDBではないため migrate:fresh を中止しました。'
            );
        }
    }
}
