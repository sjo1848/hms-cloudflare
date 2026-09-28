#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
wrangler="$repo_dir/node_modules/.bin/wrangler"
session="f0-08-reservation-recovery"
cleanup_tree() {
  local root="$1" pid live
  local pids=()
  collect_tree() { local parent="$1" child; pids+=("$parent"); while IFS= read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true); }
  collect_tree "$root"
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait "$root" 2>/dev/null || true
  for _ in {1..50}; do
    live=0; for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && return 0
    sleep 0.1
  done
  for pid in "${pids[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0; for pid in "${pids[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && return 0
    sleep 0.1
  done
  echo "owned process tree remains: $root" >&2
  return 1
}
cleanup() {
  local failed=0
  bash "$pwcli" -s "$session" close >/dev/null 2>&1 || true
  [[ -z "$web_pid" ]] || cleanup_tree "$web_pid" || failed=1
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid" || failed=1
  return "$failed"
}
on_exit() {
  local result=$?
  if [[ "$result" != 0 ]]; then mkdir -p "$repo_dir/output/playwright"; cp "$tmp_dir"/*.log "$repo_dir/output/playwright/" 2>/dev/null || true; fi
  cleanup || result=1
  rm -rf "$tmp_dir"
  exit "$result"
}
trap on_exit EXIT
cd "$repo_dir"
mkdir -p output/playwright
export CI=1
for db in CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB; do
  "$wrangler" d1 migrations apply "$db" --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" >"$tmp_dir/migrations.log" 2>&1
done
"$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  DELETE FROM hotel_memberships; DELETE FROM access_identity_mappings; DELETE FROM control_hotels; DELETE FROM hotel_admin_metadata;
  INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES ('10000000-0000-0000-0000-000000000001','hotel-a','HOTEL_DEMO_DB',1);
  INSERT INTO access_identity_mappings (access_subject,email,active) VALUES ('source-user:14000000-0000-0000-0000-000000000002','leo-reception@migration.invalid',1);
  INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES ('source-user:14000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','receptionist',1);
  INSERT INTO hotel_admin_metadata (hotel_id,name,plan_tier,timezone) VALUES ('10000000-0000-0000-0000-000000000001','Hotel Norte','BASIC','America/Argentina/Mendoza');
" >>"$tmp_dir/migrations.log" 2>&1
"$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES
    ('e2e-room-a','101','STANDARD','AVAILABLE',10000,'READY','IN_SERVICE'),
    ('e2e-room-b','102','STANDARD','AVAILABLE',12000,'READY','IN_SERVICE'),
    ('e2e-room-blocked','103','STANDARD','AVAILABLE',9000,'READY','IN_SERVICE');
  INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at)
    VALUES ('e2e-case-blocked','e2e-room-blocked','OPEN','BLOCKING','HIGH','Synthetic booking block','desk','2026-01-01T00:00:00Z');
" >>"$tmp_dir/migrations.log" 2>&1
"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:8787/health >/dev/null
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4176 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:4176/bookings >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:4176/bookings >/dev/null
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-f0-08-reservation-recovery.playwright.js | tee output/playwright/f0-08-reservation-recovery.log
"$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
 SELECT (SELECT COUNT(*) FROM guests WHERE email IN ('f08-integrated@example.test','f08-recovery@example.test','f08-mobile@example.test')) AS guests;
 SELECT COUNT(*) AS bookings FROM bookings b JOIN guests g ON g.id=b.guest_id WHERE g.email IN ('f08-integrated@example.test','f08-recovery@example.test','f08-mobile@example.test') AND b.status='CONFIRMED';
 SELECT COUNT(*) AS operations FROM reservation_creation_operations o JOIN guests g ON g.id=o.guest_id WHERE g.email IN ('f08-integrated@example.test','f08-recovery@example.test','f08-mobile@example.test') AND o.stage='BOOKING_CREATED';
 SELECT COUNT(*) AS events FROM reservation_creation_events e JOIN guests g ON g.id=e.guest_id WHERE g.email IN ('f08-integrated@example.test','f08-recovery@example.test','f08-mobile@example.test');
 SELECT COUNT(*) AS unresolved FROM reservation_creation_operations o JOIN guests g ON g.id=o.guest_id WHERE g.email='f08-recovery@example.test' AND o.stage='GUEST_CREATED';
" --json >"$tmp_dir/final.json"
node - "$tmp_dir/final.json" <<'NODE'
const fs = require("node:fs");
const result = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).map(row => row.results[0]);
if (result[0]?.guests !== 3 || result[1]?.bookings !== 3 || result[2]?.operations !== 3 || result[3]?.events !== 6 || result[4]?.unresolved !== 1) throw new Error(`unexpected final D1 recovery state: ${JSON.stringify(result)}`);
NODE
cleanup
api_pid=""
web_pid=""
echo "F0.8 integrated Worker/D1/Vite/browser PASS; owned API/Vite process trees verified stopped."
