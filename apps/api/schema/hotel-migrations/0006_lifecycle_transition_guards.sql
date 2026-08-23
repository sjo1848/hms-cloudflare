ALTER TABLE lifecycle_events ADD COLUMN from_room_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lifecycle_events_checkin_once
  ON lifecycle_events (booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT');
CREATE UNIQUE INDEX IF NOT EXISTS idx_lifecycle_events_reassign_guard
  ON lifecycle_events (booking_id, event_type, from_room_id) WHERE event_type = 'REASSIGN';
