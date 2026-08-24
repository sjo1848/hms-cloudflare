#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
worker_pid=""
cleanup() { pkill -TERM -f "wrangler dev --local --ip 127.0.0.1 --port 8787" 2>/dev/null || true; if [[ -n "$worker_pid" ]]; then pkill -TERM -P "$worker_pid" 2>/dev/null || true; kill "$worker_pid" 2>/dev/null || true; fi; }
trap cleanup EXIT
cd "$repo_dir"

wrangler="$repo_dir/node_modules/.bin/wrangler"

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >/dev/null
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM rooms WHERE id IN ('browser-a','browser-b','browser-c','browser-d','browser-e');
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('room-a','101','STANDARD','DIRTY',10000),('room-b','102','STANDARD','CLEANING',12000),
    ('room-c','103','STANDARD','AVAILABLE',13000),('room-d','104','STANDARD','MAINTENANCE',14000),
    ('room-e','105','STANDARD','DIRTY',15000),('room-f','106','STANDARD','MAINTENANCE',16000),('room-g','107','STANDARD','DIRTY',17000);
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('guest-a','Guest A','a@example.test','2026-01-01');
" >/dev/null

CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at) VALUES ('case-f','room-f','OPEN','HIGH','Existing maintenance case','ops','subject-a','2026-01-01T00:00:00Z');" >/dev/null

./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >"$tmp_dir/worker.log" 2>&1 & worker_pid=$!
ready=false
for _ in {1..30}; do if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then ready=true; break; fi; sleep 1; done
if [[ "$ready" != true ]]; then echo "local API worker did not become ready" >&2; cat "$tmp_dir/worker.log" >&2; exit 1; fi
base=http://127.0.0.1:8787/api/v1
common=(-H 'x-local-access-subject: subject-a' -H 'x-local-access-email: a@example.test' -H 'x-hotel-id: hotel-a' -H 'content-type: application/json')
request() { curl -sS -o "$tmp_dir/response.json" -w '%{http_code}' "${common[@]}" "$@"; }
assert_status() { [[ "$1" == "$2" ]] || { echo "expected HTTP $2, got $1: $(cat "$tmp_dir/response.json")" >&2; exit 1; }; }

status=$(request "$base/housekeeping/dirty"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.map(x=>x.id).sort().join(',')!=='room-a,room-b,room-e,room-g') process.exit(1)"
status=$(request "$base/housekeeping/board"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.rooms.length!==7||!r.rooms.some(x=>x.room_id==='room-d'&&x.room_status==='Maintenance')) process.exit(1)"

status=$(request -X POST "$base/housekeeping/room-a/start"); assert_status "$status" 200
status=$(request -X POST "$base/housekeeping/room-a/start"); assert_status "$status" 409
status=$(request -X POST "$base/housekeeping/room-a/finish"); assert_status "$status" 200
status=$(request -X POST "$base/housekeeping/room-a/finish"); assert_status "$status" 409

# Deterministic race coverage: two stale callers contend for the same guarded
# transition. Exactly one event may exist and one caller must be rejected.
curl -sS -o "$tmp_dir/race-start-a.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-e/start" >"$tmp_dir/race-start-a.status" & race_a=$!
curl -sS -o "$tmp_dir/race-start-b.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-e/start" >"$tmp_dir/race-start-b.status" & race_b=$!
wait "$race_a" "$race_b"
node -e "const s=[require('fs').readFileSync('$tmp_dir/race-start-a.status','utf8'),require('fs').readFileSync('$tmp_dir/race-start-b.status','utf8')].sort(); if(s.join(',')!=='200,409') process.exit(1)"
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-e'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-e' AND event_type='CLEANING_START';" --json >"$tmp_dir/race-start-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-start-db.json')).flatMap(x=>x.results); if(r[0].status!=='CLEANING'||r[1].events!==1) process.exit(1)"

