#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fixture=${1:?Pass the exact synthetic .hms-local/p0-1-* fixture root}
case "$fixture" in
  "$repo_dir"/.hms-local/p0-1-*) ;;
  *) printf 'Refusing non-P0.1 synthetic fixture path: %s\n' "$fixture" >&2; exit 2 ;;
esac
[[ -d "$fixture/combined" ]] || { printf 'Missing isolated local D1 persistence: %s/combined\n' "$fixture" >&2; exit 2; }
for endpoint in 8787 4177; do
  if curl -fsS "http://127.0.0.1:$endpoint/health" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$endpoint/" >/dev/null 2>&1; then
    printf 'Refusing to attach to unowned service on port %s\n' "$endpoint" >&2
    exit 1
  fi
done

api_pid=""
preview_pid=""
session="f0-11-built-$$"
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
  bash "${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh" -s "$session" close >/dev/null 2>&1 || true
  [[ -z "$preview_pid" ]] || cleanup_tree "$preview_pid" || failed=1
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid" || failed=1
  return "$failed"
}
on_exit() { local status=$?; cleanup || status=1; exit "$status"; }
trap on_exit EXIT

cd "$repo_dir"
mkdir -p output/playwright
setsid ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8787 --persist-to "$fixture/combined" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$fixture/f0-11-built-api.log" 2>&1 & api_pid=$!
setsid ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4177 --strictPort --config apps/web/vite.config.ts >"$fixture/f0-11-built-preview.log" 2>&1 & preview_pid=$!
for _ in {1..60}; do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:4177/rooms >/dev/null 2>&1; then break; fi
  sleep 0.25
done
curl -fsS http://127.0.0.1:8787/health >/dev/null
curl -fsS http://127.0.0.1:4177/rooms >/dev/null
bash "${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh" -s "$session" open about:blank >/dev/null
bash "${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh" -s "$session" run-code --filename scripts/cf-f0-11-built-browser.playwright.js | tee output/playwright/f0-11-built-browser.log
cleanup
api_pid=""
preview_pid=""
printf 'F0.11 built minified UI + local Worker/D1 browser PASS; owned process trees verified stopped.\n'
