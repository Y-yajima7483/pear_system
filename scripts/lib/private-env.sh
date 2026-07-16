#!/usr/bin/env bash

# Validate a private operator-controlled file before it is read.
validate_private_file() {
    local private_file="$1"
    local file_mode
    local file_owner
    local current_owner

    if [ -L "$private_file" ]; then
        echo "[ERROR] Private file must not be a symbolic link" >&2
        return 1
    fi

    if [ ! -f "$private_file" ] || [ ! -r "$private_file" ]; then
        echo "[ERROR] Private file is not a readable regular file" >&2
        return 1
    fi

    if file_mode="$(stat -c '%a' "$private_file" 2>/dev/null)"; then
        file_owner="$(stat -c '%u' "$private_file")"
    else
        file_mode="$(stat -f '%Lp' "$private_file")"
        file_owner="$(stat -f '%u' "$private_file")"
    fi

    if ! [[ "$file_mode" =~ ^[0-7]+$ ]] || ! [[ "$file_owner" =~ ^[0-9]+$ ]]; then
        echo "[ERROR] Unable to determine private file ownership or mode" >&2
        return 1
    fi

    current_owner="$(id -u)"
    if [ "$file_owner" != "0" ] && [ "$file_owner" != "$current_owner" ]; then
        echo "[ERROR] Private file must be owned by root or the current user" >&2
        return 1
    fi

    if (( (8#${file_mode}) & 077 )); then
        echo "[ERROR] Private file must not be accessible by group or others" >&2
        return 1
    fi
}

# Load an environment file only after the common private-file checks. Callers
# are expected to run with `set -euo pipefail`.
load_private_env_file() {
    local env_file="$1"
    local parse_marker

    validate_private_file "$env_file" || return 1

    if ! bash -n "$env_file" >/dev/null 2>&1; then
        echo "[ERROR] Private environment file has invalid shell syntax" >&2
        return 1
    fi

    # Some older Bash releases can return success for a narrow class of
    # incomplete constructs during `bash -n`. Require a post-source marker in an
    # isolated shell as a second fail-closed syntax/flow check.
    parse_marker="$(bash -c \
        'source "$1" >/dev/null 2>&1; printf %s __PEAR_PRIVATE_ENV_OK__' \
        bash "$env_file" 2>/dev/null || true)"
    if [ "$parse_marker" != "__PEAR_PRIVATE_ENV_OK__" ]; then
        echo "[ERROR] Private environment file could not be evaluated safely" >&2
        return 1
    fi

    set -a
    # shellcheck disable=SC1090
    if ! source "$env_file"; then
        set +a
        echo "[ERROR] Private environment file could not be sourced" >&2
        return 1
    fi
    set +a
}
