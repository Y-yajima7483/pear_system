#!/usr/bin/env bash
# Docker alternative: create an atomic, integrity-checked MySQL backup.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(dirname -- "$SCRIPT_DIR")"

# shellcheck source=lib/maintenance-lock.sh
source "${SCRIPT_DIR}/lib/maintenance-lock.sh"

CONTAINER_NAME="${DB_CONTAINER_NAME:-pear_mysql}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups/mysql}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
LOCK_DIR="${BACKUP_LOCK_DIR:-${TMPDIR:-/tmp}/pear-system-docker-backup.lock}"
BACKUP_RESULT_FILE="${BACKUP_RESULT_FILE:-}"

LOCK_ACQUIRED=0
TEMP_FILE=""

cleanup() {
    local status=$?

    if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
        rm -f -- "$TEMP_FILE"
    fi

    if [ "$LOCK_ACQUIRED" -eq 1 ]; then
        rmdir -- "$LOCK_DIR" 2>/dev/null || true
    fi

    release_maintenance_lock

    exit "$status"
}
trap cleanup EXIT INT TERM

for command_name in docker gzip mktemp find date; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[ERROR] Required command is unavailable: ${command_name}" >&2
        exit 1
    fi
done

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
    echo "[ERROR] BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
    exit 1
fi

acquire_maintenance_lock

if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
    echo "[ERROR] Another Docker backup is already running" >&2
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

umask 077
mkdir -p -- "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%d_%H%M%S)"
TEMP_FILE="$(mktemp "${BACKUP_DIR}/.${DB_NAME}_${timestamp}.XXXXXX")"
unique_suffix="${TEMP_FILE##*.}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${timestamp}_${unique_suffix}.sql.gz"

echo "[$(date -u +%FT%TZ)] Creating Docker database backup..."
if ! docker exec "$CONTAINER_NAME" sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -u root --single-transaction --routines --triggers --events --no-tablespaces "$1"' \
    sh "$DB_NAME" | gzip -c > "$TEMP_FILE"; then
    echo "[ERROR] Database dump failed" >&2
    exit 1
fi

if [ ! -s "$TEMP_FILE" ] || ! gzip -t -- "$TEMP_FILE"; then
    echo "[ERROR] Backup integrity check failed" >&2
    exit 1
fi

mv -- "$TEMP_FILE" "$BACKUP_FILE"
TEMP_FILE=""

if [ -n "$BACKUP_RESULT_FILE" ]; then
    printf '%s\n' "$BACKUP_FILE" > "$BACKUP_RESULT_FILE"
fi

deleted_count="$(find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l | tr -d '[:space:]')"

echo "[$(date -u +%FT%TZ)] Backup verified: $(basename -- "$BACKUP_FILE")"
if [ "$deleted_count" -gt 0 ]; then
    echo "[$(date -u +%FT%TZ)] Removed ${deleted_count} expired backup(s)"
fi
