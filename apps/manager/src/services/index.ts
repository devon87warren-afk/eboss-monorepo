/**
 * Services Index
 * Central export for all Supabase service functions
 */

// Technician Location Service
export {
  fetchTechnicianLocations,
  fetchTechnicianLocationByUserId,
  upsertTechnicianLocation,
  updateTechnicianLocation,
  deleteTechnicianLocation,
  subscribeToTechnicianLocations,
  TechnicianLocationServiceError,
} from './technicianLocationService';

// Trip Service
export {
  fetchTripProposals,
  fetchTripProposalById,
  createTripProposal,
  updateTripProposal,
  deleteTripProposal,
  fetchFlightOptions,
  createFlightOption,
  bookFlight,
  getSelectedFlight,
  TripServiceError,
} from './tripService';

// Savings Service
export {
  fetchSavingsProjections,
  fetchUserSavingsProjections,
  fetchUnitSavingsProjections,
  fetchSavingsProjectionById,
  createSavingsProjection,
  deleteSavingsProjection,
  getSavingsStatistics,
  calculateSavings,
  SAVINGS_CONSTANTS,
  SavingsServiceError,
} from './savingsService';
