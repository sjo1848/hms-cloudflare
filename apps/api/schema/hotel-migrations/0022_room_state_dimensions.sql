-- Foundation 0.1: additive canonical room dimensions.
-- Existing rows are intentionally left NULL until F0.3's evidence-backed
-- synthetic mapping/reconciliation. NULL is unresolved, never READY.
ALTER TABLE rooms ADD COLUMN housekeeping_state TEXT
  CHECK (housekeeping_state IS NULL OR housekeeping_state IN ('READY', 'DIRTY', 'CLEANING'));

ALTER TABLE rooms ADD COLUMN service_state TEXT
  CHECK (service_state IS NULL OR service_state IN ('IN_SERVICE', 'OUT_OF_ORDER'));

CREATE INDEX idx_rooms_housekeeping_state ON rooms(housekeeping_state, room_number);
CREATE INDEX idx_rooms_service_state ON rooms(service_state, room_number);
