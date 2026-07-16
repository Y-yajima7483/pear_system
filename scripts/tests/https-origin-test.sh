#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
ORIGIN_LIBRARY="${PROJECT_DIR}/scripts/lib/https-origin.sh"

# shellcheck source=../lib/https-origin.sh
source "$ORIGIN_LIBRARY"

assert_valid() {
    local supplied="$1"
    local expected="$2"

    if ! validate_https_origin "$supplied" >/dev/null 2>&1; then
        echo "Expected valid HTTPS origin was rejected" >&2
        exit 1
    fi
    if [ "$HTTPS_ORIGIN_NORMALIZED" != "$expected" ]; then
        echo "HTTPS origin normalized unexpectedly" >&2
        exit 1
    fi
}

assert_invalid() {
    local supplied="$1"

    if validate_https_origin "$supplied" >/dev/null 2>&1; then
        echo "Unsafe HTTPS origin was accepted" >&2
        exit 1
    fi
}

assert_valid https://app.example.invalid https://app.example.invalid
assert_valid HTTPS://app.example.invalid https://app.example.invalid
assert_valid https://APP.EXAMPLE.INVALID/ https://app.example.invalid
assert_valid https://app.example.invalid:443/ https://app.example.invalid
assert_valid https://app.example.invalid:8443 https://app.example.invalid:8443

assert_invalid http://app.example.invalid
assert_invalid https://user@app.example.invalid
assert_invalid https://app.example.invalid/path
assert_invalid https://app.example.invalid//
assert_invalid 'https://app.example.invalid?query=1'
assert_invalid 'https://app.example.invalid#fragment'
assert_invalid 'https://app.example.invalid '
assert_invalid https://app.example.invalid:0
assert_invalid https://app.example.invalid:65536
assert_invalid https://app.example.invalid:not-a-port
assert_invalid https://-bad.example.invalid
assert_invalid https://bad-.example.invalid
assert_invalid https://bad..example.invalid

for deploy_script in deploy.sh deploy-native.sh; do
    rg -q 'source .*lib/https-origin\.sh' "${PROJECT_DIR}/scripts/${deploy_script}"
    rg -q 'validate_https_origin "\$APP_ORIGIN"' "${PROJECT_DIR}/scripts/${deploy_script}"
done
rg -q 'source /usr/local/lib/pear/https-origin\.sh' "${PROJECT_DIR}/docker/php/docker-entrypoint.prod.sh"
rg -q 'validate_https_origin "\$APP_ORIGIN"' "${PROJECT_DIR}/docker/php/docker-entrypoint.prod.sh"
rg -q 'validate_https_origin "\$APP_URL"' "${PROJECT_DIR}/docker/php/docker-entrypoint.prod.sh"
rg -q 'COPY scripts/lib/https-origin\.sh /usr/local/lib/pear/https-origin\.sh' \
    "${PROJECT_DIR}/docker/php/Dockerfile.prod"

echo "HTTPS origin validation checks passed."
