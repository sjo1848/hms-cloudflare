PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS maintenance_cases (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  reason TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  reported_by_user_id TEXT,
  reported_at TEXT NOT NULL,
  resolution_note TEXT,
  resolved_by_user_id TEXT,
  resolved_at TEXT,
  return_status TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  CHECK (
    (status = 'OPEN' AND resolution_note IS NULL AND resolved_by_user_id IS NULL AND resolved_at IS NULL AND return_status IS NULL)
    OR
    (status = 'RESOLVED' AND resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL AND resolved_at IS NOT NULL AND return_status = 'DIRTY')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_maintenance_cases_open_room
  ON maintenance_cases (room_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_maintenance_cases_room_status
  ON maintenance_cases (room_id, status, reported_at);

CREATE TABLE IF NOT EXISTS housekeeping_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  maintenance_case_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('CLEANING_START', 'CLEANING_FINISH', 'MAINTENANCE_OPEN', 'MAINTENANCE_RESOLVE')),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (maintenance_case_id) REFERENCES maintenance_cases(id)
);
CREATE INDEX IF NOT EXISTS idx_housekeeping_events_room_created
  ON housekeeping_events (room_id, created_at);

CREATE TRIGGER IF NOT EXISTS housekeeping_event_state_guard
BEFORE INSERT ON housekeeping_events
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM rooms WHERE id = NEW.room_id AND status = NEW.to_status
  ) THEN RAISE(ABORT, 'housekeeping room transition guard failed') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_START' AND (NEW.from_status <> 'DIRTY' OR NEW.to_status <> 'CLEANING')
    THEN RAISE(ABORT, 'invalid cleaning start transition') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_FINISH' AND (NEW.from_status <> 'CLEANING' OR NEW.to_status <> 'AVAILABLE')
    THEN RAISE(ABORT, 'invalid cleaning finish transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_OPEN' AND (NEW.to_status <> 'MAINTENANCE' OR NEW.maintenance_case_id IS NULL OR NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE id = NEW.maintenance_case_id AND room_id = NEW.room_id AND status = 'OPEN'))
    THEN RAISE(ABORT, 'invalid maintenance open transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_RESOLVE' AND (NEW.from_status <> 'MAINTENANCE' OR NEW.to_status <> 'DIRTY' OR NEW.maintenance_case_id IS NULL OR NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE id = NEW.maintenance_case_id AND room_id = NEW.room_id AND status = 'RESOLVED' AND return_status = 'DIRTY'))
    THEN RAISE(ABORT, 'invalid maintenance resolve transition') END);
END;
