PRAGMA foreign_keys = OFF;

CREATE TABLE bookings_reception_lifecycle (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  notes TEXT,
  checked_in_at TEXT,
  checked_in_by TEXT,
  checked_out_at TEXT,
  checked_out_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  CHECK (check_out > check_in)
);

INSERT INTO bookings_reception_lifecycle
  (id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at)
SELECT id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at
FROM bookings;

DROP TABLE bookings;
ALTER TABLE bookings_reception_lifecycle RENAME TO bookings;
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings (guest_id, created_at);
CREATE INDEX idx_bookings_room ON bookings (room_id, check_in);
CREATE INDEX idx_bookings_status ON bookings (status, check_in);

CREATE TABLE IF NOT EXISTS lifecycle_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('CHECK_IN', 'REASSIGN', 'CHECK_OUT')),
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_booking ON lifecycle_events (booking_id, created_at);

PRAGMA foreign_keys = ON;
