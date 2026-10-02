PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_foundation.sql','2026-10-02 04:14:55');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0002_rooms_guests_holds.sql','2026-10-02 04:14:56');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0003_bookings.sql','2026-10-02 04:14:56');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(4,'0004_booking_claim_fk.sql','2026-10-02 04:14:57');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(5,'0005_reception_lifecycle.sql','2026-10-02 04:14:57');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(6,'0006_lifecycle_transition_guards.sql','2026-10-02 04:14:57');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(7,'0007_lifecycle_atomic_guards.sql','2026-10-02 04:14:58');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(8,'0008_lifecycle_domain_parity.sql','2026-10-02 04:14:58');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(9,'0009_housekeeping_maintenance.sql','2026-10-02 04:14:58');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(10,'0010_billing.sql','2026-10-02 04:14:59');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(11,'0011_cash_closure_audit.sql','2026-10-02 04:14:59');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(12,'0012_cash_closure_operation_token.sql','2026-10-02 04:15:00');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(13,'0013_noshow_reporting_parity.sql','2026-10-02 04:15:00');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(14,'0014_migration_source_parity.sql','2026-10-02 04:15:01');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(15,'0015_payment_operation_token.sql','2026-10-02 04:15:01');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(16,'0016_payment_operation_token_scope.sql','2026-10-02 04:15:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(17,'0017_reporting_indexes.sql','2026-10-02 04:15:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(18,'0018_agent_mutation_provenance.sql','2026-10-02 04:15:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(19,'0019_billing_reconciliation.sql','2026-10-02 04:15:44');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(20,'0020_maintenance_impact.sql','2026-10-02 04:16:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(21,'0021_reassignment_remaining_nights.sql','2026-10-02 04:16:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(22,'0022_room_state_dimensions.sql','2026-10-02 04:16:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(23,'0023_room_state_command_guards.sql','2026-10-02 04:16:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(24,'0024_reassignment_interval_room_versions.sql','2026-10-02 04:16:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(25,'0025_segmented_stay_pricing.sql','2026-10-02 04:16:04');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(26,'0026_active_stay_pricing_bootstrap_shadow.sql','2026-10-02 04:16:04');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(27,'0027_active_stay_bootstrap_segment_snapshot_guard.sql','2026-10-02 04:16:04');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(28,'0028_checkout_settlement_guard.sql','2026-10-02 04:16:05');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(29,'0029_reservation_creation_recovery.sql','2026-10-02 04:16:05');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(30,'0030_extra_charge_operation_identity.sql','2026-10-02 04:16:05');
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
, room_type TEXT NOT NULL DEFAULT 'STANDARD', housekeeping_state TEXT
  CHECK (housekeeping_state IS NULL OR housekeeping_state IN ('READY', 'DIRTY', 'CLEANING')), service_state TEXT
  CHECK (service_state IS NULL OR service_state IN ('IN_SERVICE', 'OUT_OF_ORDER')), room_state_version INTEGER NOT NULL DEFAULT 0 CHECK (room_state_version >= 0), pricing_version INTEGER NOT NULL DEFAULT 0 CHECK (pricing_version >= 0), inventory_version INTEGER NOT NULL DEFAULT 0 CHECK (inventory_version >= 0));
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type","housekeeping_state","service_state","room_state_version","pricing_version","inventory_version") VALUES('diag-room-unpaid','D101','AVAILABLE',6000,'STANDARD',NULL,NULL,0,0,0);
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type","housekeeping_state","service_state","room_state_version","pricing_version","inventory_version") VALUES('diag-room-partial','D102','AVAILABLE',10000,'STANDARD',NULL,NULL,0,0,0);
INSERT INTO "rooms" ("id","room_number","status","price_cents","room_type","housekeeping_state","service_state","room_state_version","pricing_version","inventory_version") VALUES('diag-room-paid','D103','AVAILABLE',10000,'STANDARD',NULL,NULL,0,0,0);
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
CREATE TABLE extra_charges (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 200),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category TEXT NOT NULL DEFAULT 'OTHER',
  created_at TEXT NOT NULL, operation_token TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
INSERT INTO "extra_charges" ("id","booking_id","description","amount_cents","category","created_at","operation_token") VALUES('diag-charge-unpaid','diag-booking-unpaid','Synthetic minibar charge',500,'MINIBAR','2026-10-02T00:20:00Z',NULL);
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
  check_in_guests_count INTEGER, check_out_payment_policy TEXT, check_out_reference TEXT, check_in_reference TEXT, guest_name_snapshot TEXT, check_in_document_verified INTEGER CHECK (check_in_document_verified IN (0, 1)), check_in_contact_confirmed INTEGER CHECK (check_in_contact_confirmed IN (0, 1)), check_in_stay_confirmed INTEGER CHECK (check_in_stay_confirmed IN (0, 1)), check_out_charges_reviewed INTEGER CHECK (check_out_charges_reviewed IN (0, 1)), check_out_room_release_confirmed INTEGER CHECK (check_out_room_release_confirmed IN (0, 1)), check_out_housekeeping_handoff INTEGER CHECK (check_out_housekeeping_handoff IN (0, 1)), terminal_reason TEXT, terminal_recorded_at TEXT, terminal_recorded_by TEXT, late_arrival_eta TEXT, late_arrival_note TEXT, late_arrival_recorded_at TEXT, late_arrival_recorded_by TEXT, last_reassignment_token TEXT, pricing_version INTEGER NOT NULL DEFAULT 0 CHECK (pricing_version >= 0), last_pricing_operation_token TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id), FOREIGN KEY (room_id) REFERENCES rooms(id), CHECK (check_out > check_in)
);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by","last_reassignment_token","pricing_version","last_pricing_operation_token") VALUES('diag-booking-unpaid','diag-guest-unpaid','diag-room-unpaid','2026-10-10','2026-10-12','CONFIRMED',12500,'synthetic unpaid preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:01:00Z','2026-10-02T00:20:00Z',NULL,NULL,NULL,NULL,'Diagnostic Unpaid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by","last_reassignment_token","pricing_version","last_pricing_operation_token") VALUES('diag-booking-partial','diag-guest-partial','diag-room-partial','2026-10-11','2026-10-13','CONFIRMED',20000,'synthetic partial preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:02:00Z','2026-10-02T00:02:00Z',NULL,NULL,NULL,NULL,'Diagnostic Partial',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL);
INSERT INTO "bookings" ("id","guest_id","room_id","check_in","check_out","status","total_cents","notes","checked_in_at","checked_in_by","checked_out_at","checked_out_by","created_at","updated_at","check_in_guests_count","check_out_payment_policy","check_out_reference","check_in_reference","guest_name_snapshot","check_in_document_verified","check_in_contact_confirmed","check_in_stay_confirmed","check_out_charges_reviewed","check_out_room_release_confirmed","check_out_housekeeping_handoff","terminal_reason","terminal_recorded_at","terminal_recorded_by","late_arrival_eta","late_arrival_note","late_arrival_recorded_at","late_arrival_recorded_by","last_reassignment_token","pricing_version","last_pricing_operation_token") VALUES('diag-booking-paid','diag-guest-paid','diag-room-paid','2026-10-12','2026-10-14','CONFIRMED',8000,'synthetic paid preservation fixture',NULL,NULL,NULL,NULL,'2026-10-02T00:03:00Z','2026-10-02T00:30:00Z',NULL,NULL,NULL,NULL,'Diagnostic Paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL);
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
CREATE TABLE IF NOT EXISTS "invoices" (
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
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-unpaid','diag-booking-unpaid',12500,0,'PENDING','CASH',NULL,NULL,'2026-10-02T00:01:00Z');
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-partial','diag-booking-partial',20000,7000,'PENDING','CARD','diag-invoice-ref-partial',NULL,'2026-10-02T00:02:00Z');
INSERT INTO "invoices" ("id","booking_id","amount_cents","paid_amount_cents","status","payment_method","payment_reference","paid_at","created_at") VALUES('diag-invoice-paid','diag-booking-paid',8000,10000,'PAID','TRANSFER','diag-invoice-ref-paid','2026-10-02T00:03:00Z','2026-10-02T00:03:00Z');
CREATE TABLE payment_entries (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  operation_token TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-partial-cash','diag-invoice-partial','diag-booking-partial',3000,'CASH','diag-ref-cash-001','first partial payment','diag-actor','2026-10-02T00:10:00Z','diag-op-partial-cash');
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-partial-card','diag-invoice-partial','diag-booking-partial',4000,'CARD',NULL,NULL,'diag-actor','2026-10-02T00:11:00Z',NULL);
INSERT INTO "payment_entries" ("id","invoice_id","booking_id","amount_cents","payment_method","payment_reference","note","received_by_user_id","received_at","operation_token") VALUES('diag-payment-paid','diag-invoice-paid','diag-booking-paid',10000,'TRANSFER','diag-ref-transfer-001','settled synthetic invoice','diag-actor','2026-10-02T00:12:00Z','diag-op-paid-transfer');
CREATE TABLE maintenance_cases (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  impact TEXT NOT NULL DEFAULT 'NON_BLOCKING' CHECK (impact IN ('NON_BLOCKING', 'BLOCKING')),
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
    (status = 'RESOLVED' AND resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL AND resolved_at IS NOT NULL AND return_status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER'))
  )
);
CREATE TABLE housekeeping_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  maintenance_case_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('CLEANING_START', 'CLEANING_FINISH', 'MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE')),
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
CREATE TABLE active_stay_bootstrap_heads (
  hotel_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  run_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (hotel_id, model_version)
);
CREATE TABLE active_stay_bootstrap_runs (
  run_id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  model_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SHADOWED','ACTIVATING','COMPLETE','BLOCKED')),
  manifest_json TEXT NOT NULL CHECK (json_valid(manifest_json)),
  activation_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (hotel_id, source_digest, model_version)
);
CREATE TABLE active_stay_bootstrap_candidates (
  candidate_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN (
    'TRACEABLE_SEGMENTS','TRACEABLE_AGGREGATE_ONLY','ACCOUNT_MISMATCH','VOIDED','ORPHAN_OR_CONFLICT'
  )),
  status TEXT NOT NULL CHECK (status IN ('SHADOWED','HELD','ACTIVATING','ACTIVATED')),
  baseline_source_json TEXT NOT NULL CHECK (json_valid(baseline_source_json)),
  candidate_json TEXT NOT NULL CHECK (json_valid(candidate_json)),
  source_digest TEXT NOT NULL,
  currency_basis TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES active_stay_bootstrap_runs(run_id) ON DELETE CASCADE,
  UNIQUE (run_id, booking_id)
);
CREATE TABLE active_stay_bootstrap_candidate_segments (
  candidate_id TEXT NOT NULL,
  segment_order INTEGER NOT NULL CHECK (segment_order > 0),
  source_ref TEXT NOT NULL,
  room_id TEXT NOT NULL,
  effective_start TEXT NOT NULL,
  effective_end TEXT NOT NULL,
  rate_cents INTEGER NOT NULL CHECK (rate_cents >= 0),
  source_rate_version INTEGER NOT NULL CHECK (source_rate_version >= 0),
  operation_token TEXT NOT NULL UNIQUE,
  PRIMARY KEY (candidate_id, segment_order),
  CHECK (effective_start < effective_end),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE TABLE active_stay_bootstrap_snapshot_rooms (
  candidate_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  pricing_version INTEGER NOT NULL,
  inventory_version INTEGER NOT NULL,
  room_state_version INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, room_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);
CREATE TABLE active_stay_bootstrap_snapshot_inventory (
  candidate_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  PRIMARY KEY (candidate_id, room_id, stay_date, booking_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);
CREATE TABLE active_stay_bootstrap_snapshot_charges (
  candidate_id TEXT NOT NULL,
  charge_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (candidate_id, charge_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);
CREATE TABLE active_stay_bootstrap_snapshot_payments (
  candidate_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  operation_token TEXT,
  PRIMARY KEY (candidate_id, payment_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);
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
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',30);
CREATE INDEX idx_room_holds_room_dates
  ON room_holds (room_id, start_date, end_date);
CREATE INDEX idx_room_inventory_nights_booking
  ON room_inventory_nights (booking_id);
CREATE INDEX idx_lifecycle_events_booking ON lifecycle_events (booking_id, created_at);
CREATE UNIQUE INDEX idx_lifecycle_events_checkin_once
  ON lifecycle_events (booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT');
CREATE INDEX idx_extra_charges_booking ON extra_charges(booking_id, created_at);
CREATE UNIQUE INDEX idx_cash_closures_shift ON cash_closures(opening_time);
CREATE INDEX idx_cash_closures_request ON cash_closures(request_id);
CREATE UNIQUE INDEX idx_cash_closures_operation_token ON cash_closures(operation_token);
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings (guest_id, created_at);
CREATE INDEX idx_bookings_room ON bookings (room_id, check_in);
CREATE INDEX idx_bookings_status ON bookings (status, check_in);
CREATE INDEX idx_bookings_status_checkout
  ON bookings (status, check_out);
CREATE INDEX idx_agent_mutation_booking ON agent_mutation_events(booking_id, created_at);
CREATE INDEX idx_agent_mutation_trace ON agent_mutation_events(trace_id);
CREATE INDEX idx_agent_mutation_actor ON agent_mutation_events(actor_id, created_at);
CREATE INDEX idx_invoices_status ON invoices(status, created_at);
CREATE INDEX idx_payments_shift
  ON payment_entries(received_at, payment_method);
CREATE INDEX idx_payments_booking
  ON payment_entries(booking_id, received_at);
CREATE UNIQUE INDEX idx_payment_entries_booking_operation_token
  ON payment_entries(booking_id, operation_token);
CREATE UNIQUE INDEX ux_maintenance_cases_open_room
  ON maintenance_cases (room_id) WHERE status = 'OPEN';
CREATE INDEX idx_maintenance_cases_room_status
  ON maintenance_cases (room_id, status, reported_at);
CREATE INDEX idx_housekeeping_events_room_created
  ON housekeeping_events (room_id, created_at);
CREATE INDEX idx_rooms_housekeeping_state ON rooms(housekeeping_state, room_number);
CREATE INDEX idx_rooms_service_state ON rooms(service_state, room_number);
CREATE UNIQUE INDEX idx_reassign_source_version_winner
ON lifecycle_events (
  from_room_id,
  CAST(json_extract(details_json,'$.old_room_version_after') AS INTEGER)
)
WHERE event_type='REASSIGN' AND json_extract(details_json,'$.old_room_version_after') IS NOT NULL;
CREATE UNIQUE INDEX idx_reassign_destination_version_winner
ON lifecycle_events (
  json_extract(details_json,'$.to_room_id'),
  CAST(json_extract(details_json,'$.new_room_version_after') AS INTEGER)
)
WHERE event_type='REASSIGN' AND json_extract(details_json,'$.new_room_version_after') IS NOT NULL;
CREATE INDEX idx_booking_pricing_segments_interval
  ON booking_pricing_segments(booking_id, effective_start, effective_end, created_at, segment_id);
CREATE INDEX idx_active_stay_bootstrap_candidate_status
  ON active_stay_bootstrap_candidates(hotel_id, status, booking_id);
CREATE INDEX idx_reservation_creation_incomplete
  ON reservation_creation_operations(stage, created_at)
  WHERE stage <> 'BOOKING_CREATED';
CREATE INDEX idx_reservation_creation_events_hotel_time
  ON reservation_creation_events(hotel_id, created_at);
CREATE UNIQUE INDEX idx_extra_charges_booking_operation_token
  ON extra_charges(booking_id, operation_token)
  WHERE operation_token IS NOT NULL;
CREATE TRIGGER trg_cash_closure_audit
AFTER INSERT ON cash_closures
BEGIN
  INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at)
  VALUES (lower(hex(randomblob(16))), 'CASH_CLOSURE', NULL, NEW.actor_subject, NEW.request_id, NEW.hotel_id,
    json_object('total_amount_cents', NEW.total_amount_cents, 'cash_amount_cents', NEW.cash_amount_cents,
      'card_amount_cents', NEW.card_amount_cents, 'payment_count', NEW.payment_count,
      'counted_cash_amount_cents', NEW.counted_cash_amount_cents, 'opening_time', NEW.opening_time), NEW.closing_time);
END;
CREATE TRIGGER lifecycle_checkin_guest_count_guard BEFORE UPDATE OF status ON bookings WHEN NEW.status = 'CHECKED_IN' BEGIN SELECT (CASE WHEN NEW.check_in_guests_count IS NULL OR NEW.check_in_guests_count < 1 THEN RAISE(ABORT, 'check-in guest count required') END); END;
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
CREATE TRIGGER billing_reconcile_total_guard
BEFORE UPDATE OF total_cents ON bookings
WHEN NEW.total_cents <> OLD.total_cents
  AND EXISTS (SELECT 1 FROM invoices WHERE booking_id = OLD.id)
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM invoices
    WHERE booking_id = OLD.id AND status = 'VOIDED'
  ) THEN RAISE(ABORT, 'D11 invoice is voided') END);
  SELECT (CASE WHEN EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.booking_id = OLD.id
      AND i.paid_amount_cents <> (
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payment_entries p
        WHERE p.invoice_id = i.id
      )
  ) THEN RAISE(ABORT, 'D11 payment ledger mismatch') END);
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
CREATE TRIGGER lifecycle_checkin_state_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_IN'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'check-in room dimension guard failed') END);
END;
CREATE TRIGGER lifecycle_checkout_atomic_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_OUT'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'checkout room dimension guard failed') END);
END;
CREATE TRIGGER housekeeping_event_state_guard
BEFORE INSERT ON housekeeping_events
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = NEW.room_id AND r.status = NEW.to_status
      AND r.room_state_version = CAST(json_extract(NEW.details_json, '$.room_state_version_after') AS INTEGER)
      AND CAST(json_extract(NEW.details_json, '$.room_state_version_before') AS INTEGER) + 1 = r.room_state_version
  ) THEN RAISE(ABORT, 'room command version guard failed') END);

  SELECT (CASE WHEN NEW.event_type = 'CLEANING_START' AND NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'invalid cleaning start dimensions') END);

  SELECT (CASE WHEN NEW.event_type = 'CLEANING_FINISH' AND NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'invalid cleaning finish dimensions') END);

  SELECT (CASE WHEN NEW.event_type IN ('MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE') AND NOT EXISTS (
    SELECT 1 FROM maintenance_cases mc WHERE mc.id = NEW.maintenance_case_id AND mc.room_id = NEW.room_id
      AND ((NEW.event_type = 'MAINTENANCE_OPEN' AND mc.status = 'OPEN' AND mc.impact = json_extract(NEW.details_json, '$.impact'))
        OR (NEW.event_type = 'MAINTENANCE_ESCALATE' AND mc.status = 'OPEN' AND mc.impact = 'BLOCKING' AND json_extract(NEW.details_json, '$.impact_after') = 'BLOCKING')
        OR (NEW.event_type = 'MAINTENANCE_RESOLVE' AND mc.status = 'RESOLVED' AND mc.return_status = NEW.to_status))
  ) THEN RAISE(ABORT, 'maintenance case identity guard failed') END);

  SELECT (CASE WHEN NEW.event_type IN ('MAINTENANCE_OPEN', 'MAINTENANCE_ESCALATE', 'MAINTENANCE_RESOLVE') AND NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'maintenance changed an unrelated room dimension') END);
