PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS trg_extra_charge_total;
DROP TRIGGER IF EXISTS billing_reconcile_total_guard;
DROP TRIGGER IF EXISTS billing_reconcile_total_apply;
DROP TRIGGER IF EXISTS billing_invoice_ledger_guard;

CREATE TABLE invoices_d11 (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  paid_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'VOIDED')),
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO invoices_d11 (
  id, booking_id, amount_cents, paid_amount_cents, status,
  payment_method, payment_reference, paid_at, created_at
)
SELECT
  id, booking_id, amount_cents, paid_amount_cents, status,
  payment_method, payment_reference, paid_at, created_at
FROM invoices;

DROP TABLE invoices;
ALTER TABLE invoices_d11 RENAME TO invoices;

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, created_at);

PRAGMA foreign_keys = ON;

CREATE TRIGGER billing_reconcile_total_guard
BEFORE UPDATE OF total_cents ON bookings
WHEN NEW.total_cents <> OLD.total_cents
  AND EXISTS (SELECT 1 FROM invoices WHERE booking_id = OLD.id)
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM invoices
    WHERE booking_id = OLD.id AND status = 'VOIDED'
  ) THEN RAISE(ABORT, 'D11 invoice is voided') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.booking_id = OLD.id
      AND i.paid_amount_cents <> (
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payment_entries p
        WHERE p.invoice_id = i.id
      )
  ) THEN RAISE(ABORT, 'D11 payment ledger mismatch') END;
END;

CREATE TRIGGER billing_reconcile_total_apply
AFTER UPDATE OF total_cents ON bookings
WHEN NEW.total_cents <> OLD.total_cents
  AND EXISTS (SELECT 1 FROM invoices WHERE booking_id = NEW.id)
BEGIN
  UPDATE invoices
  SET
    amount_cents = NEW.total_cents,
    paid_amount_cents = (
      SELECT COALESCE(SUM(p.amount_cents), 0)
      FROM payment_entries p
      WHERE p.invoice_id = invoices.id
    ),
    status = CASE
      WHEN (
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payment_entries p
        WHERE p.invoice_id = invoices.id
      ) >= NEW.total_cents THEN 'PAID'
      ELSE 'PENDING'
    END,
    paid_at = CASE
      WHEN status = 'PAID'
        AND (
          SELECT COALESCE(SUM(p.amount_cents), 0)
          FROM payment_entries p
          WHERE p.invoice_id = invoices.id
        ) >= NEW.total_cents
        THEN paid_at
      WHEN status = 'PENDING'
        AND (
          SELECT COALESCE(SUM(p.amount_cents), 0)
          FROM payment_entries p
          WHERE p.invoice_id = invoices.id
        ) >= NEW.total_cents
        THEN NEW.updated_at
      ELSE NULL
    END
  WHERE booking_id = NEW.id
    AND status <> 'VOIDED';
END;

CREATE TRIGGER billing_invoice_ledger_guard
BEFORE UPDATE OF paid_amount_cents ON invoices
WHEN NEW.paid_amount_cents <> (
  SELECT COALESCE(SUM(p.amount_cents), 0)
  FROM payment_entries p
  WHERE p.invoice_id = NEW.id
)
BEGIN
  SELECT RAISE(ABORT, 'D11 paid amount must equal immutable payment ledger');
END;
