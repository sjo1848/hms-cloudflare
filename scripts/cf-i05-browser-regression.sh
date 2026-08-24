#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
cleanup() {
  if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then pkill -TERM -P "$api_pid" 2>/dev/null || true; kill "$api_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT
cd "$repo_dir"
wrangler="$repo_dir/node_modules/.bin/wrangler"

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM bookings; DELETE FROM rooms WHERE id IN ('browser-a','browser-b','browser-c','browser-d','browser-e','browser-f');
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('browser-a','901','STANDARD','DIRTY',10000),('browser-b','902','STANDARD','CLEANING',12000),
    ('browser-c','903','STANDARD','AVAILABLE',13000),('browser-d','904','STANDARD','MAINTENANCE',14000),
    ('browser-e','905','STANDARD','AVAILABLE',15000),('browser-f','906','STANDARD','OCCUPIED',16000);
  INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at)
    VALUES ('browser-case-d','browser-d','OPEN','HIGH','Existing maintenance case','ops','subject-a','2026-01-01T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-guest-f','Orphan Departure Guest','orphan@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-f','browser-guest-f','browser-f','2026-08-20',date('now'),'CHECKED_IN',16000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
" >/dev/null

"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done
"$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:4174/housekeeping >/dev/null 2>&1 && break; sleep 1; done

codex_home=${CODEX_HOME:-$HOME/.codex}
pwcli="$codex_home/skills/playwright/scripts/playwright_cli.sh"
bash "$pwcli" -s cf-i05-integrated open about:blank >/dev/null
bash "$pwcli" -s cf-i05-integrated run-code --filename scripts/cf-i05-browser-regression.playwright.js
bash "$pwcli" -s cf-i05-integrated close >/dev/null
echo "CF-I05 integrated browser regression PASS"