END;
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
CREATE TRIGGER active_stay_bootstrap_run_update_guard
BEFORE UPDATE ON active_stay_bootstrap_runs
WHEN NEW.run_id<>OLD.run_id OR NEW.hotel_id<>OLD.hotel_id OR NEW.source_digest<>OLD.source_digest
  OR NEW.model_version<>OLD.model_version OR NEW.manifest_json<>OLD.manifest_json
  OR NEW.created_at<>OLD.created_at
  OR (NEW.status<>OLD.status AND NOT (
    (OLD.status='SHADOWED' AND NEW.status IN ('ACTIVATING','COMPLETE','BLOCKED'))
    OR (OLD.status='ACTIVATING' AND NEW.status IN ('COMPLETE','BLOCKED'))
  ))
  OR (OLD.activation_token IS NOT NULL AND COALESCE(NEW.activation_token,'')<>OLD.activation_token)
  OR (NEW.activation_token IS NOT NULL AND NEW.status<>'ACTIVATING' AND OLD.status<>'ACTIVATING')
  OR (NEW.status='ACTIVATING' AND COALESCE(NEW.activation_token,'')<>NEW.run_id)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap run identity/state is immutable');
END;
CREATE TRIGGER active_stay_bootstrap_candidate_insert_guard
BEFORE INSERT ON active_stay_bootstrap_candidates
WHEN NOT EXISTS (
  SELECT 1 FROM active_stay_bootstrap_runs r
  WHERE r.run_id=NEW.run_id AND r.hotel_id=NEW.hotel_id AND r.source_digest=NEW.source_digest
    AND json_extract(NEW.candidate_json,'$.bookingId')=NEW.booking_id
    AND json_extract(NEW.candidate_json,'$.classification')=NEW.classification
    AND json_extract(NEW.candidate_json,'$.currencyBasis')=NEW.currency_basis
    AND json_extract(NEW.candidate_json,'$.baselineDigest') IS NOT NULL
    AND json(NEW.baseline_source_json)=json_extract(NEW.candidate_json,'$.sourceSnapshot')
    AND EXISTS (SELECT 1 FROM json_each(r.manifest_json,'$.candidates') x
      WHERE json_extract(x.value,'$.bookingId')=NEW.booking_id
        AND json_extract(x.value,'$.classification')=NEW.classification
        AND json_extract(x.value,'$.baselineDigest')=json_extract(NEW.candidate_json,'$.baselineDigest')
        AND json_extract(x.value,'$.currencyBasis')=NEW.currency_basis)
    AND NEW.status=CASE WHEN NEW.classification='TRACEABLE_SEGMENTS' THEN 'SHADOWED' ELSE 'HELD' END
)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap candidate is not bound to its manifest');
END;
CREATE TRIGGER active_stay_bootstrap_candidate_update_guard
BEFORE UPDATE ON active_stay_bootstrap_candidates
WHEN NEW.candidate_id<>OLD.candidate_id OR NEW.run_id<>OLD.run_id OR NEW.hotel_id<>OLD.hotel_id
  OR NEW.booking_id<>OLD.booking_id OR NEW.classification<>OLD.classification
  OR NEW.baseline_source_json<>OLD.baseline_source_json OR NEW.candidate_json<>OLD.candidate_json
  OR NEW.source_digest<>OLD.source_digest OR NEW.currency_basis<>OLD.currency_basis
  OR NEW.created_at<>OLD.created_at
  OR (NEW.status<>OLD.status AND NOT (
    (OLD.status='SHADOWED' AND NEW.status='ACTIVATING')
    OR (OLD.status='ACTIVATING' AND NEW.status='ACTIVATED')
  ))
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap candidate is immutable');
END;
CREATE TRIGGER active_stay_bootstrap_candidate_activation_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_candidates
WHEN NEW.status='ACTIVATING' AND OLD.status='SHADOWED'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap activation is not current')
  WHERE NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_runs r
    JOIN active_stay_bootstrap_heads h ON h.hotel_id=r.hotel_id AND h.model_version=r.model_version
    WHERE r.run_id=NEW.run_id AND r.status='ACTIVATING' AND r.source_digest=NEW.source_digest
      AND h.run_id=r.run_id AND h.source_digest=r.source_digest);
