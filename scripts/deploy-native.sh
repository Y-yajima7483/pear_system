#!/usr/bin/env bash
# Canonical native release gate. All real locations, service identifiers and
# credentials are supplied by the private operations source of truth.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-}"

# shellcheck source=lib/private-env.sh
source "${SCRIPT_DIR}/lib/private-env.sh"
# shellcheck source=lib/https-origin.sh
source "${SCRIPT_DIR}/lib/https-origin.sh"
# shellcheck source=lib/revision.sh
source "${SCRIPT_DIR}/lib/revision.sh"

if [ -n "$DEPLOY_ENV_FILE" ]; then
    requested_deploy_env_file="$DEPLOY_ENV_FILE"
    load_private_env_file "$requested_deploy_env_file"
    DEPLOY_ENV_FILE="$requested_deploy_env_file"
fi

# Load after the private environment so an operator-specific lock location can
# be supplied without publishing it in this repository.
# shellcheck source=lib/maintenance-lock.sh
source "${SCRIPT_DIR}/lib/maintenance-lock.sh"

: "${APP_DIR:?APP_DIR must be set by the private deployment environment}"
: "${APP_ORIGIN:?APP_ORIGIN must be set by the private deployment environment}"
: "${DEPLOY_REVISION:?DEPLOY_REVISION must identify the revision already checked out}"
: "${DB_NAME:?DB_NAME must be set by the private deployment environment}"
: "${BACKUP_DIR:?BACKUP_DIR must be set by the private deployment environment}"
: "${MYSQL_DEFAULTS_FILE:?MYSQL_DEFAULTS_FILE must be set by the private deployment environment}"
: "${BACKUP_DB_HOST:?BACKUP_DB_HOST must identify the native backup target}"
: "${NEXT_SERVICE:?NEXT_SERVICE must be set by the private deployment environment}"
: "${PHP_FPM_SERVICE:?PHP_FPM_SERVICE must be set by the private deployment environment}"
: "${PROXY_SERVICE:?PROXY_SERVICE must be set by the private deployment environment}"
: "${AUTH_SMOKE_SCRIPT:?AUTH_SMOKE_SCRIPT must point to a private executable smoke test}"

BACKUP_DB_PORT="${BACKUP_DB_PORT:-3306}"

LOCK_DIR="${DEPLOY_LOCK_DIR:-${TMPDIR:-/tmp}/pear-system-native-deploy.lock}"
LOCK_ACQUIRED=0
TEMP_DIR=""

cleanup() {
    local status=$?

    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf -- "$TEMP_DIR"
    fi

    if [ "$LOCK_ACQUIRED" -eq 1 ]; then
        rmdir -- "$LOCK_DIR" 2>/dev/null || true
    fi

    release_maintenance_lock

    exit "$status"
}
trap cleanup EXIT INT TERM

for command_name in git composer php yarn curl gzip mktemp systemctl; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[ERROR] Required command is unavailable: ${command_name}" >&2
        exit 1
    fi
done

validate_https_origin "$APP_ORIGIN"
APP_ORIGIN="$HTTPS_ORIGIN_NORMALIZED"
export APP_ORIGIN

