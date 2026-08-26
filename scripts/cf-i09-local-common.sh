#!/usr/bin/env bash

# Shared, source-only helpers for the CF-I09 local acceptance runtime. This file
# is sourced by the executable scripts and intentionally performs no work alone.
set -euo pipefail

CF_I09_REPO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CF_I09_CONFIG="$CF_I09_REPO_DIR/apps/api/wrangler.jsonc"
CF_I09_WRANGLER="$CF_I09_REPO_DIR/node_modules/.bin/wrangler"
# Wrangler's local export command has no --persist-to flag and resolves local
# state beside the selected config. Keep every command on that same directory.
CF_I09_PERSIST_DIR="$CF_I09_REPO_DIR/apps/api/.wrangler/state"
CF_I09_RUNTIME_DIR="$CF_I09_REPO_DIR/.hms-local"
CF_I09_LOG_DIR="$CF_I09_RUNTIME_DIR/logs"
CF_I09_PID_DIR="$CF_I09_RUNTIME_DIR/pids"
CF_I09_BACKUP_ROOT="$CF_I09_RUNTIME_DIR/backups"
CF_I09_API_URL="http://127.0.0.1:8787"
CF_I09_WEB_URL="http://127.0.0.1:4174"
CF_I09_DATABASES=(CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB)

export WRANGLER_SEND_METRICS=false

cf_i09_die() {
  printf 'CF-I09 local readiness error: %s\n' "$*" >&2
  exit 1
}

cf_i09_require_tools() {
  [[ -x "$CF_I09_WRANGLER" ]] || cf_i09_die "run npm install before using the local runtime"
  command -v curl >/dev/null || cf_i09_die "curl is required"
  command -v node >/dev/null || cf_i09_die "node is required"
  command -v python3 >/dev/null || cf_i09_die "python3 is required"
  command -v sha256sum >/dev/null || cf_i09_die "sha256sum is required"
}

cf_i09_pid_is_live() {
  local pid_file="$1" pid
  [[ -f "$pid_file" ]] || return 1
  read -r pid < "$pid_file"
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

cf_i09_require_stopped() {
  if cf_i09_pid_is_live "$CF_I09_PID_DIR/api.pid" || cf_i09_pid_is_live "$CF_I09_PID_DIR/web.pid"; then
    cf_i09_die "the managed local runtime is running; use scripts/cf-i09-local-stop.sh first"
  fi
}

cf_i09_reconcile() {
  local output_file="$1"
  [[ -f "$CF_I09_REPO_DIR/scripts/migration/reconcile.mjs" ]] || cf_i09_die "migration reconciliation entrypoint is missing"
  node "$CF_I09_REPO_DIR/scripts/migration/reconcile.mjs" --persist-to "$CF_I09_PERSIST_DIR" > "$output_file"
}

cf_i09_wait_http() {
  local url="$1" attempts="${2:-60}"
  for ((attempt=1; attempt<=attempts; attempt++)); do
    if curl --fail --silent --show-error "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

cf_i09_assert_managed_path() {
  local candidate="$1"
  case "$candidate" in
    "$CF_I09_REPO_DIR/apps/api/.wrangler/state"/*|"$CF_I09_RUNTIME_DIR"/*) ;;
    *) cf_i09_die "refusing filesystem mutation outside managed local paths: $candidate" ;;
  esac
}