END;
CREATE TRIGGER active_stay_bootstrap_candidate_complete_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_candidates
WHEN NEW.status='ACTIVATED' AND OLD.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap canonical segment set is incomplete')
  WHERE (SELECT COUNT(*) FROM active_stay_bootstrap_candidate_segments s WHERE s.candidate_id=NEW.candidate_id)
    <>json_array_length(json_extract(NEW.candidate_json,'$.segments'))
    OR EXISTS (SELECT 1 FROM active_stay_bootstrap_candidate_segments s
      WHERE s.candidate_id=NEW.candidate_id AND NOT EXISTS (
        SELECT 1 FROM booking_pricing_segments p WHERE p.booking_id=NEW.booking_id
          AND p.room_id=s.room_id AND p.effective_start=s.effective_start AND p.effective_end=s.effective_end
          AND p.rate_cents=s.rate_cents AND p.room_pricing_version=s.source_rate_version
          AND p.operation_token=s.operation_token));
END;
CREATE TRIGGER active_stay_bootstrap_candidate_segment_no_update
BEFORE UPDATE ON active_stay_bootstrap_candidate_segments
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is immutable');
END;
CREATE TRIGGER active_stay_bootstrap_candidate_segment_insert_guard
BEFORE INSERT ON active_stay_bootstrap_candidate_segments
WHEN NOT EXISTS (
  SELECT 1 FROM active_stay_bootstrap_candidates c
  WHERE c.candidate_id=NEW.candidate_id AND c.status='SHADOWED'
    AND c.classification='TRACEABLE_SEGMENTS'
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].sourceRef')=NEW.source_ref
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].roomId')=NEW.room_id
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].effectiveStart')=NEW.effective_start
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].effectiveEnd')=NEW.effective_end
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].rateCents')=NEW.rate_cents
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].sourceRateVersion')=NEW.source_rate_version
    AND NEW.operation_token=c.run_id||':'||c.booking_id||':'||NEW.segment_order
)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is not candidate-backed');
END;
CREATE TRIGGER active_stay_bootstrap_candidate_segment_no_delete
BEFORE DELETE ON active_stay_bootstrap_candidate_segments
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is immutable');
END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update
BEFORE UPDATE ON active_stay_bootstrap_snapshot_rooms
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_inventory
BEFORE UPDATE ON active_stay_bootstrap_snapshot_inventory
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_charges
BEFORE UPDATE ON active_stay_bootstrap_snapshot_charges
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_payments
BEFORE UPDATE ON active_stay_bootstrap_snapshot_payments
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete
BEFORE DELETE ON active_stay_bootstrap_snapshot_rooms
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_inventory
BEFORE DELETE ON active_stay_bootstrap_snapshot_inventory
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_charges
BEFORE DELETE ON active_stay_bootstrap_snapshot_charges
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_payments
BEFORE DELETE ON active_stay_bootstrap_snapshot_payments
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER booking_pricing_segment_insert_guard
BEFORE INSERT ON booking_pricing_segments
WHEN NOT EXISTS (
  SELECT 1 FROM bookings b JOIN rooms r ON r.id=NEW.room_id
  WHERE b.id=NEW.booking_id AND b.room_id=NEW.room_id
    AND b.check_in<=NEW.effective_start AND NEW.effective_end<=b.check_out
    AND r.pricing_version=NEW.room_pricing_version
    AND b.last_pricing_operation_token=NEW.operation_token
    AND NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_candidate_segments s WHERE s.operation_token=NEW.operation_token)
    AND NEW.segment_version=b.pricing_version+1
)
AND NOT EXISTS (
  SELECT 1
  FROM active_stay_bootstrap_candidate_segments s
  JOIN active_stay_bootstrap_candidates c ON c.candidate_id=s.candidate_id
  JOIN active_stay_bootstrap_runs r ON r.run_id=c.run_id
  JOIN active_stay_bootstrap_heads h ON h.hotel_id=r.hotel_id AND h.model_version=r.model_version
  JOIN bookings b ON b.id=c.booking_id
  WHERE c.booking_id=NEW.booking_id AND c.classification='TRACEABLE_SEGMENTS'
    AND c.status='ACTIVATING' AND r.status='ACTIVATING'
    AND r.activation_token=r.run_id
    AND h.run_id=r.run_id AND h.source_digest=r.source_digest
    AND s.room_id=NEW.room_id AND s.effective_start=NEW.effective_start AND s.effective_end=NEW.effective_end
    AND s.rate_cents=NEW.rate_cents AND s.source_rate_version=NEW.room_pricing_version
    AND s.operation_token=NEW.operation_token
    AND NEW.segment_version=b.pricing_version+1
    AND b.last_pricing_operation_token=NEW.operation_token
)
BEGIN
  SELECT RAISE(ABORT,'pricing segment source/version guard failed');
