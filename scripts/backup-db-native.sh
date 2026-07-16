#!/usr/bin/env bash
# Native deployment helper. Real paths and credentials are supplied by the
# private operations environment; this repository contains no production values.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"

# shellcheck source=lib/private-env.sh
source "${SCRIPT_DIR}/lib/private-env.sh"
# shellcheck source=lib/maintenance-lock.sh
source "${SCRIPT_DIR}/lib/maintenance-lock.sh"

: "${DB_NAME:?DB_NAME must be set by the private deployment environment}"
: "${BACKUP_DIR:?BACKUP_DIR must be set by the private deployment environment}"
: "${MYSQL_DEFAULTS_FILE:?MYSQL_DEFAULTS_FILE must point to a protected MySQL option file}"
: "${BACKUP_DB_HOST:?BACKUP_DB_HOST must identify the native backup target}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_DB_PORT="${BACKUP_DB_PORT:-3306}"
RCLONE_DESTINATION="${BACKUP_RCLONE_DESTINATION:-}"
LOCK_DIR="${BACKUP_LOCK_DIR:-${BACKUP_DIR}/.backup.lock}"
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

for command_name in mysqldump gzip mktemp find date stat; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[ERROR] Required command is unavailable: ${command_name}" >&2
        exit 1
    fi
done

if ! [[ "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "[ERROR] DB_NAME must contain only letters, digits, and underscores" >&2
    exit 1
fi

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
    echo "[ERROR] BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
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

validate_private_file "$MYSQL_DEFAULTS_FILE"

umask 077
mkdir -p -- "$BACKUP_DIR"

acquire_maintenance_lock

if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
    echo "[ERROR] Another native backup is already running" >&2
    exit 1
fi
LOCK_ACQUIRED=1

timestamp="$(date -u +%Y%m%d_%H%M%S)"
TEMP_FILE="$(mktemp "${BACKUP_DIR}/.${DB_NAME}_${timestamp}.XXXXXX")"
unique_suffix="${TEMP_FILE##*.}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${timestamp}_${unique_suffix}.sql.gz"

echo "[$(date -u +%FT%TZ)] Creating native database backup..."
if ! mysqldump \
    --defaults-extra-file="$MYSQL_DEFAULTS_FILE" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --no-tablespaces \
    --host="$BACKUP_DB_HOST" \
    --port="$BACKUP_DB_PORT" \
    "$DB_NAME" | gzip -c > "$TEMP_FILE"; then
    echo "[ERROR] Database dump failed" >&2
    exit 1
fi

if [ ! -s "$TEMP_FILE" ] || ! gzip -t -- "$TEMP_FILE"; then
    echo "[ERROR] Backup integrity check failed" >&2
    exit 1
fi

mv -- "$TEMP_FILE" "$BACKUP_FILE"
TEMP_FILE=""

if [ -n "$RCLONE_DESTINATION" ]; then
    if ! command -v rclone >/dev/null 2>&1; then
        echo "[ERROR] BACKUP_RCLONE_DESTINATION is set but rclone is unavailable" >&2
        exit 1
    fi

    rclone copyto "$BACKUP_FILE" "${RCLONE_DESTINATION%/}/$(basename -- "$BACKUP_FILE")"
fi

if [ -n "$BACKUP_RESULT_FILE" ]; then
    printf '%s\n' "$BACKUP_FILE" > "$BACKUP_RESULT_FILE"
fi

deleted_count="$(find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l | tr -d '[:space:]')"

echo "[$(date -u +%FT%TZ)] Backup verified: $(basename -- "$BACKUP_FILE")"
if [ "$deleted_count" -gt 0 ]; then
    echo "[$(date -u +%FT%TZ)] Removed ${deleted_count} expired backup(s)"
fi
