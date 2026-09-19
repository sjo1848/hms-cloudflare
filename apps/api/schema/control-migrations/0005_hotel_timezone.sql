PRAGMA foreign_keys = ON;

ALTER TABLE hotel_admin_metadata
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Argentina/Mendoza';

UPDATE hotel_admin_metadata
SET timezone = 'America/Argentina/Mendoza';
