/**
 * Cloud SQL Database Type Definitions
 *
 * TypeScript interfaces matching the Cloud SQL PostgreSQL schema defined in
 * infrastructure/cloud-sql/001_unified_schema.sql.
 *
 * Pattern: Each table has Row (full record), Insert (creation input), and
 * Update (partial mutation) interfaces following the existing codebase
 * convention in apps/tech/src/types/database.ts.
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Maps to PostgreSQL enum: user_role */
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'technician' | 'support';

/** Maps to PostgreSQL enum: unit_status */
export type UnitStatus = 'running' | 'down' | 'maintenance' | 'decommissioned';

/** Maps to PostgreSQL enum: checklist_status */
export type ChecklistStatus = 'draft' | 'in_progress' | 'completed' | 'void';

/** Checklist section identifiers */
export type ChecklistSection =
  | 'safety_physical'
  | 'mechanical'
  | 'electrical'
  | 'vfd_controls'
  | 'bess_hybrid';

// ============================================================================
// CHECKLIST ITEM (jsonb structure)
// ============================================================================

/**
 * Individual checklist item stored in commissioning_checklists.items jsonb.
 *
 * - `checkbox` items: technician toggles `completed`.
 * - `input` items: technician enters a measured `value` (e.g. battery voltage).
 */
export interface ChecklistItem {
  /** Unique item identifier within the checklist */
  id: string;
  /** Which section this item belongs to */
  section: ChecklistSection;
  /** Human-readable label (e.g. "Grounding Verification") */
  label: string;
  /** Item type: checkbox (toggle) or input (measured value) */
  type: 'checkbox' | 'input';
  /** Whether the item has been completed */
  completed: boolean;
  /** Measured value for input items, null for checkbox items */
  value: string | null;
}

// ============================================================================
// TERRITORIES
// ============================================================================

/** Full territory row from the database */
export interface TerritoryRow {
  id: string;
  name: string;
  region: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/** Input for creating a territory */
export interface TerritoryInsert {
  id: string;
  name: string;
  region: string;
  timezone?: string;
}

/** Input for updating a territory */
export interface TerritoryUpdate {
  name?: string;
  region?: string;
  timezone?: string;
}

// ============================================================================
// USER PROFILES
// ============================================================================

/** Full user_profiles row from the database */
export interface UserProfileRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territory_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input for creating a user profile */
export interface UserProfileInsert {
  id?: string;
  email: string;
  name: string;
  role?: UserRole;
  territory_id?: string | null;
  is_active?: boolean;
}

/** Input for updating a user profile */
export interface UserProfileUpdate {
  email?: string;
  name?: string;
  role?: UserRole;
  territory_id?: string | null;
  is_active?: boolean;
}

// ============================================================================
// UNITS
// ============================================================================

/** Full units row from the database */
export interface UnitRow {
  id: string;
  serial_number: string;
  model: string;
  manufacturing_date: string | null;
  status: UnitStatus;
  location: string | null;
  territory_id: string | null;
  customer_name: string | null;
  runtime_hours: number;
  condition_score: number | null;
  telemetry_status: string | null;
  recent_readings: unknown[];
  active_alerts: unknown[];
  created_at: string;
  updated_at: string;
}

/** Input for creating a unit */
export interface UnitInsert {
  id?: string;
  serial_number: string;
  model: string;
  manufacturing_date?: string | null;
  status?: UnitStatus;
  location?: string | null;
  territory_id?: string | null;
  customer_name?: string | null;
  runtime_hours?: number;
  condition_score?: number | null;
  telemetry_status?: string | null;
  recent_readings?: unknown[];
  active_alerts?: unknown[];
}

/** Input for updating a unit */
export interface UnitUpdate {
  serial_number?: string;
  model?: string;
  manufacturing_date?: string | null;
  status?: UnitStatus;
  location?: string | null;
  territory_id?: string | null;
  customer_name?: string | null;
  runtime_hours?: number;
  condition_score?: number | null;
  telemetry_status?: string | null;
  recent_readings?: unknown[];
  active_alerts?: unknown[];
}

// ============================================================================
// COMMISSIONING CHECKLISTS
// ============================================================================

/** Full commissioning_checklists row from the database */
export interface CommissioningChecklistRow {
  id: string;
  unit_id: string;
  technician_id: string;
  territory_id: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
  observations: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Input for creating a commissioning checklist */
export interface CommissioningChecklistInsert {
  id?: string;
  unit_id: string;
  technician_id: string;
  territory_id: string;
  status?: ChecklistStatus;
  items?: ChecklistItem[];
  observations?: string | null;
  started_at?: string | null;
}

/** Input for updating a commissioning checklist */
export interface CommissioningChecklistUpdate {
  status?: ChecklistStatus;
  items?: ChecklistItem[];
  observations?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

// ============================================================================
// DATABASE SCHEMA TYPE (for Cloud SQL client typing)
// ============================================================================

/**
 * Database schema type mapping table names to their Row/Insert/Update shapes.
 * Mirrors the pattern used in apps/tech/src/types/database.ts for Supabase.
 */
export interface CloudSqlDatabase {
  public: {
    Tables: {
      territories: {
        Row: TerritoryRow;
        Insert: TerritoryInsert;
        Update: TerritoryUpdate;
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      units: {
        Row: UnitRow;
        Insert: UnitInsert;
        Update: UnitUpdate;
      };
      commissioning_checklists: {
        Row: CommissioningChecklistRow;
        Insert: CommissioningChecklistInsert;
        Update: CommissioningChecklistUpdate;
      };
    };
    Enums: {
      user_role: UserRole;
      unit_status: UnitStatus;
      checklist_status: ChecklistStatus;
    };
  };
}
