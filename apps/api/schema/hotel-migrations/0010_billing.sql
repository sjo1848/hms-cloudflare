PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS extra_charges (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 200),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category TEXT NOT NULL DEFAULT 'OTHER',
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  paid_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0 AND paid_amount_cents <= amount_cents),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'VOIDED')),
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_entries (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cash_closures (
  id TEXT PRIMARY KEY,
  actor_subject TEXT NOT NULL,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  cash_amount_cents INTEGER NOT NULL CHECK (cash_amount_cents >= 0),
  card_amount_cents INTEGER NOT NULL CHECK (card_amount_cents >= 0),
  payment_count INTEGER NOT NULL CHECK (payment_count >= 0),
  counted_cash_amount_cents INTEGER NOT NULL CHECK (counted_cash_amount_cents >= 0),
  cash_difference_cents INTEGER NOT NULL,
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  handoff_to TEXT NOT NULL CHECK (length(trim(handoff_to)) BETWEEN 1 AND 120),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS financial_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  booking_id TEXT,
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_extra_charges_booking ON extra_charges(booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_shift ON payment_entries(received_at, payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payment_entries(booking_id, received_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_closures_shift ON cash_closures(opening_time);

CREATE TRIGGER IF NOT EXISTS trg_extra_charge_total
AFTER INSERT ON extra_charges
BEGIN
  UPDATE bookings SET total_cents = total_cents + NEW.amount_cents, updated_at = NEW.created_at WHERE id = NEW.booking_id;
  UPDATE invoices SET amount_cents = amount_cents + NEW.amount_cents WHERE booking_id = NEW.booking_id AND status = 'PENDING';
END;
