-- ============================================================================
-- EBOSS Cloud SQL Unified Schema
-- Migration: 001_unified_schema.sql
-- PostgreSQL 15 | Cloud SQL (db-custom-2-7680, us-west1)
--
-- Tables: territories, user_profiles, units, commissioning_checklists
-- Includes: enums, RLS policies, indexes, triggers, comments
--
-- Prerequisites:
--   - Cloud SQL PostgreSQL 15 instance provisioned in us-west1
--   - Cloud SQL Auth Proxy configured (see cloud-sql-proxy-config.yaml)
--   - Application role 'app_user' created (see below)
--
-- RLS Strategy:
--   Application sets session variables per request:
--     SET app.current_user_id = '<user-uuid>';
--     SET app.current_territory_id = '<territory-id>';
--     SET app.current_user_role = '<role>';
--   Policies use current_setting() to enforce territory boundaries.
-- ============================================================================

BEGIN;

-- ============================================================================
-- ROLES
-- ============================================================================

-- Application role used by the pg Pool connection.
-- The Cloud Run service connects as this role; RLS policies apply to it.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN;
  END IF;
END $$;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'technician', 'support');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('running', 'down', 'maintenance', 'decommissioned');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE checklist_status AS ENUM ('draft', 'in_progress', 'completed', 'void');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- HELPER: updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: territories
-- ============================================================================

