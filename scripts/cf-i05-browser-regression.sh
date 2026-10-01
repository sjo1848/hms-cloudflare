#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
status=0
api_port=8787
web_port=4194
codex_home=${CODEX_HOME:-$HOME/.codex}
pwcli="$codex_home/skills/playwright/scripts/playwright_cli.sh"
browser_session=cf-i05-integrated
collect_tree() {
  local parent="$1" child
  printf '%s\n' "$parent"
  while read -r child; do [[ -z "$child" ]] || collect_tree "$child"; done < <(pgrep -P "$parent" || true)
}
cleanup() {
  local root pid live
  local -a owned=()
  if [[ "${CI_BROWSER_STANDARD:-0}" != "1" ]]; then
    if ! bash "$pwcli" -s "$browser_session" close >"$tmp_dir/browser-close.log" 2>&1; then
      cat "$tmp_dir/browser-close.log" >&2
      echo "Playwright browser session did not close cleanly" >&2
      return 1
    fi
  fi
  for root in "$web_pid" "$api_pid"; do
    [[ -n "$root" ]] || continue
    while read -r pid; do owned+=("$pid"); done < <(collect_tree "$root")
  done
  for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..50}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { [[ -z "$web_pid" ]] || wait "$web_pid" 2>/dev/null || true; [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true; web_pid=""; api_pid=""; return 0; }
    sleep 0.1
  done
  for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    (( live == 0 )) && { web_pid=""; api_pid=""; return 0; }
    sleep 0.1
  done
  echo "CF-I05 owned Worker/Vite process tree remains" >&2
  return 1
}
on_exit() {
  status=$?
  if [[ "$status" != "0" ]]; then
    mkdir -p output/playwright
    cp "$tmp_dir"/*.log output/playwright/ 2>/dev/null || true
  fi
  cleanup || status=1
  exit "$status"
}
trap on_exit EXIT
cd "$repo_dir"
mkdir -p output/playwright
wrangler="$repo_dir/node_modules/.bin/wrangler"
persist_dir="$tmp_dir/wrangler-state"
hotel_local_date=$(TZ=America/Argentina/Mendoza date +%F)
hotel_risk_check_in=$(TZ=America/Argentina/Mendoza date -d "$hotel_local_date + 1 day" +%F)
hotel_risk_check_out=$(TZ=America/Argentina/Mendoza date -d "$hotel_local_date + 2 days" +%F)
if curl -fsS "http://127.0.0.1:$api_port/health" >/dev/null 2>&1; then echo "API port $api_port already occupied" >&2; exit 1; fi
if curl -fsS "http://127.0.0.1:$web_port/housekeeping" >/dev/null 2>&1; then echo "Web port $web_port already occupied" >&2; exit 1; fi

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "
  INSERT OR REPLACE INTO control_hotels (id,slug,operational_binding,active) VALUES ('hotel-a','hotel-a','HOTEL_DEMO_DB',1),('hotel-b','hotel-b','HOTEL_SECOND_DB',1);
  INSERT OR REPLACE INTO access_identity_mappings (access_subject,email,active) VALUES
    ('source-user:subject-a','a@example.test',1),
    ('source-user:subject-admin','admin@example.test',1),
    ('source-user:subject-network','network@example.test',1);
  INSERT OR REPLACE INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES
    ('source-user:subject-a','hotel-a','housekeeping',1),
    ('source-user:subject-a','hotel-b','housekeeping',1),
    ('source-user:subject-admin','hotel-a','admin',1);
  INSERT OR REPLACE INTO network_memberships (access_subject,role,active) VALUES ('source-user:subject-network','saas_admin',1);
  INSERT OR REPLACE INTO hotel_admin_metadata (hotel_id,name,plan_tier) VALUES ('hotel-a','Hotel Norte','BASIC'),('hotel-b','Hotel Sur','PRO');
" >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM bookings; DELETE FROM rooms WHERE id IN ('browser-a','browser-b','browser-c','browser-d','browser-e','browser-f','browser-g','browser-h','browser-report');
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES
    ('browser-a','901','STANDARD','DIRTY',10000,'DIRTY','IN_SERVICE'),('browser-b','902','STANDARD','CLEANING',12000,'CLEANING','IN_SERVICE'),
    ('browser-c','903','STANDARD','AVAILABLE',13000,'READY','IN_SERVICE'),('browser-d','904','STANDARD','MAINTENANCE',14000,'READY','OUT_OF_ORDER'),
    ('browser-e','905','STANDARD','AVAILABLE',15000,'READY','IN_SERVICE'),('browser-f','906','STANDARD','OCCUPIED',16000,'READY','IN_SERVICE'),
    ('browser-g','907','STANDARD','AVAILABLE',17000,'READY','IN_SERVICE'),('browser-h','908','STANDARD','AVAILABLE',18000,'READY','IN_SERVICE'),
    ('browser-report','909','STANDARD','AVAILABLE',19000,'READY','IN_SERVICE');
  INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at)
    VALUES ('browser-case-d','browser-d','OPEN','HIGH','Existing maintenance case','ops','subject-a','2026-01-01T00:00:00Z');
  UPDATE maintenance_cases SET impact='BLOCKING' WHERE id='browser-case-d';
  UPDATE rooms SET room_state_version=1 WHERE id='browser-d';
  INSERT OR REPLACE INTO housekeeping_events (id,room_id,maintenance_case_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at)
    VALUES ('browser-event-d','browser-d','browser-case-d','MAINTENANCE_OPEN','AVAILABLE','MAINTENANCE','source-user:subject-a','browser-request-d','hotel-a',json_object('room_state_version_before',0,'room_state_version_after',1,'impact','BLOCKING','housekeeping_state_after','READY','service_state_after','OUT_OF_ORDER','occupancy_before','VACANT','occupancy_after','VACANT','maintenance_impact_after','BLOCKING'),'2026-01-01T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-guest-f','Orphan Departure Guest','orphan@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-f','browser-guest-f','browser-f','2026-08-20','$hotel_local_date','CHECKED_IN',16000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-guest-g','Eligible Checked-In Guest','checked-in@example.test','2026-08-20'),('browser-guest-h','Eligible Confirmed Guest','confirmed@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-g','browser-guest-g','browser-g','2026-08-20','$hotel_local_date','CHECKED_IN',17000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z'),
      ('browser-booking-h','browser-guest-h','browser-h','2026-08-20','$hotel_local_date','CONFIRMED',18000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-report-guest','Report Fixture Guest','report@example.test','2026-08-20');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-report-booking','browser-report-guest','browser-report','2026-09-02','2026-09-04','CONFIRMED',40000,'2026-08-20T00:00:00Z','2026-08-20T00:00:00Z');
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('browser-risk-guest-d','At Risk Guest','risk@example.test','$hotel_local_date');
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
    VALUES ('browser-booking-risk-d','browser-risk-guest-d','browser-d','$hotel_risk_check_in','$hotel_risk_check_out','CONFIRMED',24000,'$hotel_local_date' || 'T00:00:00Z','$hotel_local_date' || 'T00:00:00Z');
" >>"$tmp_dir/migrations.log" 2>&1

CI=1 "$wrangler" d1 execute HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM bookings WHERE id IN ('browser-booking-risk-d'); DELETE FROM rooms WHERE id IN ('browser-a','browser-d');
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES
    ('browser-a','201','STANDARD','DIRTY',9000,'DIRTY','IN_SERVICE'),('browser-d','204','STANDARD','AVAILABLE',14000,'READY','IN_SERVICE');
  INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at)
    VALUES ('browser-case-d','browser-d','OPEN','NON_BLOCKING','LOW','Hotel Sur advisory case','team-b','source-user:subject-a','2026-01-02T00:00:00Z');
  UPDATE rooms SET room_state_version=1 WHERE id='browser-d';
  INSERT OR REPLACE INTO housekeeping_events (id,room_id,maintenance_case_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at)
    VALUES ('browser-event-d','browser-d','browser-case-d','MAINTENANCE_OPEN','AVAILABLE','AVAILABLE','source-user:subject-a','hotel-b-request','hotel-b',json_object('room_state_version_before',0,'room_state_version_after',1,'impact','NON_BLOCKING','housekeeping_state_after','READY','service_state_after','IN_SERVICE','occupancy_before','VACANT','occupancy_after','VACANT','maintenance_impact_after','NON_BLOCKING'),'2026-01-02T00:00:00Z');
" >>"$tmp_dir/migrations.log" 2>&1

"$wrangler" dev --local --ip 127.0.0.1 --port "$api_port" --persist-to "$persist_dir" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port "$web_port" --strictPort --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS "http://127.0.0.1:$web_port/housekeeping" >/dev/null 2>&1 && break; sleep 1; done

if [[ "${CI_BROWSER_STANDARD:-0}" == "1" ]]; then
  node scripts/cf-ux-mobile-browser-ci.mjs 2>&1 | tee output/playwright/browser.log
else
  bash "$pwcli" -s "$browser_session" open about:blank >/dev/null
  bash "$pwcli" -s "$browser_session" run-code --filename scripts/cf-i05-browser-regression.playwright.js
fi