if ! [[ "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "[ERROR] DB_NAME must contain only letters, digits, and underscores" >&2
    exit 1
fi

if [[ "$BACKUP_DB_HOST" =~ [[:space:]] ]] || [[ "$BACKUP_DB_HOST" = -* ]] || [ -z "$BACKUP_DB_HOST" ]; then
    echo "[ERROR] BACKUP_DB_HOST is invalid" >&2
    exit 1
fi

if ! [[ "$BACKUP_DB_PORT" =~ ^[0-9]+$ ]] \
    || [ "$BACKUP_DB_PORT" -lt 1 ] \
    || [ "$BACKUP_DB_PORT" -gt 65535 ]; then
    echo "[ERROR] BACKUP_DB_PORT must be between 1 and 65535" >&2
    exit 1
fi

for service_name in "$NEXT_SERVICE" "$PHP_FPM_SERVICE" "$PROXY_SERVICE"; do
    if ! [[ "$service_name" =~ ^[A-Za-z0-9@_.][A-Za-z0-9@_.-]*$ ]]; then
        echo "[ERROR] Invalid service identifier" >&2
        exit 1
    fi
done

if [ ! -x "$AUTH_SMOKE_SCRIPT" ]; then
    echo "[ERROR] AUTH_SMOKE_SCRIPT is not executable" >&2
    exit 1
fi

if [ ! -d "${APP_DIR}/laravel" ] || [ ! -d "${APP_DIR}/next" ]; then
    echo "[ERROR] APP_DIR does not contain the expected application directories" >&2
    exit 1
fi

if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
    echo "[ERROR] Another native deployment is already running" >&2
    exit 1
fi
LOCK_ACQUIRED=1

cd -- "$APP_DIR"

current_revision="$(git rev-parse --verify HEAD)"
validate_deploy_revision "$DEPLOY_REVISION" "$current_revision"

if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
    echo "[ERROR] Refusing to deploy with tracked, staged, or untracked working-tree changes" >&2
    exit 1
fi

echo "[$(date -u +%FT%TZ)] Building and checking the release before migration..."
cd -- "${APP_DIR}/laravel"
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php artisan config:clear
php artisan route:list >/dev/null

cd -- "${APP_DIR}/next"
yarn install --immutable
NEXT_PUBLIC_APP_URL="$APP_ORIGIN" NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}" yarn build

acquire_maintenance_lock

echo "[$(date -u +%FT%TZ)] Validating the effective Laravel production and database configuration..."
php "${SCRIPT_DIR}/validate-laravel-production.php" \
    "${APP_DIR}/laravel" \
    "$DB_NAME" \
    "$BACKUP_DB_HOST" \
    "$BACKUP_DB_PORT" \
    "$APP_ORIGIN"

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pear-deploy.XXXXXX")"
backup_result="${TEMP_DIR}/backup-result"

echo "[$(date -u +%FT%TZ)] Creating the pre-migration backup..."
BACKUP_RESULT_FILE="$backup_result" \
    DB_NAME="$DB_NAME" \
    BACKUP_DIR="$BACKUP_DIR" \
    MYSQL_DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE" \
    BACKUP_DB_HOST="$BACKUP_DB_HOST" \
    BACKUP_DB_PORT="$BACKUP_DB_PORT" \
    "${SCRIPT_DIR}/backup-db-native.sh"

backup_file="$(sed -n '1p' "$backup_result")"
if [ -z "$backup_file" ] || [ ! -f "$backup_file" ] || ! gzip -t -- "$backup_file"; then
    echo "[ERROR] Pre-migration backup verification failed" >&2
    exit 1
fi

echo "[$(date -u +%FT%TZ)] Running the release migration exactly once..."
cd -- "${APP_DIR}/laravel"
php artisan migrate --force

echo "[$(date -u +%FT%TZ)] Rebuilding framework caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[$(date -u +%FT%TZ)] Restarting application services..."
systemctl restart "$NEXT_SERVICE"
systemctl reload "$PHP_FPM_SERVICE"
systemctl reload "$PROXY_SERVICE"

health_url="${APP_ORIGIN%/}/api/health"
csrf_url="${APP_ORIGIN%/}/sanctum/csrf-cookie"
csrf_headers="${TEMP_DIR}/csrf-headers"
csrf_cookies="${TEMP_DIR}/csrf-cookies"

curl --fail --silent --show-error --retry 5 --retry-delay 1 "$health_url" >/dev/null
curl --fail --silent --show-error --retry 5 --retry-delay 1 \
    --dump-header "$csrf_headers" --cookie-jar "$csrf_cookies" --output /dev/null "$csrf_url"

if ! grep -qi '^set-cookie:[[:space:]]*XSRF-TOKEN=' "$csrf_headers"; then
    echo "[ERROR] Sanctum CSRF smoke check did not receive an XSRF-TOKEN cookie" >&2
    exit 1
fi

"$AUTH_SMOKE_SCRIPT" "$APP_ORIGIN"

echo "[$(date -u +%FT%TZ)] Native deployment passed all gates."
