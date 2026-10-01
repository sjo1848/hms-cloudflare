#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
persist_dir="$tmp_dir/persist"
mkdir -p "$persist_dir"
persist_args=(--persist-to "$persist_dir")
port=$(node -e 'const server=require("node:net").createServer(); server.listen(0,"127.0.0.1",()=>{console.log(server.address().port); server.close();});')
worker_pid=""
cleanup() { if [[ -n "$worker_pid" ]]; then stop_worker; fi; }
trap cleanup EXIT
cd "$repo_dir"

wrangler="$repo_dir/node_modules/.bin/wrangler"

stop_worker() { if [[ -n "$worker_pid" ]]; then local owned_pid="$worker_pid" pgid; pgid=$(ps -o pgid= -p "$owned_pid" 2>/dev/null | tr -d ' ' || true); if [[ "$pgid" == "$owned_pid" ]]; then kill -TERM -- "-$owned_pid" 2>/dev/null || true; else kill -TERM "$owned_pid" 2>/dev/null || true; fi; wait "$owned_pid" 2>/dev/null || true; for _ in {1..30}; do local live_count; live_count=$(ps -o stat= -g "$owned_pid" 2>/dev/null | awk '$1 !~ /^Z/ { live++ } END { print live+0 }' || true); if [[ "$live_count" == "0" ]]; then worker_pid=""; return 0; fi; sleep 0.1; done; echo "owned Wrangler process group $owned_pid still has live processes" >&2; ps -o pid,ppid,pgid,stat,args -g "$owned_pid" >&2 || true; return 1; fi; }
start_worker() { setsid ./node_modules/.bin/wrangler dev --local --persist-to "$persist_dir" --ip 127.0.0.1 --port "$port" --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >>"$tmp_dir/worker.log" 2>&1 & worker_pid=$!; local pgid; for _ in {1..40}; do kill -0 "$worker_pid" 2>/dev/null || { cat "$tmp_dir/worker.log" >&2; return 1; }; pgid=$(ps -o pgid= -p "$worker_pid" | tr -d ' '); [[ "$pgid" == "$worker_pid" ]] && break; sleep 0.05; done; if [[ "$pgid" != "$worker_pid" ]]; then echo "Wrangler was not isolated in its own process group" >&2; stop_worker; return 1; fi; for _ in {1..30}; do kill -0 -- "-$worker_pid" 2>/dev/null || { cat "$tmp_dir/worker.log" >&2; return 1; }; curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1 && return 0; sleep 1; done; return 1; }
serialized_d1() { local status; stop_worker; if CI=1 "$wrangler" d1 execute "$@" "${persist_args[@]}"; then status=0; else status=$?; fi; start_worker; return "$status"; }

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" >/dev/null
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" >/dev/null
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" --command "INSERT OR REPLACE INTO control_hotels (id,slug,operational_binding,active) VALUES ('hotel-a','hotel-a','HOTEL_DEMO_DB',1); INSERT OR REPLACE INTO access_identity_mappings (access_subject,email,active) VALUES ('subject-a','a@example.test',1); INSERT OR REPLACE INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES ('subject-a','hotel-a','housekeeping',1);" >/dev/null
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" --command "
  DELETE FROM housekeeping_events; DELETE FROM maintenance_cases; DELETE FROM room_inventory_nights; DELETE FROM room_holds; DELETE FROM bookings; DELETE FROM rooms;
  INSERT OR REPLACE INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('room-a','101','STANDARD','DIRTY',10000),('room-b','102','STANDARD','CLEANING',12000),
    ('room-c','103','STANDARD','AVAILABLE',13000),('room-d','104','STANDARD','MAINTENANCE',14000),
    ('room-e','105','STANDARD','DIRTY',15000),('room-f','106','STANDARD','MAINTENANCE',16000),('room-g','107','STANDARD','DIRTY',17000),
    ('room-h','108','STANDARD','MAINTENANCE',18000),('room-i','109','STANDARD','OCCUPIED',19000);
  INSERT OR REPLACE INTO guests (id,full_name,email,created_at) VALUES ('guest-a','Guest A','a@example.test','2026-01-01');
  UPDATE rooms SET housekeeping_state=CASE status WHEN 'DIRTY' THEN 'DIRTY' WHEN 'CLEANING' THEN 'CLEANING' WHEN 'AVAILABLE' THEN 'READY' WHEN 'OCCUPIED' THEN 'READY' ELSE NULL END, service_state='IN_SERVICE', room_state_version=0;
  UPDATE rooms SET housekeeping_state='DIRTY' WHERE id='room-f';
  UPDATE rooms SET housekeeping_state='READY' WHERE id='room-h';
  INSERT OR REPLACE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES
    ('booking-i','guest-a','room-i','2026-01-01','2026-01-02','CHECKED_IN',19000,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
    ('booking-risk-f','guest-a','room-f','2026-01-02','2026-01-04','CONFIRMED',21000,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
    ('booking-advisory-c','guest-a','room-c','2026-01-02','2026-01-04','CONFIRMED',22000,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
" >/dev/null

CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" --command "INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at) VALUES ('case-f','room-f','OPEN','BLOCKING','HIGH','Existing maintenance case','ops','subject-a','2026-01-01T00:00:00Z');" >/dev/null
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc "${persist_args[@]}" --command "INSERT OR REPLACE INTO maintenance_cases (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at,resolution_note,resolved_by_user_id,resolved_at,return_status) VALUES ('case-h1','room-h','RESOLVED','HIGH','First maintenance case','ops','subject-a','2026-01-01T00:00:00Z','First case resolved','subject-a','2026-01-02T00:00:00Z','DIRTY'), ('case-h2','room-h','OPEN','URGENT','New maintenance case after re-entry','ops','subject-a','2026-01-03T00:00:00Z',NULL,NULL,NULL,NULL);" >/dev/null

start_worker
ready=false
for _ in {1..30}; do if curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1; then ready=true; break; fi; sleep 1; done
if [[ "$ready" != true ]]; then echo "local API worker did not become ready" >&2; cat "$tmp_dir/worker.log" >&2; exit 1; fi
base=http://127.0.0.1:$port/api/v1
common=(-H 'x-local-access-subject: subject-a' -H 'x-local-access-email: a@example.test' -H 'x-hotel-id: hotel-a' -H 'content-type: application/json')
request() { curl -sS -o "$tmp_dir/response.json" -w '%{http_code}' "${common[@]}" "$@"; }
assert_status() { [[ "$1" == "$2" ]] || { echo "expected HTTP $2, got $1: $(cat "$tmp_dir/response.json")" >&2; exit 1; }; }

status=$(request "$base/housekeeping/dirty"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.map(x=>x.id).sort().join(',')!=='room-a,room-b,room-e,room-f,room-g') process.exit(1); const f=r.find(x=>x.id==='room-f'); if(f.operational_state.maintenanceImpact!=='BLOCKING') process.exit(1)"
status=$(request "$base/housekeeping/board?date=2026-01-01"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); const f=r.rooms.find(x=>x.room_id==='room-f'); if(r.rooms.length!==8||!r.rooms.some(x=>x.room_id==='room-d'&&x.room_status==='Maintenance')||!f||f.at_risk_bookings?.[0]?.id!=='booking-risk-f') process.exit(1)"

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
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-e'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-e' AND event_type='CLEANING_START';" --json >"$tmp_dir/race-start-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-start-db.json')).flatMap(x=>x.results); if(r[0].status!=='CLEANING'||r[1].events!==1) { console.error('race-start state mismatch',r); process.exit(1) }"

curl -sS -o "$tmp_dir/race-finish-a.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-b/finish" >"$tmp_dir/race-finish-a.status" & race_a=$!
curl -sS -o "$tmp_dir/race-finish-b.json" -w '%{http_code}' "${common[@]}" -X POST "$base/housekeeping/room-b/finish" >"$tmp_dir/race-finish-b.status" & race_b=$!
wait "$race_a" "$race_b"
node -e "const s=[require('fs').readFileSync('$tmp_dir/race-finish-a.status','utf8'),require('fs').readFileSync('$tmp_dir/race-finish-b.status','utf8')].sort(); if(s.join(',')!=='200,409') process.exit(1)"
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-b'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-b' AND event_type='CLEANING_FINISH';" --json >"$tmp_dir/race-finish-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-finish-db.json')).flatMap(x=>x.results); if(r[0].status!=='AVAILABLE'||r[1].events!==1) process.exit(1)"
status=$(request -X POST -d '{"reason":"bad","priority":"HIGH","assigned_to":"ops"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 400
status=$(request -X POST -d '{"reason":"Advisory noise report","impact":"NON_BLOCKING","priority":"URGENT","assigned_to":"Technical shift"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 201
case_c=$(node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.status!=='Open'||r.impact!=='NON_BLOCKING'||r.priority!=='Urgent'||r.assigned_to!=='Technical shift') process.exit(1); process.stdout.write(r.id)")
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-c';" --json >"$tmp_dir/nonblocking-open.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/nonblocking-open.json')); if(r[0].results[0].status!=='AVAILABLE') process.exit(1)"
status=$(request -X POST -d '{"reason":"Duplicate report","priority":"HIGH","assigned_to":"ops"}' "$base/housekeeping/room-c/maintenance"); assert_status "$status" 409
status=$(request "$base/housekeeping/board?date=2026-01-01"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); const c=r.rooms.find(x=>x.room_id==='room-c'); if(!c||c.maintenance_case?.impact!=='NON_BLOCKING'||c.at_risk_bookings?.length) process.exit(1)"
status=$(request -X POST -d '{"note":"Risk now requires blocking"}' "$base/housekeeping/room-c/maintenance/$case_c/escalate"); assert_status "$status" 200
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-c';" --json >"$tmp_dir/escalated.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/escalated.json')); if(r[0].results[0].status!=='MAINTENANCE') process.exit(1)"
status=$(request -X POST -d '{"resolution_note":"short"}' "$base/housekeeping/room-c/dirty"); assert_status "$status" 400
status=$(request -X POST -d "{\"case_id\":\"$case_c\",\"resolution_note\":\"Leak repaired and verified\"}" "$base/housekeeping/room-c/dirty"); assert_status "$status" 200
status=$(request -X POST -d '{"reason":"Occupied safety concern","impact":"BLOCKING","priority":"HIGH","assigned_to":"Technical shift"}' "$base/housekeeping/room-i/maintenance"); assert_status "$status" 201
case_i=$(node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); if(r.impact!=='BLOCKING') process.exit(1); process.stdout.write(r.id)")
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-i'; SELECT impact FROM maintenance_cases WHERE id='$case_i';" --json >"$tmp_dir/occupied-blocking.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/occupied-blocking.json')).flatMap(x=>x.results); if(r[0].status!=='OCCUPIED'||r[1].impact!=='BLOCKING') process.exit(1)"
status=$(request -X POST -d '{"case_id":"'$case_i'","resolution_note":"Occupied issue reviewed"}' "$base/housekeeping/room-i/maintenance/$case_i/resolve"); assert_status "$status" 200
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-i'; SELECT return_status FROM maintenance_cases WHERE id='$case_i';" --json >"$tmp_dir/occupied-resolve.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/occupied-resolve.json')).flatMap(x=>x.results); if(r[0].status!=='OCCUPIED'||r[1].return_status!=='OCCUPIED') process.exit(1)"
status=$(request "$base/housekeeping/board"); assert_status "$status" 200
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/response.json')); const c=r.rooms.find(x=>x.room_id==='room-c'); const a=r.rooms.find(x=>x.room_id==='room-a'); if(!c||c.room_status!=='Dirty'||!a?.maintenance_history?.some(e=>e.event_type==='CLEANING_START'&&e.actor_subject==='subject-a'&&e.request_id)||!a?.maintenance_history?.some(e=>e.event_type==='CLEANING_FINISH')) process.exit(1)"

