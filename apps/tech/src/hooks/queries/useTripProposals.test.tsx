/**
 * useTripProposals Hook Tests
 *
 * Tests for the trip proposals query hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTripProposals,
  useTripProposal,
  useCurrentTripProposal,
  TRIP_PROPOSALS_KEY,
} from './useTripProposals';
import {
  createTripProposalWithDetails,
  createFlightOption,
  resetMockCounters,
} from '@/test/mock-factories';
import { TripServiceError } from '@/services/tripService';
import React from 'react';

// Mock the service
const mockFetchTripProposals = vi.fn();
const mockFetchTripProposalById = vi.fn();

vi.mock('@/services/tripService', () => ({
  fetchTripProposals: (...args: unknown[]) => mockFetchTripProposals(...args),
  fetchTripProposalById: (...args: unknown[]) => mockFetchTripProposalById(...args),
  TripServiceError: class extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
      this.name = 'TripServiceError';
    }
  },
}));

describe('useTripProposals hooks', () => {
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
  // useTripProposals TESTS
  // ============================================================================

  describe('useTripProposals', () => {
    it('returns loading state initially', () => {
      mockFetchTripProposals.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useTripProposals(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.trips).toEqual([]);
    });

    it('fetches trips successfully', async () => {
      const mockTrips = [
        createTripProposalWithDetails({ destination: 'Washington DC' }),
        createTripProposalWithDetails({ destination: 'Dallas' }),
      ];
      mockFetchTripProposals.mockResolvedValueOnce(mockTrips);

      const { result } = renderHook(() => useTripProposals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trips).toHaveLength(2);
      expect(result.current.trips[0].destination).toBe('Washington DC');
    });

    it('filters by user ID', async () => {
      mockFetchTripProposals.mockResolvedValueOnce([]);

      renderHook(
        () => useTripProposals({ userId: 'user-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockFetchTripProposals).toHaveBeenCalledWith('user-123');
      });
    });

    it('uses mock data when Supabase not configured', async () => {
      const error = new TripServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTripProposals.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTripProposals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUsingMockData).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.trips.length).toBeGreaterThan(0);
    });

    it('mock data includes flight options', async () => {
      const error = new TripServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTripProposals.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTripProposals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isUsingMockData).toBe(true);
      });

      expect(result.current.trips[0].flight_options.length).toBeGreaterThan(0);
    });

    it('uses correct query key', async () => {
      mockFetchTripProposals.mockResolvedValueOnce([]);

      renderHook(
        () => useTripProposals({ userId: 'user-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const queryState = queryClient.getQueryState([
          TRIP_PROPOSALS_KEY,
          'user-456',
        ]);
        expect(queryState).toBeDefined();
      });
    });
  });

  // ============================================================================
  // useTripProposal TESTS
  // ============================================================================

  describe('useTripProposal', () => {
    it('fetches single trip by ID', async () => {
      const mockTrip = createTripProposalWithDetails({ id: 'trip-123' });
      mockFetchTripProposalById.mockResolvedValueOnce(mockTrip);

      const { result } = renderHook(
        () => useTripProposal('trip-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trip?.id).toBe('trip-123');
    });

    it('returns null when trip not found', async () => {
      mockFetchTripProposalById.mockResolvedValueOnce(null);

      const { result } = renderHook(
        () => useTripProposal('nonexistent'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trip).toBeNull();
    });

    it('disabled when tripId is empty', () => {
      const { result } = renderHook(
        () => useTripProposal(''),
        { wrapper: createWrapper() }
      );

      expect(mockFetchTripProposalById).not.toHaveBeenCalled();
      expect(result.current.trip).toBeNull();
    });

    it('uses mock data when Supabase not configured', async () => {
      const error = new TripServiceError(
        'Supabase is not configured',
        'NOT_CONFIGURED'
      );
      mockFetchTripProposalById.mockRejectedValueOnce(error);

      const { result } = renderHook(
        () => useTripProposal('mock-trip-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUsingMockData).toBe(true);
    });
  });

  // ============================================================================
  // useCurrentTripProposal TESTS
  // ============================================================================

  describe('useCurrentTripProposal', () => {
    it('returns most recent proposed trip', async () => {
      const mockTrips = [
        createTripProposalWithDetails({ status: 'booked' }),
        createTripProposalWithDetails({ status: 'proposed' }),
        createTripProposalWithDetails({ status: 'completed' }),
      ];
      mockFetchTripProposals.mockResolvedValueOnce(mockTrips);

      const { result } = renderHook(() => useCurrentTripProposal(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trip?.status).toBe('proposed');
    });

    it('returns first trip if none are proposed', async () => {
      const mockTrips = [
        createTripProposalWithDetails({ status: 'booked', destination: 'First' }),
        createTripProposalWithDetails({ status: 'completed', destination: 'Second' }),
      ];
      mockFetchTripProposals.mockResolvedValueOnce(mockTrips);

      const { result } = renderHook(() => useCurrentTripProposal(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trip?.destination).toBe('First');
    });

    it('returns null when no trips', async () => {
      mockFetchTripProposals.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCurrentTripProposal(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trip).toBeNull();
      expect(result.current.flightOptions).toEqual([]);
    });

    it('returns flight options from current trip', async () => {
      const flightOptions = [
        createFlightOption({ airline: 'Delta' }),
        createFlightOption({ airline: 'Southwest' }),
      ];
      const mockTrips = [
        createTripProposalWithDetails({
          status: 'proposed',
          flight_options: flightOptions,
        }),
      ];
      mockFetchTripProposals.mockResolvedValueOnce(mockTrips);

      const { result } = renderHook(() => useCurrentTripProposal(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flightOptions).toHaveLength(2);
      expect(result.current.flightOptions[0].airline).toBe('Delta');
    });
  });
});
