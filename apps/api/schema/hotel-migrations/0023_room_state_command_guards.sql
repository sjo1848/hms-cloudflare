-- F0.2: bind shared room commands/events to a monotonic state version and
-- independent room dimensions. Legacy rooms.status remains compatibility-only.
ALTER TABLE rooms ADD COLUMN room_state_version INTEGER NOT NULL DEFAULT 0 CHECK (room_state_version >= 0);

DROP TRIGGER IF EXISTS lifecycle_checkout_atomic_guard;
DROP TRIGGER IF EXISTS housekeeping_event_state_guard;

CREATE TRIGGER lifecycle_checkin_state_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_IN'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON r.id = b.room_id
    WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_IN' AND r.id = NEW.from_room_id
      AND r.status = 'OCCUPIED' AND r.housekeeping_state = 'READY'
      AND r.service_state = 'IN_SERVICE'
      AND json_extract(NEW.details_json, '$.occupancy_before') = 'VACANT'
      AND json_extract(NEW.details_json, '$.occupancy_after') = 'OCCUPIED'
      AND json_extract(NEW.details_json, '$.housekeeping_state_before') = r.housekeeping_state
      AND json_extract(NEW.details_json, '$.housekeeping_state_after') = r.housekeeping_state
      AND json_extract(NEW.details_json, '$.service_state_before') = r.service_state
      AND json_extract(NEW.details_json, '$.service_state_after') = r.service_state
      AND json_extract(NEW.details_json, '$.maintenance_impact_before') = CASE WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') THEN 'NON_BLOCKING' ELSE 'NONE' END
      AND json_extract(NEW.details_json, '$.maintenance_impact_after') = json_extract(NEW.details_json, '$.maintenance_impact_before')
      AND r.room_state_version = CAST(json_extract(NEW.details_json, '$.room_state_version_after') AS INTEGER)
      AND CAST(json_extract(NEW.details_json, '$.room_state_version_before') AS INTEGER) + 1 = r.room_state_version
      AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN' AND mc.impact = 'BLOCKING')
      AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id = r.id AND active.status = 'CHECKED_IN') = 1
  ) THEN RAISE(ABORT, 'check-in room dimension guard failed') END;
END;

CREATE TRIGGER lifecycle_checkout_atomic_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_OUT'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON r.id = b.room_id
    WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_OUT' AND r.id = NEW.from_room_id
      AND r.housekeeping_state = 'DIRTY'
      AND json_extract(NEW.details_json, '$.occupancy_before') = 'OCCUPIED'
      AND json_extract(NEW.details_json, '$.occupancy_after') = 'VACANT'
      AND json_extract(NEW.details_json, '$.housekeeping_state_after') = 'DIRTY'
      AND r.room_state_version = CAST(json_extract(NEW.details_json, '$.room_state_version_after') AS INTEGER)
      AND CAST(json_extract(NEW.details_json, '$.room_state_version_before') AS INTEGER) + 1 = r.room_state_version
      AND COALESCE(r.service_state, '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_before'), '__UNRESOLVED__')
      AND COALESCE(r.service_state, '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_after'), '__UNRESOLVED__')
      AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id = r.id AND active.status = 'CHECKED_IN') = 0
      AND (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN') = CAST(json_extract(NEW.details_json, '$.maintenance_open_case_count_before') AS INTEGER)
      AND CAST(json_extract(NEW.details_json, '$.maintenance_open_case_count_before') AS INTEGER) = CAST(json_extract(NEW.details_json, '$.maintenance_open_case_count_after') AS INTEGER)
  ) THEN RAISE(ABORT, 'checkout room dimension guard failed') END;
END;