END;
CREATE TRIGGER active_stay_bootstrap_activation_snapshot_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN OLD.status='SHADOWED' AND NEW.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap source digest is no longer current')
  WHERE NOT EXISTS (
    SELECT 1 FROM active_stay_bootstrap_heads h
    WHERE h.hotel_id=NEW.hotel_id AND h.model_version=NEW.model_version
      AND h.run_id=NEW.run_id AND h.source_digest=NEW.source_digest
  );
  SELECT RAISE(ABORT,'active-stay booking snapshot is stale or conflicting')
  WHERE EXISTS (
    SELECT 1 FROM active_stay_bootstrap_candidates c
    JOIN bookings b ON b.id=c.booking_id
    WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS'
      AND (
        b.id<>json_extract(c.baseline_source_json,'$.booking.id')
        OR b.status<>json_extract(c.baseline_source_json,'$.booking.status')
        OR b.room_id<>json_extract(c.baseline_source_json,'$.booking.roomId')
        OR b.check_in<>json_extract(c.baseline_source_json,'$.booking.checkIn')
        OR b.check_out<>json_extract(c.baseline_source_json,'$.booking.checkOut')
        OR b.total_cents<>json_extract(c.baseline_source_json,'$.booking.totalCents')
        OR b.pricing_version<>json_extract(c.baseline_source_json,'$.booking.pricingVersion')
        OR COALESCE(b.last_pricing_operation_token,'')<>COALESCE(json_extract(c.baseline_source_json,'$.booking.lastPricingOperationToken'),'')
        OR b.updated_at<>json_extract(c.baseline_source_json,'$.booking.updatedAt')
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_candidate_segments s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.candidate_json,'$.segments'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_rooms s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.rooms'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.inventory'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.charges'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.payments'))
        OR (SELECT COUNT(*) FROM invoices i WHERE i.booking_id=b.id)<>1
        OR NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=b.id
          AND i.id=json_extract(c.baseline_source_json,'$.invoice.id')
          AND i.amount_cents=json_extract(c.baseline_source_json,'$.invoice.amountCents')
          AND i.paid_amount_cents=json_extract(c.baseline_source_json,'$.invoice.paidAmountCents')
          AND i.status=json_extract(c.baseline_source_json,'$.invoice.status')
          AND i.payment_method=json_extract(c.baseline_source_json,'$.invoice.paymentMethod')
          AND COALESCE(i.payment_reference,'')=COALESCE(json_extract(c.baseline_source_json,'$.invoice.paymentReference'),'')
          AND COALESCE(i.paid_at,'')=COALESCE(json_extract(c.baseline_source_json,'$.invoice.paidAt'),'')
          AND i.created_at=json_extract(c.baseline_source_json,'$.invoice.createdAt'))
        OR (SELECT COUNT(*) FROM extra_charges a WHERE a.booking_id=b.id)
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_charges s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM extra_charges a WHERE a.booking_id=b.id
            AND a.id=s.charge_id AND a.amount_cents=s.amount_cents AND a.description=s.description
            AND a.category=s.category AND a.created_at=s.created_at))
        OR EXISTS (SELECT 1 FROM extra_charges a WHERE a.booking_id=b.id AND NOT EXISTS (
          SELECT 1 FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id
            AND s.charge_id=a.id AND s.amount_cents=a.amount_cents AND s.description=a.description
            AND s.category=a.category AND s.created_at=a.created_at))
        OR (SELECT COUNT(*) FROM payment_entries p WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id))
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_payments s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM payment_entries p
            WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id)
              AND p.id=s.payment_id AND p.booking_id=s.booking_id AND p.amount_cents=s.amount_cents
              AND p.payment_method=s.payment_method AND COALESCE(p.payment_reference,'')=COALESCE(s.payment_reference,'')
              AND COALESCE(p.note,'')=COALESCE(s.note,'') AND p.received_by_user_id=s.received_by_user_id
              AND p.received_at=s.received_at AND COALESCE(p.operation_token,'')=COALESCE(s.operation_token,'')))
        OR EXISTS (SELECT 1 FROM payment_entries p WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id)
          AND NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id
            AND s.payment_id=p.id AND s.booking_id=p.booking_id AND s.amount_cents=p.amount_cents
            AND s.payment_method=p.payment_method AND COALESCE(s.payment_reference,'')=COALESCE(p.payment_reference,'')
            AND COALESCE(s.note,'')=COALESCE(p.note,'') AND s.received_by_user_id=p.received_by_user_id
            AND s.received_at=p.received_at AND COALESCE(s.operation_token,'')=COALESCE(p.operation_token,'')))
        OR (SELECT COUNT(*) FROM room_inventory_nights n JOIN active_stay_bootstrap_snapshot_rooms s
          ON s.candidate_id=c.candidate_id AND s.room_id=n.room_id
          WHERE n.stay_date>=b.check_in AND n.stay_date<b.check_out)
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_inventory s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n
            WHERE n.booking_id=s.booking_id AND n.room_id=s.room_id AND n.stay_date=s.stay_date))
        OR EXISTS (SELECT 1 FROM room_inventory_nights n JOIN active_stay_bootstrap_snapshot_rooms sr
          ON sr.candidate_id=c.candidate_id AND sr.room_id=n.room_id
          WHERE n.stay_date>=b.check_in AND n.stay_date<b.check_out AND NOT EXISTS (
            SELECT 1 FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id
              AND s.booking_id=n.booking_id AND s.room_id=n.room_id AND s.stay_date=n.stay_date))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_rooms s WHERE s.candidate_id=c.candidate_id)
          <>(SELECT COUNT(*) FROM rooms r JOIN active_stay_bootstrap_snapshot_rooms s
            ON s.candidate_id=c.candidate_id AND s.room_id=r.id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_rooms s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.id=s.room_id
            AND r.price_cents=s.price_cents AND r.pricing_version=s.pricing_version AND r.inventory_version=s.inventory_version
            AND r.room_state_version=s.room_state_version))
      )
  );
