#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
worker_pid=""
collect_tree() { local parent="$1" child; printf '%s\n' "$parent"; while read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true); }
cleanup() {
  local pid live; local -a owned=(); [[ -n "$worker_pid" ]] || { rm -rf "$tmp_dir"; return 0; }; while read -r pid; do owned+=("$pid"); done < <(collect_tree "$worker_pid"); for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done; for _ in {1..50}; do live=0; for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done; (( live == 0 )) && { wait "$worker_pid" 2>/dev/null || true; worker_pid=""; rm -rf "$tmp_dir"; return 0; }; sleep 0.1; done; for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do live=0; for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done; (( live == 0 )) && { wait "$worker_pid" 2>/dev/null || true; worker_pid=""; rm -rf "$tmp_dir"; return 0; }; sleep 0.1; done; echo "owned CF-I03 Worker remains after cleanup" >&2; return 1
  rm -rf "$tmp_dir"
}
trap cleanup EXIT
cd "$repo_dir"

CI=1 npx wrangler d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 npx wrangler d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 npx wrangler d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "
  INSERT OR REPLACE INTO control_hotels (id,slug,operational_binding,active) VALUES ('hotel-a','hotel-a','HOTEL_DEMO_DB',1);
  INSERT OR REPLACE INTO access_identity_mappings (access_subject,email,active) VALUES ('subject-a','a@example.test',1);
  INSERT OR REPLACE INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES ('subject-a','hotel-a','admin',1);
" >/dev/null
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM payment_entries;
  DELETE FROM financial_events;
  DELETE FROM invoices;
  DELETE FROM extra_charges;
  DELETE FROM cash_closures;
  DELETE FROM housekeeping_events;
  DELETE FROM maintenance_cases;
  DELETE FROM lifecycle_events;
  DELETE FROM room_inventory_nights;
  DELETE FROM bookings;
  DELETE FROM room_holds;
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('room-a','101','STANDARD','AVAILABLE',10000),('room-b','102','STANDARD','AVAILABLE',12000);
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('guest-a','Guest A','a@example.test','2026-01-01T00:00:00Z');
" >/dev/null
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "PRAGMA foreign_key_list(room_inventory_nights)" --json >"$tmp_dir/foreign-keys.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/foreign-keys.json'))[0].results; if (!r.some(x=>x.table==='bookings' && x.from==='booking_id')) process.exit(1)"
if CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-a','2026-08-22','missing-booking')" >/dev/null 2>&1; then
  echo "orphan claim unexpectedly accepted" >&2
  exit 1
fi

npx wrangler dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/worker.log" 2>&1 &
worker_pid=$!
for _ in {1..30}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done

base=http://127.0.0.1:8787/api/v1
common=(-H 'x-local-access-subject: subject-a' -H 'x-local-access-email: a@example.test' -H 'x-hotel-id: hotel-a' -H 'content-type: application/json')
request() { curl -sS -o "$tmp_dir/response.json" -w '%{http_code}' "${common[@]}" "$@"; }
assert_status() { [[ "$1" == "$2" ]] || { echo "expected HTTP $2, got $1: $(cat "$tmp_dir/response.json")" >&2; exit 1; }; }

status=$(request -d '{"guest_id":"guest-a","room_id":"room-a","check_in":"2026-08-23","check_out":"2026-08-25","notes":""}' "$base/bookings")
assert_status "$status" 201
booking_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')).id)")

status=$(request -d '{"guest_id":"guest-a","room_id":"room-a","check_in":"2026-08-24","check_out":"2026-08-26"}' "$base/bookings")
assert_status "$status" 409

status=$(request -G --data-urlencode start=2026-08-25 --data-urlencode end=2026-08-26 "$base/rooms/available")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if (!r.some(x=>x.id==='room-a')) process.exit(1)"

status=$(request -X PATCH -d '{"room_id":"room-b","check_in":"2026-08-26","check_out":"2026-08-28"}' "$base/bookings/$booking_id")
assert_status "$status" 200
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT room_id,stay_date FROM room_inventory_nights WHERE booking_id='$booking_id' ORDER BY stay_date" --json >"$tmp_dir/claims.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/claims.json'))[0].results; if (r.length!==2 || r.some(x=>x.room_id!=='room-b')) process.exit(1)"

