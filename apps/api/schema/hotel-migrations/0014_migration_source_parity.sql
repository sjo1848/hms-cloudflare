PRAGMA foreign_keys = ON;

-- Source HMS operational snapshots remain historical data after the runtime
-- transition. New target operations continue to use lifecycle_events, while
-- migration preserves the source checklist/exception record on the booking.
ALTER TABLE bookings ADD COLUMN check_in_reference TEXT;
ALTER TABLE bookings ADD COLUMN guest_name_snapshot TEXT;
ALTER TABLE bookings ADD COLUMN check_in_document_verified INTEGER CHECK (check_in_document_verified IN (0, 1));
ALTER TABLE bookings ADD COLUMN check_in_contact_confirmed INTEGER CHECK (check_in_contact_confirmed IN (0, 1));
ALTER TABLE bookings ADD COLUMN check_in_stay_confirmed INTEGER CHECK (check_in_stay_confirmed IN (0, 1));
ALTER TABLE bookings ADD COLUMN check_out_charges_reviewed INTEGER CHECK (check_out_charges_reviewed IN (0, 1));
ALTER TABLE bookings ADD COLUMN check_out_room_release_confirmed INTEGER CHECK (check_out_room_release_confirmed IN (0, 1));
ALTER TABLE bookings ADD COLUMN check_out_housekeeping_handoff INTEGER CHECK (check_out_housekeeping_handoff IN (0, 1));
ALTER TABLE bookings ADD COLUMN terminal_reason TEXT;
ALTER TABLE bookings ADD COLUMN terminal_recorded_at TEXT;
ALTER TABLE bookings ADD COLUMN terminal_recorded_by TEXT;
ALTER TABLE bookings ADD COLUMN late_arrival_eta TEXT;
ALTER TABLE bookings ADD COLUMN late_arrival_note TEXT;
ALTER TABLE bookings ADD COLUMN late_arrival_recorded_at TEXT;
ALTER TABLE bookings ADD COLUMN late_arrival_recorded_by TEXT;

CREATE TRIGGER IF NOT EXISTS bookings_migrated_snapshot_insert_guard
BEFORE INSERT ON bookings
BEGIN
  SELECT (CASE
    WHEN (NEW.terminal_reason IS NULL) <> (NEW.terminal_recorded_at IS NULL)
      OR (NEW.terminal_reason IS NULL) <> (NEW.terminal_recorded_by IS NULL)
    THEN RAISE(ABORT, 'incomplete terminal booking provenance')
  END);
  SELECT (CASE
    WHEN NEW.late_arrival_eta IS NOT NULL
      AND (NEW.late_arrival_note IS NULL OR NEW.late_arrival_recorded_at IS NULL OR NEW.late_arrival_recorded_by IS NULL)
    THEN RAISE(ABORT, 'incomplete late-arrival provenance')
  END);
END;

CREATE TABLE IF NOT EXISTS migration_rehearsals (
  rehearsal_id TEXT PRIMARY KEY,
  source_baseline TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'APPLIED')
);

CREATE TABLE IF NOT EXISTS migration_provenance (
  id TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  reason TEXT NOT NULL
);
