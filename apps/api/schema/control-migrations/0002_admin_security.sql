PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS network_memberships (
  access_subject TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role = 'saas_admin'),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  FOREIGN KEY (access_subject) REFERENCES access_identity_mappings(access_subject)
);

CREATE TABLE IF NOT EXISTS hotel_admin_metadata (
  hotel_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  address TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'FREE',
  features_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (hotel_id) REFERENCES control_hotels(id)
);

CREATE TABLE IF NOT EXISTS control_audit_events (
  id TEXT PRIMARY KEY,
  actor_subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  hotel_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_control_audit_events_newest
  ON control_audit_events (created_at DESC, id DESC);
