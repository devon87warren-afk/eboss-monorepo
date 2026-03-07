/**
 * useUpdateTechnicianLocation Hook
 *
 * React Query mutation hook for updating technician locations.
 * Supports optimistic updates for responsive UI.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  updateTechnicianLocation,
  upsertTechnicianLocation,
  TechnicianLocationServiceError,
} from '@/services/technicianLocationService';
import { TECHNICIAN_LOCATIONS_KEY } from '@/hooks/queries/useTechnicianLocations';
import type {
  TechnicianLocation,
  TechnicianLocationInput,
  TechnicianLocationWithProfile,
} from '@/types/database';

interface UpdateLocationVariables {
  /** User ID to update */
  userId: string;
  /** Partial location data to update */
  updates: Partial<TechnicianLocationInput>;
}

interface UpsertLocationVariables {
  /** Full location input for upsert */
  input: TechnicianLocationInput;
}

interface UseUpdateTechnicianLocationOptions {
  /** Callback on successful update */
  onSuccess?: (data: TechnicianLocation) => void;
  /** Callback on error */
  onError?: (error: TechnicianLocationServiceError) => void;
  /** Enable optimistic updates (default: true) */
  optimistic?: boolean;
}

/**
 * Hook to update an existing technician location
 *
 * @param options - Mutation options
 * @returns Mutation result with update function
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateTechnicianLocation({
 *   onSuccess: () => toast.success('Location updated'),
 * });
 *
 * mutate({ userId: 'user-123', updates: { status: 'On-Site' } });
 * ```
 */
export function useUpdateTechnicianLocation(
  options: UseUpdateTechnicianLocationOptions = {}
): UseMutationResult<
  TechnicianLocation,
  TechnicianLocationServiceError,
  UpdateLocationVariables
> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: UpdateLocationVariables) =>
      updateTechnicianLocation(userId, updates),

    onMutate: async ({ userId, updates }) => {
      if (!optimistic) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TECHNICIAN_LOCATIONS_KEY] });

      // Snapshot the previous value
      const previousLocations = queryClient.getQueryData<TechnicianLocationWithProfile[]>([
        TECHNICIAN_LOCATIONS_KEY,
      ]);

      // Optimistically update the cache
      if (previousLocations) {
        queryClient.setQueryData<TechnicianLocationWithProfile[]>(
          [TECHNICIAN_LOCATIONS_KEY],
          previousLocations.map((loc) =>
            loc.user_id === userId
              ? {
                  ...loc,
                  ...updates,
                  last_updated: new Date().toISOString(),
                }
              : loc
          )
        );
      }

      return { previousLocations };
    },

    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLocations) {
        queryClient.setQueryData(
          [TECHNICIAN_LOCATIONS_KEY],
          context.previousLocations
        );
      }
      onError?.(error);
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: [TECHNICIAN_LOCATIONS_KEY] });
    },
  });
}

/**
 * Hook to create or update a technician location (upsert)
 *
 * @param options - Mutation options
 * @returns Mutation result with upsert function
 *
 * @example
 * ```tsx
 * const { mutate } = useUpsertTechnicianLocation();
 *
 * mutate({
 *   input: {
 *     user_id: 'user-123',
 *     latitude: 39.7,
 *     longitude: -105.0,
 *     status: 'Available',
 *   },
 * });
 * ```
 */
export function useUpsertTechnicianLocation(
  options: UseUpdateTechnicianLocationOptions = {}
): UseMutationResult<
  TechnicianLocation,
  TechnicianLocationServiceError,
  UpsertLocationVariables
> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input }: UpsertLocationVariables) =>
      upsertTechnicianLocation(input),

    onMutate: async ({ input }) => {
      if (!optimistic) return;

      await queryClient.cancelQueries({ queryKey: [TECHNICIAN_LOCATIONS_KEY] });

      const previousLocations = queryClient.getQueryData<TechnicianLocationWithProfile[]>([
        TECHNICIAN_LOCATIONS_KEY,
      ]);

      if (previousLocations) {
        const existingIndex = previousLocations.findIndex(
          (loc) => loc.user_id === input.user_id
        );

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...previousLocations];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...input,
            last_updated: new Date().toISOString(),
          };
          queryClient.setQueryData([TECHNICIAN_LOCATIONS_KEY], updated);
        } else {
          // Add new (with temporary ID)
          const newLocation: TechnicianLocationWithProfile = {
            id: `temp-${Date.now()}`,
            ...input,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            status: input.status ?? 'Available',
            current_client: input.current_client ?? null,
            current_task: input.current_task ?? null,
            flight_from: input.flight_from ?? null,
            flight_to: input.flight_to ?? null,
            flight_progress: input.flight_progress ?? null,
            last_updated: new Date().toISOString(),
            name: 'New Technician',
            flight:
              input.flight_from && input.flight_to
                ? {
                    from: input.flight_from,
                    to: input.flight_to,
                    progress: input.flight_progress ?? 0,
                  }
                : null,
          };
          queryClient.setQueryData(
            [TECHNICIAN_LOCATIONS_KEY],
            [...previousLocations, newLocation]
          );
        }
      }

      return { previousLocations };
    },

    onError: (error, _variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(
          [TECHNICIAN_LOCATIONS_KEY],
          context.previousLocations
        );
      }
      onError?.(error);
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TECHNICIAN_LOCATIONS_KEY] });
    },
  });
}

export default useUpdateTechnicianLocation;
