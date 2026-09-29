#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
pwcli=/home/sjo1848/.codex/skills/playwright/scripts/playwright_cli.sh
vite_pid=""
session="f0-11-refresh-races"

cleanup_tree() {
  local root="$1" live
  local pids=()
  collect_tree() { local parent="$1" child; pids+=("$parent"); while IFS= read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true); }
  collect_tree "$root"
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait "$root" 2>/dev/null || true
  for _ in {1..50}; do live=0; for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done; (( live == 0 )) && return 0; sleep 0.1; done
  for pid in "${pids[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do live=0; for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done; (( live == 0 )) && return 0; sleep 0.1; done
  echo "owned process tree remains: $root" >&2; return 1
}

cleanup() {
  local failed=0
  bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
  [[ -z "$vite_pid" ]] || cleanup_tree "$vite_pid" || failed=1
  return "$failed"
}
on_exit() { local result=$?; cleanup || result=1; exit "$result"; }
trap on_exit EXIT

cd "$repo_dir"
mkdir -p output/playwright
VITE_LOCAL_ACCEPTANCE_AUTH=true node_modules/.bin/vite --host 127.0.0.1 --port 4181 --config apps/web/vite.config.ts >output/playwright/f0-11-refresh-races-vite.log 2>&1 & vite_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:4181/ >/dev/null 2>&1 && break; sleep 0.25; done
curl -fsS http://127.0.0.1:4181/ >/dev/null
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-f0-11-refresh-races.playwright.js | tee output/playwright/f0-11-refresh-races.log
cleanup
vite_pid=""
echo "F0.11 mocked deferred-response browser race tests PASS; owned Vite process verified stopped. This is mock evidence, not integrated Worker/D1 evidence."
