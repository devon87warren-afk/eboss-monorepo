/**
 * Savings Service
 *
 * Provides CRUD operations for savings projections using Supabase.
 * Used by the SavingsCalculator component.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  SavingsProjection,
  CreateSavingsProjectionInput,
} from '../types/database';

/**
 * Error class for service-level errors
 */
export class SavingsServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SavingsServiceError';
  }
}

/**
 * Savings calculation constants (ANA EBOSS Specs)
 */
export const SAVINGS_CONSTANTS = {
  /** Standard 25kVA diesel generator burn rate (gal/hr) */
  STANDARD_BURN_RATE: 1.5,
  /** EBOSS hybrid burn rate (75% reduction) (gal/hr) */
  HYBRID_BURN_RATE: 0.375,
  /** CO2 emissions per gallon of diesel (lbs) - EPA standard */
  CO2_PER_GALLON: 22.4,
  /** Pounds per ton */
  LBS_PER_TON: 2000,
  /** CO2 absorbed per tree per year (lbs) */
  CO2_PER_TREE: 48,
};

/**
 * Calculate savings projection (client-side calculation)
 * Mirrors the database trigger calculation
 *
 * @param runtimeHours - Daily runtime hours
 * @param fuelPrice - Fuel price per gallon
 * @param projectDays - Project duration in days
 * @returns Calculated savings values
 */
export function calculateSavings(
  runtimeHours: number,
  fuelPrice: number,
  projectDays: number
): {
  fuelSaved: number;
  costSaved: number;
  co2SavedTons: number;
  co2SavedLbs: number;
  treesEquivalent: number;
} {
  const { STANDARD_BURN_RATE, HYBRID_BURN_RATE, CO2_PER_GALLON, LBS_PER_TON, CO2_PER_TREE } =
    SAVINGS_CONSTANTS;

  const totalStandardFuel = runtimeHours * projectDays * STANDARD_BURN_RATE;
  const totalHybridFuel = runtimeHours * projectDays * HYBRID_BURN_RATE;
  const fuelSaved = totalStandardFuel - totalHybridFuel;

  const costSaved = fuelSaved * fuelPrice;
  const co2SavedLbs = fuelSaved * CO2_PER_GALLON;
  const co2SavedTons = co2SavedLbs / LBS_PER_TON;
  const treesEquivalent = Math.floor(co2SavedLbs / CO2_PER_TREE);

  return {
    fuelSaved: Math.round(fuelSaved * 100) / 100,
    costSaved: Math.round(costSaved * 100) / 100,
    co2SavedTons: Math.round(co2SavedTons * 100) / 100,
    co2SavedLbs: Math.round(co2SavedLbs * 100) / 100,
    treesEquivalent,
  };
}

/**
 * Fetch all savings projections
 *
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of savings projections
 * @throws SavingsServiceError if query fails
 */
export async function fetchSavingsProjections(
  limit: number = 50
): Promise<SavingsProjection[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new SavingsServiceError(
      'Failed to fetch savings projections',
      error.code,
      error
    );
  }

  return (data ?? []) as SavingsProjection[];
}

/**
 * Fetch savings projections for a specific user
 *
 * @param userId - The user ID to filter by
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of savings projections
 * @throws SavingsServiceError if query fails
 */
export async function fetchUserSavingsProjections(
  userId: string,
  limit: number = 50
): Promise<SavingsProjection[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new SavingsServiceError(
      'Failed to fetch user savings projections',
      error.code,
      error
    );
  }

  return (data ?? []) as SavingsProjection[];
}

/**
 * Fetch savings projections for a specific unit
 *
 * @param serialNumber - The unit serial number
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of savings projections
 * @throws SavingsServiceError if query fails
 */
export async function fetchUnitSavingsProjections(
  serialNumber: string,
  limit: number = 50
): Promise<SavingsProjection[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .select('*')
    .eq('unit_serial_number', serialNumber)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new SavingsServiceError(
      'Failed to fetch unit savings projections',
      error.code,
      error
    );
  }

  return (data ?? []) as SavingsProjection[];
}

