/**
 * useTechnicianLocations Hook
 *
 * React Query hook for fetching technician locations with polling support.
 * Used by the FleetMap component.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  fetchTechnicianLocations,
  TechnicianLocationServiceError,
} from '../../services/technicianLocationService';
import type { TechnicianLocationWithProfile } from '../../types/database';

/** Query key for technician locations */
export const TECHNICIAN_LOCATIONS_KEY = 'technician-locations';

/** Default polling interval (30 seconds) */
const DEFAULT_POLL_INTERVAL = 30 * 1000;

interface UseTechnicianLocationsOptions {
  /** Territory ID to filter by (optional) */
  territoryId?: string;
  /** Polling interval in milliseconds (default: 30000) */
  pollInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseTechnicianLocationsResult {
  /** Array of technician locations with profile data */
  locations: TechnicianLocationWithProfile[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether a background refetch is in progress */
  isFetching: boolean;
  /** Error object if the query failed */
  error: TechnicianLocationServiceError | null;
  /** Whether the query has encountered an error */
  isError: boolean;
  /** Whether we're using mock data (Supabase not configured) */
  isUsingMockData: boolean;
  /** Function to manually refetch data */
  refetch: UseQueryResult['refetch'];
}

/**
 * Mock data for when Supabase is not configured
 * Matches the existing FleetMap TECH_LOCATIONS structure
 */
const MOCK_TECHNICIAN_LOCATIONS: TechnicianLocationWithProfile[] = [
  {
    id: 'mock-1',
    user_id: 'user-1',
    name: 'Alex Tech',
    status: 'On-Site',
    current_client: 'Sunbelt Rentals',
    current_task: 'Commissioning EBOSS-104',
    latitude: 38.9,
    longitude: -77.0,
    flight_from: null,
    flight_to: null,
    flight_progress: null,
    flight: null,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    user_id: 'user-2',
    name: 'Sarah Field',
    status: 'Traveling',
    current_client: 'United Rentals',
    current_task: 'Travel to Dallas',
    latitude: 35.0,
    longitude: -90.0,
    flight_from: 'DEN',
    flight_to: 'DFW',
    flight_progress: 60,
    flight: { from: 'DEN', to: 'DFW', progress: 60 },
    last_updated: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    user_id: 'user-3',
    name: 'Mike Lead',
    status: 'Available',
    current_client: null,
    current_task: 'Remote Triage',
    latitude: 39.7,
    longitude: -105.0,
    flight_from: null,
    flight_to: null,
    flight_progress: null,
    flight: null,
    last_updated: new Date().toISOString(),
  },
];

/**
 * Hook to fetch and poll technician locations
 *
 * @param options - Configuration options
 * @returns Technician locations data and query state
 *
 * @example
 * ```tsx
 * const { locations, isLoading, error, isUsingMockData } = useTechnicianLocations({
 *   territoryId: 'west-coast',
 *   pollInterval: 15000,
 * });
 * ```
 */
export function useTechnicianLocations(
  options: UseTechnicianLocationsOptions = {}
): UseTechnicianLocationsResult {
  const {
    territoryId,
    pollInterval = DEFAULT_POLL_INTERVAL,
    enablePolling = true,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: [TECHNICIAN_LOCATIONS_KEY, territoryId],
    queryFn: () => fetchTechnicianLocations(territoryId),
    enabled,
    refetchInterval: enablePolling ? pollInterval : false,
    staleTime: pollInterval / 2, // Consider data stale halfway through poll interval
    retry: (failureCount, error) => {
      // Don't retry if Supabase is not configured
      if (
        error instanceof TechnicianLocationServiceError &&
        error.code === 'NOT_CONFIGURED'
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Determine if we should use mock data
  const isUsingMockData =
    query.error instanceof TechnicianLocationServiceError &&
    query.error.code === 'NOT_CONFIGURED';

  return {
    locations: isUsingMockData ? MOCK_TECHNICIAN_LOCATIONS : (query.data ?? []),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as TechnicianLocationServiceError | null,
    isError: query.isError && !isUsingMockData,
    isUsingMockData,
    refetch: query.refetch,
  };
}

export default useTechnicianLocations;