status=$(request -X PATCH -d '{"guest_id":"missing-guest"}' "$base/bookings/$booking_id")
assert_status "$status" 409
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM room_inventory_nights WHERE booking_id='$booking_id'" --json >"$tmp_dir/claims-after-failed-update.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/claims-after-failed-update.json'))[0].results[0]; if (r.count!==2) process.exit(1)"

status=$(request -d '{"start_date":"2026-08-26","end_date":"2026-08-28","hold_type":"Other","reason":"claimed dates"}' "$base/rooms/room-b/holds")
assert_status "$status" 409

status=$(request -X PATCH -d '{"status":"CANCELLED"}' "$base/bookings/$booking_id")
assert_status "$status" 200
status=$(request -G --data-urlencode start=2026-08-26 --data-urlencode end=2026-08-28 "$base/rooms/available")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if (!r.some(x=>x.id==='room-b')) process.exit(1)"

status=$(request -d '{"guest_id":"guest-a","room_id":"room-a","check_in":"2026-09-01","check_out":"2026-09-03"}' "$base/bookings")
assert_status "$status" 201
lifecycle_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')).id)")
status=$(request -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":false}' "$base/bookings/$lifecycle_id/check-in")
assert_status "$status" 400
status=$(request -d '{"start_date":"2026-09-01","end_date":"2026-09-03","hold_type":"Other","reason":"QA reassignment hold"}' "$base/rooms/room-b/holds")
assert_status "$status" 201
hold_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')).id)")
status=$(request -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$lifecycle_id/check-in")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedIn'||r.room_status!=='Occupied') process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT check_in_guests_count FROM bookings WHERE id='$lifecycle_id'" --json >"$tmp_dir/checkin-count.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/checkin-count.json'))[0].results[0]; if(r.check_in_guests_count!==2) process.exit(1)"
status=$(request -X POST -d '{"room_id":"room-b"}' "$base/bookings/$lifecycle_id/reassign")
assert_status "$status" 409
status=$(request "$base/bookings/$lifecycle_id")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedIn'||r.room_id!=='room-a') process.exit(1)"
status=$(request -X DELETE "$base/rooms/room-b/holds/$hold_id")
assert_status "$status" 200
status=$(request -X POST -d '{"room_id":"room-b"}' "$base/bookings/$lifecycle_id/reassign")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.room_id!=='room-b') process.exit(1)"
status=$(request -X POST -d '{"check_out_payment_policy":"settled","check_out_reference":null,"charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":false}' "$base/bookings/$lifecycle_id/check-out")
assert_status "$status" 400
status=$(request "$base/bookings/$lifecycle_id")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedIn') process.exit(1)"
status=$(request -X POST -d '{"check_out_payment_policy":"pending-approved","check_out_reference":null,"charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":true}' "$base/bookings/$lifecycle_id/check-out")
assert_status "$status" 400
status=$(request -X POST -d '{"check_out_payment_policy":"pending-approved","check_out_reference":"short","charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":true}' "$base/bookings/$lifecycle_id/check-out")
assert_status "$status" 400
status=$(request -X POST -d '{"check_out_payment_policy":"pending-approved","check_out_reference":"approved-123","charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":true}' "$base/bookings/$lifecycle_id/check-out")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedOut'||r.room_status!=='Dirty'||!r.housekeeping_handoff) process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT check_out_payment_policy,check_out_reference FROM bookings WHERE id='$lifecycle_id'" --json >"$tmp_dir/checkout-policy.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/checkout-policy.json'))[0].results[0]; if(r.check_out_payment_policy!=='pending-approved'||r.check_out_reference!=='approved-123') process.exit(1)"
status=$(request "$base/bookings/$lifecycle_id")
assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedOut') process.exit(1)"

CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM payment_entries; DELETE FROM financial_events; DELETE FROM invoices; DELETE FROM extra_charges; DELETE FROM cash_closures;
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases;
  DELETE FROM lifecycle_events;
  DELETE FROM room_inventory_nights;
  DELETE FROM bookings;
  DELETE FROM room_holds;
  UPDATE rooms SET status='AVAILABLE';
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('room-c','103','STANDARD','AVAILABLE',13000);
" >/dev/null
status=$(request -d '{"guest_id":"guest-a","room_id":"room-a","check_in":"2026-10-01","check_out":"2026-10-03"}' "$base/bookings")
assert_status "$status" 201
race_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')).id)")
curl -sS -o "$tmp_dir/checkin-1.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$race_id/check-in" >"$tmp_dir/checkin-1.status" & p1=$!
curl -sS -o "$tmp_dir/checkin-2.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$race_id/check-in" >"$tmp_dir/checkin-2.status" & p2=$!
wait "$p1" "$p2"
echo "check-in race statuses: $(tr '\n' ' ' < "$tmp_dir/checkin-1.status") $(tr '\n' ' ' < "$tmp_dir/checkin-2.status")" >&2
cat "$tmp_dir/checkin-1.json" "$tmp_dir/checkin-2.json" >&2
node -e "const fs=require('fs'); const s=[fs.readFileSync('$tmp_dir/checkin-1.status','utf8').trim(),fs.readFileSync('$tmp_dir/checkin-2.status','utf8').trim()]; if(!s.every(x=>x==='200'||x==='409')) { console.error(s,fs.readFileSync('$tmp_dir/checkin-1.json','utf8'),fs.readFileSync('$tmp_dir/checkin-2.json','utf8')); process.exit(1); }"
status=$(request "$base/bookings/$race_id"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedIn'||r.room_id!=='room-a') process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='$race_id' AND event_type='CHECK_IN'" --json >"$tmp_dir/checkin-events.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/checkin-events.json'))[0].results[0]; if(r.count!==1) process.exit(1)"
# Reassignment concurrency is covered by deterministic stale-destination and
# hold-race transactions below; avoid a non-deterministic local HTTP socket race.
status=$(request -X POST -d '{"room_id":"room-b"}' "$base/bookings/$race_id/reassign"); assert_status "$status" 200
status=$(request "$base/bookings/$race_id"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedIn'||!['room-b','room-c'].includes(r.room_id)) process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT DISTINCT room_id FROM room_inventory_nights WHERE booking_id='$race_id'" --json >"$tmp_dir/race-claims.json"
node -e "const b=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-claims.json'))[0].results; if(r.length!==1||r[0].room_id!==b.room_id) process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='$race_id' AND event_type='REASSIGN'" --json >"$tmp_dir/reassign-events.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/reassign-events.json'))[0].results[0]; if(r.count!==1) process.exit(1)"
curl -sS -o "$tmp_dir/checkout-1.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"check_out_payment_policy":"settled","check_out_reference":null,"charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":true}' "$base/bookings/$race_id/check-out" >"$tmp_dir/checkout-1.status" & p1=$!
curl -sS -o "$tmp_dir/checkout-2.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"check_out_payment_policy":"settled","check_out_reference":null,"charge_reviewed":true,"release_confirmed":true,"handoff_confirmed":true}' "$base/bookings/$race_id/check-out" >"$tmp_dir/checkout-2.status" & p2=$!
wait "$p1" "$p2"
node -e "const s=[require('fs').readFileSync('$tmp_dir/checkout-1.status','utf8').trim(),require('fs').readFileSync('$tmp_dir/checkout-2.status','utf8').trim()]; if(!s.every(x=>x==='200'||x==='409')) { console.error(s); process.exit(1); }"
status=$(request "$base/bookings/$race_id"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='CheckedOut') process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM room_inventory_nights WHERE booking_id='$race_id'" --json >"$tmp_dir/race-claims-after-checkout.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-claims-after-checkout.json'))[0].results[0]; if(r.count!==0) process.exit(1)"
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='$race_id'" --json >"$tmp_dir/race-events.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-events.json'))[0].results[0]; if(r.count<2||r.count>4) process.exit(1)"
CI=1 npx wrangler d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='subject-a' AND hotel_id='hotel-a'" >/dev/null
status=$(request -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$race_id/check-in")
assert_status "$status" 403
CI=1 npx wrangler d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='admin' WHERE access_subject='subject-a' AND hotel_id='hotel-a'" >/dev/null
status=$(curl -sS -o "$tmp_dir/unknown-binding.json" -w '%{http_code}' -H 'x-local-access-subject: subject-a' -H 'x-local-access-email: a@example.test' -H 'x-hotel-id: unknown-hotel' -H 'content-type: application/json' -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$race_id/check-in")
assert_status "$status" 403
status=$(request -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/missing-cross-tenant/check-in")
assert_status "$status" 404
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='$race_id'" --json >"$tmp_dir/security-events.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/security-events.json'))[0].results[0]; if(r.count<2||r.count>4) process.exit(1)"

# Deterministic stale-state guard checks: the event trigger is the final
# statement in each operation batch and must abort the whole batch, preserving
# booking, claims, room state and event count.
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM lifecycle_events; DELETE FROM room_inventory_nights; DELETE FROM bookings;
  UPDATE rooms SET status='AVAILABLE';
  INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('stale-checkout','guest-a','room-a','2026-11-01','2026-11-03','CHECKED_IN',20000,'2026-01-01','2026-01-01');
  INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-a','2026-11-01','stale-checkout'),('room-a','2026-11-02','stale-checkout');
  UPDATE rooms SET status='OCCUPIED' WHERE id='room-a';
" >/dev/null
if CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  BEGIN;
  UPDATE bookings SET status='CHECKED_OUT' WHERE id='stale-checkout' AND status='CHECKED_IN';
  DELETE FROM room_inventory_nights WHERE booking_id='stale-checkout';
  UPDATE rooms SET status='DIRTY' WHERE id='room-a' AND status='AVAILABLE';
  INSERT INTO lifecycle_events (id,booking_id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('stale-checkout-event','stale-checkout','CHECK_OUT','room-a','subject-a','stale-request','hotel-a','{}','2026-01-01');
  COMMIT;
" >/dev/null 2>&1; then echo "stale checkout batch unexpectedly committed" >&2; exit 1; fi
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status,room_id FROM bookings WHERE id='stale-checkout'; SELECT COUNT(*) AS claims FROM room_inventory_nights WHERE booking_id='stale-checkout'; SELECT status FROM rooms WHERE id='room-a'; SELECT COUNT(*) AS events FROM lifecycle_events WHERE booking_id='stale-checkout'" --json >"$tmp_dir/stale-checkout.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/stale-checkout.json')).flatMap(x=>x.results); if(r[0].status!=='CHECKED_IN'||r[0].room_id!=='room-a'||r[1].claims!==2||r[2].status!=='OCCUPIED'||r[3].events!==0) process.exit(1)"

# Valid repeated room history remains legal (A -> B -> A -> C).
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "DELETE FROM payment_entries; DELETE FROM financial_events; DELETE FROM invoices; DELETE FROM extra_charges; DELETE FROM cash_closures; DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM lifecycle_events; DELETE FROM room_inventory_nights; DELETE FROM bookings; UPDATE rooms SET status='AVAILABLE';" >/dev/null
status=$(request -d '{"guest_id":"guest-a","room_id":"room-a","check_in":"2026-12-01","check_out":"2026-12-03"}' "$base/bookings"); assert_status "$status" 201
history_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')).id)")
status=$(request -X POST -d '{"check_in_guests_count":2,"document_verified":true,"contact_confirmed":true,"stay_confirmed":true}' "$base/bookings/$history_id/check-in"); assert_status "$status" 200
for destination in room-b room-a room-c; do status=$(request -X POST -d "{\"room_id\":\"$destination\"}" "$base/bookings/$history_id/reassign"); assert_status "$status" 200; done
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT COUNT(*) AS count FROM lifecycle_events WHERE booking_id='$history_id' AND event_type='REASSIGN'" --json >"$tmp_dir/repeated-history.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/repeated-history.json'))[0].results[0]; if(r.count!==3) process.exit(1)"

# Deterministic stale destination rollback: destination invalidation before the
# final event guard must preserve booking, claims, both rooms and audit count.
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM lifecycle_events; DELETE FROM room_inventory_nights; DELETE FROM bookings; DELETE FROM room_holds;
  UPDATE rooms SET status='AVAILABLE';
  INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('stale-reassign','guest-a','room-a','2027-01-01','2027-01-03','CHECKED_IN',20000,'2026-01-01','2026-01-01');
  INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-a','2027-01-01','stale-reassign'),('room-a','2027-01-02','stale-reassign');
  UPDATE rooms SET status='OCCUPIED' WHERE id='room-a'; UPDATE rooms SET status='MAINTENANCE' WHERE id='room-b';
" >/dev/null
if CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  BEGIN;
  UPDATE bookings SET room_id='room-b' WHERE id='stale-reassign' AND status='CHECKED_IN' AND room_id='room-a';
  DELETE FROM room_inventory_nights WHERE booking_id='stale-reassign';
  INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-b','2027-01-01','stale-reassign'),('room-b','2027-01-02','stale-reassign');
  UPDATE rooms SET status='AVAILABLE' WHERE id='room-a' AND status='OCCUPIED';
  UPDATE rooms SET status='OCCUPIED' WHERE id='room-b' AND status='AVAILABLE';
  INSERT INTO lifecycle_events (id,booking_id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('stale-reassign-event','stale-reassign','REASSIGN','room-a','subject-a','stale-request','hotel-a','{\"from_room_id\":\"room-a\",\"to_room_id\":\"room-b\"}','2026-01-01');
  COMMIT;
" >/dev/null 2>&1; then echo "stale reassignment batch unexpectedly committed" >&2; exit 1; fi
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT room_id FROM bookings WHERE id='stale-reassign'; SELECT room_id,COUNT(*) AS claims FROM room_inventory_nights WHERE booking_id='stale-reassign' GROUP BY room_id; SELECT id,status FROM rooms WHERE id IN ('room-a','room-b') ORDER BY id; SELECT COUNT(*) AS events FROM lifecycle_events WHERE booking_id='stale-reassign'" --json >"$tmp_dir/stale-reassign.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/stale-reassign.json')).flatMap(x=>x.results); if(r[0].room_id!=='room-a'||r[1].room_id!=='room-a'||r[1].claims!==2||r[2].status!=='OCCUPIED'||r[3].status!=='MAINTENANCE'||r[4].events!==0) process.exit(1)"

# Deterministic hold-vs-reassignment guard: an overlapping hold at the final
# event boundary cannot coexist with booking claims.
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "DELETE FROM lifecycle_events; DELETE FROM room_inventory_nights; DELETE FROM bookings; DELETE FROM room_holds; UPDATE rooms SET status='AVAILABLE'; INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('hold-race','guest-a','room-a','2027-02-01','2027-02-03','CHECKED_IN',20000,'2026-01-01','2026-01-01'); INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-a','2027-02-01','hold-race'),('room-a','2027-02-02','hold-race'); UPDATE rooms SET status='OCCUPIED' WHERE id='room-a'; INSERT INTO room_holds (id,room_id,start_date,end_date,hold_type,reason,created_at) VALUES ('hold-race-hold','room-b','2027-02-01','2027-02-03','Other','race hold','2026-01-01');" >/dev/null
if CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "BEGIN; UPDATE bookings SET room_id='room-b' WHERE id='hold-race' AND room_id='room-a'; DELETE FROM room_inventory_nights WHERE booking_id='hold-race'; INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES ('room-b','2027-02-01','hold-race'),('room-b','2027-02-02','hold-race'); UPDATE rooms SET status='AVAILABLE' WHERE id='room-a' AND status='OCCUPIED'; UPDATE rooms SET status='OCCUPIED' WHERE id='room-b' AND status='AVAILABLE'; INSERT INTO lifecycle_events (id,booking_id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('hold-race-event','hold-race','REASSIGN','room-a','subject-a','hold-request','hotel-a','{\"from_room_id\":\"room-a\",\"to_room_id\":\"room-b\"}','2026-01-01'); COMMIT;" >/dev/null 2>&1; then echo "hold-vs-reassignment batch unexpectedly committed" >&2; exit 1; fi
CI=1 npx wrangler d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT room_id FROM bookings WHERE id='hold-race'; SELECT room_id,COUNT(*) AS claims FROM room_inventory_nights WHERE booking_id='hold-race' GROUP BY room_id; SELECT COUNT(*) AS events FROM lifecycle_events WHERE booking_id='hold-race';" --json >"$tmp_dir/hold-race.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/hold-race.json')).flatMap(x=>x.results); if(r[0].room_id!=='room-a'||r[1].room_id!=='room-a'||r[1].claims!==2||r[2].events!==0) process.exit(1)"

echo "CF-I03 + CF-I04 lifecycle D1/API regression PASS"
