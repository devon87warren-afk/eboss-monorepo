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
} from '../../services/savingsService';
import type { SavingsProjection, CreateSavingsProjectionInput } from '../../types/database';

/** Query key for savings projections */
export const SAVINGS_PROJECTIONS_KEY = 'savings-projections';

interface UseSavingsProjectionsOptions {
  userId?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseSavingsProjectionsResult {
  projections: SavingsProjection[];
  isLoading: boolean;
  isFetching: boolean;
  error: SavingsServiceError | null;
  isError: boolean;
  isUsingMockData: boolean;
  refetch: UseQueryResult['refetch'];
}

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

export function useSavingsProjections(
  options: UseSavingsProjectionsOptions = {}
): UseSavingsProjectionsResult {
  const { userId, limit = 50, enabled = true } = options;

  const query = useQuery({
    queryKey: [SAVINGS_PROJECTIONS_KEY, userId, limit],
    queryFn: () =>
      userId ? fetchUserSavingsProjections(userId, limit) : fetchSavingsProjections(limit),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof SavingsServiceError && error.code === 'NOT_CONFIGURED') {
        return false;
      }
      return failureCount < 2;
    },
  });

  const isUsingMockData =
    query.error instanceof SavingsServiceError && query.error.code === 'NOT_CONFIGURED';

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
    staleTime: 5 * 60 * 1000,
  });

  const isUsingMockData =
    query.error instanceof SavingsServiceError && query.error.code === 'NOT_CONFIGURED';

  const mockStatistics = {
    totalFuelSaved: MOCK_SAVINGS_PROJECTIONS.reduce((sum, p) => sum + (p.fuel_saved ?? 0), 0),
    totalCostSaved: MOCK_SAVINGS_PROJECTIONS.reduce((sum, p) => sum + (p.cost_saved ?? 0), 0),
    totalCo2SavedTons: MOCK_SAVINGS_PROJECTIONS.reduce((sum, p) => sum + (p.co2_saved_tons ?? 0), 0),
    projectionCount: MOCK_SAVINGS_PROJECTIONS.length,
  };

  return {
    statistics: isUsingMockData ? mockStatistics : (query.data ?? null),
    isLoading: query.isLoading,
    isUsingMockData,
  };
}

interface UseCreateSavingsProjectionOptions {
  onSuccess?: (data: SavingsProjection) => void;
  onError?: (error: SavingsServiceError) => void;
}

export function useCreateSavingsProjection(options: UseCreateSavingsProjectionOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSavingsProjectionInput) => createSavingsProjection(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_PROJECTIONS_KEY] });
      onSuccess?.(data);
    },
    onError: (error: SavingsServiceError) => {
      onError?.(error);
    },
  });
}

export function useSavingsCalculator() {
  return {
    calculate: calculateSavings,
  };
}

export default useSavingsProjections;
