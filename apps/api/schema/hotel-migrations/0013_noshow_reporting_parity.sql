PRAGMA foreign_keys = OFF;
DROP TRIGGER IF EXISTS lifecycle_checkout_atomic_guard;
DROP TRIGGER IF EXISTS lifecycle_reassign_atomic_guard;
DROP TRIGGER IF EXISTS lifecycle_checkin_guest_count_guard;
DROP TRIGGER IF EXISTS trg_extra_charge_total;
CREATE TABLE bookings_noshow_parity (
  id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, room_id TEXT NOT NULL,
  check_in TEXT NOT NULL, check_out TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','CHECKED_IN','CHECKED_OUT','NO_SHOW')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0), notes TEXT,
  checked_in_at TEXT, checked_in_by TEXT, checked_out_at TEXT, checked_out_by TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  check_in_guests_count INTEGER, check_out_payment_policy TEXT, check_out_reference TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id), FOREIGN KEY (room_id) REFERENCES rooms(id), CHECK (check_out > check_in)
);
INSERT INTO bookings_noshow_parity SELECT * FROM bookings;
DROP TABLE bookings;
ALTER TABLE bookings_noshow_parity RENAME TO bookings;
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings (guest_id, created_at);
CREATE INDEX idx_bookings_room ON bookings (room_id, check_in);
CREATE INDEX idx_bookings_status ON bookings (status, check_in);
CREATE TRIGGER lifecycle_checkout_atomic_guard BEFORE INSERT ON lifecycle_events WHEN NEW.event_type = 'CHECK_OUT' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_OUT' AND r.id = NEW.from_room_id AND r.status = 'DIRTY') THEN RAISE(ABORT, 'checkout atomic guard failed') END; END;
CREATE TRIGGER lifecycle_reassign_atomic_guard BEFORE INSERT ON lifecycle_events WHEN NEW.event_type = 'REASSIGN' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM bookings b JOIN rooms old_room ON old_room.id = NEW.from_room_id JOIN rooms new_room ON new_room.id = b.room_id WHERE b.id = NEW.booking_id AND b.status = 'CHECKED_IN' AND json_extract(NEW.details_json, '$.to_room_id') = b.room_id AND new_room.status = 'OCCUPIED' AND old_room.status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id = b.id AND n.room_id = b.room_id) AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id = b.room_id AND h.start_date < b.check_out AND h.end_date > b.check_in) ) THEN RAISE(ABORT, 'reassignment atomic guard failed') END; END;
CREATE TRIGGER lifecycle_checkin_guest_count_guard BEFORE UPDATE OF status ON bookings WHEN NEW.status = 'CHECKED_IN' BEGIN SELECT CASE WHEN NEW.check_in_guests_count IS NULL OR NEW.check_in_guests_count < 1 THEN RAISE(ABORT, 'check-in guest count required') END; END;
CREATE TRIGGER trg_extra_charge_total AFTER INSERT ON extra_charges BEGIN UPDATE bookings SET total_cents = total_cents + NEW.amount_cents, updated_at = NEW.created_at WHERE id = NEW.booking_id; UPDATE invoices SET amount_cents = amount_cents + NEW.amount_cents WHERE booking_id = NEW.booking_id AND status = 'PENDING'; END;
PRAGMA foreign_keys = ON;
