PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_hotel_operational_binding
  ON control_hotels (operational_binding) WHERE active = 1;

UPDATE hotel_admin_metadata SET plan_tier = 'BASIC' WHERE plan_tier = 'FREE';

CREATE TRIGGER IF NOT EXISTS trg_hotel_plan_insert_valid
BEFORE INSERT ON hotel_admin_metadata
WHEN NEW.plan_tier NOT IN ('BASIC', 'PRO', 'ENTERPRISE')
BEGIN SELECT RAISE(ABORT, 'invalid plan tier'); END;

CREATE TRIGGER IF NOT EXISTS trg_hotel_plan_update_valid
BEFORE UPDATE OF plan_tier ON hotel_admin_metadata
WHEN NEW.plan_tier NOT IN ('BASIC', 'PRO', 'ENTERPRISE')
BEGIN SELECT RAISE(ABORT, 'invalid plan tier'); END;
