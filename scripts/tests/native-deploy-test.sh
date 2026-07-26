#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
DEPLOY_SCRIPT="${PROJECT_DIR}/scripts/deploy-native.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/pear-native-deploy-test.XXXXXX")"
MOCK_BIN="${TEST_ROOT}/bin"
MOCK_LOG="${TEST_ROOT}/calls.log"
APP_DIR="${TEST_ROOT}/app"
PRIVATE_ENV="${TEST_ROOT}/deploy.env"
MYSQL_DEFAULTS_FILE="${TEST_ROOT}/my.cnf"
AUTH_SMOKE_SCRIPT="${TEST_ROOT}/auth-smoke.sh"
AUTH_SMOKE_ENV_FILE="${TEST_ROOT}/auth-smoke.env"
REVISION=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
CALLER_EMAIL_SECRET=caller-email-secret-value
CALLER_PASSWORD_SECRET=caller-password-secret-value

cleanup() {
    rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p -- "$MOCK_BIN" "$APP_DIR/laravel" "$APP_DIR/next/public" "$APP_DIR/next/.next/static" "$TEST_ROOT/backups"
: > "$MOCK_LOG"
printf '%s\n' 'asset' > "$APP_DIR/next/public/asset.txt"
printf '%s\n' 'static' > "$APP_DIR/next/.next/static/asset.txt"
printf '%s\n' '[client]' > "$MYSQL_DEFAULTS_FILE"
chmod 0600 "$MYSQL_DEFAULTS_FILE"
printf '%s\n' 'AUTH_SMOKE_EMAIL=smoke@example.invalid' 'AUTH_SMOKE_PASSWORD=mock-secret' > "$AUTH_SMOKE_ENV_FILE"
chmod 0600 "$AUTH_SMOKE_ENV_FILE"

cat > "${MOCK_BIN}/git" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'git|%s\n' "$*" >> "$MOCK_LOG"
case "$*" in
  'rev-parse --verify HEAD') printf '%s\n' "$MOCK_REVISION" ;;
  'status --porcelain --untracked-files=normal') printf '%s' "${MOCK_DIRTY:-}" ;;
  *) exit 99 ;;
esac
MOCK

cat > "${MOCK_BIN}/composer" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[ "${AUTH_SMOKE_EMAIL+x}" != x ]
[ "${AUTH_SMOKE_PASSWORD+x}" != x ]
printf 'composer|%s\n' "$*" >> "$MOCK_LOG"
MOCK

cat > "${MOCK_BIN}/php" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'php|%s\n' "$*" >> "$MOCK_LOG"
case "$*" in
  *validate-laravel-production.php*) [ "${MOCK_FAIL_STAGE:-}" != validator ] || exit 41 ;;
  *'artisan migrate --force'*) [ "${MOCK_FAIL_STAGE:-}" != migrate ] || exit 42 ;;
esac
MOCK

cat > "${MOCK_BIN}/yarn" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'yarn|%s|origin=%s\n' "$*" "${NEXT_PUBLIC_APP_URL:-}" >> "$MOCK_LOG"
if [ "${1:-}" = build ]; then
  [ "${MOCK_FAIL_STAGE:-}" != build ] || exit 43
  if [ "${MOCK_NO_SERVER:-0}" != 1 ]; then
    mkdir -p .next/standalone
    : > .next/standalone/server.js
  fi
fi
MOCK

cat > "${MOCK_BIN}/mysqldump" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'mysqldump|%s\n' "$*" >> "$MOCK_LOG"
[ "${MOCK_FAIL_STAGE:-}" != backup ] || exit 44
printf '%s\n' 'CREATE TABLE mocked (id INT);'
MOCK

cat > "${MOCK_BIN}/systemctl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'systemctl|%s\n' "$*" >> "$MOCK_LOG"
[ "${MOCK_FAIL_STAGE:-}" != active ] || { [ "${1:-}" != is-active ] || exit 45; }
MOCK

