#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
REVISION_LIBRARY="${PROJECT_DIR}/scripts/lib/revision.sh"

# shellcheck source=../lib/revision.sh
source "$REVISION_LIBRARY"

VALID_OID=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
OTHER_OID=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

validate_deploy_revision "$VALID_OID" "$VALID_OID"

for invalid_revision in \
    HEAD \
    main \
    refs/heads/main \
    v1.0.0 \
    aaaaaaa \
    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
    aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; do
    if validate_deploy_revision "$invalid_revision" "$VALID_OID" >/dev/null 2>&1; then
        echo "Non-complete deploy revision was accepted" >&2
        exit 1
    fi
done

if validate_deploy_revision "$OTHER_OID" "$VALID_OID" >/dev/null 2>&1; then
    echo "A complete but non-current commit OID was accepted" >&2
    exit 1
fi

for deploy_script in deploy.sh deploy-native.sh; do
    rg -q 'source .*lib/revision\.sh' "${PROJECT_DIR}/scripts/${deploy_script}"
    rg -q 'validate_deploy_revision "\$DEPLOY_REVISION" "\$current_revision"' \
        "${PROJECT_DIR}/scripts/${deploy_script}"
    if rg -q 'DEPLOY_REVISION\}\^\{commit\}' "${PROJECT_DIR}/scripts/${deploy_script}"; then
        echo "${deploy_script} still resolves symbolic deploy revisions" >&2
        exit 1
    fi
done

echo "Complete commit OID validation checks passed."
