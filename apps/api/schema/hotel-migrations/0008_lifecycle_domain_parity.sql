ALTER TABLE bookings ADD COLUMN check_in_guests_count INTEGER;
ALTER TABLE bookings ADD COLUMN check_out_payment_policy TEXT;
ALTER TABLE bookings ADD COLUMN check_out_reference TEXT;

CREATE TRIGGER IF NOT EXISTS lifecycle_checkin_guest_count_guard
BEFORE UPDATE OF status ON bookings
WHEN NEW.status = 'CHECKED_IN'
BEGIN
  SELECT CASE WHEN NEW.check_in_guests_count IS NULL OR NEW.check_in_guests_count < 1
    THEN RAISE(ABORT, 'check-in guest count required') END;
END;
