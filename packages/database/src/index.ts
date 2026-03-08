/**
 * @eboss/database - Cloud SQL Database Package
 *
 * Provides typed database client and schema types for the EBOSS
 * Cloud SQL PostgreSQL commissioning module.
 */

// Database client and connection helpers
export {
  withContext,
  queryWithContext,
  query,
  disconnect,
  pool,
} from './client';

export type { SessionContext } from './client';

// Schema types
export type {
  // Enums
  UserRole,
  UnitStatus,
  ChecklistStatus,
  ChecklistSection,

  // Checklist item (jsonb)
  ChecklistItem,

  // Territories
  TerritoryRow,
  TerritoryInsert,
  TerritoryUpdate,

  // User Profiles
  UserProfileRow,
  UserProfileInsert,
  UserProfileUpdate,

  // Units
  UnitRow,
  UnitInsert,
  UnitUpdate,

  // Commissioning Checklists
  CommissioningChecklistRow,
  CommissioningChecklistInsert,
  CommissioningChecklistUpdate,

  // Full schema type
  CloudSqlDatabase,
} from './types';
