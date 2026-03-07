/**
 * useTripProposals Hook
 *
 * React Query hook for fetching trip proposals.
 * Used by the TravelOptimizer component.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  fetchTripProposals,
  fetchTripProposalById,
  TripServiceError,
} from '@/services/tripService';
import type { TripProposalWithDetails, FlightOption } from '@/types/database';

/** Query key for trip proposals */
export const TRIP_PROPOSALS_KEY = 'trip-proposals';

interface UseTripProposalsOptions {
  /** User ID to filter by (optional) */
  userId?: string;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseTripProposalsResult {
  /** Array of trip proposals with details */
  trips: TripProposalWithDetails[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether a background refetch is in progress */
  isFetching: boolean;
  /** Error object if the query failed */
  error: TripServiceError | null;
  /** Whether the query has encountered an error */
  isError: boolean;
  /** Whether we're using mock data (Supabase not configured) */
  isUsingMockData: boolean;
  /** Function to manually refetch data */
  refetch: UseQueryResult['refetch'];
}

/**
 * Mock data for when Supabase is not configured
 * Matches the existing TravelOptimizer structure
 */
const MOCK_TRIP_PROPOSALS: TripProposalWithDetails[] = [
  {
    id: 'mock-trip-1',
    user_id: 'user-1',
    destination: 'Washington DC',
    start_date: '2024-02-12',
    end_date: '2024-02-14',
    client_id: 'client-1',
    client_name: 'Sunbelt Rentals',
    purpose: 'Installation/Training and Sales Support',
    status: 'proposed',
    total_cost: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    flight_options: [
      {
        id: 'flight-1',
        trip_id: 'mock-trip-1',
        airline: 'Delta',
        price: 450,
        departure_time: null,
        arrival_time: null,
        perks: ['Upgrade Eligible', '9x Points', 'Preferred Seat'],
        is_preferred: true,
        is_deal: false,
        is_selected: false,
      },
      {
        id: 'flight-2',
        trip_id: 'mock-trip-1',
        airline: 'Southwest',
        price: 320,
        departure_time: null,
        arrival_time: null,
        perks: ['No Change Fees', '2 Bags Free'],
        is_preferred: false,
        is_deal: true,
        is_selected: false,
      },
    ],
  },
];

/**
 * Hook to fetch trip proposals
 *
 * @param options - Configuration options
 * @returns Trip proposals data and query state
 *
 * @example
 * ```tsx
 * const { trips, isLoading, error, isUsingMockData } = useTripProposals({
 *   userId: 'user-123',
 * });
 * ```
 */
export function useTripProposals(
  options: UseTripProposalsOptions = {}
): UseTripProposalsResult {
  const { userId, enabled = true } = options;

  const query = useQuery({
    queryKey: [TRIP_PROPOSALS_KEY, userId],
    queryFn: () => fetchTripProposals(userId),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      if (
        error instanceof TripServiceError &&
        error.code === 'NOT_CONFIGURED'
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const isUsingMockData =
    query.error instanceof TripServiceError &&
    query.error.code === 'NOT_CONFIGURED';

  return {
    trips: isUsingMockData ? MOCK_TRIP_PROPOSALS : (query.data ?? []),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as TripServiceError | null,
    isError: query.isError && !isUsingMockData,
    isUsingMockData,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single trip proposal by ID
 *
 * @param tripId - The trip ID to fetch
 * @param options - Configuration options
 * @returns Single trip proposal data and query state
 */
export function useTripProposal(
  tripId: string,
  options: { enabled?: boolean } = {}
): {
  trip: TripProposalWithDetails | null;
  isLoading: boolean;
  error: TripServiceError | null;
  isUsingMockData: boolean;
} {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: [TRIP_PROPOSALS_KEY, 'detail', tripId],
    queryFn: () => fetchTripProposalById(tripId),
    enabled: enabled && !!tripId,
    staleTime: 60 * 1000,
  });

  const isUsingMockData =
    query.error instanceof TripServiceError &&
    query.error.code === 'NOT_CONFIGURED';

  // Find mock trip if using mock data
  const mockTrip = MOCK_TRIP_PROPOSALS.find((t) => t.id === tripId) ?? null;

  return {
    trip: isUsingMockData ? mockTrip : (query.data ?? null),
    isLoading: query.isLoading,
    error: query.error as TripServiceError | null,
    isUsingMockData,
  };
}

/**
 * Hook to get current trip with flight options (for TravelOptimizer)
 * Returns the most recent proposed trip
 */
export function useCurrentTripProposal(): {
  trip: TripProposalWithDetails | null;
  flightOptions: FlightOption[];
  isLoading: boolean;
  isUsingMockData: boolean;
} {
  const { trips, isLoading, isUsingMockData } = useTripProposals();

  // Get the most recent proposed trip
  const currentTrip =
    trips.find((t) => t.status === 'proposed') ?? trips[0] ?? null;

  return {
    trip: currentTrip,
    flightOptions: currentTrip?.flight_options ?? [],
    isLoading,
    isUsingMockData,
  };
}

export default useTripProposals;