CREATE TRIGGER housekeeping_event_state_guard
BEFORE INSERT ON housekeeping_events
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = NEW.room_id AND r.status = NEW.to_status
      AND r.room_state_version = CAST(json_extract(NEW.details_json, '$.room_state_version_after') AS INTEGER)
      AND CAST(json_extract(NEW.details_json, '$.room_state_version_before') AS INTEGER) + 1 = r.room_state_version
  ) THEN RAISE(ABORT, 'room command version guard failed') END;

  SELECT CASE WHEN NEW.event_type = 'CLEANING_START' AND NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = NEW.room_id AND NEW.from_status = 'DIRTY' AND NEW.to_status = 'CLEANING'
      AND r.housekeeping_state = 'CLEANING'
      AND json_extract(NEW.details_json, '$.occupancy_before') = 'VACANT'
      AND json_extract(NEW.details_json, '$.occupancy_after') = 'VACANT'
      AND (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN') = 0
      AND COALESCE(r.service_state, '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_after'), '__UNRESOLVED__')
      AND COALESCE(json_extract(NEW.details_json, '$.service_state_before'), '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_after'), '__UNRESOLVED__')
      AND CAST(json_extract(NEW.details_json, '$.maintenance_open_case_count') AS INTEGER) = (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN')
      AND json_extract(NEW.details_json, '$.maintenance_impact_before') = json_extract(NEW.details_json, '$.maintenance_impact_after')
      AND json_extract(NEW.details_json, '$.maintenance_impact_after') = CASE
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='BLOCKING') THEN 'BLOCKING'
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') THEN 'NON_BLOCKING'
        ELSE 'NONE' END
  ) THEN RAISE(ABORT, 'invalid cleaning start dimensions') END;

  SELECT CASE WHEN NEW.event_type = 'CLEANING_FINISH' AND NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = NEW.room_id AND NEW.from_status = 'CLEANING' AND NEW.to_status IN ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_ORDER')
      AND r.housekeeping_state = 'READY'
      AND json_extract(NEW.details_json, '$.occupancy_before') = 'VACANT'
      AND json_extract(NEW.details_json, '$.occupancy_after') = 'VACANT'
      AND (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN') = 0
      AND COALESCE(r.service_state, '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_after'), '__UNRESOLVED__')
      AND COALESCE(json_extract(NEW.details_json, '$.service_state_before'), '__UNRESOLVED__') = COALESCE(json_extract(NEW.details_json, '$.service_state_after'), '__UNRESOLVED__')
      AND CAST(json_extract(NEW.details_json, '$.maintenance_open_case_count') AS INTEGER) = (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN')
      AND json_extract(NEW.details_json, '$.maintenance_impact_before') = json_extract(NEW.details_json, '$.maintenance_impact_after')
      AND json_extract(NEW.details_json, '$.maintenance_impact_after') = CASE
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='BLOCKING') THEN 'BLOCKING'
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') THEN 'NON_BLOCKING'
        ELSE 'NONE' END
  ) THEN RAISE(ABORT, 'invalid cleaning finish dimensions') END;

  SELECT CASE WHEN NEW.event_type IN ('MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE') AND NOT EXISTS (
    SELECT 1 FROM maintenance_cases mc WHERE mc.id = NEW.maintenance_case_id AND mc.room_id = NEW.room_id
      AND ((NEW.event_type = 'MAINTENANCE_OPEN' AND mc.status = 'OPEN' AND mc.impact = json_extract(NEW.details_json, '$.impact'))
        OR (NEW.event_type = 'MAINTENANCE_ESCALATE' AND mc.status = 'OPEN' AND mc.impact = 'BLOCKING' AND json_extract(NEW.details_json, '$.impact_after') = 'BLOCKING')
        OR (NEW.event_type = 'MAINTENANCE_RESOLVE' AND mc.status = 'RESOLVED' AND mc.return_status = NEW.to_status))
  ) THEN RAISE(ABORT, 'maintenance case identity guard failed') END;

  SELECT CASE WHEN NEW.event_type IN ('MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE') AND NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.id=NEW.room_id
      AND r.housekeeping_state IS json_extract(NEW.details_json, '$.housekeeping_state_after')
      AND r.service_state IS json_extract(NEW.details_json, '$.service_state_after')
      AND json_extract(NEW.details_json, '$.occupancy_before') = CASE
        WHEN (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN')=0 THEN 'VACANT'
        WHEN (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN')=1 THEN 'OCCUPIED'
        ELSE 'UNRESOLVED' END
      AND json_extract(NEW.details_json, '$.occupancy_after') = CASE
        WHEN (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN')=0 THEN 'VACANT'
        WHEN (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='CHECKED_IN')=1 THEN 'OCCUPIED'
        ELSE 'UNRESOLVED' END
      AND json_extract(NEW.details_json, '$.maintenance_impact_after') = CASE
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='BLOCKING') THEN 'BLOCKING'
        WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') THEN 'NON_BLOCKING'
        ELSE 'NONE' END
  ) THEN RAISE(ABORT, 'maintenance changed an unrelated room dimension') END;
END;
