-- Audit history must not impose a lifetime room-history restriction. The
-- operation batches below provide the concurrency guard.
DROP INDEX IF EXISTS idx_lifecycle_events_reassign_guard;

CREATE TRIGGER IF NOT EXISTS lifecycle_checkout_atomic_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_OUT'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON r.id = b.room_id
    WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_OUT'
      AND r.id = NEW.from_room_id AND r.status = 'DIRTY'
  ) THEN RAISE(ABORT, 'checkout atomic guard failed') END;
END;

CREATE TRIGGER IF NOT EXISTS lifecycle_reassign_atomic_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN rooms old_room ON old_room.id = NEW.from_room_id
    JOIN rooms new_room ON new_room.id = b.room_id
    WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_IN'
      AND json_extract(NEW.details_json, '$.to_room_id') = b.room_id
      AND new_room.status = 'OCCUPIED' AND old_room.status = 'AVAILABLE'
      AND EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id = b.id AND n.room_id = b.room_id)
  ) THEN RAISE(ABORT, 'reassignment atomic guard failed') END;
END;
