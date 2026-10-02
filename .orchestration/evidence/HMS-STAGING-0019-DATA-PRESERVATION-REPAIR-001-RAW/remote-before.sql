PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_foundation.sql','2026-10-02 04:07:21');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0002_rooms_guests_holds.sql','2026-10-02 04:07:22');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0003_bookings.sql','2026-10-02 04:07:22');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(4,'0004_booking_claim_fk.sql','2026-10-02 04:07:22');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(5,'0005_reception_lifecycle.sql','2026-10-02 04:07:23');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(6,'0006_lifecycle_transition_guards.sql','2026-10-02 04:07:23');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(7,'0007_lifecycle_atomic_guards.sql','2026-10-02 04:07:23');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(8,'0008_lifecycle_domain_parity.sql','2026-10-02 04:07:24');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(9,'0009_housekeeping_maintenance.sql','2026-10-02 04:07:24');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(10,'0010_billing.sql','2026-10-02 04:07:59');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(11,'0011_cash_closure_audit.sql','2026-10-02 04:07:59');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(12,'0012_cash_closure_operation_token.sql','2026-10-02 04:08:00');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(13,'0013_noshow_reporting_parity.sql','2026-10-02 04:08:00');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(14,'0014_migration_source_parity.sql','2026-10-02 04:08:01');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(15,'0015_payment_operation_token.sql','2026-10-02 04:08:01');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(16,'0016_payment_operation_token_scope.sql','2026-10-02 04:08:01');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(17,'0017_reporting_indexes.sql','2026-10-02 04:08:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(18,'0018_agent_mutation_provenance.sql','2026-10-02 04:08:02');
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
, room_type TEXT NOT NULL DEFAULT 'STANDARD');
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type") VALUES('diag-room-unpaid','D101','AVAILABLE',6000,'STANDARD');
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type") VALUES('diag-room-partial','D102','AVAILABLE',10000,'STANDARD');
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type") VALUES('diag-room-paid','D103','AVAILABLE',10000,'STANDARD');
CREATE TABLE guests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TEXT NOT NULL
);
INSERT INTO "guests" ("id","full_name","email","phone","created_at") VALUES('diag-guest-unpaid','Diagnostic Unpaid','diag-unpaid@example.invalid',NULL,'2026-10-02T00:00:00Z');
INSERT INTO "guests" ("id","full_name","email","phone","created_at") VALUES('diag-guest-partial','Diagnostic Partial','diag-partial@example.invalid','555-0102','2026-10-02T00:00:00Z');
INSERT INTO "guests" ("id","full_name","email","phone","created_at") VALUES('diag-guest-paid','Diagnostic Paid','diag-paid@example.invalid',NULL,'2026-10-02T00:00:00Z');
CREATE TABLE room_holds (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  hold_type TEXT NOT NULL CHECK (hold_type IN ('Vip', 'Maintenance', 'Owner', 'Compliance', 'Commercial', 'Other')),
  reason TEXT NOT NULL,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE TABLE IF NOT EXISTS "room_inventory_nights" (
  room_id TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  PRIMARY KEY (room_id, stay_date),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE TABLE lifecycle_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('CHECK_IN', 'REASSIGN', 'CHECK_OUT')),
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL, from_room_id TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE TABLE maintenance_cases (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  reason TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  reported_by_user_id TEXT,
  reported_at TEXT NOT NULL,
  resolution_note TEXT,
  resolved_by_user_id TEXT,
  resolved_at TEXT,
  return_status TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  CHECK (
    (status = 'OPEN' AND resolution_note IS NULL AND resolved_by_user_id IS NULL AND resolved_at IS NULL AND return_status IS NULL)
    OR
    (status = 'RESOLVED' AND resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL AND resolved_at IS NOT NULL AND return_status = 'DIRTY')
  )
);
CREATE TABLE housekeeping_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  maintenance_case_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('CLEANING_START', 'CLEANING_FINISH', 'MAINTENANCE_OPEN', 'MAINTENANCE_RESOLVE')),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (maintenance_case_id) REFERENCES maintenance_cases(id)
);
CREATE TABLE extra_charges (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 200),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category TEXT NOT NULL DEFAULT 'OTHER',
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE TABLE invoices (
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
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-unpaid','diag-booking-unpaid',12000,0,'PENDING','CASH',NULL,NULL,'2026-10-02T00:01:00Z');
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-partial','diag-booking-partial',20000,7000,'PENDING','CARD','diag-invoice-ref-partial',NULL,'2026-10-02T00:02:00Z');
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-paid','diag-booking-paid',10000,10000,'PAID','TRANSFER','diag-invoice-ref-paid','2026-10-02T00:03:00Z','2026-10-02T00:03:00Z');
CREATE TABLE payment_entries (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL, operation_token TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-partial-cash','diag-invoice-partial','diag-booking-partial',3000,'CASH','diag-ref-cash-001','first partial payment','diag-actor','2026-10-02T00:10:00Z','diag-op-partial-cash');
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-partial-card','diag-invoice-partial','diag-booking-partial',4000,'CARD',NULL,NULL,'diag-actor','2026-10-02T00:11:00Z',NULL);
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-paid','diag-invoice-paid','diag-booking-paid',10000,'TRANSFER','diag-ref-transfer-001','settled synthetic invoice','diag-actor','2026-10-02T00:12:00Z','diag-op-paid-transfer');
CREATE TABLE cash_closures (
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
, request_id TEXT, hotel_id TEXT, operation_token TEXT);
CREATE TABLE financial_events (
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
CREATE TABLE IF NOT EXISTS "bookings" (
  id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, room_id TEXT NOT NULL,
  check_in TEXT NOT NULL, check_out TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','CHECKED_IN','CHECKED_OUT','NO_SHOW')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0), notes TEXT,
  checked_in_at TEXT, checked_in_by TEXT, checked_out_at TEXT, checked_out_by TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  check_in_guests_count INTEGER, check_out_payment_policy TEXT, check_out_reference TEXT, check_in_reference TEXT, guest_name_snapshot TEXT, check_in_document_verified INTEGER CHECK (check_in_document_verified IN (0, 1)), check_in_contact_confirmed INTEGER CHECK (check_in_contact_confirmed IN (0, 1)), check_in_stay_confirmed INTEGER CHECK (check_in_stay_confirmed IN (0, 1)), check_out_charges_reviewed INTEGER CHECK (check_out_charges_reviewed IN (0, 1)), check_out_room_release_confirmed INTEGER CHECK (check_out_room_release_confirmed IN (0, 1)), check_out_housekeeping_handoff INTEGER CHECK (check_out_housekeeping_handoff IN (0, 1)), terminal_reason TEXT, terminal_recorded_at TEXT, terminal_recorded_by TEXT, late_arrival_eta TEXT, late_arrival_note TEXT, late_arrival_recorded_at TEXT, late_arrival_recorded_by TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id), FOREIGN KEY (room_id) REFERENCES rooms(id), CHECK (check_out > check_in)
);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by") VALUES('diag-booking-unpaid','diag-guest-unpaid','diag-room-unpaid','2026-10-10','2026-10-12','CONFIRMED',12000,'synthetic unpaid preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:01:00Z','2026-10-02T00:01:00Z',NULL,NULL,NULL,NULL,'Diagnostic Unpaid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by") VALUES('diag-booking-partial','diag-guest-partial','diag-room-partial','2026-10-11','2026-10-13','CONFIRMED',20000,'synthetic partial preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:02:00Z','2026-10-02T00:02:00Z',NULL,NULL,NULL,NULL,'Diagnostic Partial',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by") VALUES('diag-booking-paid','diag-guest-paid','diag-room-paid','2026-10-12','2026-10-14','CONFIRMED',10000,'synthetic paid preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:03:00Z','2026-10-02T00:03:00Z',NULL,NULL,NULL,NULL,'Diagnostic Paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE migration_rehearsals (
  rehearsal_id TEXT PRIMARY KEY,
  source_baseline TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'APPLIED')
);
CREATE TABLE migration_provenance (
  id TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE TABLE agent_mutation_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'CANCEL')),
  tenant_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (booking_id, action)
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',18);
CREATE INDEX idx_room_holds_room_dates
  ON room_holds (room_id, start_date, end_date);
