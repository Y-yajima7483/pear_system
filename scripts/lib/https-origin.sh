#!/usr/bin/env bash

# Validate and normalize an HTTPS origin without accepting credentials, paths,
# queries, or fragments. One trailing slash is accepted and removed.
validate_https_origin() {
    local supplied_origin="$1"
    local normalized_origin
    local supplied_scheme
    local normalized_scheme
    local authority
    local host
    local port=""
    local label
    local labels=()

    if [[ "$supplied_origin" != *://* ]]; then
        echo "[ERROR] Origin must use https" >&2
        return 1
    fi

    supplied_scheme="${supplied_origin%%://*}"
    normalized_scheme="$(printf '%s' "$supplied_scheme" | tr '[:upper:]' '[:lower:]')"
    if [ "$normalized_scheme" != "https" ]; then
        echo "[ERROR] Origin must use https" >&2
        return 1
    fi

    normalized_origin="https://${supplied_origin#*://}"
    normalized_origin="${normalized_origin%/}"

    authority="${normalized_origin#https://}"
    if [ -z "$authority" ] \
        || [[ "$authority" == *'/'* ]] \
        || [[ "$authority" == *'?'* ]] \
        || [[ "$authority" == *'#'* ]] \
        || [[ "$authority" == *'@'* ]] \
        || [[ "$authority" =~ [[:space:]] ]]; then
        echo "[ERROR] Origin must contain only a host and optional port" >&2
        return 1
    fi

    if [[ "$authority" == *:* ]]; then
        host="${authority%%:*}"
        port="${authority#*:}"
        if [[ "$port" == *:* ]] || ! [[ "$port" =~ ^[0-9]+$ ]] \
            || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
            echo "[ERROR] Origin contains an invalid port" >&2
            return 1
        fi
    else
        host="$authority"
    fi

    if [ -z "$host" ] \
        || [[ "$host" == .* ]] \
        || [[ "$host" == *. ]] \
        || [[ "$host" == *..* ]] \
        || ! [[ "$host" =~ ^[A-Za-z0-9.-]+$ ]]; then
        echo "[ERROR] Origin contains an invalid host" >&2
        return 1
    fi

    local IFS='.'
    read -r -a labels <<< "$host"
    for label in "${labels[@]}"; do
        if [ -z "$label" ] || ! [[ "$label" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$ ]]; then
            echo "[ERROR] Origin contains an invalid host label" >&2
            return 1
        fi
    done

    HTTPS_ORIGIN_HOST="$(printf '%s' "$host" | tr '[:upper:]' '[:lower:]')"
    if [ -n "$port" ] && [ "$port" != "443" ]; then
        HTTPS_ORIGIN_NORMALIZED="https://${HTTPS_ORIGIN_HOST}:${port}"
        HTTPS_ORIGIN_STATEFUL_HOST="${HTTPS_ORIGIN_HOST}:${port}"
    else
        HTTPS_ORIGIN_NORMALIZED="https://${HTTPS_ORIGIN_HOST}"
        HTTPS_ORIGIN_STATEFUL_HOST="$HTTPS_ORIGIN_HOST"
    fi

    export HTTPS_ORIGIN_HOST HTTPS_ORIGIN_NORMALIZED HTTPS_ORIGIN_STATEFUL_HOST
}