/**
 * Fetch a single savings projection by ID
 *
 * @param projectionId - The projection ID
 * @returns Savings projection or null if not found
 * @throws SavingsServiceError if query fails
 */
export async function fetchSavingsProjectionById(
  projectionId: string
): Promise<SavingsProjection | null> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .select('*')
    .eq('id', projectionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new SavingsServiceError(
      'Failed to fetch savings projection',
      error.code,
      error
    );
  }

  return data as SavingsProjection;
}

/**
 * Create a new savings projection
 * Note: The database trigger will auto-calculate fuel_saved, cost_saved, and co2_saved_tons
 * if not provided
 *
 * @param input - Projection input data
 * @returns The created savings projection
 * @throws SavingsServiceError if creation fails
 */
export async function createSavingsProjection(
  input: CreateSavingsProjectionInput
): Promise<SavingsProjection> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  // If savings values not provided, calculate them client-side
  // (The database trigger will do the same, but this provides consistency)
  let insertData: Record<string, unknown> = { ...input };
  if (
    input.fuel_saved === undefined ||
    input.cost_saved === undefined ||
    input.co2_saved_tons === undefined
  ) {
    const calculated = calculateSavings(
      input.runtime_hours,
      input.fuel_price,
      input.project_days
    );
    insertData = {
      ...input,
      fuel_saved: input.fuel_saved ?? calculated.fuelSaved,
      cost_saved: input.cost_saved ?? calculated.costSaved,
      co2_saved_tons: input.co2_saved_tons ?? calculated.co2SavedTons,
    };
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new SavingsServiceError(
      'Failed to create savings projection',
      error.code,
      error
    );
  }

  return data as SavingsProjection;
}

/**
 * Delete a savings projection
 *
 * @param projectionId - The projection ID to delete
 * @throws SavingsServiceError if deletion fails
 */
export async function deleteSavingsProjection(
  projectionId: string
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { error } = await supabase
    .from('savings_projections')
    .delete()
    .eq('id', projectionId);

  if (error) {
    throw new SavingsServiceError(
      'Failed to delete savings projection',
      error.code,
      error
    );
  }
}

/**
 * Get aggregate savings statistics
 *
 * @returns Aggregate totals across all projections
 * @throws SavingsServiceError if query fails
 */
export async function getSavingsStatistics(): Promise<{
  totalFuelSaved: number;
  totalCostSaved: number;
  totalCo2SavedTons: number;
  projectionCount: number;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SavingsServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('savings_projections')
    .select('fuel_saved, cost_saved, co2_saved_tons');

  if (error) {
    throw new SavingsServiceError(
      'Failed to fetch savings statistics',
      error.code,
      error
    );
  }

  const rows = (data ?? []) as Array<{
    fuel_saved: number | null;
    cost_saved: number | null;
    co2_saved_tons: number | null;
  }>;

  const totals = rows.reduce(
    (acc, row) => ({
      totalFuelSaved: acc.totalFuelSaved + (row.fuel_saved ?? 0),
      totalCostSaved: acc.totalCostSaved + (row.cost_saved ?? 0),
      totalCo2SavedTons: acc.totalCo2SavedTons + (row.co2_saved_tons ?? 0),
      projectionCount: acc.projectionCount + 1,
    }),
    {
      totalFuelSaved: 0,
      totalCostSaved: 0,
      totalCo2SavedTons: 0,
      projectionCount: 0,
    }
  );

  return {
    totalFuelSaved: Math.round(totals.totalFuelSaved * 100) / 100,
    totalCostSaved: Math.round(totals.totalCostSaved * 100) / 100,
    totalCo2SavedTons: Math.round(totals.totalCo2SavedTons * 100) / 100,
    projectionCount: totals.projectionCount,
  };
}
