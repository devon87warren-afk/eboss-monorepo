/**
 * Hooks Index
 * Central export for all React Query hooks
 */

// Technician Location Hooks
export {
  useTechnicianLocations,
  TECHNICIAN_LOCATIONS_KEY,
} from './queries/useTechnicianLocations';
export {
  useUpdateTechnicianLocation,
  useUpsertTechnicianLocation,
} from './mutations/useUpdateTechnicianLocation';

// Trip Proposal Hooks
export {
  useTripProposals,
  useTripProposal,
  useCurrentTripProposal,
  TRIP_PROPOSALS_KEY,
} from './queries/useTripProposals';
export {
  useCreateTripProposal,
  useUpdateTripProposal,
  useDeleteTripProposal,
} from './mutations/useCreateTripProposal';
export { useBookTrip, useSelectFlight } from './mutations/useBookTrip';

// Savings Projection Hooks
export {
  useSavingsProjections,
  useSavingsStatistics,
  useCreateSavingsProjection,
  useSavingsCalculator,
  SAVINGS_PROJECTIONS_KEY,
} from './queries/useSavingsProjections';
