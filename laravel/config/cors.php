<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 本番セキュリティ対策: allowed_originsを環境変数で制御可能にした。
    // 開発環境: CORS_ALLOWED_ORIGINS未設定 → '*'（全オリジン許可）
    // 本番環境: CORS_ALLOWED_ORIGINS=https://example.com → 特定ドメインのみ許可
    // カンマ区切りで複数ドメイン指定可能（例: https://a.com,https://b.com）
    // ※ supports_credentials=true と allowed_origins='*' の組み合わせは
    //   任意オリジンからCookie付きリクエストを許可するため、本番では必ず制限すること。
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS', '*') === '*'
        ? ['*']
        : explode(',', env('CORS_ALLOWED_ORIGINS', '*')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
