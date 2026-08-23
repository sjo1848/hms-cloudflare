#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
worker_pid=""
cleanup() {
  if [[ -n "$worker_pid" ]]; then kill "$worker_pid" 2>/dev/null || true; fi
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

echo "CF-I03 D1/API regression PASS"
