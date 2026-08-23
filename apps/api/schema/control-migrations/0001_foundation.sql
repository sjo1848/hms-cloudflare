PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS control_hotels (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  operational_binding TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS access_identity_mappings (
  access_subject TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS hotel_memberships (
  access_subject TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  PRIMARY KEY (access_subject, hotel_id),
  FOREIGN KEY (access_subject) REFERENCES access_identity_mappings(access_subject),
  FOREIGN KEY (hotel_id) REFERENCES control_hotels(id)
);

CREATE INDEX IF NOT EXISTS idx_hotel_memberships_subject_active
  ON hotel_memberships (access_subject, active);
