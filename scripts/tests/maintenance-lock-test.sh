#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
LOCK_LIBRARY="${PROJECT_DIR}/scripts/lib/maintenance-lock.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-maintenance-lock-test.XXXXXX")"

export MAINTENANCE_LOCK_DIR="${TEST_ROOT}/maintenance.lock"

# shellcheck source=../lib/maintenance-lock.sh
source "$LOCK_LIBRARY"

cleanup() {
    release_maintenance_lock
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

for maintenance_script in backup-db.sh backup-db-native.sh deploy.sh deploy-native.sh restore-db.sh; do
    if ! rg -q 'source .*lib/maintenance-lock\.sh' "${PROJECT_DIR}/scripts/${maintenance_script}" \
        || ! rg -q 'acquire_maintenance_lock' "${PROJECT_DIR}/scripts/${maintenance_script}"; then
        echo "${maintenance_script} is not protected by the common maintenance lock" >&2
        exit 1
    fi
done

acquire_maintenance_lock

# A trusted child helper inherits the token and may share the lock.
bash -c 'source "$1"; acquire_maintenance_lock; release_maintenance_lock' bash "$LOCK_LIBRARY"

# An unrelated operation must fail while the parent holds the lock.
set +e
env -u PEAR_MAINTENANCE_LOCK_TOKEN \
    MAINTENANCE_LOCK_DIR="$MAINTENANCE_LOCK_DIR" \
    bash -c 'source "$1"; acquire_maintenance_lock' bash "$LOCK_LIBRARY" >/dev/null 2>&1
contended_status=$?
set -e
if [ "$contended_status" -eq 0 ]; then
    echo "Independent maintenance operation bypassed the active lock" >&2
    exit 1
fi

release_maintenance_lock

# The lock is reusable after a clean release.
env -u PEAR_MAINTENANCE_LOCK_TOKEN \
    MAINTENANCE_LOCK_DIR="$MAINTENANCE_LOCK_DIR" \
    bash -c 'source "$1"; acquire_maintenance_lock; release_maintenance_lock' bash "$LOCK_LIBRARY"

echo "Maintenance lock nesting and contention checks passed."
