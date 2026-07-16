#!/bin/bash
set -euo pipefail

# shellcheck source=/usr/local/lib/pear/https-origin.sh
source /usr/local/lib/pear/https-origin.sh

cd /var/www/app

required_variables=(
    APP_ENV
    APP_DEBUG
    APP_KEY
    APP_ORIGIN
    APP_URL
    DB_HOST
    DB_DATABASE
    DB_USERNAME
    DB_PASSWORD
    SESSION_DOMAIN
    SESSION_SECURE_COOKIE
    SANCTUM_STATEFUL_DOMAINS
    CORS_ALLOWED_ORIGINS
)

for variable_name in "${required_variables[@]}"; do
    if [ -z "${!variable_name:-}" ]; then
        echo "[ERROR] Required runtime variable is empty: ${variable_name}" >&2
        exit 1
    fi
done

if [ "$APP_ENV" != "production" ]; then
    echo "[ERROR] Production image requires APP_ENV=production" >&2
    exit 1
fi

if [ "$APP_DEBUG" != "false" ] && [ "$APP_DEBUG" != "0" ]; then
    echo "[ERROR] Production image requires APP_DEBUG=false" >&2
    exit 1
fi

validate_https_origin "$APP_ORIGIN"
normalized_app_origin="$HTTPS_ORIGIN_NORMALIZED"
expected_origin_host="$HTTPS_ORIGIN_HOST"
expected_stateful_host="$HTTPS_ORIGIN_STATEFUL_HOST"
validate_https_origin "$APP_URL"
normalized_app_url="$HTTPS_ORIGIN_NORMALIZED"

if [ "$normalized_app_origin" != "$normalized_app_url" ]; then
    echo "[ERROR] APP_URL must exactly match APP_ORIGIN after normalization" >&2
    exit 1
fi

APP_ORIGIN="$normalized_app_origin"
APP_URL="$normalized_app_url"
export APP_ORIGIN APP_URL

normalized_session_domain="$(printf '%s' "$SESSION_DOMAIN" \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | tr '[:upper:]' '[:lower:]')"
if [ "$normalized_session_domain" != "$expected_origin_host" ]; then
    echo "[ERROR] SESSION_DOMAIN must be exactly the APP_ORIGIN host" >&2
    exit 1
fi

stateful_match=0
IFS=',' read -r -a stateful_entries <<< "$SANCTUM_STATEFUL_DOMAINS"
for stateful_entry in "${stateful_entries[@]}"; do
    stateful_entry="$(printf '%s' "$stateful_entry" \
        | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
        | tr '[:upper:]' '[:lower:]')"
    [ -n "$stateful_entry" ] || continue
    if [ "$stateful_entry" != "$expected_stateful_host" ]; then
        echo "[ERROR] SANCTUM_STATEFUL_DOMAINS contains an origin other than APP_ORIGIN" >&2
        exit 1
    fi
    stateful_match=1
done
if [ "$stateful_match" -ne 1 ]; then
    echo "[ERROR] SANCTUM_STATEFUL_DOMAINS does not contain APP_ORIGIN" >&2
    exit 1
fi

cors_match=0
IFS=',' read -r -a cors_entries <<< "$CORS_ALLOWED_ORIGINS"
for cors_entry in "${cors_entries[@]}"; do
    cors_entry="$(printf '%s' "$cors_entry" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -n "$cors_entry" ] || continue
    validate_https_origin "$cors_entry"
    if [ "$HTTPS_ORIGIN_NORMALIZED" != "$normalized_app_origin" ]; then
        echo "[ERROR] CORS_ALLOWED_ORIGINS contains an origin other than APP_ORIGIN" >&2
        exit 1
    fi
    cors_match=1
done
if [ "$cors_match" -ne 1 ]; then
    echo "[ERROR] CORS_ALLOWED_ORIGINS does not contain APP_ORIGIN" >&2
    exit 1
fi

if [ "$SESSION_SECURE_COOKIE" != "true" ] && [ "$SESSION_SECURE_COOKIE" != "1" ]; then
    echo "[ERROR] Production image requires SESSION_SECURE_COOKIE=true" >&2
    exit 1
fi

if [ "$CORS_ALLOWED_ORIGINS" = "*" ] || [ "$SANCTUM_STATEFUL_DOMAINS" = "*" ]; then
    echo "[ERROR] Production CORS and Sanctum host lists must be restricted" >&2
    exit 1
fi

if [[ "$APP_KEY" != base64:* ]]; then
    echo "[ERROR] APP_KEY must be a base64-encoded Laravel application key" >&2
    exit 1
fi

if ! decoded_key_length="$(printf '%s' "${APP_KEY#base64:}" | base64 -d 2>/dev/null | wc -c | tr -d '[:space:]')"; then
    echo "[ERROR] APP_KEY is not valid base64" >&2
    exit 1
fi

if [ "$decoded_key_length" -ne 32 ]; then
    echo "[ERROR] APP_KEY must decode to 32 bytes for AES-256-CBC" >&2
    exit 1
fi

# 権限の設定
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 本番用キャッシュの生成
echo "Generating production caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Application ready."

# 実行コマンドを実行
exec "$@"
