#!/usr/bin/env bash
# Docker alternative: restore an integrity-checked gzip SQL dump.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(dirname -- "$SCRIPT_DIR")"

# shellcheck source=lib/maintenance-lock.sh
source "${SCRIPT_DIR}/lib/maintenance-lock.sh"

CONTAINER_NAME="${DB_CONTAINER_NAME:-pear_mysql}"
LOCK_DIR="${RESTORE_LOCK_DIR:-${TMPDIR:-/tmp}/pear-system-docker-restore.lock}"

LOCK_ACQUIRED=0

cleanup() {
    local status=$?

    if [ "$LOCK_ACQUIRED" -eq 1 ]; then
        rmdir -- "$LOCK_DIR" 2>/dev/null || true
    fi

    release_maintenance_lock

    exit "$status"
}
trap cleanup EXIT INT TERM

usage() {
    echo "Usage: $0 <backup-file.sql.gz>" >&2
}

if [ "$#" -ne 1 ]; then
    usage
    exit 2
fi

INPUT_FILE="${1:-}"
if [ -z "$INPUT_FILE" ]; then
    usage
    exit 2
fi

if [[ "$INPUT_FILE" = /* ]]; then
    CANDIDATE_FILE="$INPUT_FILE"
else
    CANDIDATE_FILE="${PROJECT_DIR}/${INPUT_FILE}"
fi

if [ ! -f "$CANDIDATE_FILE" ]; then
    echo "[ERROR] Backup file not found: ${INPUT_FILE}" >&2
    exit 1
fi

BACKUP_FILE="$(cd -- "$(dirname -- "$CANDIDATE_FILE")" && pwd -P)/$(basename -- "$CANDIDATE_FILE")"

if [[ "$BACKUP_FILE" != *.sql.gz ]]; then
    echo "[ERROR] Backup file must end in .sql.gz" >&2
    exit 1
fi

for command_name in docker gzip; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[ERROR] Required command is unavailable: ${command_name}" >&2
        exit 1
    fi
done

if ! gzip -t -- "$BACKUP_FILE"; then
    echo "[ERROR] Backup gzip integrity check failed" >&2
    exit 1
fi

if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
    echo "[ERROR] Another restore is already running" >&2
    exit 1
fi
LOCK_ACQUIRED=1

if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || true)" != "true" ]; then
    echo "[ERROR] Database container is not running: ${CONTAINER_NAME}" >&2
    exit 1
fi

DB_NAME="${DB_DATABASE:-}"
if [ -z "$DB_NAME" ]; then
    DB_NAME="$(docker exec "$CONTAINER_NAME" printenv MYSQL_DATABASE 2>/dev/null || true)"
fi

if ! [[ "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "[ERROR] Database name must contain only letters, digits, and underscores" >&2
    exit 1
fi

echo "WARNING: This imports the dump into database '${DB_NAME}'." >&2
echo "Backup file: ${BACKUP_FILE}" >&2
if ! read -r -p "Type RESTORE ${DB_NAME} to continue: " CONFIRMATION; then
    echo "[ERROR] Confirmation input was not available" >&2
    exit 1
fi

if [ "$CONFIRMATION" != "RESTORE ${DB_NAME}" ]; then
    echo "Cancelled."
    exit 0
fi

acquire_maintenance_lock

if ! gzip -t -- "$BACKUP_FILE"; then
    echo "[ERROR] Backup changed or failed integrity validation while awaiting confirmation" >&2
    exit 1
fi

# The prompt intentionally happens before acquiring the shared lock. Recheck the
# target after locking so an intervening deploy cannot redirect this restore.
if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || true)" != "true" ]; then
    echo "[ERROR] Database container stopped before restore acquired the maintenance lock" >&2
    exit 1
fi

LOCKED_DB_NAME="${DB_DATABASE:-}"
if [ -z "$LOCKED_DB_NAME" ]; then
    LOCKED_DB_NAME="$(docker exec "$CONTAINER_NAME" printenv MYSQL_DATABASE 2>/dev/null || true)"
fi
if [ "$LOCKED_DB_NAME" != "$DB_NAME" ]; then
    echo "[ERROR] Database target changed while waiting for the maintenance lock" >&2
    exit 1
fi

echo "[$(date -u +%FT%TZ)] Creating a mandatory pre-restore safety backup..."
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups/mysql}" \
    DB_CONTAINER_NAME="$CONTAINER_NAME" \
    DB_DATABASE="$DB_NAME" \
    "${SCRIPT_DIR}/backup-db.sh"

echo "[$(date -u +%FT%TZ)] Restoring database..."
if ! gzip -dc -- "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -u root "$1"' \
    sh "$DB_NAME"; then
    echo "[ERROR] Restore failed; inspect the database and use the safety backup if recovery is required" >&2
    exit 1
fi

echo "[$(date -u +%FT%TZ)] Restore completed successfully."
