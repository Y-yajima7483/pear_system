#!/usr/bin/env bash

# Directory locking is used instead of flock so the helpers work on both the
# canonical Linux host and developer workstations. A token permits trusted child
# helpers (for example deploy -> backup) to share the same lock without deadlock.
MAINTENANCE_LOCK_DIR="${MAINTENANCE_LOCK_DIR:-/tmp/pear-system-db-maintenance.lock}"
export MAINTENANCE_LOCK_DIR
MAINTENANCE_LOCK_ACQUIRED=0

acquire_maintenance_lock() {
    local token_file="${MAINTENANCE_LOCK_DIR}/token"
    local recorded_token=""

    if [ -n "${PEAR_MAINTENANCE_LOCK_TOKEN:-}" ]; then
        if [ ! -f "$token_file" ]; then
            echo "[ERROR] Inherited maintenance lock token has no active lock" >&2
            return 1
        fi

        IFS= read -r recorded_token < "$token_file" || true
        if [ -z "$recorded_token" ] || [ "$recorded_token" != "$PEAR_MAINTENANCE_LOCK_TOKEN" ]; then
            echo "[ERROR] Inherited maintenance lock token is invalid" >&2
            return 1
        fi

        return 0
    fi

    umask 077
    if ! mkdir -- "$MAINTENANCE_LOCK_DIR" 2>/dev/null; then
        echo "[ERROR] Another database maintenance operation is already running" >&2
        return 1
    fi

    chmod 0700 "$MAINTENANCE_LOCK_DIR"
    PEAR_MAINTENANCE_LOCK_TOKEN="$$-${BASHPID:-$$}-${RANDOM:-0}-$(date +%s)"
    if ! printf '%s\n' "$PEAR_MAINTENANCE_LOCK_TOKEN" > "$token_file"; then
        rmdir -- "$MAINTENANCE_LOCK_DIR" 2>/dev/null || true
        unset PEAR_MAINTENANCE_LOCK_TOKEN
        return 1
    fi
    chmod 0600 "$token_file"
    export PEAR_MAINTENANCE_LOCK_TOKEN
    MAINTENANCE_LOCK_ACQUIRED=1
}

release_maintenance_lock() {
    if [ "$MAINTENANCE_LOCK_ACQUIRED" -ne 1 ]; then
        return 0
    fi

    rm -f -- "${MAINTENANCE_LOCK_DIR}/token"
    rmdir -- "$MAINTENANCE_LOCK_DIR" 2>/dev/null || true
    unset PEAR_MAINTENANCE_LOCK_TOKEN
    MAINTENANCE_LOCK_ACQUIRED=0
}
