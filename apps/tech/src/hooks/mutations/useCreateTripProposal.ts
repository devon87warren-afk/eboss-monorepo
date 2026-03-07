/**
 * useCreateTripProposal Hook
 *
 * React Query mutation hook for creating trip proposals.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  createTripProposal,
  updateTripProposal,
  deleteTripProposal,
  TripServiceError,
} from '@/services/tripService';
import { TRIP_PROPOSALS_KEY } from '@/hooks/queries/useTripProposals';
import type {
  TripProposal,
  CreateTripProposalInput,
  UpdateTripProposalInput,
} from '@/types/database';

interface UseCreateTripProposalOptions {
  /** Callback on successful creation */
  onSuccess?: (data: TripProposal) => void;
  /** Callback on error */
  onError?: (error: TripServiceError) => void;
}

/**
 * Hook to create a new trip proposal
 *
 * @param options - Mutation options
 * @returns Mutation result with create function
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTripProposal({
 *   onSuccess: (trip) => toast.success(`Trip to ${trip.destination} created`),
 * });
 *
 * mutate({
 *   user_id: 'user-123',
 *   destination: 'Washington DC',
 *   start_date: '2024-02-12',
 *   end_date: '2024-02-14',
 *   purpose: 'Client meeting',
 * });
 * ```
 */
export function useCreateTripProposal(
  options: UseCreateTripProposalOptions = {}
): UseMutationResult<TripProposal, TripServiceError, CreateTripProposalInput> {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripProposalInput) => createTripProposal(input),

    onSuccess: (data) => {
      // Invalidate trip proposals queries to refetch with new trip
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
      onSuccess?.(data);
    },

    onError: (error) => {
      onError?.(error);
    },
  });
}

interface UseUpdateTripProposalOptions {
  /** Callback on successful update */
  onSuccess?: (data: TripProposal) => void;
  /** Callback on error */
  onError?: (error: TripServiceError) => void;
}

interface UpdateTripVariables {
  tripId: string;
  updates: UpdateTripProposalInput;
}

/**
 * Hook to update an existing trip proposal
 *
 * @param options - Mutation options
 * @returns Mutation result with update function
 *
 * @example
 * ```tsx
 * const { mutate } = useUpdateTripProposal();
 *
 * mutate({
 *   tripId: 'trip-123',
 *   updates: { status: 'approved' },
 * });
 * ```
 */
export function useUpdateTripProposal(
  options: UseUpdateTripProposalOptions = {}
): UseMutationResult<TripProposal, TripServiceError, UpdateTripVariables> {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, updates }: UpdateTripVariables) =>
      updateTripProposal(tripId, updates),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
      onSuccess?.(data);
    },

    onError: (error) => {
      onError?.(error);
    },
  });
}

interface UseDeleteTripProposalOptions {
  /** Callback on successful deletion */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: TripServiceError) => void;
}

/**
 * Hook to delete a trip proposal
 *
 * @param options - Mutation options
 * @returns Mutation result with delete function
 *
 * @example
 * ```tsx
 * const { mutate } = useDeleteTripProposal();
 *
 * mutate('trip-123');
 * ```
 */
export function useDeleteTripProposal(
  options: UseDeleteTripProposalOptions = {}
): UseMutationResult<void, TripServiceError, string> {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId: string) => deleteTripProposal(tripId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
      onSuccess?.();
    },

    onError: (error) => {
      onError?.(error);
    },
  });
}

export default useCreateTripProposal;