status=$(request -X POST -d '{"resolution_note":"Legacy maintenance reviewed and repaired"}' "$base/housekeeping/room-d/dirty"); assert_status "$status" 200
status=$(request -X POST -d '{"case_id":"case-h1","resolution_note":"Stale first case attempt"}' "$base/housekeeping/room-h/dirty"); assert_status "$status" 409
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-h'; SELECT id,status FROM maintenance_cases WHERE room_id='room-h' ORDER BY id; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-h' AND event_type='MAINTENANCE_RESOLVE';" --json >"$tmp_dir/aba.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/aba.json')).flatMap(x=>x.results); if(r[0].status!=='MAINTENANCE'||r[1].id!=='case-h1'||r[1].status!=='RESOLVED'||r[2].id!=='case-h2'||r[2].status!=='OPEN'||r[3].events!==0) process.exit(1)"
curl -sS -o "$tmp_dir/race-resolve-a.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"case_id":"case-f","resolution_note":"Race resolver completed"}' "$base/housekeeping/room-f/dirty" >"$tmp_dir/race-resolve-a.status" & race_a=$!
curl -sS -o "$tmp_dir/race-resolve-b.json" -w '%{http_code}' "${common[@]}" -X POST -d '{"case_id":"case-f","resolution_note":"Race resolver completed"}' "$base/housekeeping/room-f/dirty" >"$tmp_dir/race-resolve-b.status" & race_b=$!
wait "$race_a" "$race_b"
node -e "const s=[require('fs').readFileSync('$tmp_dir/race-resolve-a.status','utf8'),require('fs').readFileSync('$tmp_dir/race-resolve-b.status','utf8')].sort(); if(s.join(',')!=='200,409') process.exit(1)"
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT id,status,return_status,reported_by_user_id,resolved_by_user_id,reason,reported_at,resolved_at FROM maintenance_cases WHERE room_id='room-d'; SELECT event_type,maintenance_case_id,actor_subject,request_id,hotel_id,details_json FROM housekeeping_events WHERE room_id='room-d' AND event_type='MAINTENANCE_RESOLVE'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id IN ('room-a','room-c','room-d') AND actor_subject='subject-a' AND hotel_id='hotel-a' AND request_id IS NOT NULL;" --json >"$tmp_dir/assertions.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/assertions.json')).flatMap(x=>x.results); const d=r[0],e=r[1]; const details=JSON.parse(e.details_json); if(d.status!=='RESOLVED'||d.return_status!=='DIRTY'||d.reported_by_user_id!=='subject-a'||d.resolved_by_user_id!=='subject-a'||d.reason!=='Legacy maintenance room without an opening case'||d.reported_at!==d.resolved_at||e.event_type!=='MAINTENANCE_RESOLVE'||e.maintenance_case_id!==d.id||e.actor_subject!=='subject-a'||!e.request_id||e.hotel_id!=='hotel-a'||details.legacy_recovery!==true||r[2].events<5) process.exit(1)"
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status,reported_by_user_id,resolved_by_user_id,return_status FROM maintenance_cases WHERE room_id='room-d'; SELECT status FROM rooms WHERE id='room-f'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE room_id='room-f' AND event_type='MAINTENANCE_RESOLVE';" --json >"$tmp_dir/race-resolve-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/race-resolve-db.json')).flatMap(x=>x.results); if(r[0].reported_by_user_id!=='subject-a'||r[0].resolved_by_user_id!=='subject-a'||r[0].return_status!=='DIRTY'||r[1].status!=='DIRTY'||r[2].events!==1) process.exit(1)"

