PRAGMA foreign_keys = ON;

-- CF-ARCH-HARDENING-II: dashboard departures and checkout-day reporting filter
-- by booking status and exact check_out date. Existing idx_bookings_status covers
-- status + check_in; this complementary index avoids a scan for checkout lookups.
CREATE INDEX IF NOT EXISTS idx_bookings_status_checkout
  ON bookings (status, check_out);
