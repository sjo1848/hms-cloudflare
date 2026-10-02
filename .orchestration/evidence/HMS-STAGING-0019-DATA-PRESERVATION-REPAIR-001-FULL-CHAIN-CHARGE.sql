-- Synthetic-only valid charge added to the unpaid booking before migration 0019.
-- The accepted 0010 trigger increments booking/invoice amount by exactly 500 cents.
INSERT INTO extra_charges (id, booking_id, description, amount_cents, category, created_at)
VALUES ('diag-charge-unpaid', 'diag-booking-unpaid', 'Synthetic minibar charge', 500, 'MINIBAR', '2026-10-02T00:20:00Z');
