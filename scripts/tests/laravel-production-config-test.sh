#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
VALIDATOR="${PROJECT_DIR}/scripts/validate-laravel-production.php"
LARAVEL_DIR="${PROJECT_DIR}/laravel"

common_environment=(
    APP_ENV=production
    APP_DEBUG=false
    APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
    APP_URL=https://app.example.invalid
    DATABASE_URL=
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=pear_prod
    DB_USERNAME=pear_app
    DB_PASSWORD=not-a-real-secret
    SESSION_DRIVER=cookie
    SESSION_DOMAIN=app.example.invalid
    SESSION_SECURE_COOKIE=true
    SANCTUM_STATEFUL_DOMAINS=app.example.invalid
    CORS_ALLOWED_ORIGINS=https://app.example.invalid
)

STATUS=0
OUTPUT=""
TEST_COUNT=0
EXPECTED_ORIGIN=https://app.example.invalid

run_validator() {
    set +e
    OUTPUT="$(env "${common_environment[@]}" "$@" php "$VALIDATOR" \
        "$LARAVEL_DIR" pear_prod 127.0.0.1 3306 "$EXPECTED_ORIGIN" 2>&1)"
    STATUS=$?
    set -e
}

assert_status() {
    local expected="$1"
    local label="$2"
    TEST_COUNT=$((TEST_COUNT + 1))

    if [ "$STATUS" -ne "$expected" ]; then
        echo "not ok ${TEST_COUNT} - ${label} (expected ${expected}, got ${STATUS})" >&2
        echo "$OUTPUT" >&2
        exit 1
    fi
    echo "ok ${TEST_COUNT} - ${label}"
}

assert_output_contains() {
    local expected="$1"
    local label="$2"
    TEST_COUNT=$((TEST_COUNT + 1))

    if [[ "$OUTPUT" != *"$expected"* ]]; then
        echo "not ok ${TEST_COUNT} - ${label}" >&2
        echo "$OUTPUT" >&2
        exit 1
    fi
    echo "ok ${TEST_COUNT} - ${label}"
}

run_validator
assert_status 0 "valid production configuration passes"

run_validator \
    DB_DATABASE=ignored_by_url \
    DATABASE_URL=mysql://pear_app:not-a-real-secret@127.0.0.1:3306/pear_prod
assert_status 0 "matching DATABASE_URL is resolved as the effective target"

run_validator DATABASE_URL=mysql://pear_app:not-a-real-secret@127.0.0.1:3306/wrong_database
assert_status 1 "DATABASE_URL database mismatch fails closed"
assert_output_contains "effective database do not match" "database mismatch is explicit"

run_validator APP_DEBUG=true
assert_status 1 "debug mode fails closed"

run_validator APP_ENV=staging
assert_status 1 "non-production environment fails closed"

run_validator APP_KEY=
assert_status 1 "empty application key fails closed"

run_validator APP_KEY=invalid
assert_status 1 "invalid application key fails closed"

run_validator SESSION_SECURE_COOKIE=false
assert_status 1 "insecure session cookie fails closed"

run_validator SESSION_DOMAIN=other.example.invalid
assert_status 1 "session domain mismatch fails closed"

run_validator SESSION_DOMAIN=example.invalid
assert_status 1 "parent session domain fails closed"

run_validator SESSION_DOMAIN=.app.example.invalid
assert_status 1 "leading-dot session domain fails closed"

run_validator SESSION_DOMAIN=' APP.EXAMPLE.INVALID '
assert_status 0 "session domain case and surrounding whitespace normalize"

run_validator SANCTUM_STATEFUL_DOMAINS=other.example.invalid
assert_status 1 "Sanctum host mismatch fails closed"

run_validator SANCTUM_STATEFUL_DOMAINS='app.example.invalid,other.example.invalid'
assert_status 1 "extra Sanctum host fails closed"

run_validator SANCTUM_STATEFUL_DOMAINS=' app.example.invalid ,app.example.invalid,  '
assert_status 0 "duplicate and whitespace Sanctum entries normalize"

