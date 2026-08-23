PRAGMA foreign_keys = OFF;

CREATE TABLE room_inventory_nights_with_booking_fk (
  room_id TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  PRIMARY KEY (room_id, stay_date),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO room_inventory_nights_with_booking_fk (room_id, stay_date, booking_id)
  SELECT room_id, stay_date, booking_id FROM room_inventory_nights;

DROP TABLE room_inventory_nights;
ALTER TABLE room_inventory_nights_with_booking_fk RENAME TO room_inventory_nights;
CREATE INDEX IF NOT EXISTS idx_room_inventory_nights_booking
  ON room_inventory_nights (booking_id);

PRAGMA foreign_keys = ON;
