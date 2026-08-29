#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
wrangler=${1:-$repo_dir/node_modules/.bin/wrangler}
log_file=${2:-/dev/null}

CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c "$repo_dir/apps/api/wrangler.jsonc" --command "
  DELETE FROM room_inventory_nights WHERE room_id LIKE 'integral-%';
  DELETE FROM housekeeping_events WHERE room_id LIKE 'integral-%';
  DELETE FROM maintenance_cases WHERE room_id LIKE 'integral-%';
  DELETE FROM room_holds WHERE room_id LIKE 'integral-%';
  DELETE FROM bookings WHERE id LIKE 'integral-%';
  DELETE FROM guests WHERE id LIKE 'integral-%';
  DELETE FROM rooms WHERE id LIKE 'integral-%';

  INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('integral-dirty','951','STANDARD','DIRTY',10100),
    ('integral-cleaning','952','STANDARD','CLEANING',10200),
    ('integral-ready-a','953','STANDARD','AVAILABLE',10300),
    ('integral-maintenance','954','STANDARD','MAINTENANCE',10400),
    ('integral-ready-b','955','STANDARD','AVAILABLE',10500),
    ('integral-occupied','956','STANDARD','OCCUPIED',10600),
    ('integral-hold','957','STANDARD','AVAILABLE',10700),
    ('integral-life-a','958','STANDARD','AVAILABLE',10800),
    ('integral-report','959','STANDARD','AVAILABLE',10900);

  INSERT INTO maintenance_cases
    (id,room_id,status,priority,reason,assigned_to,reported_by_user_id,reported_at)
  VALUES
    ('integral-maintenance-case','integral-maintenance','OPEN','HIGH','Integral fixture maintenance','ops','subject-admin','2026-08-28T00:00:00Z');

  INSERT INTO guests (id,full_name,email,created_at)
  VALUES ('integral-report-guest','Integral Report Guest','integral-report@example.test','2026-08-28T00:00:00Z');

  INSERT INTO bookings
    (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at)
  VALUES
    ('integral-report-booking','integral-report-guest','integral-report','2026-09-02','2026-09-04','CONFIRMED',21800,'2026-08-28T00:00:00Z','2026-08-28T00:00:00Z');

  INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES
    ('integral-report','2026-09-02','integral-report-booking'),
    ('integral-report','2026-09-03','integral-report-booking');
" >>"$log_file" 2>&1
