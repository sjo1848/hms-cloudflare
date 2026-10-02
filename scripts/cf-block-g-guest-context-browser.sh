#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
tmp_dir=$(mktemp -d)
web_pid=""
browser_session="hms-block-g-guest-context"
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"

collect_tree() {
  local parent="$1" child
  printf '%s\n' "$parent"
  while read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true)
}

cleanup() {
  local pid live
  local -a owned=()
  bash "$pwcli" -s "$browser_session" close >/dev/null 2>&1 || true
  [[ -n "$web_pid" ]] || return 0
  while read -r pid; do owned+=("$pid"); done < <(collect_tree "$web_pid")
  for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..50}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { wait "$web_pid" 2>/dev/null || true; web_pid=""; return 0; }
    sleep 0.1
  done
  for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { wait "$web_pid" 2>/dev/null || true; web_pid=""; return 0; }
    sleep 0.1
  done
  echo "owned Block G browser runner process remains after cleanup" >&2
  return 1
}
trap 'status=$?; cleanup || status=1; rm -rf "$tmp_dir"; exit "$status"' EXIT
if curl -fsS http://127.0.0.1:4197/health >/dev/null 2>&1 || curl -fsS http://127.0.0.1:4197/guests >/dev/null 2>&1; then echo "port 4197 already occupied" >&2; exit 1; fi
"$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4197 --strictPort --config apps/web/vite.config.ts >"$tmp_dir/vite.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:4197/guests >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4197/guests >/dev/null
bash "$pwcli" -s "$browser_session" open about:blank >/dev/null
bash "$pwcli" -s "$browser_session" run-code --filename scripts/cf-block-g-guest-context.playwright.js
cleanup
trap - EXIT
rm -rf "$tmp_dir"
echo "Block G Guests context failure/recovery browser regression PASS (synthetic mock; local Vite; owned process cleanup verified)"
