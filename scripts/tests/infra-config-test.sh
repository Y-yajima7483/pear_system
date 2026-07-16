#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-infra-config-test.XXXXXX")"

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

umask 077
cd -- "$PROJECT_DIR"

docker compose --env-file /dev/null -f docker-compose.yml config > "${TEST_ROOT}/development.yml"

rg -q 'host_ip: 127\.0\.0\.1' "${TEST_ROOT}/development.yml"
rg -q 'source: next_node_modules' "${TEST_ROOT}/development.yml"
rg -q 'target: /app/node_modules' "${TEST_ROOT}/development.yml"
rg -q 'source: next_build_cache' "${TEST_ROOT}/development.yml"
rg -q 'target: /app/\.next' "${TEST_ROOT}/development.yml"
rg -q 'NEXT_PUBLIC_APP_URL: http://localhost:8080' "${TEST_ROOT}/development.yml"
rg -q '^    expose:$' "${TEST_ROOT}/development.yml"
host_port_mapping='"3000[:]3000"'
if rg -q 'published: "3000"' "${TEST_ROOT}/development.yml" \
    || rg -q "$host_port_mapping" docker-compose.yml; then
    echo "Next.js development port 3000 is still published to the host" >&2
    exit 1
fi

same_origin_files=(
    README.md
    next/README.md
    next/src/app/layout.tsx
    laravel/.env.example
    laravel/config/sanctum.php
)
if rg -q '(localhost|127\.0\.0\.1):3000' "${same_origin_files[@]}"; then
    echo "A tracked development browser/auth setting still uses port 3000" >&2
    exit 1
fi
rg -q 'http://localhost:8080' README.md next/README.md next/src/app/layout.tsx laravel/.env.example
rg -q 'localhost:8080,127\.0\.0\.1:8080' laravel/.env.example laravel/config/sanctum.php

rg -q '^COPY next/package\.json next/yarn\.lock next/\.yarnrc\.yml \./$' docker/node/Dockerfile
rg -q '^RUN yarn install --immutable$' docker/node/Dockerfile
rg -q '^COPY next/package\.json next/yarn\.lock next/\.yarnrc\.yml \./$' docker/node/Dockerfile.prod
rg -q '^RUN yarn install --immutable$' docker/node/Dockerfile.prod

APP_ORIGIN=https://app.example.invalid \
APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
DB_DATABASE=pear_app \
DB_USERNAME=pear_app \
DB_PASSWORD=not-a-real-secret \
DB_ROOT_PASSWORD=not-a-real-secret \
SESSION_DOMAIN=app.example.invalid \
SANCTUM_STATEFUL_DOMAINS=app.example.invalid \
docker compose --env-file /dev/null -f docker-compose.prod.yml config > "${TEST_ROOT}/production.yml"

if rg -q 'docker compose .* (build|up)' docker-compose.prod.yml \
    || ! rg -q 'scripts/deploy\.sh' docker-compose.prod.yml; then
    echo "Production Compose usage does not require the guarded deploy script" >&2
    exit 1
fi

legacy_backend_variable='NEXT_PUBLIC_''BACKEND_URL'
if rg -q "$legacy_backend_variable" "${TEST_ROOT}/production.yml" docker/node/Dockerfile.prod; then
    echo "Production configuration still exposes an absolute browser API variable" >&2
    exit 1
fi

if rg -q 'artisan migrate' docker/php/docker-entrypoint.prod.sh; then
    echo "Production application startup still runs migrations" >&2
    exit 1
fi

rg -q '\^/\(api\|sanctum\)' docker/nginx/conf.d/production.conf

set +e
env -i PATH="$PATH" HOME="$HOME" \
    docker compose --env-file /dev/null -f docker-compose.prod.yml config --quiet \
    > "${TEST_ROOT}/missing-env.log" 2>&1
missing_env_status=$?
set -e
if [ "$missing_env_status" -eq 0 ] || ! rg -q 'must be set|missing a value' "${TEST_ROOT}/missing-env.log"; then
    echo "Production Compose did not fail closed for missing required variables" >&2
    exit 1
fi

if git check-ignore -q next/.yarnrc.yml; then
    echo "Tracked Yarn configuration is still ignored" >&2
    exit 1
fi

echo "Infrastructure configuration checks passed."
