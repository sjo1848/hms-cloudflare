PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agent_mutation_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'CANCEL')),
  tenant_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (booking_id, action)
);

CREATE INDEX IF NOT EXISTS idx_agent_mutation_booking ON agent_mutation_events(booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_mutation_trace ON agent_mutation_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_agent_mutation_actor ON agent_mutation_events(actor_id, created_at);
