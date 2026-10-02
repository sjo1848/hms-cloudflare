-- Synthetic-only pre-0019 preservation fixture. Stable IDs and explicit values.
INSERT INTO guests (id, full_name, email, phone, created_at) VALUES
  ('diag-guest-unpaid', 'Diagnostic Unpaid', 'diag-unpaid@example.invalid', NULL, '2026-10-02T00:00:00Z'),
  ('diag-guest-partial', 'Diagnostic Partial', 'diag-partial@example.invalid', '555-0102', '2026-10-02T00:00:00Z'),
  ('diag-guest-paid', 'Diagnostic Paid', 'diag-paid@example.invalid', NULL, '2026-10-02T00:00:00Z');

INSERT INTO rooms (id, room_number, status, price_cents, room_type) VALUES
  ('diag-room-unpaid', 'D101', 'AVAILABLE', 6000, 'STANDARD'),
  ('diag-room-partial', 'D102', 'AVAILABLE', 10000, 'STANDARD'),
  ('diag-room-paid', 'D103', 'AVAILABLE', 10000, 'STANDARD');

INSERT INTO bookings (id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at, guest_name_snapshot) VALUES
  ('diag-booking-unpaid', 'diag-guest-unpaid', 'diag-room-unpaid', '2026-10-10', '2026-10-12', 'CONFIRMED', 12000, 'synthetic unpaid preservation fixture', '2026-10-02T00:01:00Z', '2026-10-02T00:01:00Z', 'Diagnostic Unpaid'),
  ('diag-booking-partial', 'diag-guest-partial', 'diag-room-partial', '2026-10-11', '2026-10-13', 'CONFIRMED', 20000, 'synthetic partial preservation fixture', '2026-10-02T00:02:00Z', '2026-10-02T00:02:00Z', 'Diagnostic Partial'),
  ('diag-booking-paid', 'diag-guest-paid', 'diag-room-paid', '2026-10-12', '2026-10-14', 'CONFIRMED', 10000, 'synthetic paid preservation fixture', '2026-10-02T00:03:00Z', '2026-10-02T00:03:00Z', 'Diagnostic Paid');

INSERT INTO invoices (id, booking_id, amount_cents, paid_amount_cents, status, payment_method, payment_reference, paid_at, created_at) VALUES
  ('diag-invoice-unpaid', 'diag-booking-unpaid', 12000, 0, 'PENDING', 'CASH', NULL, NULL, '2026-10-02T00:01:00Z'),
  ('diag-invoice-partial', 'diag-booking-partial', 20000, 7000, 'PENDING', 'CARD', 'diag-invoice-ref-partial', NULL, '2026-10-02T00:02:00Z'),
  ('diag-invoice-paid', 'diag-booking-paid', 10000, 10000, 'PAID', 'TRANSFER', 'diag-invoice-ref-paid', '2026-10-02T00:03:00Z', '2026-10-02T00:03:00Z');

INSERT INTO payment_entries (id, invoice_id, booking_id, amount_cents, payment_method, payment_reference, note, received_by_user_id, received_at, operation_token) VALUES
  ('diag-payment-partial-cash', 'diag-invoice-partial', 'diag-booking-partial', 3000, 'CASH', 'diag-ref-cash-001', 'first partial payment', 'diag-actor', '2026-10-02T00:10:00Z', 'diag-op-partial-cash'),
  ('diag-payment-partial-card', 'diag-invoice-partial', 'diag-booking-partial', 4000, 'CARD', NULL, NULL, 'diag-actor', '2026-10-02T00:11:00Z', NULL),
  ('diag-payment-paid', 'diag-invoice-paid', 'diag-booking-paid', 10000, 'TRANSFER', 'diag-ref-transfer-001', 'settled synthetic invoice', 'diag-actor', '2026-10-02T00:12:00Z', 'diag-op-paid-transfer');
