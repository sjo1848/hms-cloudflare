#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
mkdir -p .hms-local output/playwright
p01_persist=$(mktemp -d .hms-local/p0-1-XXXXXX)
api_pid=""
web_pid=""

stop_servers() {
  if [[ -n "$web_pid" ]]; then
    kill -TERM -- "-$web_pid" 2>/dev/null || true
    wait "$web_pid" 2>/dev/null || true
  fi
  if [[ -n "$api_pid" ]]; then
    kill -TERM -- "-$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  # Child workers may exit just after their process-group leader is reaped.
  # This is a bounded process-exit observation, not a browser/test retry.
  for _ in {1..50}; do
    if { [[ -z "$api_pid" ]] || ! kill -0 -- "-$api_pid" 2>/dev/null; } \
      && { [[ -z "$web_pid" ]] || ! kill -0 -- "-$web_pid" 2>/dev/null; }; then
      return
    fi
    sleep 0.1
  done
}

on_exit() {
  local status=$?
  trap - EXIT
  stop_servers
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

node scripts/p0-1-seed-local.mjs "$p01_persist"
setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8787 --persist-to "$p01_persist/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$p01_persist/api.log" 2>&1 &
api_pid=$!
setsid env VITE_LOCAL_ACCEPTANCE_AUTH=true ./node_modules/.bin/vite --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$p01_persist/web.log" 2>&1 &
web_pid=$!
for _ in {1..40}; do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4174/bookings >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4174/bookings >/dev/null
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {chromium} from "playwright"; const runner=eval(readFileSync("scripts/p0-1-arrival-integrated.playwright.js","utf8")); const browser=await chromium.launch({headless:true}); try { const page=await browser.newPage(); await runner(page); await page.close(); } finally { await browser.close(); }'
stop_servers
if kill -0 -- "-$api_pid" 2>/dev/null || kill -0 -- "-$web_pid" 2>/dev/null; then
  printf 'P0.1 owned browser servers remained after cleanup\n' >&2
  exit 1
fi
api_pid=""
web_pid=""
node scripts/p0-1-assert-local.mjs "$p01_persist"
printf 'P0.1 integrated browser + D1 PASS; local fixture retained at %s\n' "$p01_persist"
