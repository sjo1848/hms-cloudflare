#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
pwcli="/home/sjo1848/.codex/skills/playwright/scripts/playwright_cli.sh"
fixture_root=""
api_pid=""
web_pid=""
browser_session="f03-rooms-$$"
browser_owned_pids=""
result=0

process_group_alive() {
  local leader="$1"
  [[ -n "$leader" ]] && kill -0 -- "-$leader" 2>/dev/null
}

stop_group() {
  local leader="$1"
  if process_group_alive "$leader"; then kill -TERM -- "-$leader" 2>/dev/null || true; fi
  if [[ -n "$leader" ]]; then wait "$leader" 2>/dev/null || true; fi
  for _ in {1..50}; do
    process_group_alive "$leader" || return 0
    sleep 0.1
  done
  return 1
}

stop_browser() {
  bash "$pwcli" --session "$browser_session" close >/dev/null 2>&1 || true
  for _ in {1..50}; do
    local alive=false
    for pid in $browser_owned_pids; do
      local state
      state=$(ps -p "$pid" -o stat= 2>/dev/null || true)
      if [[ -n "$state" && "$state" != Z* ]]; then alive=true; break; fi
    done
    [[ "$alive" == false ]] && return 0
    sleep 0.1
  done
  return 1
}

on_exit() {
  result=$?
  trap - EXIT
  stop_browser || result=1
  stop_group "$web_pid" || result=1
  stop_group "$api_pid" || result=1
  if [[ "$result" -eq 0 && -n "$fixture_root" && "$fixture_root" == "$repo_dir/.hms-local/p0-1-f03-"* ]]; then
    rm -rf -- "$fixture_root"
  elif [[ -n "$fixture_root" ]]; then
    printf 'Synthetic fixture retained for diagnosis: %s\n' "$fixture_root" >&2
  fi
  if process_group_alive "$api_pid" || process_group_alive "$web_pid"; then
    printf 'F0.3 browser runner failed owned-process cleanup verification\n' >&2
    result=1
  fi
  exit "$result"
}
trap on_exit EXIT

command -v npx >/dev/null 2>&1
[[ -f "$pwcli" ]]
mkdir -p output/playwright .hms-local
if curl -sS --max-time 1 http://127.0.0.1:8787/health -o /dev/null >/dev/null 2>&1; then
  printf 'Refusing to use occupied API port 8787\n' >&2
  exit 1
fi
if curl -sS --max-time 1 http://127.0.0.1:4176/rooms -o /dev/null >/dev/null 2>&1; then
  printf 'Refusing to use occupied web port 4176\n' >&2
  exit 1
fi

fixture_root=$(mktemp -d "$repo_dir/.hms-local/p0-1-f03-XXXXXX")
node scripts/p0-1-seed-local.mjs "$fixture_root"
setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8787 --persist-to "$fixture_root/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$fixture_root/api.log" 2>&1 &
api_pid=$!
setsid env VITE_LOCAL_ACCEPTANCE_AUTH=true ./node_modules/.bin/vite --host 127.0.0.1 --port 4176 --config apps/web/vite.config.ts >"$fixture_root/web.log" 2>&1 &
web_pid=$!

ready=false
for _ in {1..60}; do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4176/rooms >/dev/null 2>&1; then ready=true; break; fi
  sleep 0.25
done
if [[ "$ready" != true ]]; then
  printf 'Local Worker/Vite did not become ready; logs: %s/api.log %s/web.log\n' "$fixture_root" "$fixture_root" >&2
  exit 1
fi

 bash "$pwcli" --session "$browser_session" open about:blank >/dev/null
browser_owned_pids=$(ps -eo pid,args | awk -v session="$browser_session" '(/\/opt\/google\/chrome\/chrome/ && /--user-data-dir=\/tmp\/playwright_chromiumdev_profile-/ || (/cliDaemon\.js/ && index($0,session))) && $0 !~ /awk/ {print $1}' | sort -u | tr '\n' ' ')
bash "$pwcli" --session "$browser_session" run-code --filename scripts/f03-room-state-browser.playwright.js
bash "$pwcli" --session "$browser_session" close >/dev/null
stop_browser
stop_group "$web_pid"
stop_group "$api_pid"
web_pid=""
api_pid=""
node scripts/f03-room-state-browser.assert.mjs "$fixture_root"
printf 'F0.3 real local Worker/D1 Rooms readiness browser PASS\n'
