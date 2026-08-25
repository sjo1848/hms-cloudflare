PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS migration_rehearsals (
  rehearsal_id TEXT PRIMARY KEY,
  source_baseline TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'APPLIED')
);
