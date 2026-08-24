ALTER TABLE cash_closures ADD COLUMN operation_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_closures_operation_token ON cash_closures(operation_token);
