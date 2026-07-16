#!/usr/bin/env bash

validate_deploy_revision() {
    local requested_revision="$1"
    local current_revision="$2"

    if ! [[ "$requested_revision" =~ ^[0-9a-f]{40}$ ]]; then
        echo "[ERROR] DEPLOY_REVISION must be a complete lowercase 40-character commit OID" >&2
        return 1
    fi

    if ! [[ "$current_revision" =~ ^[0-9a-f]{40}$ ]]; then
        echo "[ERROR] Unable to determine the current complete commit OID" >&2
        return 1
    fi

    if [ "$requested_revision" != "$current_revision" ]; then
        echo "[ERROR] Checked-out commit does not match DEPLOY_REVISION" >&2
        return 1
    fi
}
