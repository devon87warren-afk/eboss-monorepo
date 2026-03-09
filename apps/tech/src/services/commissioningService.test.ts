/**
 * Commissioning Service Tests
 *
 * Tests for serial number validation, parsing, and unit lookup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateSerialNumber,
  parseSerialNumber,
  lookupUnitBySerialNumber,
  CommissioningServiceError,
  SERIAL_NUMBER_REGEX,
  EBOSS_MODELS,
} from './commissioningService';

// Mock the supabase module
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

let mockIsConfigured = true;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => mockIsConfigured,
}));

describe('commissioningService', () => {
  beforeEach(() => {
    mockIsConfigured = true;
    vi.clearAllMocks();

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe('EBOSS_MODELS', () => {
    it('exports all four model variants', () => {
      expect(EBOSS_MODELS).toEqual(['30KW', '60KW', '100KW', '150KW']);
    });
  });

  // ============================================================================
  // validateSerialNumber
  // ============================================================================

  describe('validateSerialNumber', () => {
    it('accepts valid 60KW serial number', () => {
      expect(validateSerialNumber('EBOSS-60KW-2025-001234')).toBe(true);
    });

    it('accepts all model variants', () => {
      expect(validateSerialNumber('EBOSS-30KW-2025-001')).toBe(true);
      expect(validateSerialNumber('EBOSS-60KW-2025-001')).toBe(true);
      expect(validateSerialNumber('EBOSS-100KW-2025-001')).toBe(true);
      expect(validateSerialNumber('EBOSS-150KW-2025-001')).toBe(true);
    });

    it('is case-insensitive (normalises input)', () => {
      expect(validateSerialNumber('eboss-60kw-2025-001234')).toBe(true);
    });

    it('trims surrounding whitespace', () => {
      expect(validateSerialNumber('  EBOSS-60KW-2025-001234  ')).toBe(true);
    });

    it('rejects missing EBOSS prefix', () => {
      expect(validateSerialNumber('60KW-2025-001234')).toBe(false);
    });

    it('rejects unknown model', () => {
      expect(validateSerialNumber('EBOSS-200KW-2025-001234')).toBe(false);
    });

    it('rejects wrong year format', () => {
      expect(validateSerialNumber('EBOSS-60KW-25-001234')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateSerialNumber('')).toBe(false);
    });

    it('rejects random strings', () => {
      expect(validateSerialNumber('not-a-serial')).toBe(false);
    });

    it('SERIAL_NUMBER_REGEX is exported and consistent with validateSerialNumber', () => {
      const valid = 'EBOSS-100KW-2024-000001';
      expect(SERIAL_NUMBER_REGEX.test(valid)).toBe(true);
      expect(validateSerialNumber(valid)).toBe(true);
    });
  });

  // ============================================================================
  // parseSerialNumber
  // ============================================================================

  describe('parseSerialNumber', () => {
    it('parses a valid serial number', () => {
      const result = parseSerialNumber('EBOSS-60KW-2025-001234');
      expect(result).toEqual({ model: '60KW', year: 2025, sequence: '001234' });
    });

    it('normalises case before parsing', () => {
      const result = parseSerialNumber('eboss-30kw-2023-42');
      expect(result).toEqual({ model: '30KW', year: 2023, sequence: '42' });
    });

    it('returns null for an invalid serial number', () => {
      expect(parseSerialNumber('INVALID')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseSerialNumber('')).toBeNull();
    });
  });

  // ============================================================================
  // lookupUnitBySerialNumber
  // ============================================================================

  describe('lookupUnitBySerialNumber', () => {
    it('throws NOT_CONFIGURED when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(lookupUnitBySerialNumber('EBOSS-60KW-2025-001')).rejects.toThrow(
        CommissioningServiceError
      );
      await expect(lookupUnitBySerialNumber('EBOSS-60KW-2025-001')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('queries the units table with the normalised serial number', async () => {
      await lookupUnitBySerialNumber('eboss-60kw-2025-001234');

      expect(mockFrom).toHaveBeenCalledWith('units');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('serial_number', 'EBOSS-60KW-2025-001234');
    });

    it('returns the unit when found', async () => {
      const mockUnit = {
        id: 'unit-1',
        serial_number: 'EBOSS-60KW-2025-001234',
        model: '60KW',
        year: 2025,
        sequence: '001234',
        territory_id: 'terr-1',
        customer_name: 'Sunbelt Rentals',
        site_location: 'Reston Data Center',
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockUnit, error: null });

      const result = await lookupUnitBySerialNumber('EBOSS-60KW-2025-001234');

      expect(result).toEqual(mockUnit);
    });

    it('returns null when unit is not found (or outside territory)', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await lookupUnitBySerialNumber('EBOSS-60KW-2025-999999');

      expect(result).toBeNull();
    });

    it('throws CommissioningServiceError on database error', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERR' },
      });

      await expect(lookupUnitBySerialNumber('EBOSS-60KW-2025-001')).rejects.toThrow(
        CommissioningServiceError
      );
    });

    it('normalises input before querying', async () => {
      await lookupUnitBySerialNumber('  eboss-150kw-2024-42  ');

      expect(mockEq).toHaveBeenCalledWith('serial_number', 'EBOSS-150KW-2024-42');
    });
  });
});
