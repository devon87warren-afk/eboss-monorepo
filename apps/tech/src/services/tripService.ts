/**
 * Trip Service
 *
 * Provides CRUD operations for trip proposals and flight options using Supabase.
 * Used by the TravelOptimizer component.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  TripProposal,
  TripProposalWithDetails,
  CreateTripProposalInput,
  UpdateTripProposalInput,
  FlightOption,
  CreateFlightOptionInput,
  BookFlightInput,
} from '@/types/database';

/**
 * Error class for service-level errors
 */
export class TripServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TripServiceError';
  }
}

/**
 * Transform raw database row to TripProposalWithDetails
 */
function transformToWithDetails(
  trip: TripProposal & {
    customers?: { name: string } | null;
    flight_options?: FlightOption[];
  }
): TripProposalWithDetails {
  return {
    ...trip,
    client_name: trip.customers?.name ?? null,
    flight_options: (trip.flight_options ?? []).map((opt) => ({
      ...opt,
      perks: Array.isArray(opt.perks) ? opt.perks : [],
    })),
  };
}

// ============================================================================
// TRIP PROPOSALS
// ============================================================================

/**
 * Fetch all trip proposals for a user
 *
 * @param userId - Optional user ID filter (defaults to current user via RLS)
 * @returns Array of trip proposals with details
 * @throws TripServiceError if query fails
 */
