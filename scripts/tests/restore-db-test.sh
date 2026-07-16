#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
RESTORE_SCRIPT="${PROJECT_DIR}/scripts/restore-db.sh"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-restore-test.XXXXXX")"
MOCK_BIN="${TEST_ROOT}/bin"
MOCK_LOG="${TEST_ROOT}/docker.log"
BACKUP_DIR="${TEST_ROOT}/backups"

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p -- "$MOCK_BIN" "$BACKUP_DIR" "${TEST_ROOT}/tmp"
: > "$MOCK_LOG"

cat > "${MOCK_BIN}/docker" <<'MOCK_DOCKER'
#!/usr/bin/env bash
set -euo pipefail

(
    printf '%s' "${1:-}"
    shift || true
    for argument in "$@"; do
        printf '|%s' "$argument"
    done
    printf '\n'
) >> "${MOCK_LOG}"

case "${1:-}" in
    inspect)
        printf '%s\n' "${MOCK_RUNNING:-true}"
        ;;
    exec)
        shift
        if [ "${1:-}" = "-i" ]; then
            shift
            cat >/dev/null
            if [ "${MOCK_RESTORE_FAIL:-0}" = "1" ]; then
                exit 41
            fi
            exit 0
        fi

        shift
        if [ "${1:-}" = "printenv" ]; then
            printf '%s\n' "${MOCK_DATABASE:-pear_test}"
            exit 0
        fi

        if [ "${MOCK_BACKUP_FAIL:-0}" = "1" ]; then
            exit 42
        fi
        printf '%s\n' 'CREATE TABLE mock_backup (id INT);'
        ;;
    *)
        echo "Unexpected mock docker call" >&2
        exit 99
        ;;
esac
MOCK_DOCKER
chmod 0755 "${MOCK_BIN}/docker"

VALID_BACKUP="${TEST_ROOT}/valid.sql.gz"
INVALID_BACKUP="${TEST_ROOT}/invalid.sql.gz"
printf '%s\n' 'CREATE TABLE restored_data (id INT);' | gzip -c > "$VALID_BACKUP"
printf '%s\n' 'not a gzip stream' > "$INVALID_BACKUP"

export PATH="${MOCK_BIN}:${PATH}"
export MOCK_LOG
export MOCK_DATABASE=pear_test
export DB_DATABASE=pear_test
export DB_CONTAINER_NAME=mock_mysql
export BACKUP_DIR
export BACKUP_LOCK_DIR="${TEST_ROOT}/backup.lock"
export RESTORE_LOCK_DIR="${TEST_ROOT}/restore.lock"
export MAINTENANCE_LOCK_DIR="${TEST_ROOT}/maintenance.lock"
export TMPDIR="${TEST_ROOT}/tmp"

STATUS=0
OUTPUT=""
TEST_COUNT=0

run_restore() {
    local confirmation="$1"
    shift

    set +e
    OUTPUT="$(printf '%s\n' "$confirmation" | "$RESTORE_SCRIPT" "$@" 2>&1)"
    STATUS=$?
    set -e
}

assert_status() {
    local expected="$1"
    local label="$2"
    TEST_COUNT=$((TEST_COUNT + 1))

    if [ "$STATUS" -ne "$expected" ]; then
        echo "not ok ${TEST_COUNT} - ${label} (expected status ${expected}, got ${STATUS})" >&2
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

export MOCK_RUNNING=true MOCK_BACKUP_FAIL=0 MOCK_RESTORE_FAIL=0

run_restore ""
assert_status 2 "missing argument returns usage status"
assert_output_contains "Usage:" "missing argument prints usage"

run_restore "" "$VALID_BACKUP" extra
assert_status 2 "extra argument is rejected"

run_restore "" "${TEST_ROOT}/missing.sql.gz"
assert_status 1 "missing file is rejected"
assert_output_contains "Backup file not found" "missing file has a clear error"

run_restore "" "$INVALID_BACKUP"
assert_status 1 "invalid gzip is rejected before Docker access"
assert_output_contains "gzip integrity check failed" "invalid gzip has a clear error"

export MOCK_RUNNING=false
run_restore "" "$VALID_BACKUP"
assert_status 1 "stopped database container is rejected"
assert_output_contains "not running" "stopped container has a clear error"

export MOCK_RUNNING=true
: > "$MOCK_LOG"
run_restore "no" "$VALID_BACKUP"
assert_status 0 "operator cancellation is clean"
assert_output_contains "Cancelled" "operator cancellation is reported"
if grep -q '^exec|-i|' "$MOCK_LOG"; then
    echo "Restore was unexpectedly invoked after cancellation" >&2
    exit 1
fi

mkdir -- "$MAINTENANCE_LOCK_DIR"
run_restore "RESTORE pear_test" "$VALID_BACKUP"
assert_status 1 "active maintenance lock blocks restore"
assert_output_contains "maintenance operation" "maintenance lock contention is reported"
rmdir -- "$MAINTENANCE_LOCK_DIR"

export MOCK_BACKUP_FAIL=1
run_restore "RESTORE pear_test" "$VALID_BACKUP"
assert_status 1 "failed safety backup blocks restore"
assert_output_contains "Database dump failed" "safety backup failure is reported"

export MOCK_BACKUP_FAIL=0 MOCK_RESTORE_FAIL=1
run_restore "RESTORE pear_test" "$VALID_BACKUP"
assert_status 1 "failed import returns non-zero"
assert_output_contains "Restore failed" "failed import has a recovery warning"

export MOCK_RESTORE_FAIL=0
run_restore "RESTORE pear_test" "$VALID_BACKUP"
assert_status 0 "valid confirmed restore succeeds after a safety backup"
assert_output_contains "Restore completed successfully" "successful restore is reported"

unsafe_bypass_name='RESTORE_SKIP''_SAFETY_BACKUP'
if rg -q "$unsafe_bypass_name" "$RESTORE_SCRIPT"; then
    echo "Restore safety backup bypass is still present" >&2
    exit 1
fi

backup_count="$(find "$BACKUP_DIR" -type f -name 'pear_test_*.sql.gz' | wc -l | tr -d '[:space:]')"
TEST_COUNT=$((TEST_COUNT + 1))
if [ "$backup_count" -lt 1 ]; then
    echo "not ok ${TEST_COUNT} - safety backup artifact exists" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - safety backup artifact exists"

echo "1..${TEST_COUNT}"
