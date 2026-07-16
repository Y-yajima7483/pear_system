#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
INIT_SCRIPT="${PROJECT_DIR}/docker/mysql/initdb/10-create-test-database.sh"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-mysql-init-test.XXXXXX")"
MOCK_BIN="${TEST_ROOT}/bin"
SQL_LOG="${TEST_ROOT}/sql.log"

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p -- "$MOCK_BIN"
cat > "${MOCK_BIN}/mysql" <<'MOCK_MYSQL'
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${MYSQL_PWD:-}" ]; then
    echo "MYSQL_PWD was not provided" >&2
    exit 90
fi

cat > "$SQL_LOG"
MOCK_MYSQL
chmod 0755 "${MOCK_BIN}/mysql"

export PATH="${MOCK_BIN}:${PATH}"
export SQL_LOG

MYSQL_CREATE_TEST_DATABASE=false "$INIT_SCRIPT"
if [ -e "$SQL_LOG" ]; then
    echo "Production no-op unexpectedly invoked mysql" >&2
    exit 1
fi

set +e
MYSQL_CREATE_TEST_DATABASE=true \
    MYSQL_TEST_DATABASE='invalid-name' \
    MYSQL_USER=pear_user \
    MYSQL_ROOT_PASSWORD=not-a-real-secret \
    "$INIT_SCRIPT" >/dev/null 2>&1
invalid_status=$?
set -e

if [ "$invalid_status" -eq 0 ]; then
    echo "Invalid database identifier was accepted" >&2
    exit 1
fi

MYSQL_CREATE_TEST_DATABASE=true \
    MYSQL_TEST_DATABASE=pear_system_testing \
    MYSQL_USER=pear_user \
    MYSQL_ROOT_PASSWORD=not-a-real-secret \
    "$INIT_SCRIPT"

grep -Fq 'CREATE DATABASE IF NOT EXISTS `pear_system_testing`' "$SQL_LOG"
grep -Fq "GRANT ALL PRIVILEGES ON \`pear_system_testing\`.* TO 'pear_user'@'%';" "$SQL_LOG"

if grep -q 'not-a-real-secret' "$SQL_LOG"; then
    echo "Root credential was written into SQL" >&2
    exit 1
fi

echo "MySQL test database init checks passed."
