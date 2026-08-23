PRAGMA foreign_keys = ON;

-- Operational records belong in a hotel database, never in CONTROL_DB.
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
);

CREATE TABLE IF NOT EXISTS room_inventory_nights (
  room_id TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  PRIMARY KEY (room_id, stay_date),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
