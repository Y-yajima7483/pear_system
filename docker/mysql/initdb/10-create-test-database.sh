#!/usr/bin/env bash

set -euo pipefail

if [ "${MYSQL_CREATE_TEST_DATABASE:-false}" != "true" ]; then
    exit 0
fi

TEST_DATABASE="${MYSQL_TEST_DATABASE:-pear_system_testing}"
APP_USER="${MYSQL_USER:-}"

if ! [[ "$TEST_DATABASE" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "[ERROR] MYSQL_TEST_DATABASE contains unsupported characters" >&2
    exit 1
fi

if ! [[ "$APP_USER" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "[ERROR] MYSQL_USER contains unsupported characters" >&2
    exit 1
fi

if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    echo "[ERROR] MYSQL_ROOT_PASSWORD is required to initialize the test database" >&2
    exit 1
fi

MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${TEST_DATABASE}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON \`${TEST_DATABASE}\`.* TO '${APP_USER}'@'%';
SQL
