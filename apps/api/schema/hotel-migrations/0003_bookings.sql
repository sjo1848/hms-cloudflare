PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings (guest_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings (room_id, check_in);
