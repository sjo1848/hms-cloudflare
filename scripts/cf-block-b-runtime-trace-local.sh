#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
fixture=${1:-.hms-local/p0-1-block-b-sDBEUJ}
[[ "$fixture" = /* ]] || fixture="$repo_dir/$fixture"
[[ "$fixture" = "$repo_dir"/.hms-local/p0-1-block-b-* && -d "$fixture/combined" ]] || { echo "Expected retained synthetic Block B fixture" >&2; exit 2; }
api_pid="" proxy_pid="" site_pid=""
cleanup_tree() {
  local root="$1" pid
  local pids=()
  collect() { local parent="$1" child; pids+=("$parent"); while IFS= read -r child; do [[ -n "$child" ]] && collect "$child"; done < <(pgrep -P "$parent" || true); }
  collect "$root"
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait "$root" 2>/dev/null || true
  for _ in {1..50}; do
    local live=0
    for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && return 0
    sleep .1
  done
  return 1
}
cleanup() {
  [[ -z "$site_pid" ]] || cleanup_tree "$site_pid"
  [[ -z "$proxy_pid" ]] || cleanup_tree "$proxy_pid"
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid"
}
trap cleanup EXIT INT TERM
for port in 4181 8787 8788; do
  if curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$port/" >/dev/null 2>&1; then
    echo "Refusing unowned service on port $port" >&2; exit 1
  fi
done
./node_modules/.bin/vite build --config apps/web/vite.config.ts
setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8788 --persist-to "$fixture/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$fixture/trace-api.log" 2>&1 & api_pid=$!
setsid env HMS_BLOCK_B_AUX_DELAY_MS=4000 node scripts/cf-block-b-runtime-delay-proxy.mjs >"$fixture/trace-proxy.log" 2>&1 & proxy_pid=$!
setsid node scripts/cf-block-b-trace-server.mjs >"$fixture/trace-site.log" 2>&1 & site_pid=$!
for _ in {1..100}; do
  if curl -fsS http://127.0.0.1:8788/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4181/bookings >/dev/null 2>&1; then break; fi
  sleep .2
done
curl -fsS http://127.0.0.1:8788/health >/dev/null
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4181/bookings >/dev/null
echo "Trace runtime ready: production Vite build + Wrangler synthetic D1 + 4s auxiliary response hold. Press Ctrl-C to stop owned process trees."
while :; do sleep 1; done
