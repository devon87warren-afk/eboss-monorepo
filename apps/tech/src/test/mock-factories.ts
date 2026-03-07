/**
 * Mock Data Factories
 *
 * Factory functions for creating test data with sensible defaults.
 */

import type {
  TechnicianLocation,
  TechnicianLocationWithProfile,
  TechnicianStatus,
  TripProposal,
  TripProposalWithDetails,
  TripStatus,
  FlightOption,
  SavingsProjection,
} from '@/types/database';

// ============================================================================
// TECHNICIAN LOCATION FACTORIES
// ============================================================================

let technicianIdCounter = 1;

export function createTechnicianLocation(
  overrides: Partial<TechnicianLocation> = {}
): TechnicianLocation {
  const id = technicianIdCounter++;
  return {
    id: `tech-${id}`,
    user_id: `user-${id}`,
    latitude: 39.7 + Math.random() * 2,
    longitude: -105.0 + Math.random() * 5,
    status: 'Available' as TechnicianStatus,
    current_client: null,
    current_task: null,
    flight_from: null,
    flight_to: null,
    flight_progress: null,
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}

export function createTechnicianLocationWithProfile(
  overrides: Partial<TechnicianLocationWithProfile> = {}
): TechnicianLocationWithProfile {
  const base = createTechnicianLocation(overrides);
  return {
    ...base,
    name: overrides.name ?? `Technician ${base.user_id}`,
    flight: overrides.flight ?? null,
  };
}

export function createTravelingTechnician(
  overrides: Partial<TechnicianLocationWithProfile> = {}
): TechnicianLocationWithProfile {
  return createTechnicianLocationWithProfile({
    status: 'Traveling',
    flight_from: 'DEN',
    flight_to: 'DFW',
    flight_progress: 60,
    flight: { from: 'DEN', to: 'DFW', progress: 60 },
    current_task: 'Travel to Dallas',
    ...overrides,
  });
}

export function createOnSiteTechnician(
  overrides: Partial<TechnicianLocationWithProfile> = {}
): TechnicianLocationWithProfile {
  return createTechnicianLocationWithProfile({
    status: 'On-Site',
    current_client: 'Sunbelt Rentals',
    current_task: 'Commissioning EBOSS-104',
    ...overrides,
  });
}

// ============================================================================
// TRIP PROPOSAL FACTORIES
// ============================================================================

let tripIdCounter = 1;

export function createTripProposal(
  overrides: Partial<TripProposal> = {}
): TripProposal {
  const id = tripIdCounter++;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  return {
    id: `trip-${id}`,
    user_id: `user-${id}`,
    destination: 'Washington DC',
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    client_id: null,
    purpose: 'Installation/Training',
    status: 'proposed' as TripStatus,
    total_cost: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createFlightOption(
  overrides: Partial<FlightOption> = {}
): FlightOption {
  const id = Math.floor(Math.random() * 10000);
  return {
    id: `flight-${id}`,
    trip_id: 'trip-1',
    airline: 'Delta',
    price: 450,
    departure_time: null,
    arrival_time: null,
    perks: ['Upgrade Eligible', '9x Points'],
    is_preferred: false,
    is_deal: false,
    is_selected: false,
    ...overrides,
  };
}

export function createTripProposalWithDetails(
  overrides: Partial<TripProposalWithDetails> = {}
): TripProposalWithDetails {
  const base = createTripProposal(overrides);
  return {
    ...base,
    client_name: overrides.client_name ?? null,
    flight_options: overrides.flight_options ?? [
      createFlightOption({ trip_id: base.id, is_preferred: true }),
      createFlightOption({
        trip_id: base.id,
        airline: 'Southwest',
        price: 320,
        is_deal: true,
        perks: ['No Change Fees', '2 Bags Free'],
      }),
    ],
  };
}

// ============================================================================
// SAVINGS PROJECTION FACTORIES
// ============================================================================

let savingsIdCounter = 1;

export function createSavingsProjection(
  overrides: Partial<SavingsProjection> = {}
): SavingsProjection {
  const id = savingsIdCounter++;
  return {
    id: `proj-${id}`,
    unit_serial_number: `EBOSS-${String(id).padStart(3, '0')}`,
    runtime_hours: 24,
    fuel_price: 4.5,
    project_days: 30,
    fuel_saved: 810,
    cost_saved: 3645,
    co2_saved_tons: 9.07,
    created_at: new Date().toISOString(),
    created_by: `user-${id}`,
    ...overrides,
  };
}

// ============================================================================
// SUPABASE MOCK HELPERS
// ============================================================================

export function createSupabaseResponse<T>(data: T, error: null = null) {
  return { data, error };
}

export function createSupabaseError(
  message: string,
  code: string = 'PGRST001'
) {
  return {
    data: null,
    error: { message, code, details: null, hint: null },
  };
}

// ============================================================================
// RESET COUNTERS (for test isolation)
// ============================================================================

export function resetMockCounters() {
  technicianIdCounter = 1;
  tripIdCounter = 1;
  savingsIdCounter = 1;
}
