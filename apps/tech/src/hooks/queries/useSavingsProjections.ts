/**
 * useSavingsProjections Hook
 *
 * React Query hook for fetching savings projections.
 * Used by the SavingsCalculator component.
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  fetchSavingsProjections,
  fetchUserSavingsProjections,
  createSavingsProjection,
  getSavingsStatistics,
  calculateSavings,
  SavingsServiceError,
} from '@/services/savingsService';
import type { SavingsProjection, CreateSavingsProjectionInput } from '@/types/database';

/** Query key for savings projections */
export const SAVINGS_PROJECTIONS_KEY = 'savings-projections';

interface UseSavingsProjectionsOptions {
  /** User ID to filter by (optional) */
  userId?: string;
  /** Maximum number of results (default: 50) */
  limit?: number;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseSavingsProjectionsResult {
  /** Array of savings projections */
  projections: SavingsProjection[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether a background refetch is in progress */
  isFetching: boolean;
  /** Error object if the query failed */
  error: SavingsServiceError | null;
  /** Whether the query has encountered an error */
  isError: boolean;
  /** Whether we're using mock data (Supabase not configured) */
  isUsingMockData: boolean;
  /** Function to manually refetch data */
  refetch: UseQueryResult['refetch'];
}

/**
 * Mock data for when Supabase is not configured
 */
const MOCK_SAVINGS_PROJECTIONS: SavingsProjection[] = [
  {
    id: 'mock-proj-1',
    unit_serial_number: 'EBOSS-001',
    runtime_hours: 24,
    fuel_price: 4.5,
    project_days: 30,
    fuel_saved: 810,
    cost_saved: 3645,
    co2_saved_tons: 9.07,
    created_at: new Date().toISOString(),
    created_by: 'user-1',
  },
  {
    id: 'mock-proj-2',
    unit_serial_number: 'EBOSS-002',
    runtime_hours: 12,
    fuel_price: 4.25,
    project_days: 60,
    fuel_saved: 810,
    cost_saved: 3442.5,
    co2_saved_tons: 9.07,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: 'user-1',
  },
];

/**
 * Hook to fetch savings projections
 *
 * @param options - Configuration options
 * @returns Savings projections data and query state
 *
 * @example
 * ```tsx
 * const { projections, isLoading, isUsingMockData } = useSavingsProjections({
 *   userId: 'user-123',
 *   limit: 10,
 * });
 * ```
 */
export function useSavingsProjections(
  options: UseSavingsProjectionsOptions = {}
): UseSavingsProjectionsResult {
  const { userId, limit = 50, enabled = true } = options;

  const query = useQuery({
    queryKey: [SAVINGS_PROJECTIONS_KEY, userId, limit],
    queryFn: () =>
      userId
        ? fetchUserSavingsProjections(userId, limit)
        : fetchSavingsProjections(limit),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (
        error instanceof SavingsServiceError &&
        error.code === 'NOT_CONFIGURED'
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const isUsingMockData =
    query.error instanceof SavingsServiceError &&
    query.error.code === 'NOT_CONFIGURED';

  return {
    projections: isUsingMockData ? MOCK_SAVINGS_PROJECTIONS : (query.data ?? []),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as SavingsServiceError | null,
    isError: query.isError && !isUsingMockData,
    isUsingMockData,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch aggregate savings statistics
 */
export function useSavingsStatistics(): {
  statistics: {
    totalFuelSaved: number;
    totalCostSaved: number;
    totalCo2SavedTons: number;
    projectionCount: number;
  } | null;
  isLoading: boolean;
  isUsingMockData: boolean;
} {
  const query = useQuery({
    queryKey: [SAVINGS_PROJECTIONS_KEY, 'statistics'],
    queryFn: getSavingsStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isUsingMockData =
    query.error instanceof SavingsServiceError &&
    query.error.code === 'NOT_CONFIGURED';

  // Calculate mock statistics
  const mockStatistics = {
    totalFuelSaved: MOCK_SAVINGS_PROJECTIONS.reduce(
      (sum, p) => sum + (p.fuel_saved ?? 0),
      0
    ),
    totalCostSaved: MOCK_SAVINGS_PROJECTIONS.reduce(
      (sum, p) => sum + (p.cost_saved ?? 0),
      0
    ),
    totalCo2SavedTons: MOCK_SAVINGS_PROJECTIONS.reduce(
      (sum, p) => sum + (p.co2_saved_tons ?? 0),
      0
    ),
    projectionCount: MOCK_SAVINGS_PROJECTIONS.length,
  };

  return {
    statistics: isUsingMockData ? mockStatistics : (query.data ?? null),
    isLoading: query.isLoading,
    isUsingMockData,
  };
}

interface UseCreateSavingsProjectionOptions {
  /** Callback on successful creation */
  onSuccess?: (data: SavingsProjection) => void;
  /** Callback on error */
  onError?: (error: SavingsServiceError) => void;
}

/**
 * Hook to create a new savings projection
 *
 * @param options - Mutation options
 * @returns Mutation result with create function
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateSavingsProjection({
 *   onSuccess: () => toast.success('Projection saved'),
 * });
 *
 * mutate({
 *   runtime_hours: 24,
 *   fuel_price: 4.50,
 *   project_days: 30,
 * });
 * ```
 */
export function useCreateSavingsProjection(
  options: UseCreateSavingsProjectionOptions = {}
) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSavingsProjectionInput) =>
      createSavingsProjection(input),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_PROJECTIONS_KEY] });
      onSuccess?.(data);
    },

    onError: (error: SavingsServiceError) => {
      onError?.(error);
    },
  });
}

/**
 * Hook for real-time savings calculations (client-side only)
 * Does not persist to database - just calculates values
 *
 * @example
 * ```tsx
 * const { calculate } = useSavingsCalculator();
 *
 * const result = calculate(24, 4.50, 30);
 * // { fuelSaved: 810, costSaved: 3645, co2SavedTons: 9.07, ... }
 * ```
 */
export function useSavingsCalculator() {
  return {
    /**
     * Calculate savings based on input parameters
     *
     * @param runtimeHours - Daily runtime hours
     * @param fuelPrice - Fuel price per gallon
     * @param projectDays - Project duration in days
     * @returns Calculated savings values
     */
    calculate: calculateSavings,
  };
}

export default useSavingsProjections;
