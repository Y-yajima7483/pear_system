#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-docker-db-release-test.XXXXXX")"
MOCK_BIN="${TEST_ROOT}/bin"
MOCK_LOG="${TEST_ROOT}/docker.log"
MOCK_STATE_DIR="${TEST_ROOT}/state"
BACKUP_RESULT="${TEST_ROOT}/backup-result"

cleanup() {
    if declare -F release_maintenance_lock >/dev/null 2>&1; then
        release_maintenance_lock
    fi
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p -- "$MOCK_BIN" "$MOCK_STATE_DIR" "${TEST_ROOT}/backups"
: > "$MOCK_LOG"

cat > "${MOCK_BIN}/docker" <<'MOCK_DOCKER'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >> "$MOCK_LOG"

case "${1:-}" in
    compose)
        if [[ " $* " == *" ps -a "* ]]; then
            echo "Legacy container-presence probe must not be used" >&2
            exit 91
        fi
        if [[ " $* " == *" up -d mysql "* ]]; then
            if [ "${MOCK_NAMED_VOLUME_PRESENT:-0}" != "1" ]; then
                echo "Expected retained named volume was not modeled" >&2
                exit 92
            fi
            touch "${MOCK_STATE_DIR}/container-created"
            printf '%s\n' 'up-existing-volume' >> "$MOCK_LOG"
            exit 0
        fi
        if [[ " $* " == *" ps -q mysql "* ]]; then
            [ -f "${MOCK_STATE_DIR}/container-created" ] || exit 93
            printf '%s\n' mock_mysql
            exit 0
        fi
        if [[ " $* " == *" run --rm --no-deps php php artisan migrate --force "* ]]; then
            printf '%s\n' 'migrate-once' >> "$MOCK_LOG"
            exit 0
        fi
        ;;
    inspect)
        if [[ " $* " == *'State.Health'* ]]; then
            printf '%s\n' healthy
        else
            printf '%s\n' true
        fi
        exit 0
        ;;
    exec)
        shift
        container_name="${1:-}"
        shift
        [ "$container_name" = "mock_mysql" ] || exit 94
        if [ "${1:-}" = "printenv" ]; then
            printf '%s\n' pear_retained_volume
            exit 0
        fi
        printf '%s\n' 'dump-from-retained-volume' >> "$MOCK_LOG"
        printf '%s\n' 'CREATE TABLE retained_data (id INT);'
        exit 0
        ;;
esac

echo "Unexpected mock docker call: $*" >&2
exit 99
MOCK_DOCKER
chmod 0755 "${MOCK_BIN}/docker"

export PATH="${MOCK_BIN}:${PATH}"
export MOCK_LOG MOCK_STATE_DIR
export MOCK_NAMED_VOLUME_PRESENT=1
export BACKUP_DIR="${TEST_ROOT}/backups"
export BACKUP_LOCK_DIR="${TEST_ROOT}/backup.lock"
export MAINTENANCE_LOCK_DIR="${TEST_ROOT}/maintenance.lock"
export DOCKER_DATABASE_HEALTH_ATTEMPTS=1
export DOCKER_DATABASE_HEALTH_INTERVAL_SECONDS=0
unset DB_DATABASE || true

# shellcheck source=../lib/maintenance-lock.sh
source "${PROJECT_DIR}/scripts/lib/maintenance-lock.sh"
# shellcheck source=../lib/docker-release-database.sh
source "${PROJECT_DIR}/scripts/lib/docker-release-database.sh"

acquire_maintenance_lock
run_docker_database_release_phase \
    "${PROJECT_DIR}/scripts" \
    "$BACKUP_RESULT" \
    docker compose -f retained-volume.yml

backup_file="$(sed -n '1p' "$BACKUP_RESULT")"
[ -f "$backup_file" ]
gzip -t -- "$backup_file"

up_line="$(rg -n '^up-existing-volume$' "$MOCK_LOG" | cut -d: -f1)"
dump_line="$(rg -n '^dump-from-retained-volume$' "$MOCK_LOG" | cut -d: -f1)"
migrate_line="$(rg -n '^migrate-once$' "$MOCK_LOG" | cut -d: -f1)"

if [ "$up_line" -ge "$dump_line" ] || [ "$dump_line" -ge "$migrate_line" ]; then
    echo "Database release order was not start -> backup -> migrate" >&2
    exit 1
fi

if [ "$(rg -c '^dump-from-retained-volume$' "$MOCK_LOG")" -ne 1 ] \
    || [ "$(rg -c '^migrate-once$' "$MOCK_LOG")" -ne 1 ]; then
    echo "Backup and migration must each run exactly once" >&2
    exit 1
fi

if rg -q ' ps -a ' "$MOCK_LOG"; then
    echo "Container absence was still used to skip backup" >&2
    exit 1
fi

echo "Container-absent retained-volume release still performs backup before migration."