# The final event trigger must roll back an invalid state transition entirely.
if serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "BEGIN; UPDATE rooms SET status='CLEANING' WHERE id='room-g' AND status='DIRTY'; INSERT INTO housekeeping_events (id,room_id,event_type,from_status,to_status,actor_subject,request_id,hotel_id,details_json,created_at) VALUES ('bad-transition','room-g','CLEANING_START','AVAILABLE','CLEANING','subject-a','bad-request','hotel-a','{}','2026-01-01'); COMMIT;" >/dev/null 2>&1; then echo "invalid transition unexpectedly committed" >&2; exit 1; fi
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status FROM rooms WHERE id='room-g'; SELECT COUNT(*) AS events FROM housekeeping_events WHERE id='bad-transition';" --json >"$tmp_dir/rollback.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/rollback.json')).flatMap(x=>x.results); if(r[0].status!=='DIRTY'||r[1].events!==0) process.exit(1)"

serialized_d1 CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='receptionist' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
status=$(request "$base/housekeeping/dirty"); assert_status "$status" 403
status=$(request -X POST "$base/housekeeping/room-a/start"); assert_status "$status" 403
status=$(request -X POST -d '{"resolution_note":"Reception resolve denied"}' "$base/housekeeping/room-d/dirty"); assert_status "$status" 403
status=$(curl -sS -o "$tmp_dir/cross-tenant.json" -w '%{http_code}' \
  -H 'x-local-access-subject: subject-a' -H 'x-local-access-email: a@example.test' \
  -H 'x-hotel-id: hotel-b' -H 'content-type: application/json' "$base/housekeeping/dirty"); assert_status "$status" 403
serialized_d1 HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "SELECT status, COUNT(*) AS events FROM rooms r LEFT JOIN housekeeping_events e ON e.room_id=r.id WHERE r.id='room-a' GROUP BY r.status;" --json >"$tmp_dir/tenant-denial-db.json"
node -e "const r=JSON.parse(require('fs').readFileSync('$tmp_dir/tenant-denial-db.json')).flatMap(x=>x.results)[0]; if(r.status!=='AVAILABLE'||r.events!==2) process.exit(1)"
serialized_d1 CONTROL_DB --local -c apps/api/wrangler.jsonc --command "UPDATE hotel_memberships SET role='housekeeping' WHERE access_subject='subject-a' AND hotel_id='hotel-a';" >/dev/null
status=$(request -X POST "$base/housekeeping/missing-room/start"); assert_status "$status" 404

stop_worker
echo "CF-I05 Housekeeping + Maintenance D1/API regression PASS"