CREATE INDEX idx_room_inventory_nights_booking
  ON room_inventory_nights (booking_id);
CREATE INDEX idx_lifecycle_events_booking ON lifecycle_events (booking_id, created_at);
CREATE UNIQUE INDEX idx_lifecycle_events_checkin_once
  ON lifecycle_events (booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT');
CREATE UNIQUE INDEX ux_maintenance_cases_open_room
  ON maintenance_cases (room_id) WHERE status = 'OPEN';
CREATE INDEX idx_maintenance_cases_room_status
  ON maintenance_cases (room_id, status, reported_at);
CREATE INDEX idx_housekeeping_events_room_created
  ON housekeeping_events (room_id, created_at);
CREATE INDEX idx_extra_charges_booking ON extra_charges(booking_id, created_at);
CREATE INDEX idx_invoices_status ON invoices(status, created_at);
CREATE INDEX idx_payments_shift ON payment_entries(received_at, payment_method);
CREATE INDEX idx_payments_booking ON payment_entries(booking_id, received_at);
CREATE UNIQUE INDEX idx_cash_closures_shift ON cash_closures(opening_time);
CREATE INDEX idx_cash_closures_request ON cash_closures(request_id);
CREATE UNIQUE INDEX idx_cash_closures_operation_token ON cash_closures(operation_token);
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings (guest_id, created_at);
CREATE INDEX idx_bookings_room ON bookings (room_id, check_in);
CREATE INDEX idx_bookings_status ON bookings (status, check_in);
CREATE UNIQUE INDEX idx_payment_entries_booking_operation_token ON payment_entries(booking_id, operation_token);
CREATE INDEX idx_bookings_status_checkout
  ON bookings (status, check_out);
CREATE INDEX idx_agent_mutation_booking ON agent_mutation_events(booking_id, created_at);
CREATE INDEX idx_agent_mutation_trace ON agent_mutation_events(trace_id);
CREATE INDEX idx_agent_mutation_actor ON agent_mutation_events(actor_id, created_at);
CREATE TRIGGER housekeeping_event_state_guard
BEFORE INSERT ON housekeeping_events
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM rooms WHERE id = NEW.room_id AND status = NEW.to_status
  ) THEN RAISE(ABORT, 'housekeeping room transition guard failed') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_START' AND (NEW.from_status <> 'DIRTY' OR NEW.to_status <> 'CLEANING')
    THEN RAISE(ABORT, 'invalid cleaning start transition') END);
  SELECT (CASE WHEN NEW.event_type = 'CLEANING_FINISH' AND (NEW.from_status <> 'CLEANING' OR NEW.to_status <> 'AVAILABLE')
    THEN RAISE(ABORT, 'invalid cleaning finish transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_OPEN' AND (NEW.to_status <> 'MAINTENANCE' OR NEW.maintenance_case_id IS NULL OR NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE id = NEW.maintenance_case_id AND room_id = NEW.room_id AND status = 'OPEN'))
    THEN RAISE(ABORT, 'invalid maintenance open transition') END);
  SELECT (CASE WHEN NEW.event_type = 'MAINTENANCE_RESOLVE' AND (NEW.from_status <> 'MAINTENANCE' OR NEW.to_status <> 'DIRTY' OR NEW.maintenance_case_id IS NULL OR NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE id = NEW.maintenance_case_id AND room_id = NEW.room_id AND status = 'RESOLVED' AND return_status = 'DIRTY'))
    THEN RAISE(ABORT, 'invalid maintenance resolve transition') END);
