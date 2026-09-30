#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fixture=${1:?Pass the exact synthetic .hms-local/p0-1-* fixture root with a checked-in a-next Booking}
case "$fixture" in "$repo_dir"/.hms-local/p0-1-*) ;; *) echo "Refusing non-P0.1 synthetic fixture path: $fixture" >&2; exit 2 ;; esac
[[ -d "$fixture/combined" ]] || { echo "Missing local D1 persistence: $fixture/combined" >&2; exit 2; }
for endpoint in 8787 4176; do
  if curl -fsS "http://127.0.0.1:$endpoint/health" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$endpoint/" >/dev/null 2>&1; then
    echo "Refusing to attach to unowned service on port $endpoint" >&2
    exit 1
  fi
done

api_pid=""
web_pid=""
session="block-c-checkout-$$"
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
cleanup_tree() {
  local root="$1" pid live
  local pids=()
  collect_tree() { local parent="$1" child; pids+=("$parent"); while IFS= read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true); }
  collect_tree "$root"
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait "$root" 2>/dev/null || true
  for _ in {1..50}; do live=0; for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done; (( live == 0 )) && return 0; sleep 0.1; done
  for pid in "${pids[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  echo "Owned local process tree remains: $root" >&2
  return 1
}
cleanup() {
  local failed=0
  bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
  [[ -z "$web_pid" ]] || cleanup_tree "$web_pid" || failed=1
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid" || failed=1
  return "$failed"
}
on_exit() { local result=$?; cleanup || result=1; exit "$result"; }
trap on_exit EXIT

cd "$repo_dir"
mkdir -p output/playwright
setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8787 --persist-to "$fixture/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$fixture/block-c-checkout-api.log" 2>&1 & api_pid=$!
setsid env VITE_LOCAL_ACCEPTANCE_AUTH=true ./node_modules/.bin/vite --host 127.0.0.1 --port 4176 --strictPort --config apps/web/vite.config.ts >"$fixture/block-c-checkout-web.log" 2>&1 & web_pid=$!
for _ in {1..60}; do if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4176/bookings >/dev/null 2>&1; then break; fi; sleep 0.25; done
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4176/bookings >/dev/null
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-block-c-checkout.playwright.js | tee output/playwright/block-c-checkout-integrated.log
cleanup
api_pid=""
web_pid=""
echo "Block C checkout local Worker/D1/browser PASS; owned Worker/Vite/browser process trees verified stopped."
