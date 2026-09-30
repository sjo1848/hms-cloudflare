#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
api_port=8787
web_port=4195
persist_dir="$tmp_dir/wrangler-state"
wrangler="$repo_dir/node_modules/.bin/wrangler"
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
browser_session=cf-i06-billing-rework1

collect_tree() {
  local parent="$1" child
  printf '%s\n' "$parent"
  while read -r child; do [[ -z "$child" ]] || collect_tree "$child"; done < <(pgrep -P "$parent" || true)
}

cleanup() {
  local root pid live
  local -a owned=()
  bash "$pwcli" -s "$browser_session" close >/dev/null 2>&1 || true
  for root in "$web_pid" "$api_pid"; do
    [[ -n "$root" ]] || continue
    while read -r pid; do owned+=("$pid"); done < <(collect_tree "$root")
  done
  for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..50}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { web_pid=""; api_pid=""; return 0; }
    sleep 0.1
  done
  for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { web_pid=""; api_pid=""; return 0; }
    sleep 0.1
  done
  echo "CF-I06 owned Worker/Vite process tree remains" >&2
  return 1
}

on_exit() {
  local status=$?
  if [[ "$status" != 0 ]]; then mkdir -p output/playwright; cp "$tmp_dir"/*.log output/playwright/ 2>/dev/null || true; fi
  cleanup || status=1
  rm -rf "$tmp_dir"
  exit "$status"
}
trap on_exit EXIT
mkdir -p output/playwright
if curl -fsS "http://127.0.0.1:$api_port/health" >/dev/null 2>&1; then echo "API port $api_port already occupied" >&2; exit 1; fi
if curl -fsS "http://127.0.0.1:$web_port/bookings" >/dev/null 2>&1; then echo "Web port $web_port already occupied" >&2; exit 1; fi

for db in CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB; do CI=1 "$wrangler" d1 migrations apply "$db" --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >>"$tmp_dir/migrations.log" 2>&1; done
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "INSERT OR REPLACE INTO control_hotels VALUES ('hotel-a','hotel-a','HOTEL_DEMO_DB',1); INSERT OR REPLACE INTO access_identity_mappings VALUES ('subject-a','a@test',1); INSERT OR REPLACE INTO hotel_memberships VALUES ('subject-a','hotel-a','admin',1);" >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "DELETE FROM cash_closures; DELETE FROM financial_events; DELETE FROM payment_entries; DELETE FROM invoices; DELETE FROM extra_charges; DELETE FROM bookings WHERE id='cf-i06'; INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('cf-i06-guest','CF-I06 Guest','cf-i06@test','2026-01-01'); INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('cf-i06-room','I06','STANDARD','AVAILABLE',10000); INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('cf-i06','cf-i06-guest','cf-i06-room','2026-09-01','2026-09-03','CONFIRMED',10000,'2026-01-01','2026-01-01');" >>"$tmp_dir/migrations.log" 2>&1

"$wrangler" dev --local --ip 127.0.0.1 --port "$api_port" --persist-to "$persist_dir" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..30}; do curl -fsS "http://127.0.0.1:$api_port/health" >/dev/null 2>&1 && break; sleep 1; done
curl -fsS "http://127.0.0.1:$api_port/health" >/dev/null
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port "$web_port" --strictPort --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS "http://127.0.0.1:$web_port/bookings" >/dev/null 2>&1 && break; sleep 1; done
curl -fsS "http://127.0.0.1:$web_port/bookings" >/dev/null

bash "$pwcli" -s "$browser_session" open about:blank >/dev/null
bash "$pwcli" -s "$browser_session" run-code --filename scripts/cf-i06-browser-regression.playwright.js | tee output/playwright/cf-i06-browser.log
cleanup
api_pid=""
web_pid=""
trap - EXIT
echo "CF-I06 browser responsive/error/close regression PASS"
