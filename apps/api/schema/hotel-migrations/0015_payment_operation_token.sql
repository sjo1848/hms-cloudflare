ALTER TABLE payment_entries ADD COLUMN operation_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_entries_operation_token ON payment_entries(operation_token);