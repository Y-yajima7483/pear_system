#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"

# shellcheck source=../lib/private-env.sh
source "${PROJECT_DIR}/scripts/lib/private-env.sh"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-private-env-test.XXXXXX")"
PRIVATE_ENV="${TEST_ROOT}/deploy.env"

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

printf '%s\n' 'PRIVATE_ENV_TEST_VALUE=loaded' > "$PRIVATE_ENV"
chmod 0600 "$PRIVATE_ENV"

unset PRIVATE_ENV_TEST_VALUE || true
load_private_env_file "$PRIVATE_ENV"
if [ "${PRIVATE_ENV_TEST_VALUE:-}" != "loaded" ]; then
    echo "Secure environment file was not sourced" >&2
    exit 1
fi

if [ "$(bash -c 'printf %s "${PRIVATE_ENV_TEST_VALUE:-}"')" != "loaded" ]; then
    echo "Sourced environment value was not exported" >&2
    exit 1
fi

chmod 0644 "$PRIVATE_ENV"
if load_private_env_file "$PRIVATE_ENV" >/dev/null 2>&1; then
    echo "Group/world-readable environment file was accepted" >&2
    exit 1
fi
chmod 0600 "$PRIVATE_ENV"

ln -s "$PRIVATE_ENV" "${TEST_ROOT}/deploy-link.env"
if load_private_env_file "${TEST_ROOT}/deploy-link.env" >/dev/null 2>&1; then
    echo "Symbolic-link environment file was accepted" >&2
    exit 1
fi

printf '%s\n' 'if then' > "${TEST_ROOT}/invalid.env"
chmod 0600 "${TEST_ROOT}/invalid.env"
if load_private_env_file "${TEST_ROOT}/invalid.env" >/dev/null 2>&1; then
    echo "Syntactically invalid environment file was accepted" >&2
    exit 1
fi

load_line="$(rg -n 'load_private_env_file' "${PROJECT_DIR}/scripts/deploy.sh" | head -n 1 | cut -d: -f1)"
required_line="$(rg -n 'DEPLOY_REVISION:\?' "${PROJECT_DIR}/scripts/deploy.sh" | head -n 1 | cut -d: -f1)"
if [ -z "$load_line" ] || [ -z "$required_line" ] || [ "$load_line" -ge "$required_line" ]; then
    echo "Docker deploy does not source its private environment before required-value checks" >&2
    exit 1
fi

native_deploy_load_line="$(rg -n 'load_private_env_file "\$requested_deploy_env_file"' "${PROJECT_DIR}/scripts/deploy-native.sh" | head -n 1 | cut -d: -f1)"
native_deploy_required_line="$(rg -n 'APP_DIR:\?' "${PROJECT_DIR}/scripts/deploy-native.sh" | head -n 1 | cut -d: -f1)"
if [ -z "$native_deploy_load_line" ] || [ -z "$native_deploy_required_line" ] \
    || [ "$native_deploy_load_line" -ge "$native_deploy_required_line" ]; then
    echo "Native deploy does not source its private environment before APP_DIR checks" >&2
    exit 1
fi

native_backup_load_line="$(rg -n 'load_private_env_file "\$requested_deploy_env_file"' "${PROJECT_DIR}/scripts/backup-db-native.sh" | head -n 1 | cut -d: -f1)"
native_backup_required_line="$(rg -n 'DB_NAME:\?' "${PROJECT_DIR}/scripts/backup-db-native.sh" | head -n 1 | cut -d: -f1)"
if [ -z "$native_backup_load_line" ] || [ -z "$native_backup_required_line" ] \
    || [ "$native_backup_load_line" -ge "$native_backup_required_line" ]; then
    echo "Native backup does not source its private environment before DB_NAME checks" >&2
    exit 1
fi

for deploy_script in deploy.sh deploy-native.sh; do
    if ! rg -q 'git status --porcelain --untracked-files=normal' "${PROJECT_DIR}/scripts/${deploy_script}"; then
        echo "${deploy_script} does not reject normal untracked files" >&2
        exit 1
    fi
done

echo "Private deployment environment checks passed."
