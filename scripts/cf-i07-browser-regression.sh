#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""

collect_tree() {
  local parent="$1" child
  printf '%s\n' "$parent"
  while read -r child; do
    [[ -n "$child" ]] && collect_tree "$child"
  done < <(pgrep -P "$parent" || true)
}

cleanup() {
  local root pid live
  local -a owned=()
  for root in "$api_pid" "$web_pid"; do
    [[ -n "$root" ]] || continue
    while read -r pid; do owned+=("$pid"); done < <(collect_tree "$root")
  done
  for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..50}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { wait "$api_pid" "$web_pid" 2>/dev/null || true; api_pid=""; web_pid=""; return 0; }
    sleep 0.1
  done
  for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { wait "$api_pid" "$web_pid" 2>/dev/null || true; api_pid=""; web_pid=""; return 0; }
    sleep 0.1
  done
  echo "owned browser-runner process remains after cleanup" >&2
  return 1
}

trap 'status=$?; cleanup || status=1; exit "$status"' EXIT
wrangler="$repo_dir/node_modules/.bin/wrangler"
for db in CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB; do CI=1 "$wrangler" d1 migrations apply "$db" --local -c apps/api/wrangler.jsonc >/dev/null; done
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "DELETE FROM hotel_memberships WHERE access_subject IN ('subject-browser-375','subject-browser-390','subject-browser-430','subject-browser-768','subject-browser-1024','subject-hk'); DELETE FROM access_identity_mappings WHERE access_subject IN ('subject-browser-375','subject-browser-390','subject-browser-430','subject-browser-768','subject-browser-1024','subject-hk'); INSERT OR REPLACE INTO control_hotels VALUES ('hotel-a','hotel-a','HOTEL_DEMO_DB',1),('hotel-b','hotel-b','HOTEL_SECOND_DB',1); INSERT OR REPLACE INTO hotel_admin_metadata(hotel_id,name,address,plan_tier) VALUES ('hotel-a','Hotel A','A Street','BASIC'),('hotel-b','Hotel B','B Street','BASIC'); INSERT OR REPLACE INTO access_identity_mappings VALUES ('subject-a','a@test.com',1),('subject-network','network@test.com',1),('subject-hk','hk@test.com',1); INSERT OR REPLACE INTO hotel_memberships VALUES ('subject-a','hotel-a','admin',1),('subject-hk','hotel-a','housekeeping',1); INSERT OR REPLACE INTO network_memberships VALUES ('subject-network','saas_admin',1);" >/dev/null
if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then echo "API port 8787 already occupied" >&2; exit 1; fi
"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done
if curl -fsS http://127.0.0.1:4174/users >/dev/null 2>&1; then echo "Web port 4174 already occupied" >&2; exit 1; fi
"$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:4174/users >/dev/null 2>&1 && break; sleep 1; done
mkdir -p output/playwright
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
bash "$pwcli" -s cf-i07-admin open about:blank >/dev/null
bash "$pwcli" -s cf-i07-admin run-code --filename scripts/cf-i07-browser-regression.playwright.js
bash "$pwcli" -s cf-i07-admin close >/dev/null
cleanup
trap - EXIT
echo "CF-I07 admin responsive browser regression PASS"
