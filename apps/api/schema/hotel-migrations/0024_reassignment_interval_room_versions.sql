-- F0.4: bind remaining-night reassignment to the authoritative local-date
-- interval and the shared monotonic room-state versions. No backfill occurs.
ALTER TABLE bookings ADD COLUMN last_reassignment_token TEXT;

DROP TRIGGER IF EXISTS lifecycle_reassign_atomic_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_identity_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_date_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_history_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_version_pair_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_total_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_room_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_maintenance_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_inventory_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_billing_guard;

-- A room-state version may be consumed by at most one REASSIGN event. This is
-- the durable exact-winner barrier when concurrent batches share a snapshot.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reassign_source_version_winner
ON lifecycle_events (
  from_room_id,
  CAST(json_extract(details_json,'$.old_room_version_after') AS INTEGER)
)
WHERE event_type='REASSIGN' AND json_extract(details_json,'$.old_room_version_after') IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reassign_destination_version_winner
ON lifecycle_events (
  json_extract(details_json,'$.to_room_id'),
  CAST(json_extract(details_json,'$.new_room_version_after') AS INTEGER)
)
WHERE event_type='REASSIGN' AND json_extract(details_json,'$.new_room_version_after') IS NOT NULL;

-- Wrangler's local D1 SQLite parser reports incomplete input for scalar CASE
-- expressions inside trigger predicates. Keep each guard independently
-- fail-closed and express those predicates with equivalent boolean branches.
CREATE TRIGGER lifecycle_reassign_identity_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.id=NEW.booking_id AND b.status='CHECKED_IN'
      AND b.room_id=json_extract(NEW.details_json,'$.to_room_id')
      AND b.last_reassignment_token=json_extract(NEW.details_json,'$.operation_token')
      AND NEW.from_room_id=json_extract(NEW.details_json,'$.from_room_id') AND b.room_id<>NEW.from_room_id
  ) THEN RAISE(ABORT,'reassignment booking identity guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_date_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.id=NEW.booking_id AND b.check_out>json_extract(NEW.details_json,'$.hotel_local_date')
      AND length(trim(COALESCE(json_extract(NEW.details_json,'$.reason'),''))) BETWEEN 6 AND 250
      AND (
        (b.check_in>json_extract(NEW.details_json,'$.hotel_local_date')
          AND json_extract(NEW.details_json,'$.effective_date')=b.check_in)
        OR
        (b.check_in<=json_extract(NEW.details_json,'$.hotel_local_date')
          AND json_extract(NEW.details_json,'$.effective_date')=json_extract(NEW.details_json,'$.hotel_local_date'))
      )
  ) THEN RAISE(ABORT,'reassignment date/reason guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_history_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.id=NEW.booking_id
      AND json_extract(NEW.details_json,'$.assignment_start_date')=COALESCE((
        SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
        WHERE e.booking_id=b.id AND e.event_type='REASSIGN'
          AND json_extract(e.details_json,'$.to_room_id')=NEW.from_room_id
        ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),b.check_in)
  ) THEN RAISE(ABORT,'reassignment assignment-history guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_version_pair_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM lifecycle_events e
    WHERE e.event_type='REASSIGN'
      AND e.from_room_id=NEW.from_room_id
      AND json_extract(e.details_json,'$.to_room_id')=json_extract(NEW.details_json,'$.to_room_id')
      AND CAST(json_extract(e.details_json,'$.old_room_version_after') AS INTEGER)=CAST(json_extract(NEW.details_json,'$.old_room_version_after') AS INTEGER)
      AND CAST(json_extract(e.details_json,'$.new_room_version_after') AS INTEGER)=CAST(json_extract(NEW.details_json,'$.new_room_version_after') AS INTEGER)
  ) THEN RAISE(ABORT,'reassignment room-version winner already recorded') END);
END;

