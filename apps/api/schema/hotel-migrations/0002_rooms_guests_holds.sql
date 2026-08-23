PRAGMA foreign_keys = ON;

ALTER TABLE rooms ADD COLUMN room_type TEXT NOT NULL DEFAULT 'STANDARD';

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_holds (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  hold_type TEXT NOT NULL CHECK (hold_type IN ('Vip', 'Maintenance', 'Owner', 'Compliance', 'Commercial', 'Other')),
  reason TEXT NOT NULL,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_room_holds_room_dates
  ON room_holds (room_id, start_date, end_date);
