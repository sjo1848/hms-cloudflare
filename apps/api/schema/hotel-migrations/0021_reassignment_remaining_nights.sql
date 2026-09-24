-- V11 reassignment keeps elapsed room history and hands the old room to
-- housekeeping/maintenance instead of making it immediately sellable.
DROP TRIGGER IF EXISTS lifecycle_reassign_atomic_guard;

CREATE TRIGGER lifecycle_reassign_atomic_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1
    FROM bookings b
    JOIN rooms old_room ON old_room.id = NEW.from_room_id
    JOIN rooms new_room ON new_room.id = b.room_id
    WHERE b.id = NEW.booking_id
      AND b.status = 'CHECKED_IN'
      AND json_extract(NEW.details_json, '$.to_room_id') = b.room_id
      AND json_extract(NEW.details_json, '$.effective_date') IS NOT NULL
      AND new_room.status = 'OCCUPIED'
      AND old_room.status IN ('DIRTY', 'MAINTENANCE')
      AND NOT EXISTS (
        SELECT 1 FROM room_inventory_nights n
        WHERE n.booking_id = b.id
          AND n.room_id = NEW.from_room_id
          AND n.stay_date >= json_extract(NEW.details_json, '$.effective_date')
      )
      AND (
        SELECT COUNT(*) FROM room_inventory_nights n
        WHERE n.booking_id = b.id
          AND n.room_id = b.room_id
          AND n.stay_date >= json_extract(NEW.details_json, '$.effective_date')
          AND n.stay_date < b.check_out
      ) = CAST(julianday(b.check_out) - julianday(json_extract(NEW.details_json, '$.effective_date')) AS INTEGER)
      AND (
        b.total_cents = json_extract(NEW.details_json, '$.old_total_cents')
        OR EXISTS (
          SELECT 1 FROM financial_events f
          WHERE f.booking_id = b.id
            AND f.event_type = 'PRICE_RECONCILIATION'
            AND json_extract(f.details_json, '$.new_total_cents') = b.total_cents
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM room_holds h
        WHERE h.room_id = b.room_id
          AND h.start_date < b.check_out
          AND h.end_date > json_extract(NEW.details_json, '$.effective_date')
      )
  ) THEN RAISE(ABORT, 'reassignment atomic guard failed') END);
END;