END;
CREATE TRIGGER active_stay_bootstrap_run_complete_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN NEW.status='COMPLETE' AND OLD.status IN ('SHADOWED','ACTIVATING')
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap activation is incomplete')
  WHERE (SELECT COUNT(*) FROM active_stay_bootstrap_candidates c WHERE c.run_id=NEW.run_id)
      <>json_array_length(json_extract(NEW.manifest_json,'$.candidates'))
    OR EXISTS (SELECT 1 FROM active_stay_bootstrap_candidates c
      WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS' AND c.status<>'ACTIVATED');
END;
CREATE TRIGGER active_stay_bootstrap_pricing_segment_snapshot_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN OLD.status='SHADOWED' AND NEW.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap canonical pricing segment snapshot is stale')
  WHERE EXISTS (
    SELECT 1 FROM active_stay_bootstrap_candidates c
    WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS'
      AND (
        COALESCE(json_type(c.baseline_source_json,'$.pricingSegments'),'')<>'array'
        OR (SELECT COUNT(*) FROM booking_pricing_segments s WHERE s.booking_id=c.booking_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.pricingSegments'))
        OR EXISTS (
          SELECT 1 FROM booking_pricing_segments s
          WHERE s.booking_id=c.booking_id AND NOT EXISTS (
            SELECT 1 FROM json_each(c.baseline_source_json,'$.pricingSegments') j
            WHERE json_extract(j.value,'$.segmentId')=s.segment_id
              AND json_extract(j.value,'$.bookingId')=s.booking_id
              AND json_extract(j.value,'$.roomId')=s.room_id
              AND json_extract(j.value,'$.effectiveStart')=s.effective_start
              AND json_extract(j.value,'$.effectiveEnd')=s.effective_end
              AND json_extract(j.value,'$.rateCents')=s.rate_cents
              AND json_extract(j.value,'$.roomPricingVersion')=s.room_pricing_version
              AND json_extract(j.value,'$.segmentVersion')=s.segment_version
              AND json_extract(j.value,'$.operationToken')=s.operation_token
              AND json_extract(j.value,'$.actorSubject')=s.actor_subject
              AND json_extract(j.value,'$.hotelId')=s.hotel_id
              AND json_extract(j.value,'$.requestId')=s.request_id
              AND json_extract(j.value,'$.createdAt')=s.created_at
          )
        )
        OR EXISTS (
          SELECT 1 FROM json_each(c.baseline_source_json,'$.pricingSegments') j
          WHERE NOT EXISTS (
            SELECT 1 FROM booking_pricing_segments s
            WHERE s.booking_id=c.booking_id
              AND s.segment_id=json_extract(j.value,'$.segmentId')
              AND s.booking_id=json_extract(j.value,'$.bookingId')
              AND s.room_id=json_extract(j.value,'$.roomId')
              AND s.effective_start=json_extract(j.value,'$.effectiveStart')
              AND s.effective_end=json_extract(j.value,'$.effectiveEnd')
              AND s.rate_cents=json_extract(j.value,'$.rateCents')
              AND s.room_pricing_version=json_extract(j.value,'$.roomPricingVersion')
              AND s.segment_version=json_extract(j.value,'$.segmentVersion')
              AND s.operation_token=json_extract(j.value,'$.operationToken')
              AND s.actor_subject=json_extract(j.value,'$.actorSubject')
              AND s.hotel_id=json_extract(j.value,'$.hotelId')
              AND s.request_id=json_extract(j.value,'$.requestId')
              AND s.created_at=json_extract(j.value,'$.createdAt')
          )
        )
      )
  );
END;
CREATE TRIGGER lifecycle_checkout_settlement_guard
BEFORE UPDATE OF status ON bookings
WHEN NEW.status = 'CHECKED_OUT' AND OLD.status = 'CHECKED_IN'
BEGIN
  SELECT (CASE WHEN NEW.check_out_payment_policy NOT IN ('settled', 'pending-approved')
    THEN RAISE(ABORT, 'checkout policy invalid') END);

  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.booking_id = OLD.id
      AND (i.status = 'VOIDED'
        OR i.amount_cents <> NEW.total_cents
        OR i.paid_amount_cents <> (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payment_entries p WHERE p.invoice_id = i.id)
        OR i.status <> CASE WHEN i.paid_amount_cents >= i.amount_cents THEN 'PAID' ELSE 'PENDING' END)
  ) THEN RAISE(ABORT, 'checkout account is inconsistent') END);

  SELECT (CASE WHEN NEW.check_out_payment_policy = 'settled' AND NOT (
    (NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id = OLD.id) AND NEW.total_cents = 0)
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.booking_id = OLD.id AND i.status <> 'VOIDED'
        AND i.amount_cents = NEW.total_cents
        AND i.paid_amount_cents = (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payment_entries p WHERE p.invoice_id = i.id)
        AND i.paid_amount_cents >= i.amount_cents
    )
  ) THEN RAISE(ABORT, 'checkout account is not settled') END);
END;
CREATE TRIGGER lifecycle_checkout_event_account_guard
BEFORE INSERT ON lifecycle_events
WHEN NEW.event_type = 'CHECK_OUT'
BEGIN
  SELECT (CASE WHEN NOT EXISTS (
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
  ) THEN RAISE(ABORT, 'checkout event account snapshot mismatch') END);
END;
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
CREATE TRIGGER extra_charge_operation_token_validate
BEFORE INSERT ON extra_charges
WHEN NEW.operation_token IS NOT NULL
  AND (length(trim(NEW.operation_token)) < 8 OR length(trim(NEW.operation_token)) > 120)
BEGIN
  SELECT RAISE(ABORT, 'extra charge operation token is invalid');
END;
CREATE TRIGGER extra_charge_legacy_identity_immutable
BEFORE UPDATE OF operation_token ON extra_charges
WHEN OLD.operation_token IS NULL AND NEW.operation_token IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'legacy extra charge operation identity is immutable');
END;
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
