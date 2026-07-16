#!/usr/bin/env bash
# Docker deployment alternative. The native deployment remains canonical.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(dirname -- "$SCRIPT_DIR")"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-}"

# shellcheck source=lib/private-env.sh
source "${SCRIPT_DIR}/lib/private-env.sh"
# shellcheck source=lib/https-origin.sh
source "${SCRIPT_DIR}/lib/https-origin.sh"
# shellcheck source=lib/revision.sh
source "${SCRIPT_DIR}/lib/revision.sh"
# shellcheck source=lib/docker-release-database.sh
source "${SCRIPT_DIR}/lib/docker-release-database.sh"

if [ -n "$DEPLOY_ENV_FILE" ]; then
    requested_deploy_env_file="$DEPLOY_ENV_FILE"
    load_private_env_file "$requested_deploy_env_file"
    DEPLOY_ENV_FILE="$requested_deploy_env_file"
fi

# shellcheck source=lib/maintenance-lock.sh
source "${SCRIPT_DIR}/lib/maintenance-lock.sh"

COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/docker-compose.prod.yml}"
LOCK_DIR="${DEPLOY_LOCK_DIR:-${TMPDIR:-/tmp}/pear-system-docker-deploy.lock}"

: "${DEPLOY_REVISION:?DEPLOY_REVISION must identify the revision already checked out}"
: "${APP_ORIGIN:?APP_ORIGIN must be set}"
: "${AUTH_SMOKE_SCRIPT:?AUTH_SMOKE_SCRIPT must point to a private executable smoke test}"

validate_https_origin "$APP_ORIGIN"
APP_ORIGIN="$HTTPS_ORIGIN_NORMALIZED"
export APP_ORIGIN

if [ ! -x "$AUTH_SMOKE_SCRIPT" ]; then
    echo "[ERROR] AUTH_SMOKE_SCRIPT is not executable" >&2
    exit 1
fi

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

for command_name in docker git curl gzip mktemp; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[ERROR] Required command is unavailable: ${command_name}" >&2
        exit 1
    fi
done

if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
    echo "[ERROR] Another Docker deployment is already running" >&2
    exit 1
fi
LOCK_ACQUIRED=1

cd -- "$PROJECT_DIR"

current_revision="$(git rev-parse --verify HEAD)"
validate_deploy_revision "$DEPLOY_REVISION" "$current_revision"

if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
    echo "[ERROR] Refusing to deploy with tracked, staged, or untracked working-tree changes" >&2
    exit 1
fi

compose=(docker compose -f "$COMPOSE_FILE")
if [ -n "$DEPLOY_ENV_FILE" ]; then
    compose=(docker compose --env-file "$DEPLOY_ENV_FILE" -f "$COMPOSE_FILE")
fi

echo "[$(date -u +%FT%TZ)] Validating and building release images..."
"${compose[@]}" config --quiet
"${compose[@]}" build

acquire_maintenance_lock

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pear-deploy.XXXXXX")"
backup_result="${TEMP_DIR}/backup-result"

run_docker_database_release_phase "$SCRIPT_DIR" "$backup_result" "${compose[@]}"

echo "[$(date -u +%FT%TZ)] Starting application services..."
"${compose[@]}" up -d

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

echo "[$(date -u +%FT%TZ)] Docker alternative deployment passed all gates."
