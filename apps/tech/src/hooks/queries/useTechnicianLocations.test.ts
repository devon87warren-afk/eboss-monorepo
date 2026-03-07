/**
 * useTechnicianLocations Hook Tests
 *
 * Tests for the technician locations query hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTechnicianLocations, TECHNICIAN_LOCATIONS_KEY } from './useTechnicianLocations';
import {
  createTechnicianLocationWithProfile,
  resetMockCounters,
} from '@/test/mock-factories';
import { TechnicianLocationServiceError } from '@/services/technicianLocationService';
import React from 'react';

// Mock the service
const mockFetchTechnicianLocations = vi.fn();

vi.mock('@/services/technicianLocationService', () => ({
  fetchTechnicianLocations: (...args: unknown[]) => mockFetchTechnicianLocations(...args),
  TechnicianLocationServiceError: class extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
      this.name = 'TechnicianLocationServiceError';
    }
  },
}));

describe('useTechnicianLocations', () => {
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
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============================================================================
  // BASIC FETCH TESTS
  // ============================================================================

  describe('basic fetching', () => {
    it('returns loading state initially', () => {
      mockFetchTechnicianLocations.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.locations).toEqual([]);
    });

    it('fetches locations successfully', async () => {
      const mockLocations = [
        createTechnicianLocationWithProfile({ name: 'Alex Tech' }),
        createTechnicianLocationWithProfile({ name: 'Sarah Field' }),
      ];
      mockFetchTechnicianLocations.mockResolvedValueOnce(mockLocations);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.locations).toHaveLength(2);
      expect(result.current.locations[0].name).toBe('Alex Tech');
      expect(result.current.isError).toBe(false);
    });

    it('handles fetch error', async () => {
      const error = new TechnicianLocationServiceError('Database error', 'DB_ERROR');
      mockFetchTechnicianLocations.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Database error');
    });
  });

  // ============================================================================
  // MOCK DATA FALLBACK TESTS
  // ============================================================================

  describe('mock data fallback', () => {
    it('uses mock data when Supabase not configured', async () => {
      const error = new TechnicianLocationServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTechnicianLocations.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUsingMockData).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.locations.length).toBeGreaterThan(0);
    });

    it('mock data includes expected technicians', async () => {
      const error = new TechnicianLocationServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTechnicianLocations.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isUsingMockData).toBe(true);
      });

      const names = result.current.locations.map((l) => l.name);
      expect(names).toContain('Alex Tech');
      expect(names).toContain('Sarah Field');
      expect(names).toContain('Mike Lead');
    });

    it('mock data includes traveling technician with flight', async () => {
      const error = new TechnicianLocationServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTechnicianLocations.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isUsingMockData).toBe(true);
      });

      const travelingTech = result.current.locations.find(
        (l) => l.status === 'Traveling'
      );
      expect(travelingTech).toBeDefined();
      expect(travelingTech?.flight).toEqual({
        from: 'DEN',
        to: 'DFW',
        progress: 60,
      });
    });
  });

  // ============================================================================
  // OPTIONS TESTS
  // ============================================================================

  describe('options', () => {
    it('passes territory ID to fetch function', async () => {
      mockFetchTechnicianLocations.mockResolvedValueOnce([]);

      renderHook(
        () => useTechnicianLocations({ territoryId: 'west-coast' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockFetchTechnicianLocations).toHaveBeenCalledWith('west-coast');
      });
    });

    it('disables query when enabled is false', () => {
      const { result } = renderHook(
        () => useTechnicianLocations({ enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockFetchTechnicianLocations).not.toHaveBeenCalled();
    });

    it('uses correct query key', async () => {
      mockFetchTechnicianLocations.mockResolvedValueOnce([]);

      renderHook(
        () => useTechnicianLocations({ territoryId: 'east-coast' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const queryState = queryClient.getQueryState([
          TECHNICIAN_LOCATIONS_KEY,
          'east-coast',
        ]);
        expect(queryState).toBeDefined();
      });
    });
  });

  // ============================================================================
  // RETRY BEHAVIOR TESTS
  // ============================================================================

  describe('retry behavior', () => {
    it('does not retry on NOT_CONFIGURED error', async () => {
      const error = new TechnicianLocationServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTechnicianLocations.mockRejectedValue(error);

      renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      // Wait for query to settle
      await new Promise((r) => setTimeout(r, 100));

      // Should only be called once (no retry)
      expect(mockFetchTechnicianLocations).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // REFETCH TESTS
  // ============================================================================

  describe('refetch', () => {
    it('provides refetch function', async () => {
      mockFetchTechnicianLocations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetch updates data', async () => {
      const initialLocations = [
        createTechnicianLocationWithProfile({ name: 'Initial Tech' }),
      ];
      const updatedLocations = [
        createTechnicianLocationWithProfile({ name: 'Updated Tech' }),
      ];

      mockFetchTechnicianLocations
        .mockResolvedValueOnce(initialLocations)
        .mockResolvedValueOnce(updatedLocations);

      const { result } = renderHook(() => useTechnicianLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.locations[0]?.name).toBe('Initial Tech');
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.locations[0]?.name).toBe('Updated Tech');
      });
    });
  });
});
