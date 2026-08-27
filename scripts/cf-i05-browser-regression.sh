#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
status=0
cleanup() {
  if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then pkill -TERM -P "$api_pid" 2>/dev/null || true; kill "$api_pid" 2>/dev/null || true; fi
}
on_exit() {
  status=$?
  if [[ "$status" != "0" ]]; then
    echo "CF-I05 browser regression failed (status $status)"
    [[ -f "$tmp_dir/migrations.log" ]] && { echo "=== migrations log ==="; cat "$tmp_dir/migrations.log"; }
    [[ -f "$tmp_dir/api.log" ]] && { echo "=== API log ==="; cat "$tmp_dir/api.log"; }
    [[ -f "$tmp_dir/web.log" ]] && { echo "=== Web log ==="; cat "$tmp_dir/web.log"; }
  fi
  cleanup
  exit "$status"
}
trap on_exit EXIT
cd "$repo_dir"
mkdir -p output/playwright
wrangler="$repo_dir/node_modules/.bin/wrangler"

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='source-user:subject-a' AND hotel_id='hotel-a';" >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM bookings; DELETE FROM rooms WHERE id IN ('browser-a','browser-b','browser-c','browser-d','browser-e','browser-f','browser-g','browser-h');
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('browser-a','901','STANDARD','DIRTY',10000),('browser-b','902','STANDARD','CLEANING',12000),
    ('browser-c','903','STANDARD','AVAILABLE',13000),('browser-d','904','STANDARD','MAINTENANCE',14000),
    ('browser-e','905','STANDARD','AVAILABLE',15000),('browser-f','906','STANDARD','OCCUPIED',16000),
    ('browser-g','907','STANDARD','AVAILABLE',17000),('browser-h','908','STANDARD','AVAILABLE',18000);
  INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at)
    VALUES ('browser-case-d','browser-d','OPEN','HIGH','Existing maintenance case','ops','subject-a','2026-01-01T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-guest-f','Orphan Departure Guest','orphan@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-f','browser-guest-f','browser-f','2026-08-20',date('now'),'CHECKED_IN',16000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-guest-g','Eligible Checked-In Guest','checked-in@example.test','2026-08-20'),('browser-guest-h','Eligible Confirmed Guest','confirmed@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-g','browser-guest-g','browser-g','2026-08-20',date('now'),'CHECKED_IN',17000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z'),
      ('browser-booking-h','browser-guest-h','browser-h','2026-08-20',date('now'),'CONFIRMED',18000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
" >>"$tmp_dir/migrations.log" 2>&1

"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1 & api_pid=$!
api_ready=0
for _ in {1..30}; do if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then api_ready=1; break; fi; sleep 1; done
if [[ "$api_ready" != "1" ]]; then echo "API did not become ready"; cat "$tmp_dir/api.log"; exit 1; fi
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
web_ready=0
for _ in {1..30}; do if curl -fsS http://127.0.0.1:4174/housekeeping >/dev/null 2>&1; then web_ready=1; break; fi; sleep 1; done
if [[ "$web_ready" != "1" ]]; then echo "Web did not become ready"; cat "$tmp_dir/web.log"; exit 1; fi

if [[ "${CI_BROWSER_STANDARD:-0}" == "1" ]]; then
  if ! node scripts/cf-ux-mobile-browser-ci.mjs; then
    exit 1
  fi
else
  codex_home=${CODEX_HOME:-$HOME/.codex}
  pwcli="$codex_home/skills/playwright/scripts/playwright_cli.sh"
  bash "$pwcli" -s cf-i05-integrated open about:blank >/dev/null
  bash "$pwcli" -s cf-i05-integrated run-code --filename scripts/cf-i05-browser-regression.playwright.js
  bash "$pwcli" -s cf-i05-integrated close >/dev/null
  echo "CF-I05 integrated browser regression PASS"
fi
