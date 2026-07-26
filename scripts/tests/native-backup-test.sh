#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup-db-native.sh"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-native-backup-test.XXXXXX")"
MOCK_BIN="${TEST_ROOT}/bin"
MOCK_LOG="${TEST_ROOT}/mock.log"
BACKUP_DIR="${TEST_ROOT}/backups"
RESULT_FILE="${TEST_ROOT}/backup-result"
PRIVATE_ENV="${TEST_ROOT}/deploy.env"

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p -- "$MOCK_BIN" "$BACKUP_DIR"
: > "$MOCK_LOG"

printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' \
    'printf "mysqldump|%s\\n" "$*" >> "$MOCK_LOG"' \
    'if [ "${MOCK_DUMP_FAIL:-0}" = "1" ]; then exit 41; fi' \
    "printf '%s\\n' 'CREATE TABLE backup_test (id INT);'" \
    > "${MOCK_BIN}/mysqldump"
chmod 0755 "${MOCK_BIN}/mysqldump"

printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' \
    'printf "rclone|%s\\n" "$*" >> "$MOCK_LOG"' \
    'if [ "${MOCK_RCLONE_FAIL:-0}" = "1" ]; then exit 42; fi' \
    > "${MOCK_BIN}/rclone"
chmod 0755 "${MOCK_BIN}/rclone"

printf '%s\n' '[client]' > "${TEST_ROOT}/mysql.cnf"
chmod 0600 "${TEST_ROOT}/mysql.cnf"

write_private_env() {
    local destination="$1"
    local rclone_destination="${2:-}"

    printf '%s\n' \
        'DB_NAME=pear_test' \
        "BACKUP_DIR=${BACKUP_DIR}" \
        "MYSQL_DEFAULTS_FILE=${TEST_ROOT}/mysql.cnf" \
        'BACKUP_DB_HOST=127.0.0.1' \
        'BACKUP_DB_PORT=3307' \
        'BACKUP_RETENTION_DAYS=0' \
        "BACKUP_LOCK_DIR=${TEST_ROOT}/backup.lock" \
        "BACKUP_RESULT_FILE=${RESULT_FILE}" \
        "BACKUP_RCLONE_DESTINATION=${rclone_destination}" \
        > "$destination"
    chmod 0600 "$destination"
}

write_private_env "$PRIVATE_ENV"

STATUS=0
OUTPUT=""
TEST_COUNT=0

run_backup() {
    local env_file="$1"
    shift

    set +e
    OUTPUT="$(
        (
        unset DB_NAME BACKUP_DIR MYSQL_DEFAULTS_FILE BACKUP_DB_HOST BACKUP_DB_PORT \
            BACKUP_RETENTION_DAYS BACKUP_LOCK_DIR BACKUP_RESULT_FILE BACKUP_RCLONE_DESTINATION
        export DEPLOY_ENV_FILE="$env_file"
        export PATH="${MOCK_BIN}:${PATH}"
        export MOCK_LOG MOCK_DUMP_FAIL="${MOCK_DUMP_FAIL:-0}" MOCK_RCLONE_FAIL="${MOCK_RCLONE_FAIL:-0}"
        "$BACKUP_SCRIPT" "$@"
        ) 2>&1
    )"
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

run_backup "$PRIVATE_ENV"
assert_status 0 "protected DEPLOY_ENV_FILE loads for a manual/cron backup"
assert_output_contains "Backup verified" "successful backup reports verification"

TEST_COUNT=$((TEST_COUNT + 1))
if ! rg -q -- '--host=127.0.0.1.*--port=3307.*pear_test|--port=3307.*pear_test' "$MOCK_LOG"; then
    echo "not ok ${TEST_COUNT} - mysqldump receives values from private environment" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - mysqldump receives values from private environment"

backup_file="$(sed -n '1p' "$RESULT_FILE")"
TEST_COUNT=$((TEST_COUNT + 1))
if [ -z "$backup_file" ] || [ ! -s "$backup_file" ] || ! gzip -t -- "$backup_file"; then
    echo "not ok ${TEST_COUNT} - dump is compressed and result file names it" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - dump is compressed and result file names it"

expired_backup="${BACKUP_DIR}/pear_test_expired.sql.gz"
printf '%s\n' 'expired' | gzip -c > "$expired_backup"
touch -t 200001010000 "$expired_backup"
run_backup "$PRIVATE_ENV"
assert_status 0 "retention run succeeds"
TEST_COUNT=$((TEST_COUNT + 1))
if [ -e "$expired_backup" ]; then
    echo "not ok ${TEST_COUNT} - expired backup is deleted by retention" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - expired backup is deleted by retention"

write_private_env "$PRIVATE_ENV" 'remote:pear-backups'
: > "$MOCK_LOG"
export MOCK_RCLONE_FAIL=0
run_backup "$PRIVATE_ENV"
assert_status 0 "optional rclone copy succeeds"
TEST_COUNT=$((TEST_COUNT + 1))
if ! rg -q '^rclone\|copyto ' "$MOCK_LOG"; then
    echo "not ok ${TEST_COUNT} - rclone copyto is used" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - rclone copyto is used"

export MOCK_RCLONE_FAIL=1
run_backup "$PRIVATE_ENV"
assert_status 1 "rclone failure is fail-closed"
unset MOCK_RCLONE_FAIL

mkdir -- "${TEST_ROOT}/backup.lock"
write_private_env "$PRIVATE_ENV"
run_backup "$PRIVATE_ENV"
assert_status 1 "backup lock contention is rejected"
assert_output_contains "already running" "lock contention has a clear error"
rmdir -- "${TEST_ROOT}/backup.lock"

chmod 0644 "$PRIVATE_ENV"
run_backup "$PRIVATE_ENV"
assert_status 1 "insecure DEPLOY_ENV_FILE permissions are rejected"
assert_output_contains "must not be accessible" "permission rejection is clear"
chmod 0600 "$PRIVATE_ENV"

chmod 0644 "${TEST_ROOT}/mysql.cnf"
: > "$MOCK_LOG"
run_backup "$PRIVATE_ENV"
assert_status 1 "insecure MYSQL_DEFAULTS_FILE permissions are rejected"
assert_output_contains "must not be accessible" "MySQL defaults permission rejection is clear"
TEST_COUNT=$((TEST_COUNT + 1))
if rg -q '^mysqldump|' "$MOCK_LOG"; then
    echo "not ok ${TEST_COUNT} - insecure MySQL defaults file is rejected before dump" >&2
    exit 1
fi
echo "ok ${TEST_COUNT} - insecure MySQL defaults file is rejected before dump"
chmod 0600 "${TEST_ROOT}/mysql.cnf"

invalid_env="${TEST_ROOT}/invalid.env"
write_private_env "$invalid_env"
printf '%s\n' 'DB_NAME=bad-name' >> "$invalid_env"
chmod 0600 "$invalid_env"
run_backup "$invalid_env"
assert_status 1 "invalid DB input is rejected after private environment loading"
assert_output_contains "DB_NAME must contain" "invalid input has a clear error"

export MOCK_DUMP_FAIL=1
run_backup "$PRIVATE_ENV"
assert_status 1 "dump failure is fail-closed"
assert_output_contains "Database dump failed" "dump failure has a clear error"
unset MOCK_DUMP_FAIL

echo "1..${TEST_COUNT}"