export async function fetchTripProposals(
  userId?: string
): Promise<TripProposalWithDetails[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  let query = supabase
    .from('trip_proposals')
    .select(`
      *,
      customers:client_id (
        name
      ),
      flight_options (*)
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new TripServiceError(
      'Failed to fetch trip proposals',
      error.code,
      error
    );
  }

  return (data ?? []).map((row) =>
    transformToWithDetails(
      row as TripProposal & {
        customers?: { name: string } | null;
        flight_options?: FlightOption[];
      }
    )
  );
}

/**
 * Fetch a single trip proposal by ID
 *
 * @param tripId - The trip ID to fetch
 * @returns Trip proposal with details or null if not found
 * @throws TripServiceError if query fails
 */
export async function fetchTripProposalById(
  tripId: string
): Promise<TripProposalWithDetails | null> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { data, error } = await supabase
    .from('trip_proposals')
    .select(`
      *,
      customers:client_id (
        name
      ),
      flight_options (*)
    `)
    .eq('id', tripId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new TripServiceError(
      'Failed to fetch trip proposal',
      error.code,
      error
    );
  }

  return transformToWithDetails(
    data as TripProposal & {
      customers?: { name: string } | null;
      flight_options?: FlightOption[];
    }
  );
}

/**
 * Create a new trip proposal
 *
 * @param input - Trip proposal data
 * @returns The created trip proposal
 * @throws TripServiceError if creation fails
 */
export async function createTripProposal(
  input: CreateTripProposalInput
): Promise<TripProposal> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { data, error } = await supabase
    .from('trip_proposals')
    .insert(input as unknown as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    throw new TripServiceError(
      'Failed to create trip proposal',
      error.code,
      error
    );
  }

  return data as TripProposal;
}

/**
 * Update an existing trip proposal
 *
 * @param tripId - The trip ID to update
 * @param updates - Partial trip data to update
 * @returns The updated trip proposal
 * @throws TripServiceError if update fails
 */
export async function updateTripProposal(
  tripId: string,
  updates: UpdateTripProposalInput
): Promise<TripProposal> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { data, error } = await supabase
    .from('trip_proposals')
    .update(updates as Record<string, unknown>)
    .eq('id', tripId)
    .select()
    .single();

  if (error) {
    throw new TripServiceError(
      'Failed to update trip proposal',
      error.code,
      error
    );
  }

  return data as TripProposal;
}

/**
 * Delete a trip proposal (cascades to flight_options)
 *
 * @param tripId - The trip ID to delete
 * @throws TripServiceError if deletion fails
 */
export async function deleteTripProposal(tripId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { error } = await supabase
    .from('trip_proposals')
    .delete()
    .eq('id', tripId);

  if (error) {
    throw new TripServiceError(
      'Failed to delete trip proposal',
      error.code,
      error
    );
  }
}

// ============================================================================
// FLIGHT OPTIONS
// ============================================================================

/**
 * Fetch flight options for a trip
 *
 * @param tripId - The trip ID to get options for
 * @returns Array of flight options
 * @throws TripServiceError if query fails
 */
export async function fetchFlightOptions(tripId: string): Promise<FlightOption[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { data, error } = await supabase
    .from('flight_options')
    .select('*')
    .eq('trip_id', tripId)
    .order('price', { ascending: true });

  if (error) {
    throw new TripServiceError(
      'Failed to fetch flight options',
      error.code,
      error
    );
  }

  // Parse perks from JSONB and ensure type safety
  return (data ?? []).map((option) => {
    const opt = option as Record<string, unknown>;
    return {
      ...opt,
      perks: Array.isArray(opt.perks) ? opt.perks : [],
    } as FlightOption;
  });
}

/**
 * Create a new flight option
 *
 * @param input - Flight option data
 * @returns The created flight option
 * @throws TripServiceError if creation fails
 */
export async function createFlightOption(
  input: CreateFlightOptionInput
): Promise<FlightOption> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const insertData = {
    ...input,
    perks: input.perks ?? [],
  };

  const { data, error } = await supabase
    .from('flight_options')
    .insert(insertData as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    throw new TripServiceError(
      'Failed to create flight option',
      error.code,
      error
    );
  }

  const result = data as Record<string, unknown>;
  return {
    ...result,
    perks: Array.isArray(result.perks) ? result.perks : [],
  } as FlightOption;
}

/**
 * Book a flight (select it and update trip status)
 *
 * @param input - Booking data with trip and flight IDs
 * @returns The updated trip proposal
 * @throws TripServiceError if booking fails
 */
export async function bookFlight(input: BookFlightInput): Promise<TripProposal> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  // Start a transaction-like operation
  // 1. Mark the flight as selected (trigger will deselect others)
  const { error: flightError } = await supabase
    .from('flight_options')
    .update({ is_selected: true } as Record<string, unknown>)
    .eq('id', input.flight_id)
    .eq('trip_id', input.trip_id);

  if (flightError) {
    throw new TripServiceError(
      'Failed to select flight',
      flightError.code,
      flightError
    );
  }

  // 2. Get the flight price to update total_cost
  const { data: flightData, error: fetchError } = await supabase
    .from('flight_options')
    .select('price')
    .eq('id', input.flight_id)
    .single();

  if (fetchError) {
    throw new TripServiceError(
      'Failed to fetch flight price',
      fetchError.code,
      fetchError
    );
  }

  const flightPrice = (flightData as { price: number })?.price;

  // 3. Update trip status to booked and set total_cost
  const { data: tripData, error: tripError } = await supabase
    .from('trip_proposals')
    .update({
      status: 'booked',
      total_cost: flightPrice,
    } as Record<string, unknown>)
    .eq('id', input.trip_id)
    .select()
    .single();

  if (tripError) {
    throw new TripServiceError(
      'Failed to update trip status',
      tripError.code,
      tripError
    );
  }

  return tripData as TripProposal;
}

/**
 * Get the currently selected flight for a trip
 *
 * @param tripId - The trip ID
 * @returns The selected flight option or null
 * @throws TripServiceError if query fails
 */
export async function getSelectedFlight(
  tripId: string
): Promise<FlightOption | null> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TripServiceError('Supabase is not configured', 'NOT_CONFIGURED');
  }

  const { data, error } = await supabase
    .from('flight_options')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_selected', true)
    .maybeSingle();

  if (error) {
    throw new TripServiceError(
      'Failed to fetch selected flight',
      error.code,
      error
    );
  }

  if (!data) return null;

  const result = data as Record<string, unknown>;
  return {
    ...result,
    perks: Array.isArray(result.perks) ? result.perks : [],
  } as FlightOption;
}