cat > "${MOCK_BIN}/sudo" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'sudo|%s\n' "$*" >> "$MOCK_LOG"
[ "${MOCK_FAIL_STAGE:-}" != sudo ] || exit 46
shift
exec "$@"
MOCK

cat > "${MOCK_BIN}/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
url="${!#}"
printf 'curl|%s\n' "$url" >> "$MOCK_LOG"
printf 'curl-options|%s\n' "$*" >> "$MOCK_LOG"
case "${MOCK_FAIL_STAGE:-}" in
  local-login) [ "$url" != 'http://127.0.0.1:3000/login' ] || exit 47 ;;
  external-login) [ "$url" != 'https://app.example.invalid/login' ] || exit 48 ;;
  health) [[ "$url" != */api/health ]] || exit 49 ;;
  csrf) [[ "$url" != */sanctum/csrf-cookie ]] || exit 50 ;;
esac
for ((i=1; i <= $#; i++)); do
  if [ "${!i}" = --dump-header ]; then
    next=$((i + 1))
    printf 'set-cookie: XSRF-TOKEN=mocked\n' > "${!next}"
  fi
done
MOCK

cat > "$AUTH_SMOKE_SCRIPT" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'auth|%s\n' "$*" >> "$MOCK_LOG"
[ -f "$AUTH_SMOKE_ENV_FILE" ]
[ "${MOCK_FAIL_STAGE:-}" != auth ] || exit 51
MOCK
chmod 0700 "$AUTH_SMOKE_SCRIPT"
chmod 0755 "${MOCK_BIN}"/*

write_private_env() {
    local next_service="${1:-pear-next.service}"
    cat > "$PRIVATE_ENV" <<EOF
APP_DIR="$APP_DIR"
APP_ORIGIN="HTTPS://APP.EXAMPLE.INVALID/"
DEPLOY_REVISION=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
DB_NAME="pear_test"
BACKUP_DIR="$TEST_ROOT/backups"
MYSQL_DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE"
BACKUP_DB_HOST="127.0.0.1"
NEXT_SERVICE="$next_service"
PHP_FPM_SERVICE="php8.4-fpm.service"
PROXY_SERVICE="nginx.service"
AUTH_SMOKE_SCRIPT="$AUTH_SMOKE_SCRIPT"
AUTH_SMOKE_ENV_FILE="$AUTH_SMOKE_ENV_FILE"
BACKUP_RESULT_FILE="$TEST_ROOT/conflicting-backup-result"
EOF
    chmod 0600 "$PRIVATE_ENV"
}

STATUS=0
OUTPUT=""
run_deploy() {
    local fail_stage="${1:-}"
    local no_server="${2:-0}"
    : > "$MOCK_LOG"
    rm -rf -- "$APP_DIR/next/.next/standalone"
    set +e
    MOCK_LOG="$MOCK_LOG" MOCK_REVISION="$REVISION" MOCK_FAIL_STAGE="$fail_stage" MOCK_NO_SERVER="$no_server" \
      AUTH_SMOKE_EMAIL="$CALLER_EMAIL_SECRET" AUTH_SMOKE_PASSWORD="$CALLER_PASSWORD_SECRET" \
      PATH="$MOCK_BIN:$PATH" DEPLOY_ENV_FILE="$PRIVATE_ENV" DEPLOY_REVISION="$REVISION" \
      MAINTENANCE_LOCK_DIR="$TEST_ROOT/maintenance.lock" DEPLOY_LOCK_DIR="$TEST_ROOT/deploy.lock" \
      TMPDIR="$TEST_ROOT" "$DEPLOY_SCRIPT" >"$TEST_ROOT/output" 2>&1
    STATUS=$?
    OUTPUT="$(<"$TEST_ROOT/output")"
    set -e
}

assert_status() {
    local expected="$1" label="$2"
    if [ "$STATUS" -ne "$expected" ]; then
        echo "${label}: expected ${expected}, got ${STATUS}" >&2
        echo "$OUTPUT" >&2
        exit 1
    fi
}

assert_no_call() {
    local pattern="$1" label="$2"
    if rg -q "$pattern" "$MOCK_LOG"; then
        echo "${label}" >&2
        cat "$MOCK_LOG" >&2
        exit 1
    fi
}

write_private_env
if rg -q '^AUTH_SMOKE_(EMAIL|PASSWORD)=' "$PRIVATE_ENV"; then
    echo "deploy environment contains authentication smoke credentials" >&2
    exit 1
fi
run_deploy
assert_status 0 "normal deployment succeeds"
if [[ "$OUTPUT" == *"$CALLER_EMAIL_SECRET"* ]] || [[ "$OUTPUT" == *"$CALLER_PASSWORD_SECRET"* ]] \
    || rg -Fq "$CALLER_EMAIL_SECRET" "$MOCK_LOG" || rg -Fq "$CALLER_PASSWORD_SECRET" "$MOCK_LOG"; then
    echo "caller authentication smoke credentials leaked into release output" >&2
    exit 1
fi
rg -q '^yarn|build|origin=https://app.example.invalid$' "$MOCK_LOG"
[ -f "$APP_DIR/next/.next/standalone/public/asset.txt" ]
[ -f "$APP_DIR/next/.next/standalone/.next/static/asset.txt" ]
rg -q '^sudo|-n systemctl restart pear-next.service$' "$MOCK_LOG"
rg -q '^sudo|-n systemctl reload php8.4-fpm.service$' "$MOCK_LOG"
rg -q '^sudo|-n systemctl reload nginx.service$' "$MOCK_LOG"
rg -q '^systemctl|is-active pear-next.service$' "$MOCK_LOG"
rg -q '^curl|http://127.0.0.1:3000/login$' "$MOCK_LOG"
rg -q '^curl|https://app.example.invalid/login$' "$MOCK_LOG"
rg -q '^curl|https://app.example.invalid/api/health$' "$MOCK_LOG"
rg -q '^auth|https://app.example.invalid$' "$MOCK_LOG"
if [ "$(rg -c '^curl-options\|.*--connect-timeout 3.*--max-time 5.*--retry 15.*--retry-delay 2.*--retry-max-time 60.*--retry-connrefused' "$MOCK_LOG")" -ne 4 ]; then
    echo "all HTTP gates must use bounded connection-refused retries" >&2
    exit 1
fi
if [ -e "$TEST_ROOT/conflicting-backup-result" ]; then
    echo "backup child re-sourced the conflicting private result path" >&2
    exit 1
fi
if rg -q 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' "$MOCK_LOG"; then
    echo "private environment overrode the invocation revision" >&2
    exit 1
fi
build_line="$(rg -n '^yarn\|build' "$MOCK_LOG" | cut -d: -f1)"
dump_line="$(rg -n '^mysqldump\|' "$MOCK_LOG" | cut -d: -f1)"
migrate_line="$(rg -n '^php\|artisan migrate --force$' "$MOCK_LOG" | cut -d: -f1)"
restart_line="$(rg -n '^sudo\|-n systemctl restart' "$MOCK_LOG" | cut -d: -f1)"
local_login_line="$(rg -n '^curl\|http://127.0.0.1:3000/login$' "$MOCK_LOG" | cut -d: -f1)"
active_line="$(rg -n '^systemctl\|is-active pear-next.service$' "$MOCK_LOG" | cut -d: -f1)"
external_login_line="$(rg -n '^curl\|https://app.example.invalid/login$' "$MOCK_LOG" | cut -d: -f1)"
if [ "$build_line" -ge "$dump_line" ] || [ "$dump_line" -ge "$migrate_line" ] || [ "$migrate_line" -ge "$restart_line" ]; then
    echo "release operations are not ordered build -> backup -> migration -> restart" >&2
    exit 1
fi
if [ "$local_login_line" -ge "$active_line" ] || [ "$active_line" -ge "$external_login_line" ]; then
    echo "readiness gates are not ordered local login -> active service -> external login" >&2
    exit 1
fi
[ "$(rg -c '^php\|artisan migrate --force$' "$MOCK_LOG")" -eq 1 ]

run_deploy build
assert_status 43 "build failure is propagated"
assert_no_call '^mysqldump\|' "backup ran after failed build"
assert_no_call '^sudo\|' "service operation ran after failed build"

run_deploy '' 1
assert_status 1 "missing standalone server fails closed"
assert_no_call '^mysqldump\|' "backup ran without standalone server"
assert_no_call '^sudo\|' "service operation ran without standalone server"

run_deploy backup
assert_status 1 "backup failure is propagated"
assert_no_call '^php\|artisan migrate --force$' "migration ran after failed backup"
assert_no_call '^sudo\|' "service operation ran after failed backup"

run_deploy local-login
assert_status 47 "local login failure is propagated"
assert_no_call '^systemctl\|is-active ' "service active check ran after local login failure"
assert_no_call '^auth\|' "auth smoke ran after local login failure"

run_deploy active
assert_status 45 "inactive Next.js service is propagated"
assert_no_call '^curl\|https://app.example.invalid/login$' "external login ran after inactive service"
assert_no_call '^auth\|' "auth smoke ran after inactive service"

run_deploy external-login
assert_status 48 "external login failure is propagated"
assert_no_call '^curl\|https://app.example.invalid/api/health$' "health ran after external login failure"
assert_no_call '^auth\|' "auth smoke ran after external login failure"

run_deploy health
assert_status 49 "health failure is propagated"
assert_no_call '^curl\|https://app.example.invalid/sanctum/csrf-cookie$' "CSRF ran after health failure"
assert_no_call '^auth\|' "auth smoke ran after health failure"

run_deploy csrf
assert_status 50 "CSRF failure is propagated"
assert_no_call '^auth\|' "auth smoke ran after CSRF failure"

run_deploy auth
assert_status 51 "authentication smoke failure is propagated"

run_deploy migrate
assert_status 42 "migration failure is propagated"
assert_no_call '^sudo\|' "service operation ran after migration failure"
assert_no_call '^curl\|' "readiness check ran after migration failure"

run_deploy sudo
assert_status 46 "sudo failure is propagated"
assert_no_call '^curl\|' "readiness check ran after sudo failure"
assert_no_call '^auth\|' "auth smoke ran after sudo failure"

write_private_env
legacy_email_secret=legacy-email-secret-value
legacy_password_secret=legacy-password-secret-value
printf '%s\n' \
    "AUTH_SMOKE_EMAIL=$legacy_email_secret" \
    "AUTH_SMOKE_PASSWORD=$legacy_password_secret" >> "$PRIVATE_ENV"
run_deploy
assert_status 1 "legacy authentication smoke credentials fail closed"
if [[ "$OUTPUT" != *"must be moved from DEPLOY_ENV_FILE to AUTH_SMOKE_ENV_FILE"* ]]; then
    echo "legacy authentication smoke credential error is not explicit" >&2
    echo "$OUTPUT" >&2
    exit 1
fi
if [[ "$OUTPUT" == *"$legacy_email_secret"* ]] || [[ "$OUTPUT" == *"$legacy_password_secret"* ]] \
    || rg -Fq "$legacy_email_secret" "$MOCK_LOG" || rg -Fq "$legacy_password_secret" "$MOCK_LOG"; then
    echo "legacy authentication smoke credentials leaked into release output" >&2
    exit 1
fi
assert_no_call '^git\|' "git ran after legacy authentication smoke credentials were rejected"
assert_no_call '^composer\|' "composer ran after legacy authentication smoke credentials were rejected"
assert_no_call '^yarn\|' "yarn ran after legacy authentication smoke credentials were rejected"

write_private_env evil.service
run_deploy
assert_status 1 "unapproved service is rejected"
assert_no_call '^git\|' "release started with an unapproved service"

set +e
PATH="$MOCK_BIN:$PATH" DEPLOY_REVISION="$REVISION" "$DEPLOY_SCRIPT" >/dev/null 2>&1
missing_env_status=$?
set -e
if [ "$missing_env_status" -eq 0 ]; then
    echo "missing DEPLOY_ENV_FILE was accepted" >&2
    exit 1
fi

echo "Native deployment mock checks passed."