curl -sS -o "$tmp_dir/race-finish-a.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-b/finish" >"$tmp_dir/race-finish-a.status" & race_a=$!
curl -sS -o "$tmp_dir/race-finish-b.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-b/finish" >"$tmp_dir/race-finish-b.status" & race_b=$!
wait "$race_a" "$race_b"
node -e "const s=[require('fs').readFileSync('$tmp_dir/race-finish-a.status','utf8'),require('fs').readFileSync('$tmp_dir/race-finish-b.status','utf8')].sort(); if(s.join(',')!=='200,409') process.exit(1)"
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-b'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-b' AND event_type='CLEANING_FINISH';" --json >"$tmp_dir/race-finish-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-finish-db.json')).flatMap(x=>x.results); if(r[0].status!=='AVAILABLE'||r[1].events!==1) process.exit(1)"
status=$(request -X POST -d '{"reason":"bad","priority":"HIGH","assigned_to":"ops"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 400
status=$(request -X POST -d '{"reason":"Water leak in bathroom","priority":"URGENT","assigned_to":"Technical shift"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 201
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='Open'||r.priority!=='Urgent'||r.assigned_to!=='Technical shift') process.exit(1)"
status=$(request -X POST -d '{"reason":"Duplicate report","priority":"HIGH","assigned_to":"ops"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 409
status=$(request -X POST -d '{"resolution_note":"short"}' "$base/housekeeping/room-c/dirty"); assert_status "$status" 400
status=$(request -X POST -d '{"resolution_note":"Leak repaired and verified"}' "$base/housekeeping/room-c/dirty"); assert_status "$status" 200
status=$(request "$base/housekeeping/board"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); const c=r.rooms.find(x=>x.room_id==='room-c'); if(!c||c.room_status!=='Dirty') process.exit(1)"

status=$(request -X POST -d '{"resolution_note":"Legacy maintenance reviewed and repaired"}' "$base/housekeeping/room-d/dirty"); assert_status "$status" 200
curl -sS -o "$tmp_dir/race-resolve-a.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"resolution_note":"Race resolver completed"}' "$base/housekeeping/room-f/dirty" >"$tmp_dir/race-resolve-a.status" & race_a=$!
curl -sS -o "$tmp_dir/race-resolve-b.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"resolution_note":"Race resolver completed"}' "$base/housekeeping/room-f/dirty" >"$tmp_dir/race-resolve-b.status" & race_b=$!
wait "$race_a" "$race_b"
node -e "const s=[require('fs').readFileSync('$tmp_dir/race-resolve-a.status','utf8'),require('fs').readFileSync('$tmp_dir/race-resolve-b.status','utf8')].sort(); if(s.join(',')!=='200,409') process.exit(1)"
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status,return_status,reported_by_user_id,resolved_by_user_id FROM maintenance_cases WHERE room_id='room-d'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id IN ('room-a','room-c','room-d') AND actor_subject='subject-a' AND hotel_id='hotel-a' AND request_id IS NOT NULL;" --json >"$tmp_dir/assertions.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/assertions.json')).flatMap(x=>x.results); if(r[0].status!=='RESOLVED'||r[0].return_status!=='DIRTY'||r[0].resolved_by_user_id!=='subject-a'||r[1].events<5) process.exit(1)"
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status,reported_by_user_id,resolved_by_user_id,return_status FROM maintenance_cases WHERE room_id='room-d'; SELECT status FROM rooms WHERE id='room-f'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-f' AND event_type='MAINTENANCE_RESOLVE';" --json >"$tmp_dir/race-resolve-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-resolve-db.json')).flatMap(x=>x.results); if(r[0].reported_by_user_id!=='subject-a'||r[0].resolved_by_user_id!=='subject-a'||r[0].return_status!=='DIRTY'||r[1].status!=='DIRTY'||r[2].events!==1) process.exit(1)"

# The final event trigger must roll back an invalid state transition entirely.
if CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "BEGIN; UPDATE rooms SET status='CLEANING' WHERE id='room-g' AND status='DIRTY'; INSERT INTO housekeeping_events (id,room_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('bad-transition','room-g','CLEANING_START','AVAILABLE','CLEANING','subject-a','bad-request','hotel-a','{}','2026-01-01'); COMMIT;" >/dev/null 2>&1; then echo "invalid transition unexpectedly committed" >&2; exit 1; fi
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-g'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE id='bad-transition';" --json >"$tmp_dir/rollback.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/rollback.json')).flatMap(x=>x.results); if(r[0].status!=='DIRTY'||r[1].events!==0) process.exit(1)"

CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='receptionist' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
status=$(request "$base/housekeeping/dirty"); assert_status "$status" 403
status=$(request -X POST "$base/housekeeping/room-a/start"); assert_status "$status" 403
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
status=$(request -X POST "$base/housekeeping/missing-room/start"); assert_status "$status" 404

echo "CF-I05 Housekeeping + Maintenance D1/API regression PASS"
