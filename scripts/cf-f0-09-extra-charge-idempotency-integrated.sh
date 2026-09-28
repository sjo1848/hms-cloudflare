#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
pwcli="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
wrangler="$repo_dir/node_modules/.bin/wrangler"
session="f0-09-extra-charge"
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
  [[ -z "$web_pid" ]] || cleanup_tree "$web_pid" || failed=1
  [[ -z "$api_pid" ]] || cleanup_tree "$api_pid" || failed=1
  return "$failed"
}
on_exit() {
  local result=$?
  if [[ "$result" != 0 ]]; then mkdir -p "$repo_dir/output/playwright"; cp "$tmp_dir"/*.log "$repo_dir/output/playwright/" 2>/dev/null || true; fi
  cleanup || result=1
  if [[ "$result" == 0 ]]; then mkdir -p "$repo_dir/output/playwright"; cp "$tmp_dir"/migrations.log "$repo_dir/output/playwright/f0-09-migration-rehearsal.log"; cp "$tmp_dir"/final.json "$repo_dir/output/playwright/f0-09-final-d1.json"; cp "$tmp_dir"/hotel-b.json "$repo_dir/output/playwright/f0-09-tenant-b-final-d1.json"; fi
  rm -rf "$tmp_dir"
  exit "$result"
}
trap on_exit EXIT
cd "$repo_dir"
mkdir -p output/playwright
export CI=1
for db in CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB; do
  "$wrangler" d1 migrations apply "$db" --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" >>"$tmp_dir/migrations.log" 2>&1
done
"$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES
    ('10000000-0000-0000-0000-000000000001','f09-a','HOTEL_DEMO_DB',1),
    ('20000000-0000-0000-0000-000000000002','f09-b','HOTEL_SECOND_DB',1);
  INSERT INTO access_identity_mappings (access_subject,email,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000002','leo-reception@migration.invalid',1),
    ('source-user:24000000-0000-0000-0000-000000000001','sol-ops@migration.invalid',1),
    ('source-user:24000000-0000-0000-0000-000000000002','max-housekeeping@migration.invalid',1);
  INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','receptionist',1),
    ('source-user:24000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','ops',1),
    ('source-user:24000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','housekeeping',1);
  INSERT INTO hotel_admin_metadata (hotel_id,name,plan_tier,timezone) VALUES
    ('10000000-0000-0000-0000-000000000001','F09 Synthetic A','BASIC','America/Argentina/Mendoza'),
    ('20000000-0000-0000-0000-000000000002','F09 Synthetic B','BASIC','America/Argentina/Mendoza');
" >>"$tmp_dir/migrations.log" 2>&1
"$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('f09-room','901','STANDARD','AVAILABLE',10000);
  INSERT INTO guests (id,full_name,email,created_at) VALUES ('f09-guest','F09 Synthetic Guest','f09-guest@example.test','2026-09-01T00:00:00Z');
  INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES
    ('f09-booking','f09-guest','f09-room','2026-09-28','2026-09-30','CONFIRMED',10000,'2026-09-01T00:00:00Z','2026-09-01T00:00:00Z'),
    ('f09-voided','f09-guest','f09-room','2026-10-01','2026-10-03','CONFIRMED',2000,'2026-09-01T00:00:00Z','2026-09-01T00:00:00Z'),
    ('f09-mismatch','f09-guest','f09-room','2026-10-04','2026-10-06','CONFIRMED',3000,'2026-09-01T00:00:00Z','2026-09-01T00:00:00Z'),
    ('f09-corrupt','f09-guest','f09-room','2026-10-07','2026-10-09','CONFIRMED',1000,'2026-09-01T00:00:00Z','2026-09-01T00:00:00Z');
  INSERT INTO invoices (id,booking_id,amount_cents,paid_amount_cents,status,payment_method,payment_reference,created_at) VALUES
    ('f09-invoice','f09-booking',10000,0,'PENDING','TRANSFER','transfer-900','2026-09-01T00:00:00Z'),
    ('f09-invoice-voided','f09-voided',2000,0,'VOIDED','CASH',NULL,'2026-09-01T00:00:00Z'),
    ('f09-invoice-mismatch','f09-mismatch',3000,500,'PENDING','CARD','legacy-ref','2026-09-01T00:00:00Z'),
    ('f09-invoice-corrupt','f09-corrupt',1000,0,'PENDING','CASH',NULL,'2026-09-01T00:00:00Z');
  INSERT INTO payment_entries (id,invoice_id,booking_id,amount_cents,payment_method,payment_reference,received_by_user_id,received_at) VALUES
    ('f09-payment','f09-invoice','f09-booking',2500,'TRANSFER','transfer-900','synthetic-actor','2026-09-01T00:00:00Z');
  INSERT INTO extra_charges (id,booking_id,description,amount_cents,category,created_at,operation_token)
    VALUES ('f09-corrupt-charge','f09-corrupt','Corrupt event pair fixture',100,'OTHER','2026-09-01T00:00:00Z','f09-corrupt-lookup-001');
  UPDATE invoices SET paid_amount_cents=2500 WHERE id='f09-invoice';
" >>"$tmp_dir/migrations.log" 2>&1
"$wrangler" d1 execute HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('f09-room-b','901','STANDARD','AVAILABLE',10000);
  INSERT INTO guests (id,full_name,email,created_at) VALUES ('f09-guest-b','F09 Tenant B','f09-b@example.test','2026-09-01T00:00:00Z');
" >>"$tmp_dir/migrations.log" 2>&1
"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:8787/health >/dev/null
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4176 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:4176/ >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:4176/ >/dev/null
bash "$pwcli" -s "$session" open about:blank >/dev/null
bash "$pwcli" -s "$session" run-code --filename scripts/cf-f0-09-extra-charge-idempotency.playwright.js | tee output/playwright/f0-09-extra-charge-idempotency.log
"$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "
  SELECT b.total_cents,i.amount_cents,i.paid_amount_cents,MAX(i.amount_cents-i.paid_amount_cents,0) remaining_cents,MAX(i.paid_amount_cents-i.amount_cents,0) credit_cents,i.status,i.payment_method,i.payment_reference,COUNT(DISTINCT x.id) charges,COUNT(DISTINCT e.id) events,COUNT(DISTINCT p.id) payments
  FROM bookings b JOIN invoices i ON i.booking_id=b.id LEFT JOIN extra_charges x ON x.booking_id=b.id LEFT JOIN financial_events e ON e.booking_id=b.id LEFT JOIN payment_entries p ON p.booking_id=b.id
  WHERE b.id='f09-booking' GROUP BY b.id;
  SELECT COUNT(*) AS rejected_charge_side_effects FROM extra_charges WHERE operation_token IN ('f09-audit-fail-001','f09-housekeeping-denied-001','f09-voided-api-001','f09-mismatch-api-001');
  SELECT COUNT(*) AS rejected_event_side_effects FROM financial_events WHERE json_extract(details_json,'$.operation_token') IN ('f09-audit-fail-001','f09-housekeeping-denied-001','f09-voided-api-001','f09-mismatch-api-001');
  SELECT b.id,b.total_cents,i.amount_cents,i.paid_amount_cents FROM bookings b JOIN invoices i ON i.booking_id=b.id WHERE b.id IN ('f09-voided','f09-mismatch') ORDER BY b.id;
  SELECT b.total_cents,i.amount_cents,(SELECT COUNT(*) FROM extra_charges x WHERE x.booking_id=b.id) charges,(SELECT COUNT(*) FROM financial_events e WHERE e.booking_id=b.id) events FROM bookings b JOIN invoices i ON i.booking_id=b.id WHERE b.id='f09-corrupt';
" --json >"$tmp_dir/final.json"
"$wrangler" d1 execute HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc --persist-to "$tmp_dir/state" --command "SELECT COUNT(*) AS foreign_booking FROM bookings WHERE id='f09-booking'; SELECT COUNT(*) AS foreign_charges FROM extra_charges WHERE booking_id='f09-booking';" --json >"$tmp_dir/hotel-b.json"
node - "$tmp_dir/final.json" <<'NODE'
const fs = require("node:fs");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).map(row => row.results);
const summary = rows[0]?.[0];
if (summary?.total_cents !== 12750 || summary?.amount_cents !== 12750 || summary?.paid_amount_cents !== 2500 || summary?.remaining_cents !== 10250 || summary?.credit_cents !== 0 || summary?.status !== "PENDING" || summary?.payment_method !== "TRANSFER" || summary?.payment_reference !== "transfer-900" || summary?.charges !== 2 || summary?.events !== 4 || summary?.payments !== 1) throw new Error(`unexpected persisted account after two UI charges: ${JSON.stringify(summary)}`);
if (rows[1]?.[0]?.rejected_charge_side_effects !== 0 || rows[2]?.[0]?.rejected_event_side_effects !== 0) throw new Error(`a rejected operation left durable effects: ${JSON.stringify(rows.slice(1, 3))}`);
if (rows[3]?.length !== 2 || rows[3].some(row => row.total_cents !== row.amount_cents)) throw new Error(`VOIDED/mismatched booking or invoice drifted: ${JSON.stringify(rows[3])}`);
if (rows[4]?.[0]?.total_cents !== 1000 || rows[4]?.[0]?.amount_cents !== 1000 || rows[4]?.[0]?.charges !== 1 || rows[4]?.[0]?.events !== 0) throw new Error(`corrupt prior event pair was modified during failed lookup/replay: ${JSON.stringify(rows[4])}`);
const hotelB = JSON.parse(fs.readFileSync(process.argv[2].replace("final.json", "hotel-b.json"), "utf8")).map(row => row.results);
if (hotelB[0]?.[0]?.foreign_booking !== 0 || hotelB[1]?.[0]?.foreign_charges !== 0) throw new Error(`foreign tenant has booking/charge drift: ${JSON.stringify(hotelB)}`);
NODE
cleanup
api_pid=""
web_pid=""
echo "F0.9 local Worker/D1/Vite/browser plus full migration chain PASS; owned process trees verified stopped."
