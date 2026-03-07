/**
 * useBookTrip Hook
 *
 * React Query mutation hook for booking flights and completing trips.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookFlight, TripServiceError } from '../../services/tripService';
import { TRIP_PROPOSALS_KEY } from '../queries/useTripProposals';
import type { TripProposal, TripProposalWithDetails, BookFlightInput } from '../../types/database';

interface UseBookTripOptions {
  onSuccess?: (data: TripProposal) => void;
  onError?: (error: TripServiceError) => void;
  optimistic?: boolean;
}

export function useBookTrip(
  options: UseBookTripOptions = {}
): UseMutationResult<TripProposal, TripServiceError, BookFlightInput> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BookFlightInput) => bookFlight(input),

    onMutate: async (input) => {
      if (!optimistic) return;

      await queryClient.cancelQueries({ queryKey: [TRIP_PROPOSALS_KEY] });

      const previousTrips = queryClient.getQueryData<TripProposalWithDetails[]>([
        TRIP_PROPOSALS_KEY,
      ]);

      if (previousTrips) {
        queryClient.setQueryData<TripProposalWithDetails[]>(
          [TRIP_PROPOSALS_KEY],
          previousTrips.map((trip) => {
            if (trip.id !== input.trip_id) return trip;

            const selectedFlight = trip.flight_options.find((f) => f.id === input.flight_id);

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
      if (context?.previousTrips) {
        queryClient.setQueryData([TRIP_PROPOSALS_KEY], context.previousTrips);
      }
      onError?.(error);
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TRIP_PROPOSALS_KEY] });
    },
  });
}

export function useSelectFlight(
  options: UseBookTripOptions = {}
): UseMutationResult<void, TripServiceError, { tripId: string; flightId: string }> {
  const { onSuccess, onError, optimistic = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, flightId }) => {
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