CREATE TRIGGER lifecycle_reassign_total_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.id=NEW.booking_id
      AND b.total_cents=CAST(json_extract(NEW.details_json,'$.old_total_cents') AS INTEGER)
      AND b.total_cents=CAST(json_extract(NEW.details_json,'$.new_total_cents') AS INTEGER)
  ) THEN RAISE(ABORT,'reassignment total-preservation guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_room_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN rooms old_room ON old_room.id=NEW.from_room_id
    JOIN rooms new_room ON new_room.id=b.room_id
    WHERE b.id=NEW.booking_id AND b.status='CHECKED_IN'
      AND (
        (EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
          AND old_room.status='MAINTENANCE')
        OR
        (NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
          AND old_room.service_state='OUT_OF_ORDER' AND old_room.status='OUT_OF_ORDER')
        OR
        (NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
          AND (old_room.service_state IS NULL OR old_room.service_state<>'OUT_OF_ORDER') AND old_room.status='DIRTY')
      )
      AND old_room.housekeeping_state='DIRTY'
      AND CAST(json_extract(NEW.details_json,'$.old_room_version_after') AS INTEGER)=old_room.room_state_version
      AND CAST(json_extract(NEW.details_json,'$.old_room_version_before') AS INTEGER)+1=old_room.room_state_version
      AND json_extract(NEW.details_json,'$.old_occupancy_before')='OCCUPIED'
      AND json_extract(NEW.details_json,'$.old_occupancy_after')='VACANT'
      AND (json_extract(NEW.details_json,'$.old_housekeeping_state_before') IS NULL
        OR json_extract(NEW.details_json,'$.old_housekeeping_state_before') IN ('READY','DIRTY','CLEANING'))
      AND json_extract(NEW.details_json,'$.old_housekeeping_state_after')='DIRTY'
      AND (json_extract(NEW.details_json,'$.old_service_state_before') IS NULL
        OR json_extract(NEW.details_json,'$.old_service_state_before') IN ('IN_SERVICE','OUT_OF_ORDER'))
      AND old_room.service_state IS json_extract(NEW.details_json,'$.old_service_state_after')
      AND old_room.service_state IS json_extract(NEW.details_json,'$.old_service_state_before')
      AND new_room.status='OCCUPIED' AND new_room.housekeeping_state='READY' AND new_room.service_state='IN_SERVICE'
      AND CAST(json_extract(NEW.details_json,'$.new_room_version_after') AS INTEGER)=new_room.room_state_version
      AND CAST(json_extract(NEW.details_json,'$.new_room_version_before') AS INTEGER)+1=new_room.room_state_version
      AND json_extract(NEW.details_json,'$.new_occupancy_before')='VACANT'
      AND json_extract(NEW.details_json,'$.new_occupancy_after')='OCCUPIED'
      AND json_extract(NEW.details_json,'$.new_housekeeping_state_before')=new_room.housekeeping_state
      AND json_extract(NEW.details_json,'$.new_housekeeping_state_after')=new_room.housekeeping_state
      AND json_extract(NEW.details_json,'$.new_service_state_before')=new_room.service_state
      AND json_extract(NEW.details_json,'$.new_service_state_after')=new_room.service_state
      AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id=old_room.id AND active.status='CHECKED_IN')=0
      AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id=new_room.id AND active.status='CHECKED_IN')=1
  ) THEN RAISE(ABORT,'reassignment room dimension/version guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_maintenance_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN rooms old_room ON old_room.id=NEW.from_room_id
    JOIN rooms new_room ON new_room.id=b.room_id
    WHERE b.id=NEW.booking_id AND b.status='CHECKED_IN'
      AND (
        (json_extract(NEW.details_json,'$.old_maintenance_impact_after')='BLOCKING'
          AND EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING'))
        OR
        (json_extract(NEW.details_json,'$.old_maintenance_impact_after')='NON_BLOCKING'
          AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
          AND EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING'))
        OR
        (json_extract(NEW.details_json,'$.old_maintenance_impact_after')='NONE'
          AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN'))
      )
      AND json_extract(NEW.details_json,'$.old_maintenance_impact_before')=json_extract(NEW.details_json,'$.old_maintenance_impact_after')
      AND (
        (json_extract(NEW.details_json,'$.new_maintenance_impact_before')='BLOCKING'
          AND EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=new_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING'))
        OR
        (json_extract(NEW.details_json,'$.new_maintenance_impact_before')='NON_BLOCKING'
          AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=new_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
          AND EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=new_room.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING'))
        OR
        (json_extract(NEW.details_json,'$.new_maintenance_impact_before')='NONE'
          AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=new_room.id AND mc.status='OPEN'))
      )
      AND json_extract(NEW.details_json,'$.new_maintenance_impact_after')=json_extract(NEW.details_json,'$.new_maintenance_impact_before')
      AND json_extract(NEW.details_json,'$.new_maintenance_impact_before') IN ('NONE','NON_BLOCKING')
      AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=new_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
  ) THEN RAISE(ABORT,'reassignment maintenance guard failed') END);
END;

CREATE TRIGGER lifecycle_reassign_inventory_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN (
    SELECT COUNT(*) FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id=NEW.from_room_id
      AND n.stay_date>=json_extract(NEW.details_json,'$.assignment_start_date')
      AND n.stay_date<json_extract(NEW.details_json,'$.effective_date')
  ) <> CAST(julianday(json_extract(NEW.details_json,'$.effective_date'))-julianday(json_extract(NEW.details_json,'$.assignment_start_date')) AS INTEGER)
    THEN RAISE(ABORT,'reassignment elapsed claim set mismatch') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id=NEW.from_room_id
      AND n.stay_date>=json_extract(NEW.details_json,'$.assignment_start_date')
      AND n.stay_date<json_extract(NEW.details_json,'$.effective_date')
      AND NOT EXISTS (SELECT 1 FROM json_each(json_extract(NEW.details_json,'$.expected_elapsed_claim_dates')) expected WHERE expected.value=n.stay_date)
  ) OR EXISTS (
    SELECT 1 FROM json_each(json_extract(NEW.details_json,'$.expected_elapsed_claim_dates')) expected
    WHERE NOT EXISTS (SELECT 1 FROM room_inventory_nights n
      WHERE n.booking_id=NEW.booking_id AND n.room_id=NEW.from_room_id AND n.stay_date=expected.value)
  ) THEN RAISE(ABORT,'reassignment elapsed claim dates mismatch') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id=NEW.from_room_id
      AND n.stay_date>=json_extract(NEW.details_json,'$.effective_date')
      AND n.stay_date<(SELECT check_out FROM bookings WHERE id=NEW.booking_id)
  ) THEN RAISE(ABORT,'reassignment old remaining claims remain') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id<>NEW.from_room_id
      AND n.stay_date>=json_extract(NEW.details_json,'$.assignment_start_date')
      AND n.stay_date<(SELECT check_out FROM bookings WHERE id=NEW.booking_id)
      AND n.room_id<>json_extract(NEW.details_json,'$.to_room_id')
  ) THEN RAISE(ABORT,'reassignment stray active claims exist') END);

  SELECT (CASE WHEN (
    SELECT COUNT(*) FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id=json_extract(NEW.details_json,'$.to_room_id')
      AND n.stay_date>=json_extract(NEW.details_json,'$.effective_date')
      AND n.stay_date<(SELECT check_out FROM bookings WHERE id=NEW.booking_id)
  ) <> CAST(julianday((SELECT check_out FROM bookings WHERE id=NEW.booking_id))-julianday(json_extract(NEW.details_json,'$.effective_date')) AS INTEGER)
    THEN RAISE(ABORT,'reassignment destination claim set mismatch') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM room_inventory_nights n
    WHERE n.booking_id=NEW.booking_id AND n.room_id=json_extract(NEW.details_json,'$.to_room_id')
      AND n.stay_date>=json_extract(NEW.details_json,'$.effective_date')
      AND n.stay_date<(SELECT check_out FROM bookings WHERE id=NEW.booking_id)
      AND NOT EXISTS (SELECT 1 FROM json_each(json_extract(NEW.details_json,'$.expected_remaining_claim_dates')) expected WHERE expected.value=n.stay_date)
  ) OR EXISTS (
    SELECT 1 FROM json_each(json_extract(NEW.details_json,'$.expected_remaining_claim_dates')) expected
    WHERE NOT EXISTS (SELECT 1 FROM room_inventory_nights n
      WHERE n.booking_id=NEW.booking_id AND n.room_id=json_extract(NEW.details_json,'$.to_room_id') AND n.stay_date=expected.value)
  ) THEN RAISE(ABORT,'reassignment destination claim dates mismatch') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM room_holds h
    WHERE h.room_id=json_extract(NEW.details_json,'$.to_room_id')
      AND h.start_date<(SELECT check_out FROM bookings WHERE id=NEW.booking_id)
      AND h.end_date>json_extract(NEW.details_json,'$.effective_date')
  ) THEN RAISE(ABORT,'reassignment destination hold conflict') END);
END;

CREATE TRIGGER lifecycle_reassign_billing_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'REASSIGN'
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM invoices i WHERE i.booking_id=NEW.booking_id AND (
      i.status='VOIDED' OR i.paid_amount_cents<>(
        SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id
      )
    )
  ) THEN RAISE(ABORT,'reassignment billing eligibility changed') END);
END;
