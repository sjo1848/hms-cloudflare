PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS housekeeping_event_state_guard;
DROP INDEX IF EXISTS ux_maintenance_cases_open_room;
DROP INDEX IF EXISTS idx_maintenance_cases_room_status;
DROP INDEX IF EXISTS idx_housekeeping_events_room_created;

-- Rebuild the two tables so the forward migration can widen the historical
-- return-state contract and add the V11 impact/event values without editing
-- migration 0009.
ALTER TABLE housekeeping_events RENAME TO housekeeping_events_legacy_impact;
ALTER TABLE maintenance_cases RENAME TO maintenance_cases_legacy_impact;

CREATE TABLE maintenance_cases (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  impact TEXT NOT NULL DEFAULT 'NON_BLOCKING' CHECK (impact IN ('NON_BLOCKING', 'BLOCKING')),
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
    (status = 'RESOLVED' AND resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL AND resolved_at IS NOT NULL AND return_status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER'))
  )
);

INSERT INTO maintenance_cases (
  id, room_id, status, impact, priority, reason, assigned_to,
  reported_by_user_id, reported_at, resolution_note, resolved_by_user_id,
  resolved_at, return_status
)
SELECT
  old.id, old.room_id, old.status,
  CASE
    WHEN old.status = 'OPEN'
      AND EXISTS (SELECT 1 FROM rooms r WHERE r.id = old.room_id AND r.status = 'MAINTENANCE')
    THEN 'BLOCKING'
    ELSE 'NON_BLOCKING'
  END,
  old.priority, old.reason, old.assigned_to, old.reported_by_user_id,
  old.reported_at, old.resolution_note, old.resolved_by_user_id,
  old.resolved_at,
  CASE WHEN old.status = 'RESOLVED' THEN COALESCE(old.return_status, 'DIRTY') ELSE NULL END
FROM maintenance_cases_legacy_impact AS old;

CREATE UNIQUE INDEX ux_maintenance_cases_open_room
  ON maintenance_cases (room_id) WHERE status = 'OPEN';
CREATE INDEX idx_maintenance_cases_room_status
  ON maintenance_cases (room_id, status, reported_at);

CREATE TABLE housekeeping_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  maintenance_case_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('CLEANING_START', 'CLEANING_FINISH', 'MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE')),
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

INSERT INTO housekeeping_events
SELECT id, room_id, maintenance_case_id, event_type, from_status, to_status,
       actor_subject, request_id, hotel_id, details_json, created_at
FROM housekeeping_events_legacy_impact;

DROP TABLE housekeeping_events_legacy_impact;
DROP TABLE maintenance_cases_legacy_impact;

CREATE INDEX idx_housekeeping_events_room_created
  ON housekeeping_events (room_id, created_at);

CREATE TRIGGER housekeeping_event_state_guard
BEFORE INSERT ON housekeeping_events
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM rooms WHERE id = NEW.room_id AND status = NEW.to_status
  ) THEN RAISE(ABORT, 'housekeeping room transition guard failed') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_START' AND (NEW.from_status <> 'DIRTY' OR NEW.to_status <> 'CLEANING')
    THEN RAISE(ABORT, 'invalid cleaning start transition') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_FINISH' AND (NEW.from_status <> 'CLEANING' OR NEW.to_status <> 'AVAILABLE')
    THEN RAISE(ABORT, 'invalid cleaning finish transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_OPEN' AND NOT EXISTS (
    SELECT 1 FROM maintenance_cases c
    WHERE c.id = NEW.maintenance_case_id AND c.room_id = NEW.room_id AND c.status = 'OPEN'
      AND ((c.impact = 'BLOCKING' AND NEW.from_status IN ('AVAILABLE', 'DIRTY', 'CLEANING') AND NEW.to_status = 'MAINTENANCE')
        OR (NEW.from_status = 'OCCUPIED' AND NEW.to_status = 'OCCUPIED')
        OR (c.impact = 'NON_BLOCKING' AND NEW.from_status IN ('AVAILABLE', 'DIRTY', 'CLEANING') AND NEW.to_status = NEW.from_status))
  ) THEN RAISE(ABORT, 'invalid maintenance open transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_ESCALATE' AND NOT EXISTS (
    SELECT 1 FROM maintenance_cases c
    WHERE c.id = NEW.maintenance_case_id AND c.room_id = NEW.room_id AND c.status = 'OPEN' AND c.impact = 'BLOCKING'
      AND ((NEW.from_status = 'OCCUPIED' AND NEW.to_status = 'OCCUPIED')
        OR (NEW.from_status IN ('AVAILABLE', 'DIRTY', 'CLEANING') AND NEW.to_status = 'MAINTENANCE'))
  ) THEN RAISE(ABORT, 'invalid maintenance escalation transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_RESOLVE' AND NOT EXISTS (
    SELECT 1 FROM maintenance_cases c
    WHERE c.id = NEW.maintenance_case_id AND c.room_id = NEW.room_id AND c.status = 'RESOLVED' AND c.return_status = NEW.to_status
      AND ((NEW.from_status = 'OCCUPIED' AND NEW.to_status = 'OCCUPIED')
        OR (c.impact = 'BLOCKING' AND NEW.from_status = 'MAINTENANCE' AND NEW.to_status = 'DIRTY')
        OR (c.impact = 'NON_BLOCKING' AND NEW.from_status IN ('AVAILABLE', 'DIRTY', 'CLEANING') AND NEW.to_status = NEW.from_status))
  ) THEN RAISE(ABORT, 'invalid maintenance resolve transition') END);
END;

PRAGMA foreign_keys = ON;
