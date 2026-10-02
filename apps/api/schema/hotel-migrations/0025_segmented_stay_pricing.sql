-- F0.5: append-only lodging pricing history. No existing booking is backfilled;
-- F0.6 owns the separately authorized active-stay bootstrap/classifier.
ALTER TABLE rooms ADD COLUMN pricing_version INTEGER NOT NULL DEFAULT 0 CHECK (pricing_version >= 0);
ALTER TABLE rooms ADD COLUMN inventory_version INTEGER NOT NULL DEFAULT 0 CHECK (inventory_version >= 0);
ALTER TABLE bookings ADD COLUMN pricing_version INTEGER NOT NULL DEFAULT 0 CHECK (pricing_version >= 0);
ALTER TABLE bookings ADD COLUMN last_pricing_operation_token TEXT;

CREATE TABLE booking_pricing_segments (
  segment_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  effective_start TEXT NOT NULL,
  effective_end TEXT NOT NULL,
  rate_cents INTEGER NOT NULL CHECK (rate_cents >= 0),
  room_pricing_version INTEGER NOT NULL CHECK (room_pricing_version >= 0),
  segment_version INTEGER NOT NULL CHECK (segment_version > 0),
  operation_token TEXT NOT NULL UNIQUE,
  actor_subject TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (effective_start < effective_end),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX idx_booking_pricing_segments_interval
  ON booking_pricing_segments(booking_id, effective_start, effective_end, created_at, segment_id);

CREATE TRIGGER booking_pricing_segment_insert_guard
BEFORE INSERT ON booking_pricing_segments
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON r.id=NEW.room_id
    WHERE b.id=NEW.booking_id AND b.room_id=NEW.room_id
      AND b.check_in<=NEW.effective_start AND NEW.effective_end<=b.check_out
      AND r.pricing_version=NEW.room_pricing_version
      AND b.last_pricing_operation_token=NEW.operation_token
      AND NEW.segment_version=b.pricing_version+1
  ) THEN RAISE(ABORT,'pricing segment source/version guard failed') END);
END;

CREATE TRIGGER booking_pricing_segment_version
AFTER INSERT ON booking_pricing_segments
BEGIN
  UPDATE bookings SET pricing_version=NEW.segment_version
  WHERE id=NEW.booking_id AND last_pricing_operation_token=NEW.operation_token;
END;

CREATE TRIGGER booking_pricing_segment_immutable_update
BEFORE UPDATE ON booking_pricing_segments
BEGIN
  SELECT RAISE(ABORT,'booking pricing segments are immutable');
END;

CREATE TRIGGER booking_pricing_segment_immutable_delete
BEFORE DELETE ON booking_pricing_segments
WHEN EXISTS (SELECT 1 FROM bookings WHERE id=OLD.booking_id)
BEGIN
  SELECT RAISE(ABORT,'booking pricing segments are immutable');
END;

CREATE TRIGGER room_inventory_priced_claim_guard
BEFORE INSERT ON room_inventory_nights
WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.id=NEW.booking_id AND b.last_pricing_operation_token IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM booking_pricing_segments s
    WHERE s.booking_id=NEW.booking_id AND s.room_id=NEW.room_id AND s.operation_token=(
      SELECT last_pricing_operation_token FROM bookings WHERE id=NEW.booking_id
    ))
BEGIN
  SELECT RAISE(ABORT,'booking inventory claim requires its pricing segment');
END;

CREATE TRIGGER room_pricing_version_advance
AFTER UPDATE OF price_cents ON rooms
WHEN NEW.price_cents<>OLD.price_cents
BEGIN
  UPDATE rooms SET pricing_version=OLD.pricing_version+1
  WHERE id=NEW.id AND pricing_version=OLD.pricing_version;
END;

CREATE TRIGGER room_inventory_version_insert
AFTER INSERT ON room_inventory_nights
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=NEW.room_id;
END;

CREATE TRIGGER room_inventory_version_delete
AFTER DELETE ON room_inventory_nights
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=OLD.room_id;
END;

CREATE TRIGGER room_inventory_version_update
AFTER UPDATE OF room_id,stay_date ON room_inventory_nights
WHEN NEW.room_id<>OLD.room_id OR NEW.stay_date<>OLD.stay_date
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=OLD.room_id;
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=NEW.room_id AND NEW.room_id<>OLD.room_id;
END;

CREATE TRIGGER room_hold_inventory_version_insert
AFTER INSERT ON room_holds
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=NEW.room_id;
END;

CREATE TRIGGER room_hold_inventory_version_delete
AFTER DELETE ON room_holds
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=OLD.room_id;
END;

CREATE TRIGGER room_hold_inventory_version_update
AFTER UPDATE OF room_id,start_date,end_date ON room_holds
WHEN NEW.room_id<>OLD.room_id OR NEW.start_date<>OLD.start_date OR NEW.end_date<>OLD.end_date
BEGIN
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=OLD.room_id;
  UPDATE rooms SET inventory_version=inventory_version+1 WHERE id=NEW.room_id AND NEW.room_id<>OLD.room_id;
END;

