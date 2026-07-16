#!/usr/bin/env bash

# Start the Compose database, require it to become healthy, create and verify a
# backup even for an empty first-run database, then migrate exactly once.
run_docker_database_release_phase() {
    local helper_script_dir="$1"
    local backup_result_file="$2"
    shift 2
    local compose_command=("$@")
    local database_container
    local database_ready=0
    local backup_file
    local health_attempts="${DOCKER_DATABASE_HEALTH_ATTEMPTS:-60}"
    local health_interval="${DOCKER_DATABASE_HEALTH_INTERVAL_SECONDS:-1}"
    local attempt

    if ! declare -F acquire_maintenance_lock >/dev/null 2>&1; then
        echo "[ERROR] Common database maintenance lock is unavailable" >&2
        return 1
    fi
    acquire_maintenance_lock || return 1

    if ! [[ "$health_attempts" =~ ^[1-9][0-9]*$ ]] \
        || ! [[ "$health_interval" =~ ^[0-9]+$ ]]; then
        echo "[ERROR] Docker database health wait settings are invalid" >&2
        return 1
    fi

    echo "[$(date -u +%FT%TZ)] Starting the database service..."
    if ! "${compose_command[@]}" up -d mysql; then
        echo "[ERROR] Database service failed to start" >&2
        return 1
    fi

    if ! database_container="$("${compose_command[@]}" ps -q mysql)"; then
        echo "[ERROR] Compose failed to resolve the database container" >&2
        return 1
    fi
    if [ -z "$database_container" ]; then
        echo "[ERROR] Compose did not return a database container after startup" >&2
        return 1
    fi

    for ((attempt = 1; attempt <= health_attempts; attempt++)); do
        if [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$database_container" 2>/dev/null || true)" = "healthy" ]; then
            database_ready=1
            break
        fi
        sleep "$health_interval"
    done

    if [ "$database_ready" -ne 1 ]; then
        echo "[ERROR] Database did not become healthy" >&2
        return 1
    fi

    echo "[$(date -u +%FT%TZ)] Creating the mandatory pre-migration backup..."
    if ! BACKUP_RESULT_FILE="$backup_result_file" \
        DB_CONTAINER_NAME="$database_container" \
        "${helper_script_dir}/backup-db.sh"; then
        echo "[ERROR] Mandatory pre-migration backup failed" >&2
        return 1
    fi

    backup_file="$(sed -n '1p' "$backup_result_file")"
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ] || ! gzip -t -- "$backup_file"; then
        echo "[ERROR] Pre-migration backup verification failed" >&2
        return 1
    fi

    echo "[$(date -u +%FT%TZ)] Running the release migration exactly once..."
    if ! "${compose_command[@]}" run --rm --no-deps php php artisan migrate --force; then
        echo "[ERROR] Release migration failed" >&2
        return 1
    fi
}
