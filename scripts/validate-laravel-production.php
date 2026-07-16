#!/usr/bin/env php
<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\DB;

if ($argc !== 6) {
    fwrite(STDERR, "Usage: validate-laravel-production.php <laravel-dir> <database> <host> <port> <app-origin>\n");
    exit(2);
}

[$script, $laravelDirectory, $expectedDatabase, $expectedHost, $expectedPort, $expectedOrigin] = $argv;
unset($script);

$realLaravelDirectory = realpath($laravelDirectory);
if ($realLaravelDirectory === false
    || ! is_file($realLaravelDirectory.'/vendor/autoload.php')
    || ! is_file($realLaravelDirectory.'/bootstrap/app.php')) {
    fwrite(STDERR, "[ERROR] Laravel application is not bootable from the supplied directory\n");
    exit(1);
}

/** @return never */
$fail = static function (string $message): void {
    fwrite(STDERR, "[ERROR] {$message}\n");
    exit(1);
};

/** @return array{origin: string, host: string, stateful_host: string} */
$parseOrigin = static function (string $origin) use ($fail): array {
    $parts = parse_url($origin);
    if (! is_array($parts)
        || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
        || empty($parts['host'])
        || isset($parts['user'])
        || isset($parts['pass'])
        || isset($parts['query'])
        || isset($parts['fragment'])
        || (isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/')) {
        $fail('Application origin must be an origin-only HTTPS URL');
    }

    $rawHost = (string) $parts['host'];
    $hostLabels = explode('.', $rawHost);
    if (! preg_match('/^[A-Za-z0-9.-]+$/', $rawHost)
        || array_filter(
            $hostLabels,
            static fn (string $label): bool => ! preg_match('/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/', $label),
        ) !== []) {
        $fail('Application origin contains an invalid host');
    }

    $host = strtolower($rawHost);
    $port = isset($parts['port']) ? (int) $parts['port'] : 443;
    if ($port < 1 || $port > 65535) {
        $fail('Application origin contains an invalid port');
    }

    $explicitPort = $port === 443 ? '' : ':'.$port;

    return [
        'origin' => 'https://'.$host.$explicitPort,
        'host' => $host,
        'stateful_host' => $host.$explicitPort,
    ];
};

try {
    chdir($realLaravelDirectory);
    require $realLaravelDirectory.'/vendor/autoload.php';
    $app = require $realLaravelDirectory.'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();

    $origin = $parseOrigin($expectedOrigin);
    $configuredOrigin = $parseOrigin((string) config('app.url'));

    if ((string) config('app.env') !== 'production') {
        $fail('Laravel effective APP_ENV is not production');
    }

    if (config('app.debug') !== false) {
        $fail('Laravel effective APP_DEBUG is not false');
    }

    $applicationKey = trim((string) config('app.key'));
    if ($applicationKey === '') {
        $fail('Laravel effective APP_KEY is empty');
    }

    $decodedApplicationKey = str_starts_with($applicationKey, 'base64:')
        ? base64_decode(substr($applicationKey, 7), true)
        : $applicationKey;
    if (! is_string($decodedApplicationKey)
        || ! Encrypter::supported($decodedApplicationKey, (string) config('app.cipher'))) {
        $fail('Laravel effective APP_KEY is invalid for the configured cipher');
    }

    if ($configuredOrigin['origin'] !== $origin['origin']) {
        $fail('Laravel APP_URL does not match APP_ORIGIN');
    }

    if (config('session.secure') !== true) {
        $fail('Laravel secure session cookie setting is not enabled');
    }

    $sessionDomain = strtolower(trim((string) config('session.domain')));
    if ($sessionDomain !== $origin['host']) {
        $fail('Laravel session domain is not exactly the APP_ORIGIN host');
    }

    $statefulHosts = array_values(array_unique(array_filter(
        array_map(
            static fn (mixed $value): string => strtolower(trim((string) $value)),
            (array) config('sanctum.stateful', []),
        ),
        static fn (string $value): bool => $value !== '',
    )));
    sort($statefulHosts, SORT_STRING);
    if ($statefulHosts !== [$origin['stateful_host']]) {
        $fail('Sanctum stateful hosts are not limited to APP_ORIGIN');
    }

    $corsOrigins = [];
    foreach ((array) config('cors.allowed_origins', []) as $configuredCorsOrigin) {
        $configuredCorsOrigin = trim((string) $configuredCorsOrigin);
        if ($configuredCorsOrigin === '') {
            continue;
        }
        $corsOrigins[] = $parseOrigin($configuredCorsOrigin)['origin'];
    }
    $corsOrigins = array_values(array_unique($corsOrigins));
    sort($corsOrigins, SORT_STRING);
    if ($corsOrigins !== [$origin['origin']]) {
        $fail('CORS allowed origins are not limited to APP_ORIGIN');
    }

    // DatabaseManager resolves DATABASE_URL before constructing the connection,
    // so these values represent the connection migration will actually use.
    $connection = DB::connection();
    $driver = (string) $connection->getConfig('driver');
    $database = (string) $connection->getConfig('database');
    $host = strtolower((string) $connection->getConfig('host'));
    $port = (string) $connection->getConfig('port');

    if ($driver !== 'mysql') {
        $fail('Laravel effective database driver is not mysql');
    }

    if ($database !== $expectedDatabase) {
        $fail('Backup database and Laravel effective database do not match');
    }

    if ($host !== strtolower($expectedHost)) {
        $fail('Backup host and Laravel effective database host do not match');
    }

    if ($port !== $expectedPort) {
        $fail('Backup port and Laravel effective database port do not match');
    }
} catch (Throwable) {
    fwrite(STDERR, "[ERROR] Unable to boot and validate the Laravel production configuration\n");
    exit(1);
}

fwrite(STDOUT, "Laravel production configuration and backup target match.\n");
