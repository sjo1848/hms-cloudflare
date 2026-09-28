-- F0.7: checkout must be authorized by current Booking Account / payment-ledger truth.
-- This is a forward-only command-boundary guard; no historical data is rewritten.
DROP TRIGGER IF EXISTS lifecycle_checkout_settlement_guard;
DROP TRIGGER IF EXISTS lifecycle_checkout_event_account_guard;

CREATE TRIGGER lifecycle_checkout_settlement_guard
BEFORE UPDATE OF status ON bookings
WHEN NEW.status = 'CHECKED_OUT' AND OLD.status = 'CHECKED_IN'
BEGIN
  SELECT CASE WHEN NEW.check_out_payment_policy NOT IN ('settled', 'pending-approved')
    THEN RAISE(ABORT, 'checkout policy invalid') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.booking_id = OLD.id
      AND (i.status = 'VOIDED'
        OR i.amount_cents <> NEW.total_cents
        OR i.paid_amount_cents <> (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payment_entries p WHERE p.invoice_id = i.id)
        OR i.status <> CASE WHEN i.paid_amount_cents >= i.amount_cents THEN 'PAID' ELSE 'PENDING' END)
  ) THEN RAISE(ABORT, 'checkout account is inconsistent') END;

  SELECT CASE WHEN NEW.check_out_payment_policy = 'settled' AND NOT (
    (NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id = OLD.id) AND NEW.total_cents = 0)
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.booking_id = OLD.id AND i.status <> 'VOIDED'
        AND i.amount_cents = NEW.total_cents
        AND i.paid_amount_cents = (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payment_entries p WHERE p.invoice_id = i.id)
        AND i.paid_amount_cents >= i.amount_cents
    )
  ) THEN RAISE(ABORT, 'checkout account is not settled') END;
END;

CREATE TRIGGER lifecycle_checkout_event_account_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_OUT'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM bookings b
    LEFT JOIN invoices i ON i.booking_id = b.id
    WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_OUT'
      AND json_extract(NEW.details_json, '$.booking_total_cents') = b.total_cents
      AND json_extract(NEW.details_json, '$.invoice_id') IS i.id
      AND json_extract(NEW.details_json, '$.invoice_status') IS i.status
      AND json_extract(NEW.details_json, '$.invoice_amount_cents') = COALESCE(i.amount_cents, b.total_cents)
      AND json_extract(NEW.details_json, '$.paid_amount_cents') = COALESCE(i.paid_amount_cents, 0)
      AND json_extract(NEW.details_json, '$.paid_at') IS i.paid_at
      AND json_extract(NEW.details_json, '$.ledger_paid_cents') = COALESCE((SELECT SUM(p.amount_cents) FROM payment_entries p WHERE p.invoice_id = i.id), 0)
      AND json_extract(NEW.details_json, '$.remaining_cents') = MAX(COALESCE(i.amount_cents, b.total_cents) - COALESCE(i.paid_amount_cents, 0), 0)
      AND json_extract(NEW.details_json, '$.credit_cents') = MAX(COALESCE(i.paid_amount_cents, 0) - COALESCE(i.amount_cents, b.total_cents), 0)
  ) THEN RAISE(ABORT, 'checkout event account snapshot mismatch') END;
END;
