-- F0.9: durable booking-scoped identity for retry-safe extra charges.
-- Historical rows intentionally remain NULL; do not fabricate prior tokens.
ALTER TABLE extra_charges ADD COLUMN operation_token TEXT;

CREATE UNIQUE INDEX idx_extra_charges_booking_operation_token
  ON extra_charges(booking_id, operation_token)
  WHERE operation_token IS NOT NULL;

CREATE TRIGGER extra_charge_operation_token_validate
BEFORE INSERT ON extra_charges
WHEN NEW.operation_token IS NOT NULL
  AND (length(trim(NEW.operation_token)) < 8 OR length(trim(NEW.operation_token)) > 120)
BEGIN
  SELECT RAISE(ABORT, 'extra charge operation token is invalid');
END;

-- Legacy charges cannot later be relabeled as a newly submitted operation.
CREATE TRIGGER extra_charge_legacy_identity_immutable
BEFORE UPDATE OF operation_token ON extra_charges
WHEN OLD.operation_token IS NULL AND NEW.operation_token IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'legacy extra charge operation identity is immutable');
END;

-- A token is the permanent identity of its exact persisted charge payload.
CREATE TRIGGER extra_charge_operation_immutable
BEFORE UPDATE ON extra_charges
WHEN OLD.operation_token IS NOT NULL
  AND (NEW.id IS NOT OLD.id
    OR NEW.booking_id IS NOT OLD.booking_id
    OR NEW.description IS NOT OLD.description
    OR NEW.amount_cents IS NOT OLD.amount_cents
    OR NEW.category IS NOT OLD.category
    OR NEW.created_at IS NOT OLD.created_at
    OR NEW.operation_token IS NOT OLD.operation_token)
BEGIN
  SELECT RAISE(ABORT, 'extra charge operation identity and payload are immutable');
END;
