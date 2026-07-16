<?php

namespace Tests\Support;

final class TestingEnvironment
{
    public const DATABASE = 'pear_system_testing';

    /**
     * Dockerの開発設定やローカル.envよりテスト設定を優先する。
     */
    public static function force(): void
    {
        $variables = [
            'APP_ENV' => 'testing',
            'DB_CONNECTION' => 'mysql',
            'DB_DATABASE' => self::DATABASE,
            // Laravelのdatabase.urlが個別DB設定を上書きしないよう空値で固定する。
            'DATABASE_URL' => '',
        ];

        foreach ($variables as $name => $value) {
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
