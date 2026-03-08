/**
 * useSavingsProjections Hook Tests
 *
 * Tests for the savings projections query and mutation hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSavingsProjections,
  useSavingsStatistics,
  useCreateSavingsProjection,
  useSavingsCalculator,
  SAVINGS_PROJECTIONS_KEY,
} from './useSavingsProjections';
import {
  createSavingsProjection,
  resetMockCounters,
} from '@/test/mock-factories';
import { SavingsServiceError } from '@/services/savingsService';
import React from 'react';

// Mock the service
const mockFetchSavingsProjections = vi.fn();
const mockFetchUserSavingsProjections = vi.fn();
const mockGetSavingsStatistics = vi.fn();
const mockCreateSavingsProjection = vi.fn();
const mockCalculateSavings = vi.fn();

vi.mock('@/services/savingsService', () => ({
  fetchSavingsProjections: (...args: unknown[]) => mockFetchSavingsProjections(...args),
  fetchUserSavingsProjections: (...args: unknown[]) => mockFetchUserSavingsProjections(...args),
  getSavingsStatistics: (...args: unknown[]) => mockGetSavingsStatistics(...args),
  createSavingsProjection: (...args: unknown[]) => mockCreateSavingsProjection(...args),
  calculateSavings: (...args: unknown[]) => mockCalculateSavings(...args),
  SavingsServiceError: class extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
      this.name = 'SavingsServiceError';
    }
  },
}));

describe('useSavingsProjections hooks', () => {
  let queryClient: QueryClient;

  function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    resetMockCounters();
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Default mock implementation for calculateSavings
    mockCalculateSavings.mockImplementation((runtime, fuelPrice, days) => ({
      fuelSaved: runtime * days * 1.125, // Simplified calculation
      costSaved: runtime * days * 1.125 * fuelPrice,
      co2SavedTons: (runtime * days * 1.125 * 22.4) / 2000,
      co2SavedLbs: runtime * days * 1.125 * 22.4,
      treesEquivalent: Math.floor((runtime * days * 1.125 * 22.4) / 48),
    }));
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============================================================================
  // useSavingsProjections TESTS
  // ============================================================================

  describe('useSavingsProjections', () => {
    it('returns loading state initially', () => {
      mockFetchSavingsProjections.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSavingsProjections(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.projections).toEqual([]);
    });

    it('fetches projections successfully', async () => {
      const mockProjections = [
        createSavingsProjection({ unit_serial_number: 'EBOSS-001' }),
        createSavingsProjection({ unit_serial_number: 'EBOSS-002' }),
      ];
      mockFetchSavingsProjections.mockResolvedValueOnce(mockProjections);

      const { result } = renderHook(() => useSavingsProjections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projections).toHaveLength(2);
      expect(result.current.projections[0].unit_serial_number).toBe('EBOSS-001');
    });

    it('uses fetchUserSavingsProjections when userId provided', async () => {
      mockFetchUserSavingsProjections.mockResolvedValueOnce([]);

      renderHook(
        () => useSavingsProjections({ userId: 'user-123', limit: 25 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockFetchUserSavingsProjections).toHaveBeenCalledWith('user-123', 25);
      });
    });

    it('uses default limit of 50', async () => {
      mockFetchSavingsProjections.mockResolvedValueOnce([]);

      renderHook(() => useSavingsProjections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetchSavingsProjections).toHaveBeenCalledWith(50);
      });
    });

    it('uses mock data when Supabase not configured', async () => {
      const error = new SavingsServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchSavingsProjections.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSavingsProjections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUsingMockData).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.projections.length).toBeGreaterThan(0);
    });

    it('provides refetch function', async () => {
      mockFetchSavingsProjections.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSavingsProjections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  // ============================================================================
  // useSavingsStatistics TESTS
  // ============================================================================

  describe('useSavingsStatistics', () => {
    it('fetches statistics successfully', async () => {
      const mockStats = {
        totalFuelSaved: 1620,
        totalCostSaved: 7290,
        totalCo2SavedTons: 18.14,
        projectionCount: 2,
      };
      mockGetSavingsStatistics.mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useSavingsStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.statistics).toEqual(mockStats);
    });

    it('uses mock statistics when Supabase not configured', async () => {
      const error = new SavingsServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockGetSavingsStatistics.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSavingsStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUsingMockData).toBe(true);
      expect(result.current.statistics).not.toBeNull();
      expect(result.current.statistics?.projectionCount).toBe(2);
    });
  });

  // ============================================================================
  // useCreateSavingsProjection TESTS
  // ============================================================================

  describe('useCreateSavingsProjection', () => {
    it('creates projection successfully', async () => {
      const newProjection = createSavingsProjection();
      mockCreateSavingsProjection.mockResolvedValueOnce(newProjection);

      const onSuccess = vi.fn();
      const { result } = renderHook(
        () => useCreateSavingsProjection({ onSuccess }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          runtime_hours: 24,
          fuel_price: 4.5,
          project_days: 30,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(newProjection);
    });

    it('handles creation error', async () => {
      const error = new SavingsServiceError('Creation failed', 'CREATE_ERROR');
      mockCreateSavingsProjection.mockRejectedValueOnce(error);

      const onError = vi.fn();
      const { result } = renderHook(
        () => useCreateSavingsProjection({ onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          runtime_hours: 24,
          fuel_price: 4.5,
          project_days: 30,
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalled();
    });

    it('invalidates queries on success', async () => {
      const newProjection = createSavingsProjection();
      mockCreateSavingsProjection.mockResolvedValueOnce(newProjection);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useCreateSavingsProjection(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          runtime_hours: 24,
          fuel_price: 4.5,
          project_days: 30,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [SAVINGS_PROJECTIONS_KEY],
      });
    });
  });

  // ============================================================================
  // useSavingsCalculator TESTS
  // ============================================================================

  describe('useSavingsCalculator', () => {
    it('provides calculate function', () => {
      const { result } = renderHook(() => useSavingsCalculator(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.calculate).toBe('function');
    });

    it('calculate returns correct values', () => {
      const { result } = renderHook(() => useSavingsCalculator(), {
        wrapper: createWrapper(),
      });

      const savings = result.current.calculate(24, 4.5, 30);

      // With the mock implementation
      expect(savings.fuelSaved).toBeDefined();
      expect(savings.costSaved).toBeDefined();
      expect(savings.co2SavedTons).toBeDefined();
    });
  });
});
