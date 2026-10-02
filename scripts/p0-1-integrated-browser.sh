#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
mkdir -p .hms-local output/playwright
p01_persist=$(mktemp -d .hms-local/p0-1-XXXXXX)
api_pid=""
web_pid=""
browser_session="ux-checkin-$$"
browser_owned_pids=""
browser_preexisting_pids=""

wait_for_owned_browser_exit() {
  for _ in {1..50}; do
    local alive=false
    for owned_pid in $browser_owned_pids; do
      local process_state
      process_state=$(ps -p "$owned_pid" -o stat= 2>/dev/null || true)
      if [[ -n "$process_state" && "$process_state" != Z* ]]; then alive=true; break; fi
    done
    if [[ "$alive" == false ]]; then return 0; fi
    sleep 0.1
  done
  return 1
}

stop_servers() {
  if [[ -n "$web_pid" ]]; then
    kill -TERM -- "-$web_pid" 2>/dev/null || true
    wait "$web_pid" 2>/dev/null || true
  fi
  if [[ -n "$api_pid" ]]; then
    kill -TERM -- "-$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  bash "$pwcli" -s "$browser_session" close >/dev/null 2>&1 || true
  # Child workers may exit just after their process-group leader is reaped.
  # This is a bounded process-exit observation, not a browser/test retry.
  for _ in {1..50}; do
    if { [[ -z "$api_pid" ]] || ! kill -0 -- "-$api_pid" 2>/dev/null; } \
      && { [[ -z "$web_pid" ]] || ! kill -0 -- "-$web_pid" 2>/dev/null; }; then
      break
    fi
    sleep 0.1
  done
  wait_for_owned_browser_exit
}

on_exit() {
  local status=$?
  trap - EXIT
  if ! stop_servers; then
    printf 'P0.1 owned browser/helper process remains after cleanup\n' >&2
    status=1
  fi
  if [[ -n "$api_pid" ]] && kill -0 -- "-$api_pid" 2>/dev/null; then
    printf 'P0.1 owned API process group remains after cleanup\n' >&2
    status=1
  fi
  if [[ -n "$web_pid" ]] && kill -0 -- "-$web_pid" 2>/dev/null; then
    printf 'P0.1 owned web process group remains after cleanup\n' >&2
    status=1
  fi
  if [[ "$status" -ne 0 ]]; then
    printf 'P0.1 integrated browser FAIL; local fixture retained at %s\n' "$p01_persist" >&2
  fi
  exit "$status"
}
trap on_exit EXIT

pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
wrangler_bin="${WRANGLER_BIN:-./node_modules/.bin/wrangler}"

node scripts/p0-1-seed-local.mjs "$p01_persist"
setsid "$wrangler_bin" dev --local --ip 127.0.0.1 --port 8787 --persist-to "$p01_persist/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$p01_persist/api.log" 2>&1 &
api_pid=$!
setsid env VITE_LOCAL_ACCEPTANCE_AUTH=true ./node_modules/.bin/vite --host 127.0.0.1 --port 4176 --config apps/web/vite.config.ts >"$p01_persist/web.log" 2>&1 &
web_pid=$!
for _ in {1..40}; do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4176/bookings >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4176/bookings >/dev/null
browser_preexisting_pids=$(ps -eo pid,args | awk '(/\/opt\/google\/chrome\/chrome/ && /--user-data-dir=\/tmp\/playwright_chromiumdev_profile-/) || /cliDaemon\.js/ {print $1}' | sort -u | tr '\n' ' ')
bash "$pwcli" -s "$browser_session" open about:blank >/dev/null
browser_owned_pids=$(ps -eo pid,args | awk -v before=" $browser_preexisting_pids " -v session="$browser_session" '(/\/opt\/google\/chrome\/chrome/ && /--user-data-dir=\/tmp\/playwright_chromiumdev_profile-/ || (/cliDaemon\.js/ && index($0,session))) && $0 !~ /awk/ && index(before," "$1" ")==0 {print $1}' | sort -u | tr '\n' ' ')
bash "$pwcli" -s "$browser_session" run-code --filename scripts/p0-1-arrival-integrated.playwright.js
bash "$pwcli" -s "$browser_session" run-code --filename scripts/p0-1-arrival-browser.playwright.js
bash "$pwcli" -s "$browser_session" run-code --filename scripts/cf-web-arch-browser.playwright.js
bash "$pwcli" -s "$browser_session" close >/dev/null
stop_servers
if kill -0 -- "-$api_pid" 2>/dev/null || kill -0 -- "-$web_pid" 2>/dev/null; then
  printf 'P0.1 owned browser servers remained after cleanup\n' >&2
  exit 1
fi
api_pid=""
web_pid=""
node scripts/p0-1-assert-local.mjs "$p01_persist"
printf 'P0.1 integrated browser + D1 PASS; local fixture retained at %s\n' "$p01_persist"
