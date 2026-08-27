DROP INDEX IF EXISTS idx_payment_entries_operation_token;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_entries_booking_operation_token ON payment_entries(booking_id, operation_token);