run_validator CORS_ALLOWED_ORIGINS='*'
assert_status 1 "wildcard CORS fails closed"

run_validator CORS_ALLOWED_ORIGINS='https://app.example.invalid,https://other.example.invalid'
assert_status 1 "extra CORS origin fails closed"

run_validator CORS_ALLOWED_ORIGINS=' https://app.example.invalid/ ,https://app.example.invalid '
assert_status 0 "duplicate and whitespace CORS entries normalize"

run_validator APP_URL=https://other.example.invalid
assert_status 1 "APP_URL mismatch fails closed"

run_validator DATABASE_URL=mysql://pear_app:not-a-real-secret@db.example.invalid:3306/pear_prod
assert_status 1 "database host mismatch fails closed"

run_validator DATABASE_URL=mysql://pear_app:not-a-real-secret@127.0.0.1:3307/pear_prod
assert_status 1 "database port mismatch fails closed"

run_validator DATABASE_URL=sqlite:///tmp/pear.sqlite
assert_status 1 "non-MySQL effective driver fails closed"

EXPECTED_ORIGIN=https://app.example.invalid:8443
run_validator \
    APP_URL=https://app.example.invalid:8443/ \
    SESSION_DOMAIN=app.example.invalid \
    SANCTUM_STATEFUL_DOMAINS=app.example.invalid:8443 \
    CORS_ALLOWED_ORIGINS=https://app.example.invalid:8443/
assert_status 0 "non-default HTTPS port and trailing slash normalize"
EXPECTED_ORIGIN=https://app.example.invalid

run_validator APP_URL=https://user@app.example.invalid
assert_status 1 "APP_URL userinfo fails closed"

run_validator APP_URL=https://app.example.invalid/path
assert_status 1 "APP_URL path fails closed"

run_validator APP_URL='https://app.example.invalid?query=1'
assert_status 1 "APP_URL query fails closed"

run_validator APP_URL='https://app.example.invalid#fragment'
assert_status 1 "APP_URL fragment fails closed"

run_validator APP_URL=https://bad_host.example.invalid
assert_status 1 "APP_URL invalid host label fails closed"

EXPECTED_ORIGIN=https://app.example.invalid/path
run_validator
assert_status 1 "APP_ORIGIN path fails closed"

EXPECTED_ORIGIN=https://user@app.example.invalid
run_validator
assert_status 1 "APP_ORIGIN userinfo fails closed"

EXPECTED_ORIGIN='https://app.example.invalid?query=1'
run_validator
assert_status 1 "APP_ORIGIN query fails closed"

EXPECTED_ORIGIN='https://app.example.invalid#fragment'
run_validator
assert_status 1 "APP_ORIGIN fragment fails closed"

EXPECTED_ORIGIN=https://bad..example.invalid
run_validator
assert_status 1 "APP_ORIGIN invalid host label fails closed"
EXPECTED_ORIGIN=https://app.example.invalid

validator_line="$(rg -n 'validate-laravel-production\.php' "${PROJECT_DIR}/scripts/deploy-native.sh" | head -n 1 | cut -d: -f1)"
backup_line="$(rg -n 'backup-db-native\.sh' "${PROJECT_DIR}/scripts/deploy-native.sh" | head -n 1 | cut -d: -f1)"
migration_line="$(rg -n '^php artisan migrate --force$' "${PROJECT_DIR}/scripts/deploy-native.sh" | head -n 1 | cut -d: -f1)"
TEST_COUNT=$((TEST_COUNT + 1))
if [ -z "$validator_line" ] || [ -z "$backup_line" ] || [ -z "$migration_line" ] \
    || [ "$validator_line" -ge "$backup_line" ] \
    || [ "$backup_line" -ge "$migration_line" ]; then
    echo "not ok ${TEST_COUNT} - validator and verified backup precede migration" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - validator and verified backup precede migration"

echo "1..${TEST_COUNT}"
