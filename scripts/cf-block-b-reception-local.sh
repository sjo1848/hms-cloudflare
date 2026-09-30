#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
mkdir -p .hms-local output/playwright
fixture=${1:-}
if [[ -z "$fixture" ]]; then fixture=$(mktemp -d .hms-local/p0-1-block-b-XXXXXX); fi
api_pid="" proxy_pid="" web_pid=""
session="block-b-$$"
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"

cleanup_tree() {
  local root="$1" pid
  local pids=()
  collect_tree() { local parent="$1" child; pids+=("$parent"); while IFS= read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true); }
  collect_tree "$root"
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait "$root" 2>/dev/null || true
  for _ in {1..50}; do
    local live=0
    for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && return 0
    sleep 0.1
  done
  printf 'Owned process tree remains after cleanup: %s\n' "$root" >&2
  return 1
}
cleanup() {
  local failed=0
  bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
  [[ -z "$web_pid" ]] || cleanup_tree "$web_pid" || failed=1
  [[ -z "$proxy_pid" ]] || cleanup_tree "$proxy_pid" || failed=1
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid" || failed=1
  return "$failed"
}
stop_api() {
  if [[ -n "$api_pid" ]]; then cleanup_tree "$api_pid"; api_pid=""; fi
}
start_api() {
  local stage="${1:-api}"
  setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8788 --persist-to "$fixture/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$fixture/${stage}-api.log" 2>&1 & api_pid=$!
  for _ in {1..80}; do
    if curl -fsS http://127.0.0.1:8788/health >/dev/null 2>&1; then return 0; fi
    sleep 0.25
  done
  printf 'Worker did not become healthy after start/restart\n' >&2
  return 1
}
on_exit() { local status=$?; cleanup || status=1; exit "$status"; }
trap on_exit EXIT

for endpoint in 8787 8788 4181; do
  if curl -fsS "http://127.0.0.1:$endpoint/health" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$endpoint/" >/dev/null 2>&1; then
    printf 'Refusing to attach to unowned service on port %s\n' "$endpoint" >&2
    exit 1
  fi
done

case "$fixture" in
  "$repo_dir"/.hms-local/p0-1-block-b-*) ;;
  .hms-local/p0-1-block-b-*) fixture="$repo_dir/$fixture" ;;
  *) printf 'Refusing non-Block-B synthetic fixture path: %s\n' "$fixture" >&2; exit 2 ;;
esac
if [[ ! -d "$fixture/combined" ]]; then
  node scripts/p0-1-seed-local.mjs "$fixture"
fi
node scripts/cf-block-b-add-scroll-rows.mjs "$fixture"
node scripts/cf-block-b-set-synthetic-role.mjs "$fixture" housekeeping
start_api denied
setsid env HMS_BLOCK_B_AUX_DELAY_MS=4000 node scripts/cf-block-b-runtime-delay-proxy.mjs >"$fixture/proxy.log" 2>&1 & proxy_pid=$!
./node_modules/.bin/vite build --config apps/web/vite.config.ts >"$fixture/build.log" 2>&1
setsid ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4181 --strictPort --config apps/web/vite.config.ts >"$fixture/web.log" 2>&1 & web_pid=$!
for _ in {1..80}; do
  if curl -fsS http://127.0.0.1:8788/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4181/bookings >/dev/null 2>&1; then break; fi
  sleep 0.25
done
curl -fsS http://127.0.0.1:8788/health >/dev/null
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4181/bookings >/dev/null
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-billing-denied.playwright.js | tee output/playwright/cf-block-b-billing-denied.log
stop_api
node scripts/cf-block-b-set-synthetic-role.mjs "$fixture" admin
start_api core
bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-reception-workspace.playwright.js | tee output/playwright/cf-block-b-reception-workspace.log
stop_api
bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
start_api links
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-reception-links.playwright.js | tee output/playwright/cf-block-b-reception-links.log
stop_api
bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
bash "$pwcli" -s "$session" open about:blank >/dev/null
start_api billing-allow
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-billing-allow.playwright.js | tee output/playwright/cf-block-b-billing-allow.log
stop_api
bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
start_api invalid-link
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-reception-invalid-link.playwright.js | tee output/playwright/cf-block-b-reception-invalid-link.log
stop_api
bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
start_api partial
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-reception-partial.playwright.js | tee output/playwright/cf-block-b-reception-partial.log
stop_api
node scripts/cf-block-b-set-synthetic-role.mjs "$fixture" housekeeping
start_api capability
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-b-capability-refresh.playwright.js | tee output/playwright/cf-block-b-capability-refresh.log
stop_api
node scripts/cf-block-b-set-synthetic-role.mjs "$fixture" admin
cleanup
web_pid="" proxy_pid="" api_pid=""
printf 'Block B Reception local Worker + D1 + browser PASS; owned process trees stopped; synthetic fixture retained at %s\n' "$fixture"
