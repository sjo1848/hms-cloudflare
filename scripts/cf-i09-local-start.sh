#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

cf_i09_require_tools
command -v setsid >/dev/null || cf_i09_die "setsid is required for managed process cleanup"
cf_i09_require_stopped
mode="${1:---reset}"
[[ "$mode" == "--reset" || "$mode" == "--reuse" ]] || cf_i09_die "usage: scripts/cf-i09-local-start.sh [--reset|--reuse]"
if curl --fail --silent "$CF_I09_API_URL/health" >/dev/null 2>&1 || curl --fail --silent "$CF_I09_WEB_URL" >/dev/null 2>&1; then
  cf_i09_die "local port 8787 or 4174 is already in use"
fi
if [[ "$mode" == "--reset" ]]; then
  "$CF_I09_REPO_DIR/scripts/cf-i09-local-reset.sh"
else
  mkdir -p "$CF_I09_RUNTIME_DIR"
  cf_i09_reconcile "$CF_I09_RUNTIME_DIR/reconciliation.json"
fi

mkdir -p "$CF_I09_LOG_DIR" "$CF_I09_PID_DIR"
start_failure() {
  status=$?
  "$CF_I09_REPO_DIR/scripts/cf-i09-local-stop.sh" >/dev/null 2>&1 || true
  printf 'Local startup failed. Inspect %s/api.log and %s/web.log\n' "$CF_I09_LOG_DIR" "$CF_I09_LOG_DIR" >&2
  exit "$status"
}
trap start_failure ERR
nohup setsid "$CF_I09_WRANGLER" dev --local --ip 127.0.0.1 --port 8787 \
  --persist-to "$CF_I09_PERSIST_DIR" --var LOCAL_DEV_AUTH:true --config "$CF_I09_CONFIG" \
  >"$CF_I09_LOG_DIR/api.log" 2>&1 </dev/null &
api_pid=$!
printf '%s\n' "$api_pid" > "$CF_I09_PID_DIR/api.pid"
cf_i09_wait_http "$CF_I09_API_URL/ready" || false
curl --fail --silent --show-error "$CF_I09_API_URL/ready" > "$CF_I09_RUNTIME_DIR/readiness.json"

nohup setsid env VITE_LOCAL_ACCEPTANCE_AUTH=true "$CF_I09_REPO_DIR/node_modules/.bin/vite" --host 127.0.0.1 --port 4174 \
  --config "$CF_I09_REPO_DIR/apps/web/vite.config.ts" >"$CF_I09_LOG_DIR/web.log" 2>&1 </dev/null &
web_pid=$!
printf '%s\n' "$web_pid" > "$CF_I09_PID_DIR/web.pid"
cf_i09_wait_http "$CF_I09_WEB_URL/rooms"
trap - ERR
printf 'CF-I09 local HMS ready: web=%s api=%s (LOCAL_DEV_AUTH only)\n' "$CF_I09_WEB_URL" "$CF_I09_API_URL"
