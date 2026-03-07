/**
 * useBookTrip Hook
 *
 * React Query mutation hook for booking flights and completing trips.
 * Handles the booking flow with optimistic updates.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookFlight, TripServiceError } from '@/services/tripService';
import { TRIP_PROPOSALS_KEY } from '@/hooks/queries/useTripProposals';
import type {
  TripProposal,
  TripProposalWithDetails,
  BookFlightInput,
} from '@/types/database';

interface UseBookTripOptions {
  /** Callback on successful booking */
  onSuccess?: (data: TripProposal) => void;
  /** Callback on error */
  onError?: (error: TripServiceError) => void;
  /** Enable optimistic updates (default: true) */
  optimistic?: boolean;
}

/**
 * Hook to book a flight for a trip proposal
 *
 * This mutation:
 * 1. Marks the selected flight as is_selected
 * 2. Updates the trip status to 'booked'
 * 3. Sets the trip's total_cost to the flight price
 *
 * @param options - Mutation options
 * @returns Mutation result with book function
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useBookTrip({
 *   onSuccess: () => toast.success('Flight booked successfully!'),
 * });
 *
 * // Book a flight
 * mutate({ trip_id: 'trip-123', flight_id: 'flight-456' });
 * ```
 */
export function useBookTrip(
  options: UseBookTripOptions = {}
): UseMutationResult<TripProposal, TripServiceError, BookFlightInput> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BookFlightInput) => bookFlight(input),

    onMutate: async (input) => {
      if (!optimistic) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TRIP_PROPOSALS_KEY] });

      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData<TripProposalWithDetails[]>([
        TRIP_PROPOSALS_KEY,
      ]);

      // Optimistically update the cache
      if (previousTrips) {
        queryClient.setQueryData<TripProposalWithDetails[]>(
          [TRIP_PROPOSALS_KEY],
          previousTrips.map((trip) => {
            if (trip.id !== input.trip_id) return trip;

            // Find the selected flight to get price
            const selectedFlight = trip.flight_options.find(
              (f) => f.id === input.flight_id
            );

            return {
              ...trip,
              status: 'booked',
              total_cost: selectedFlight?.price ?? trip.total_cost,
              updated_at: new Date().toISOString(),
              flight_options: trip.flight_options.map((flight) => ({
                ...flight,
                is_selected: flight.id === input.flight_id,
              })),
            };
          })
        );
      }

      return { previousTrips };
    },

    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousTrips) {
        queryClient.setQueryData([TRIP_PROPOSALS_KEY], context.previousTrips);
      }
      onError?.(error);
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
    },
  });
}

/**
 * Helper hook for simpler flight selection (without booking)
 * Just marks a flight as selected without changing trip status
 */
export function useSelectFlight(
  options: UseBookTripOptions = {}
): UseMutationResult<
  void,
  TripServiceError,
  { tripId: string; flightId: string }
> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, flightId }) => {
      // This is a client-side only operation for UI state
      // The actual booking happens with useBookTrip
      console.log('Flight selected:', { tripId, flightId });
    },

    onMutate: async ({ tripId, flightId }) => {
      if (!optimistic) return;

      await queryClient.cancelQueries({ queryKey: [TRIP_PROPOSALS_KEY] });

      const previousTrips = queryClient.getQueryData<TripProposalWithDetails[]>([
        TRIP_PROPOSALS_KEY,
      ]);

      if (previousTrips) {
        queryClient.setQueryData<TripProposalWithDetails[]>(
          [TRIP_PROPOSALS_KEY],
          previousTrips.map((trip) => {
            if (trip.id !== tripId) return trip;

            return {
              ...trip,
              flight_options: trip.flight_options.map((flight) => ({
                ...flight,
                is_selected: flight.id === flightId,
              })),
            };
          })
        );
      }

      return { previousTrips };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData([TRIP_PROPOSALS_KEY], context.previousTrips);
      }
      onError?.(_error as TripServiceError);
    },

    onSuccess: () => {
      onSuccess?.(null as unknown as TripProposal);
    },
  });
}

export default useBookTrip;
