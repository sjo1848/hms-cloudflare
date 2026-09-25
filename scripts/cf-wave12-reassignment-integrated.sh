#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
status=0
cleanup() {
  bash "$pwcli" -s wave12-reassignment-integrated-v2 close >/dev/null 2>&1 || true
  if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; fi
  pkill -TERM -f "vite --host 127.0.0.1 --port 4174" 2>/dev/null || true
  if [[ -n "$api_pid" ]]; then pkill -TERM -P "$api_pid" 2>/dev/null || true; kill "$api_pid" 2>/dev/null || true; fi
  pkill -TERM -f "wrangler dev --local --ip 127.0.0.1 --port 8787" 2>/dev/null || true
}
on_exit() {
  status=$?
  if [[ "$status" != "0" ]]; then
    mkdir -p output/playwright
    cp "$tmp_dir"/*.log output/playwright/ 2>/dev/null || true
  fi
  cleanup
  if pgrep -af "wrangler dev --local --ip 127.0.0.1 --port 8787|vite --host 127.0.0.1 --port 4174" >/dev/null; then
    echo "owned local browser processes remain after cleanup" >&2
    status=1
  fi
  exit "$status"
}
trap on_exit EXIT
cd "$repo_dir"
mkdir -p output/playwright
wrangler="$repo_dir/node_modules/.bin/wrangler"
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
browser_mode=${WAVE12_BROWSER_MODE:-full}
hotel_local_date=$(TZ=America/Argentina/Mendoza date +%F)
check_in=$(TZ=America/Argentina/Mendoza date -d "${hotel_local_date} - 1 day" +%F)
check_out=$(TZ=America/Argentina/Mendoza date -d "${hotel_local_date} + 2 days" +%F)
rm -rf "$repo_dir/apps/api/.wrangler/state"

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >"$tmp_dir/api.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >>"$tmp_dir/api.log" 2>&1
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM hotel_memberships; DELETE FROM access_identity_mappings; DELETE FROM control_hotels; DELETE FROM hotel_admin_metadata;
  INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES ('10000000-0000-0000-0000-000000000001','hotel-a','HOTEL_DEMO_DB',1);
  INSERT INTO access_identity_mappings (access_subject,email,active) VALUES ('source-user:14000000-0000-0000-0000-000000000002','leo-reception@migration.invalid',1),('source-user:14000000-0000-0000-0000-000000000001','ana-admin@migration.invalid',1);
  INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES ('source-user:14000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','receptionist',1),('source-user:14000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','admin',1);
  INSERT INTO hotel_admin_metadata (hotel_id,name,plan_tier,timezone) VALUES ('10000000-0000-0000-0000-000000000001','Hotel Norte','BASIC','America/Argentina/Mendoza');
" >>"$tmp_dir/api.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM payment_entries; DELETE FROM financial_events; DELETE FROM invoices; DELETE FROM extra_charges; DELETE FROM cash_closures; DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM lifecycle_events; DELETE FROM room_inventory_nights; DELETE FROM room_holds; DELETE FROM bookings; DELETE FROM guests; DELETE FROM rooms;
  INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('e2e-room-a','101','STANDARD','OCCUPIED',10000),('e2e-room-b','102','STANDARD','AVAILABLE',12000),('e2e-room-c','103','STANDARD','OCCUPIED',11000),('e2e-room-d','104','STANDARD','MAINTENANCE',14000),('e2e-room-e','105','STANDARD','AVAILABLE',15000);
  INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at) VALUES
    ('e2e-case-nonblocking','e2e-room-b','OPEN','NON_BLOCKING','LOW','Advisory maintenance','ops','source-user:subject-admin','2026-01-01T00:00:00Z'),
    ('e2e-case-blocking','e2e-room-d','OPEN','BLOCKING','HIGH','Blocking maintenance','ops','source-user:subject-admin','2026-01-01T00:00:00Z');
  INSERT INTO guests (id,full_name,email,created_at) VALUES ('e2e-guest-success','Integrated Reassignment Guest','integrated-success@example.test','2026-01-01'),('e2e-guest-stale','Stale Reassignment Guest','integrated-stale@example.test','2026-01-01');
  INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES
    ('e2e-booking-success','e2e-guest-success','e2e-room-a','$check_in','$check_out','CHECKED_IN',30000,'2026-01-01','2026-01-01'),
    ('e2e-booking-stale','e2e-guest-stale','e2e-room-c','$check_in','$check_out','CHECKED_IN',30000,'2026-01-01','2026-01-01');
  INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES
    ('e2e-room-a','$check_in','e2e-booking-success'),('e2e-room-a','$hotel_local_date','e2e-booking-success'),
    ('e2e-room-c','$check_in','e2e-booking-stale'),('e2e-room-c','$hotel_local_date','e2e-booking-stale');
  INSERT INTO invoices (id,booking_id,amount_cents,paid_amount_cents,status,created_at) VALUES
    ('e2e-invoice-success','e2e-booking-success',30000,0,'PENDING','2026-01-01'),('e2e-invoice-stale','e2e-booking-stale',30000,0,'PENDING','2026-01-01');
" >>"$tmp_dir/api.log" 2>&1

"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/api-runtime.log" 2>&1 & api_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done
VITE_LOCAL_ACCEPTANCE_AUTH=true npm run web:build >"$tmp_dir/web-build.log" 2>&1
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" preview --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:4174/bookings >/dev/null 2>&1 && break; sleep 1; done
curl -fsS -H 'x-local-access-subject: source-user:14000000-0000-0000-0000-000000000001' -H 'x-local-access-email: ana-admin@migration.invalid' -H 'x-hotel-id: 10000000-0000-0000-0000-000000000001' 'http://127.0.0.1:8787/api/v1/bookings?limit=100' >"$tmp_dir/direct-bookings.json"
echo "integrated fixture API: $(cat "$tmp_dir/direct-bookings.json")"
echo "integrated availability API: $(curl -fsS -H 'x-local-access-subject: source-user:14000000-0000-0000-0000-000000000001' -H 'x-local-access-email: ana-admin@migration.invalid' -H 'x-hotel-id: 10000000-0000-0000-0000-000000000001' "http://127.0.0.1:8787/api/v1/rooms/available?start=$check_in&end=$check_out&exclude_booking_id=e2e-booking-success")"

bash "$pwcli" -s wave12-reassignment-integrated-v2 open about:blank >/dev/null
if [[ "$browser_mode" == "success" ]]; then
  browser_file=scripts/cf-wave12-reassignment-success.playwright.js
elif [[ "$browser_mode" == "conflict" ]]; then
  browser_file=scripts/cf-wave12-reassignment-conflict.playwright.js
else
  browser_file=scripts/cf-wave12-reassignment-integrated.playwright.js
fi
bash "$pwcli" -s wave12-reassignment-integrated-v2 run-code --filename "$browser_file"
bash "$pwcli" -s wave12-reassignment-integrated-v2 close >/dev/null

if [[ "$browser_mode" == "success" ]]; then
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT id,room_id,total_cents FROM bookings WHERE id='e2e-booking-success'; SELECT amount_cents,paid_amount_cents,status FROM invoices WHERE booking_id='e2e-booking-success'; SELECT id,status FROM rooms WHERE id IN ('e2e-room-a','e2e-room-b'); SELECT booking_id,room_id,COUNT(*) AS claims FROM room_inventory_nights WHERE booking_id='e2e-booking-success' GROUP BY booking_id,room_id; SELECT event_type,COUNT(*) AS events FROM lifecycle_events WHERE booking_id='e2e-booking-success' GROUP BY event_type; SELECT event_type,COUNT(*) AS events FROM financial_events WHERE booking_id='e2e-booking-success' GROUP BY event_type; SELECT COUNT(*) AS payments FROM payment_entries WHERE booking_id='e2e-booking-success';" --json >"$tmp_dir/final-state.json"
node - "$tmp_dir/final-state.json" <<'NODE'
const fs = require("fs"); const [booking, invoice, rooms, inventory, lifecycle, financial, payments] = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).map(item => item.results);
if (booking[0]?.room_id !== "e2e-room-b" || booking[0]?.total_cents !== 36000) throw new Error(`success booking mismatch ${JSON.stringify(booking)}`);
if (invoice[0]?.amount_cents !== 36000 || invoice[0]?.paid_amount_cents !== 0 || invoice[0]?.status !== "PENDING") throw new Error(`invoice mismatch ${JSON.stringify(invoice)}`);
if (rooms.find(row => row.id === "e2e-room-a")?.status !== "DIRTY" || rooms.find(row => row.id === "e2e-room-b")?.status !== "OCCUPIED") throw new Error(`room mismatch ${JSON.stringify(rooms)}`);
if (!inventory.some(row => row.room_id === "e2e-room-a" && row.claims === 1) || !inventory.some(row => row.room_id === "e2e-room-b" && row.claims === 2)) throw new Error(`inventory mismatch ${JSON.stringify(inventory)}`);
if (!lifecycle.some(row => row.event_type === "REASSIGN" && row.events === 1) || !financial.some(row => row.event_type === "PRICE_RECONCILIATION" && row.events === 1) || payments[0]?.payments !== 0) throw new Error(`event/payment mismatch ${JSON.stringify({ lifecycle, financial, payments })}`);
NODE
elif [[ "$browser_mode" == "conflict" ]]; then
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT id,room_id,total_cents FROM bookings WHERE id='e2e-booking-stale'; SELECT id,status FROM rooms WHERE id IN ('e2e-room-c','e2e-room-e'); SELECT event_type,COUNT(*) AS events FROM lifecycle_events WHERE booking_id='e2e-booking-stale' GROUP BY event_type; SELECT event_type,COUNT(*) AS events FROM financial_events WHERE booking_id='e2e-booking-stale' GROUP BY event_type;" --json >"$tmp_dir/final-state.json"
node - "$tmp_dir/final-state.json" <<'NODE'
const fs = require("fs"); const [booking, rooms, lifecycle, financial] = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).map(item => item.results);
if (booking[0]?.room_id !== "e2e-room-c" || booking[0]?.total_cents !== 30000) throw new Error(`conflict booking drift ${JSON.stringify(booking)}`);
if (rooms.find(row => row.id === "e2e-room-e")?.status !== "MAINTENANCE") throw new Error(`conflict destination mismatch ${JSON.stringify(rooms)}`);
if (lifecycle.length || financial.length) throw new Error(`conflict produced events ${JSON.stringify({ lifecycle, financial })}`);
NODE
else
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  SELECT id,room_id,total_cents FROM bookings WHERE id IN ('e2e-booking-success','e2e-booking-stale') ORDER BY id;
  SELECT booking_id,amount_cents,paid_amount_cents,status FROM invoices WHERE booking_id IN ('e2e-booking-success','e2e-booking-stale') ORDER BY booking_id;
  SELECT id,status FROM rooms WHERE id IN ('e2e-room-a','e2e-room-b','e2e-room-e') ORDER BY id;
  SELECT booking_id,room_id,COUNT(*) AS claims FROM room_inventory_nights WHERE booking_id IN ('e2e-booking-success','e2e-booking-stale') GROUP BY booking_id,room_id ORDER BY booking_id,room_id;
  SELECT booking_id,event_type,COUNT(*) AS events FROM lifecycle_events WHERE booking_id IN ('e2e-booking-success','e2e-booking-stale') GROUP BY booking_id,event_type ORDER BY booking_id,event_type;
  SELECT booking_id,event_type,COUNT(*) AS events FROM financial_events WHERE booking_id IN ('e2e-booking-success','e2e-booking-stale') GROUP BY booking_id,event_type ORDER BY booking_id,event_type;
  SELECT booking_id,COUNT(*) AS payments FROM payment_entries WHERE booking_id IN ('e2e-booking-success','e2e-booking-stale') GROUP BY booking_id ORDER BY booking_id;
" --json >"$tmp_dir/final-state.json"
node - "$tmp_dir/final-state.json" <<'NODE'
const fs = require("fs");
const groups = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const [bookings, invoices, rooms, inventory, lifecycle, financial, payments] = groups.map(item => item.results);
const success = bookings.find(row => row.id === "e2e-booking-success");
const stale = bookings.find(row => row.id === "e2e-booking-stale");
if (success?.room_id !== "e2e-room-b" || success?.total_cents !== 36000) throw new Error(`success booking mismatch ${JSON.stringify(success)}`);
if (stale?.room_id !== "e2e-room-c" || stale?.total_cents !== 30000) throw new Error(`stale booking drift ${JSON.stringify(stale)}`);
const invoice = invoices.find(row => row.booking_id === "e2e-booking-success");
if (invoice?.amount_cents !== 36000 || invoice?.paid_amount_cents !== 0 || invoice?.status !== "PENDING") throw new Error(`invoice mismatch ${JSON.stringify(invoice)}`);
const room = id => rooms.find(row => row.id === id)?.status;
if (room("e2e-room-a") !== "DIRTY" || room("e2e-room-b") !== "OCCUPIED" || room("e2e-room-e") !== "MAINTENANCE") throw new Error(`room state mismatch ${JSON.stringify(rooms)}`);
const claim = (bookingId, roomId) => inventory.find(row => row.booking_id === bookingId && row.room_id === roomId)?.claims ?? 0;
if (claim("e2e-booking-success", "e2e-room-a") !== 1 || claim("e2e-booking-success", "e2e-room-b") !== 2) throw new Error(`inventory history mismatch ${JSON.stringify(inventory)}`);
if (!lifecycle.some(row => row.booking_id === "e2e-booking-success" && row.event_type === "REASSIGN" && row.events === 1) || lifecycle.some(row => row.booking_id === "e2e-booking-stale")) throw new Error(`lifecycle event mismatch ${JSON.stringify(lifecycle)}`);
if (!financial.some(row => row.booking_id === "e2e-booking-success" && row.event_type === "PRICE_RECONCILIATION" && row.events === 1) || financial.some(row => row.booking_id === "e2e-booking-stale")) throw new Error(`financial event mismatch ${JSON.stringify(financial)}`);
if (payments.length !== 0) throw new Error(`payment ledger changed ${JSON.stringify(payments)}`);
NODE
fi
