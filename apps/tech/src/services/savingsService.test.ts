/**
 * Savings Service Tests
 *
 * Tests for the savingsService CRUD operations and calculations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateSavings,
  SAVINGS_CONSTANTS,
  fetchSavingsProjections,
  fetchUserSavingsProjections,
  fetchUnitSavingsProjections,
  fetchSavingsProjectionById,
  createSavingsProjection,
  deleteSavingsProjection,
  getSavingsStatistics,
  SavingsServiceError,
} from './savingsService';
import {
  createSavingsProjection as createMockSavingsProjection,
  resetMockCounters,
} from '@/test/mock-factories';

// Mock the supabase module
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

let mockIsConfigured = true;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => mockIsConfigured,
}));

describe('savingsService', () => {
  beforeEach(() => {
    resetMockCounters();
    mockIsConfigured = true;
    vi.clearAllMocks();

    // Set up default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      single: mockSingle,
      limit: mockLimit,
    });
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
      single: mockSingle,
    });
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CALCULATION TESTS
  // ============================================================================

  describe('calculateSavings', () => {
    it('calculates fuel saved correctly', () => {
      const result = calculateSavings(24, 4.5, 30);

      // Formula: (runtime * days * STANDARD_BURN_RATE) - (runtime * days * HYBRID_BURN_RATE)
      // (24 * 30 * 1.5) - (24 * 30 * 0.375) = 1080 - 270 = 810 gallons
      expect(result.fuelSaved).toBe(810);
    });

    it('calculates cost saved correctly', () => {
      const result = calculateSavings(24, 4.5, 30);

      // Cost = fuelSaved * fuelPrice = 810 * 4.5 = 3645
      expect(result.costSaved).toBe(3645);
    });

    it('calculates CO2 saved in tons correctly', () => {
      const result = calculateSavings(24, 4.5, 30);

      // CO2 = (fuelSaved * CO2_PER_GALLON) / LBS_PER_TON
      // (810 * 22.4) / 2000 = 9.072 tons
      expect(result.co2SavedTons).toBe(9.07);
    });

    it('calculates CO2 saved in pounds correctly', () => {
      const result = calculateSavings(24, 4.5, 30);

      // CO2 lbs = fuelSaved * CO2_PER_GALLON = 810 * 22.4 = 18144
      expect(result.co2SavedLbs).toBe(18144);
    });

    it('calculates trees equivalent correctly', () => {
      const result = calculateSavings(24, 4.5, 30);

      // Trees = floor(co2SavedLbs / CO2_PER_TREE) = floor(18144 / 48) = 378
      expect(result.treesEquivalent).toBe(378);
    });

    it('handles minimum values', () => {
      const result = calculateSavings(1, 2, 1);

      expect(result.fuelSaved).toBeGreaterThan(0);
      expect(result.costSaved).toBeGreaterThan(0);
    });

    it('scales linearly with project days', () => {
      const result30 = calculateSavings(24, 4.5, 30);
      const result60 = calculateSavings(24, 4.5, 60);

      expect(result60.fuelSaved).toBe(result30.fuelSaved * 2);
      expect(result60.costSaved).toBe(result30.costSaved * 2);
    });

    it('uses correct constants', () => {
      expect(SAVINGS_CONSTANTS.STANDARD_BURN_RATE).toBe(1.5);
      expect(SAVINGS_CONSTANTS.HYBRID_BURN_RATE).toBe(0.375);
      expect(SAVINGS_CONSTANTS.CO2_PER_GALLON).toBe(22.4);
      expect(SAVINGS_CONSTANTS.LBS_PER_TON).toBe(2000);
      expect(SAVINGS_CONSTANTS.CO2_PER_TREE).toBe(48);
    });
  });

  // ============================================================================
  // FETCH TESTS
  // ============================================================================

  describe('fetchSavingsProjections', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(fetchSavingsProjections()).rejects.toThrow(SavingsServiceError);
      await expect(fetchSavingsProjections()).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('fetches projections with default limit', async () => {
      const mockData = [createMockSavingsProjection()];
      mockLimit.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchSavingsProjections();

      expect(mockFrom).toHaveBeenCalledWith('savings_projections');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockData);
    });

    it('respects custom limit', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await fetchSavingsProjections(10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('throws error on database failure', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      await expect(fetchSavingsProjections()).rejects.toThrow(SavingsServiceError);
    });
  });

  describe('fetchUserSavingsProjections', () => {
    it('filters by user ID', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await fetchUserSavingsProjections('user-123', 20);

      expect(mockEq).toHaveBeenCalledWith('created_by', 'user-123');
    });
  });

  describe('fetchUnitSavingsProjections', () => {
    it('filters by serial number', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await fetchUnitSavingsProjections('EBOSS-001', 10);

      expect(mockEq).toHaveBeenCalledWith('unit_serial_number', 'EBOSS-001');
    });
  });

  describe('fetchSavingsProjectionById', () => {
    it('returns projection when found', async () => {
      const mockProjection = createMockSavingsProjection();
      mockSingle.mockResolvedValueOnce({ data: mockProjection, error: null });

      const result = await fetchSavingsProjectionById('proj-1');

      expect(result).toEqual(mockProjection);
    });

    it('returns null when not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const result = await fetchSavingsProjectionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // CREATE TESTS
  // ============================================================================

  describe('createSavingsProjection', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        createSavingsProjection({
          runtime_hours: 24,
          fuel_price: 4.5,
          project_days: 30,
        })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('calculates savings if not provided', async () => {
      const input = {
        runtime_hours: 24,
        fuel_price: 4.5,
        project_days: 30,
      };

      const mockProjection = createMockSavingsProjection(input);
      mockSingle.mockResolvedValueOnce({ data: mockProjection, error: null });

      await createSavingsProjection(input);

      // Verify insert was called with calculated values
      expect(mockInsert).toHaveBeenCalled();
    });

    it('uses provided savings values if given', async () => {
      const input = {
        runtime_hours: 24,
        fuel_price: 4.5,
        project_days: 30,
        fuel_saved: 1000,
        cost_saved: 5000,
        co2_saved_tons: 10,
      };

      const mockProjection = createMockSavingsProjection(input);
      mockSingle.mockResolvedValueOnce({ data: mockProjection, error: null });

      await createSavingsProjection(input);

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('deleteSavingsProjection', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(deleteSavingsProjection('proj-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('deletes projection by ID', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await deleteSavingsProjection('proj-1');

      expect(mockFrom).toHaveBeenCalledWith('savings_projections');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'proj-1');
    });
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('getSavingsStatistics', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(getSavingsStatistics()).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('aggregates statistics correctly', async () => {
      const mockData = [
        { fuel_saved: 100, cost_saved: 500, co2_saved_tons: 1 },
        { fuel_saved: 200, cost_saved: 1000, co2_saved_tons: 2 },
        { fuel_saved: 300, cost_saved: 1500, co2_saved_tons: 3 },
      ];

      mockSelect.mockReturnValueOnce(
        Promise.resolve({ data: mockData, error: null })
      );

      const result = await getSavingsStatistics();

      expect(result.totalFuelSaved).toBe(600);
      expect(result.totalCostSaved).toBe(3000);
      expect(result.totalCo2SavedTons).toBe(6);
      expect(result.projectionCount).toBe(3);
    });

    it('handles null values in aggregation', async () => {
      const mockData = [
        { fuel_saved: null, cost_saved: 500, co2_saved_tons: 1 },
        { fuel_saved: 200, cost_saved: null, co2_saved_tons: null },
      ];

      mockSelect.mockReturnValueOnce(
        Promise.resolve({ data: mockData, error: null })
      );

      const result = await getSavingsStatistics();

      expect(result.totalFuelSaved).toBe(200);
      expect(result.totalCostSaved).toBe(500);
      expect(result.totalCo2SavedTons).toBe(1);
    });

    it('returns zero values for empty data', async () => {
      mockSelect.mockReturnValueOnce(
        Promise.resolve({ data: [], error: null })
      );

      const result = await getSavingsStatistics();

      expect(result.totalFuelSaved).toBe(0);
      expect(result.totalCostSaved).toBe(0);
      expect(result.totalCo2SavedTons).toBe(0);
      expect(result.projectionCount).toBe(0);
    });
  });
});