CREATE TABLE IF NOT EXISTS territories (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  region      text        NOT NULL,
  timezone    text        NOT NULL DEFAULT 'America/Los_Angeles',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  territories            IS 'Geographic service territories (13-state coverage)';
COMMENT ON COLUMN territories.id         IS 'Territory identifier (e.g. "west-1", "north-3")';
COMMENT ON COLUMN territories.region     IS 'Parent region: West, North, East, South';
COMMENT ON COLUMN territories.timezone   IS 'IANA timezone for the territory';

CREATE TRIGGER trg_territories_updated_at
  BEFORE UPDATE ON territories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'technician',
  territory_id  text        REFERENCES territories(id),
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  user_profiles                IS 'User accounts with role and territory assignment';
COMMENT ON COLUMN user_profiles.id             IS 'UUID primary key (matches Supabase Auth uid where applicable)';
COMMENT ON COLUMN user_profiles.role           IS 'RBAC role: admin, manager, supervisor, technician, support';
COMMENT ON COLUMN user_profiles.territory_id   IS 'FK to territories; nullable for admin/support roles';

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: units
-- ============================================================================

CREATE TABLE IF NOT EXISTS units (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number       text        NOT NULL UNIQUE,
  model               text        NOT NULL,
  manufacturing_date  date,
  status              unit_status NOT NULL DEFAULT 'running',
  location            text,
  territory_id        text        REFERENCES territories(id),
  customer_name       text,
  runtime_hours       integer     NOT NULL DEFAULT 0,
  condition_score     integer,
  telemetry_status    text,
  recent_readings     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  active_alerts       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  units                   IS 'Generator fleet units with status and telemetry';
COMMENT ON COLUMN units.serial_number     IS 'Manufacturer serial number (unique business key)';
COMMENT ON COLUMN units.territory_id      IS 'FK to territories; required for RLS territory scoping';
COMMENT ON COLUMN units.recent_readings   IS 'Latest telemetry readings (jsonb array)';
COMMENT ON COLUMN units.active_alerts     IS 'Current active alert objects (jsonb array)';

CREATE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: commissioning_checklists
-- ============================================================================

CREATE TABLE IF NOT EXISTS commissioning_checklists (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         uuid              NOT NULL REFERENCES units(id),
  technician_id   uuid              NOT NULL REFERENCES user_profiles(id),
  territory_id    text              NOT NULL REFERENCES territories(id),
  status          checklist_status  NOT NULL DEFAULT 'draft',
  items           jsonb             NOT NULL DEFAULT '[]'::jsonb,
  observations    text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);

COMMENT ON TABLE  commissioning_checklists              IS 'Commissioning checklist records per unit';
COMMENT ON COLUMN commissioning_checklists.items        IS 'Checklist items as jsonb array. Each item: {"id": "string", "section": "safety_physical|mechanical|electrical|vfd_controls|bess_hybrid", "label": "string", "type": "checkbox|input", "completed": bool, "value": "string|null"}';
COMMENT ON COLUMN commissioning_checklists.territory_id IS 'Denormalized from unit for efficient RLS filtering';
COMMENT ON COLUMN commissioning_checklists.observations IS 'Free-text field notes from technician';

CREATE TRIGGER trg_commissioning_checklists_updated_at
  BEFORE UPDATE ON commissioning_checklists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_territory_id
  ON user_profiles(territory_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role
  ON user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_units_territory_id
  ON units(territory_id);

CREATE INDEX IF NOT EXISTS idx_units_serial_number
  ON units(serial_number);

CREATE INDEX IF NOT EXISTS idx_units_status
  ON units(status);

CREATE INDEX IF NOT EXISTS idx_commissioning_checklists_unit_id
  ON commissioning_checklists(unit_id);

CREATE INDEX IF NOT EXISTS idx_commissioning_checklists_technician_id
  ON commissioning_checklists(technician_id);

CREATE INDEX IF NOT EXISTS idx_commissioning_checklists_territory_id
  ON commissioning_checklists(territory_id);

CREATE INDEX IF NOT EXISTS idx_commissioning_checklists_status
  ON commissioning_checklists(status);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE territories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioning_checklists ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Territories: all authenticated users can read; only admins can modify.
-- ---------------------------------------------------------------------------

CREATE POLICY territories_read ON territories
  FOR SELECT TO app_user
  USING (true);

CREATE POLICY territories_admin_write ON territories
  FOR ALL TO app_user
  USING (
    current_setting('app.current_user_role', true) = 'admin'
  );

-- ---------------------------------------------------------------------------
-- User Profiles: users can read profiles in their territory or their own.
-- Admins can read all. Self-update restricted to non-sensitive columns.
-- ---------------------------------------------------------------------------

CREATE POLICY user_profiles_read ON user_profiles
  FOR SELECT TO app_user
  USING (
    id::text = current_setting('app.current_user_id', true)
    OR territory_id = current_setting('app.current_territory_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Self-update: users can update their own profile but CANNOT change
-- role, territory_id, or is_active (prevents privilege escalation).
CREATE POLICY user_profiles_self_update ON user_profiles
  FOR UPDATE TO app_user
  USING (
    id::text = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    id::text = current_setting('app.current_user_id', true)
    AND role = (SELECT up.role FROM user_profiles up WHERE up.id::text = current_setting('app.current_user_id', true))
    AND territory_id IS NOT DISTINCT FROM (SELECT up.territory_id FROM user_profiles up WHERE up.id::text = current_setting('app.current_user_id', true))
    AND is_active = (SELECT up.is_active FROM user_profiles up WHERE up.id::text = current_setting('app.current_user_id', true))
  );

CREATE POLICY user_profiles_admin_all ON user_profiles
  FOR ALL TO app_user
  USING (
    current_setting('app.current_user_role', true) = 'admin'
  );

-- ---------------------------------------------------------------------------
-- Units: territory-scoped read access; admins/managers can read and write all.
-- ---------------------------------------------------------------------------

CREATE POLICY units_territory_read ON units
  FOR SELECT TO app_user
  USING (
    territory_id = current_setting('app.current_territory_id', true)
    OR current_setting('app.current_user_role', true) IN ('admin', 'manager')
  );

CREATE POLICY units_admin_write ON units
  FOR ALL TO app_user
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'manager')
  );

-- ---------------------------------------------------------------------------
-- Commissioning Checklists: technicians see their territory's checklists.
-- They can create/update checklists they own. Admins/managers have full CRUD.
-- ---------------------------------------------------------------------------

CREATE POLICY checklists_territory_read ON commissioning_checklists
  FOR SELECT TO app_user
  USING (
    territory_id = current_setting('app.current_territory_id', true)
    OR current_setting('app.current_user_role', true) IN ('admin', 'manager')
  );

CREATE POLICY checklists_technician_insert ON commissioning_checklists
  FOR INSERT TO app_user
  WITH CHECK (
    technician_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY checklists_technician_update ON commissioning_checklists
  FOR UPDATE TO app_user
  USING (
    technician_id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) IN ('admin', 'manager')
  );

CREATE POLICY checklists_admin_all ON commissioning_checklists
  FOR ALL TO app_user
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'manager')
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON territories              TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles            TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON units                    TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON commissioning_checklists TO app_user;

COMMIT;
