/**
 * useCreateTripProposal Hook
 *
 * React Query mutation hooks for trip proposal CRUD operations.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  createTripProposal,
  updateTripProposal,
  deleteTripProposal,
  TripServiceError,
} from '../../services/tripService';
import { TRIP_PROPOSALS_KEY } from '../queries/useTripProposals';
import type {
  TripProposal,
  CreateTripProposalInput,
  UpdateTripProposalInput,
} from '../../types/database';

interface UseCreateTripProposalOptions {
  onSuccess?: (data: TripProposal) => void;
  onError?: (error: TripServiceError) => void;
}

export function useCreateTripProposal(
  options: UseCreateTripProposalOptions = {}
): UseMutationResult<TripProposal, TripServiceError, CreateTripProposalInput> {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripProposalInput) => createTripProposal(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
}

interface UpdateTripVariables {
  tripId: string;
  updates: UpdateTripProposalInput;
}

export function useUpdateTripProposal(
  options: UseCreateTripProposalOptions = {}
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
  onSuccess?: () => void;
  onError?: (error: TripServiceError) => void;
}

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
