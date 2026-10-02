PRAGMA foreign_keys = ON;

-- F0.8 recoverable Reception guest + reservation creation. Tokens are scoped to
-- the selected hotel database; they are replay identity, never authorization.
CREATE TABLE reservation_creation_operations (
  operation_token TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
  guest_id TEXT NOT NULL,
  booking_id TEXT NOT NULL UNIQUE,
  guest_source TEXT NOT NULL CHECK (guest_source IN ('NEW', 'EXISTING')),
  stage TEXT NOT NULL CHECK (stage IN ('GUEST_CREATED', 'EXISTING_GUEST_SELECTED', 'BOOKING_CREATED')),
  room_id TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  created_by_subject TEXT NOT NULL,
  created_request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  booking_created_by_subject TEXT,
  booking_request_id TEXT,
  booking_created_at TEXT,
  CHECK (check_out > check_in),
  CHECK ((guest_source = 'NEW' AND stage IN ('GUEST_CREATED','BOOKING_CREATED'))
      OR (guest_source = 'EXISTING' AND stage IN ('EXISTING_GUEST_SELECTED','BOOKING_CREATED'))),
  CHECK ((stage = 'BOOKING_CREATED') = (booking_created_at IS NOT NULL)),
  CHECK ((stage = 'BOOKING_CREATED') = (booking_created_by_subject IS NOT NULL)),
  CHECK ((stage = 'BOOKING_CREATED') = (booking_request_id IS NOT NULL)),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE INDEX idx_reservation_creation_incomplete
  ON reservation_creation_operations(stage, created_at)
  WHERE stage <> 'BOOKING_CREATED';

CREATE TABLE reservation_creation_events (
  id TEXT PRIMARY KEY,
  operation_token TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('GUEST_CREATED', 'BOOKING_CREATED')),
  guest_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (operation_token, event_type),
  FOREIGN KEY (operation_token) REFERENCES reservation_creation_operations(operation_token),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE INDEX idx_reservation_creation_events_hotel_time
  ON reservation_creation_events(hotel_id, created_at);

-- Operation identity and original payload cannot be rewritten to bypass
-- changed-payload conflict or replace a staged guest/booking.
CREATE TRIGGER reservation_creation_identity_immutable
BEFORE UPDATE ON reservation_creation_operations
WHEN NEW.operation_token <> OLD.operation_token
  OR NEW.payload_hash <> OLD.payload_hash
  OR NEW.guest_id <> OLD.guest_id
  OR NEW.booking_id <> OLD.booking_id
  OR NEW.guest_source <> OLD.guest_source
  OR NEW.room_id <> OLD.room_id
  OR NEW.check_in <> OLD.check_in
  OR NEW.check_out <> OLD.check_out
  OR NEW.hotel_id <> OLD.hotel_id
  OR NEW.created_by_subject <> OLD.created_by_subject
  OR NEW.created_request_id <> OLD.created_request_id
  OR NEW.created_at <> OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'reservation creation identity is immutable');
END;

CREATE TRIGGER reservation_creation_completion_provenance_immutable
BEFORE UPDATE ON reservation_creation_operations
WHEN OLD.stage = 'BOOKING_CREATED'
  AND (NEW.booking_created_by_subject <> OLD.booking_created_by_subject
    OR NEW.booking_request_id <> OLD.booking_request_id
    OR NEW.booking_created_at <> OLD.booking_created_at)
BEGIN
  SELECT RAISE(ABORT, 'reservation completion provenance is immutable');
END;

CREATE TRIGGER reservation_creation_stage_guard
BEFORE UPDATE OF stage ON reservation_creation_operations
WHEN NEW.stage <> OLD.stage
BEGIN
  SELECT (CASE WHEN OLD.stage NOT IN ('GUEST_CREATED', 'EXISTING_GUEST_SELECTED')
    OR NEW.stage <> 'BOOKING_CREATED'
  THEN RAISE(ABORT, 'invalid reservation creation stage transition') END);

  -- The booking row, pricing segment and exact [check_in, check_out) inventory
  -- set must all exist before the durable operation can claim completion.
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = OLD.booking_id
      AND b.guest_id = OLD.guest_id
      AND b.room_id = OLD.room_id
      AND b.check_in = OLD.check_in
      AND b.check_out = OLD.check_out
      AND b.status = 'CONFIRMED'
      AND b.last_pricing_operation_token = 'reservation-create:' || OLD.booking_id
      AND (SELECT COUNT(*) FROM room_inventory_nights n WHERE n.booking_id = b.id)
        = CAST(julianday(b.check_out) - julianday(b.check_in) AS INTEGER)
      AND NOT EXISTS (
        SELECT 1 FROM room_inventory_nights n
        WHERE n.booking_id = b.id
          AND (n.room_id <> b.room_id OR n.stay_date < b.check_in OR n.stay_date >= b.check_out)
      )
      AND EXISTS (
        SELECT 1 FROM booking_pricing_segments s
        WHERE s.booking_id = b.id AND s.room_id = b.room_id
          AND s.effective_start = b.check_in AND s.effective_end = b.check_out
          AND s.operation_token = b.last_pricing_operation_token
          AND s.segment_version = b.pricing_version
      )
  ) THEN RAISE(ABORT, 'reservation creation completion lacks exact booking state') END);
END;

CREATE TRIGGER reservation_creation_event_guard
BEFORE INSERT ON reservation_creation_events
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM reservation_creation_operations o
    WHERE o.operation_token = NEW.operation_token
      AND o.guest_id = NEW.guest_id AND o.booking_id = NEW.booking_id
      AND o.hotel_id = NEW.hotel_id
      AND (
        (NEW.event_type = 'GUEST_CREATED' AND o.guest_source = 'NEW'
          AND o.stage IN ('GUEST_CREATED', 'BOOKING_CREATED')
          AND NEW.actor_subject = o.created_by_subject
          AND NEW.request_id = o.created_request_id
          AND NEW.created_at = o.created_at)
        OR
        (NEW.event_type = 'BOOKING_CREATED' AND o.stage = 'BOOKING_CREATED'
          AND NEW.actor_subject = o.booking_created_by_subject
          AND NEW.request_id = o.booking_request_id
          AND NEW.created_at = o.booking_created_at)
      )
  ) THEN RAISE(ABORT, 'reservation creation event lacks winning operation stage') END);
END;

CREATE TRIGGER reservation_creation_event_immutable_update
BEFORE UPDATE ON reservation_creation_events
BEGIN
  SELECT RAISE(ABORT, 'reservation creation events are immutable');
END;

CREATE TRIGGER reservation_creation_event_immutable_delete
BEFORE DELETE ON reservation_creation_events
BEGIN
  SELECT RAISE(ABORT, 'reservation creation events are immutable');
END;
