/**
 * Commissioning Service
 *
 * Provides serial number lookup for eBoss units using Supabase.
 * Enforces territory-based Row Level Security (RLS) so technicians
 * can only access units in their assigned territories.
 *
 * Serial Number Format: EBOSS-{MODEL}-{YEAR}-{SEQ}
 * Example: EBOSS-60KW-2025-001234
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { EbossUnit, EbossModel } from '@/types/database';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Supported eBoss model variants */
export const EBOSS_MODELS: EbossModel[] = ['30KW', '60KW', '100KW', '150KW'];

/**
 * Serial number validation regex.
 * Format: EBOSS-{MODEL}-{YEAR}-{SEQ}
 * - MODEL: 30KW | 60KW | 100KW | 150KW
 * - YEAR:  4-digit year (e.g. 2025)
 * - SEQ:   1–6 digit sequence (e.g. 001234)
 */
export const SERIAL_NUMBER_REGEX =
  /^EBOSS-(30KW|60KW|100KW|150KW)-(\d{4})-(\d{1,6})$/;

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Error class for commissioning service errors
 */
export class CommissioningServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CommissioningServiceError';
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a serial number against the expected EBOSS format.
 *
 * @param serialNumber - The serial number string to validate
 * @returns true if the format is valid, false otherwise
 */
export function validateSerialNumber(serialNumber: string): boolean {
  return SERIAL_NUMBER_REGEX.test(serialNumber.trim().toUpperCase());
}

/**
 * Parse a validated serial number into its component parts.
 *
 * @param serialNumber - A validated serial number
 * @returns Parsed components or null if invalid
 */
export function parseSerialNumber(serialNumber: string): {
  model: EbossModel;
  year: number;
  sequence: string;
} | null {
  const match = serialNumber.trim().toUpperCase().match(SERIAL_NUMBER_REGEX);
  if (!match) return null;

  return {
    model: match[1] as EbossModel,
    year: parseInt(match[2], 10),
    sequence: match[3],
  };
}

// ============================================================================
// LOOKUP
// ============================================================================

/**
 * Look up an eBoss unit by serial number.
 *
 * Territory RLS is enforced at the database level via policy:
 *   territory_id IN (SELECT territory_id FROM user_profiles WHERE id = auth.uid())
 *
 * @param serialNumber - The serial number to look up
 * @returns The unit record, or null if not found / outside territory
 * @throws CommissioningServiceError if the query fails or Supabase is not configured
 */
export async function lookupUnitBySerialNumber(
  serialNumber: string
): Promise<EbossUnit | null> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new CommissioningServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const normalized = serialNumber.trim().toUpperCase();

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('serial_number', normalized)
    .maybeSingle();

  if (error) {
    throw new CommissioningServiceError(
      'Failed to look up unit by serial number',
      error.code,
      error
    );
  }

  return (data as EbossUnit) ?? null;
}