-- F0.4 required total preservation. F0.5 replaces it with a correlated D11
-- reconciliation-event guard; inventory/room/date/version guards remain intact.
DROP TRIGGER IF EXISTS lifecycle_reassign_total_guard;
CREATE TRIGGER lifecycle_reassign_total_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type='REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id=NEW.booking_id
      AND b.total_cents=CAST(json_extract(NEW.details_json,'$.new_total_cents') AS INTEGER)
      AND b.last_reassignment_token=json_extract(NEW.details_json,'$.operation_token')
      AND EXISTS (
        SELECT 1 FROM financial_events f
        WHERE f.booking_id=b.id AND f.event_type='PRICE_RECONCILIATION'
          AND json_extract(f.details_json,'$.operation_token')=json_extract(NEW.details_json,'$.operation_token')
          AND CAST(json_extract(f.details_json,'$.old_total_cents') AS INTEGER)=CAST(json_extract(NEW.details_json,'$.old_total_cents') AS INTEGER)
          AND CAST(json_extract(f.details_json,'$.new_total_cents') AS INTEGER)=b.total_cents
      )
      AND CAST(json_extract(NEW.details_json,'$.old_total_cents') AS INTEGER)>=0
  ) THEN RAISE(ABORT,'reassignment price reconciliation event guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_inventory_version_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type='REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b JOIN rooms old_room ON old_room.id=NEW.from_room_id JOIN rooms new_room ON new_room.id=b.room_id
    WHERE b.id=NEW.booking_id
      AND old_room.inventory_version=CAST(json_extract(NEW.details_json,'$.old_inventory_version_after') AS INTEGER)
      AND new_room.inventory_version=CAST(json_extract(NEW.details_json,'$.new_inventory_version_after') AS INTEGER)
      AND CAST(json_extract(NEW.details_json,'$.old_inventory_version_after') AS INTEGER)
        =CAST(json_extract(NEW.details_json,'$.old_inventory_version_before') AS INTEGER)
          +CAST(julianday((SELECT check_out FROM bookings WHERE id=NEW.booking_id))-julianday(json_extract(NEW.details_json,'$.effective_date')) AS INTEGER)
      AND CAST(json_extract(NEW.details_json,'$.new_inventory_version_after') AS INTEGER)
        =CAST(json_extract(NEW.details_json,'$.new_inventory_version_before') AS INTEGER)
          +CAST(julianday((SELECT check_out FROM bookings WHERE id=NEW.booking_id))-julianday(json_extract(NEW.details_json,'$.effective_date')) AS INTEGER)
  ) THEN RAISE(ABORT,'reassignment inventory generation guard failed') END);
END;

CREATE TRIGGER price_reconciliation_event_guard
BEFORE INSERT ON financial_events
WHEN NEW.event_type='PRICE_RECONCILIATION'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id=NEW.booking_id
      AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=b.id AND (
        i.status='VOIDED' OR i.paid_amount_cents<>(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)
      ))
      AND (
        (
          json_extract(NEW.details_json,'$.reason')='EXTRA_CHARGE'
          AND b.total_cents=CAST(json_extract(NEW.details_json,'$.new_amount_cents') AS INTEGER)
          AND CAST(json_extract(NEW.details_json,'$.new_amount_cents') AS INTEGER)
            >CAST(json_extract(NEW.details_json,'$.old_amount_cents') AS INTEGER)
          AND EXISTS (SELECT 1 FROM financial_events e
            WHERE e.id=json_extract(NEW.details_json,'$.cause_event_id')
              AND e.booking_id=b.id AND e.event_type='EXTRA_CHARGE'
              AND e.actor_subject=NEW.actor_subject AND e.request_id=NEW.request_id AND e.hotel_id=NEW.hotel_id
              AND CAST(json_extract(e.details_json,'$.amount_cents') AS INTEGER)
                =CAST(json_extract(NEW.details_json,'$.new_amount_cents') AS INTEGER)
                  -CAST(json_extract(NEW.details_json,'$.old_amount_cents') AS INTEGER)
              AND EXISTS (SELECT 1 FROM extra_charges c
                WHERE c.id=json_extract(NEW.details_json,'$.charge_id')
                  AND c.booking_id=b.id
                  AND c.amount_cents=CAST(json_extract(e.details_json,'$.amount_cents') AS INTEGER)))
          AND NOT EXISTS (SELECT 1 FROM financial_events prior
            WHERE prior.event_type='PRICE_RECONCILIATION'
              AND (json_extract(prior.details_json,'$.cause_event_id')=json_extract(NEW.details_json,'$.cause_event_id')
                OR json_extract(prior.details_json,'$.charge_id')=json_extract(NEW.details_json,'$.charge_id')))
        )
        OR
        (
          b.status='CHECKED_IN'
          AND b.last_reassignment_token=json_extract(NEW.details_json,'$.operation_token')
          AND b.total_cents=CAST(json_extract(NEW.details_json,'$.new_total_cents') AS INTEGER)
          AND CAST(json_extract(NEW.details_json,'$.old_total_cents') AS INTEGER)>=0
          AND EXISTS (SELECT 1 FROM booking_pricing_segments s
            WHERE s.booking_id=b.id AND s.operation_token=json_extract(NEW.details_json,'$.operation_token'))
        )
      )
  ) THEN RAISE(ABORT,'price reconciliation event has no winning operation') END);
END;