END;
CREATE TRIGGER trg_cash_closure_audit
AFTER INSERT ON cash_closures
BEGIN
  INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at)
  VALUES (lower(hex(randomblob(16))), 'CASH_CLOSURE', NULL, NEW.actor_subject, NEW.request_id, NEW.hotel_id,
    json_object('total_amount_cents', NEW.total_amount_cents, 'cash_amount_cents', NEW.cash_amount_cents,
      'card_amount_cents', NEW.card_amount_cents, 'payment_count', NEW.payment_count,
      'counted_cash_amount_cents', NEW.counted_cash_amount_cents, 'opening_time', NEW.opening_time), NEW.closing_time);
END;
CREATE TRIGGER lifecycle_checkout_atomic_guard BEFORE INSERT ON lifecycle_events WHEN NEW.event_type = 'CHECK_OUT' BEGIN SELECT (CASE WHEN NOT EXISTS (SELECT 1 FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_OUT' AND r.id = NEW.from_room_id AND r.status = 'DIRTY') THEN RAISE(ABORT, 'checkout atomic guard failed') END); END;
CREATE TRIGGER lifecycle_reassign_atomic_guard BEFORE INSERT ON lifecycle_events WHEN NEW.event_type = 'REASSIGN' BEGIN SELECT (CASE WHEN NOT EXISTS (SELECT 1 FROM bookings b JOIN rooms old_room ON old_room.id = NEW.from_room_id JOIN rooms new_room ON new_room.id = b.room_id WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_IN' AND json_extract(NEW.details_json, '$.to_room_id') = b.room_id AND new_room.status = 'OCCUPIED' AND old_room.status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id = b.id AND n.room_id = b.room_id) AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id = b.room_id AND h.start_date < b.check_out AND h.end_date > b.check_in) ) THEN RAISE(ABORT, 'reassignment atomic guard failed') END); END;
CREATE TRIGGER lifecycle_checkin_guest_count_guard BEFORE UPDATE OF status ON bookings WHEN NEW.status = 'CHECKED_IN' BEGIN SELECT (CASE WHEN NEW.check_in_guests_count IS NULL OR NEW.check_in_guests_count < 1 THEN RAISE(ABORT, 'check-in guest count required') END); END;
CREATE TRIGGER trg_extra_charge_total AFTER INSERT ON extra_charges BEGIN UPDATE bookings SET total_cents = total_cents + NEW.amount_cents, updated_at = NEW.created_at WHERE id = NEW.booking_id; UPDATE invoices SET amount_cents = amount_cents + NEW.amount_cents WHERE booking_id = NEW.booking_id AND status = 'PENDING'; END;
CREATE TRIGGER bookings_migrated_snapshot_insert_guard
BEFORE INSERT ON bookings
BEGIN
  SELECT (CASE
    WHEN (NEW.terminal_reason IS NULL) <> (NEW.terminal_recorded_at IS NULL)
      OR (NEW.terminal_reason IS NULL) <> (NEW.terminal_recorded_by IS NULL)
    THEN RAISE(ABORT, 'incomplete terminal booking provenance')
  END);
  SELECT (CASE
    WHEN NEW.late_arrival_eta IS NOT NULL
      AND (NEW.late_arrival_note IS NULL OR NEW.late_arrival_recorded_at IS NULL OR NEW.late_arrival_recorded_by IS NULL)
    THEN RAISE(ABORT, 'incomplete late-arrival provenance')
  END);
END;
