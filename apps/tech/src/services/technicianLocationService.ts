/**
 * Technician Location Service
 *
 * Provides CRUD operations for technician locations using Supabase.
 * Used by the FleetMap component to display real-time technician positions.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  TechnicianLocation,
  TechnicianLocationWithProfile,
  TechnicianLocationInput,
  TechnicianFlight,
} from '@/types/database';

/**
 * Error class for service-level errors
 */
export class TechnicianLocationServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TechnicianLocationServiceError';
  }
}

/**
 * Transform raw database row to TechnicianLocationWithProfile
 */
function transformToWithProfile(
  location: TechnicianLocation & { users?: { name: string } | null }
): TechnicianLocationWithProfile {
  // Construct flight object from individual fields
  const flight: TechnicianFlight | null =
    location.flight_from && location.flight_to
      ? {
          from: location.flight_from,
          to: location.flight_to,
          progress: location.flight_progress ?? 0,
        }
      : null;

  return {
    ...location,
    name: location.users?.name ?? 'Unknown Technician',
    flight,
  };
}

/**
 * Fetch all technician locations
 *
 * @param territoryId - Optional territory filter (not yet implemented)
 * @returns Array of technician locations with profile data
 * @throws TechnicianLocationServiceError if query fails
 */
export async function fetchTechnicianLocations(
  territoryId?: string
): Promise<TechnicianLocationWithProfile[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TechnicianLocationServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const query = supabase
    .from('technician_locations')
    .select(`
      *,
      users:user_id (
        name
      )
    `)
    .order('last_updated', { ascending: false });

  // Territory filtering can be added here when territory data is available
  if (territoryId) {
    // TODO: Add territory-based filtering when territories table exists
    console.log('Territory filtering not yet implemented:', territoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new TechnicianLocationServiceError(
      'Failed to fetch technician locations',
      error.code,
      error
    );
  }

  return (data ?? []).map((row: TechnicianLocation & { users?: { name: string } | null }) =>
    transformToWithProfile(row)
  );
}

/**
 * Fetch a single technician location by user ID
 *
 * @param userId - The user ID to look up
 * @returns Technician location or null if not found
 * @throws TechnicianLocationServiceError if query fails
 */
export async function fetchTechnicianLocationByUserId(
  userId: string
): Promise<TechnicianLocationWithProfile | null> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TechnicianLocationServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('technician_locations')
    .select(`
      *,
      users:user_id (
        name
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new TechnicianLocationServiceError(
      'Failed to fetch technician location',
      error.code,
      error
    );
  }

  return transformToWithProfile(
    data as TechnicianLocation & { users?: { name: string } | null }
  );
}

/**
 * Create or update a technician location (upsert)
 *
 * @param input - Location data to create/update
 * @returns The created/updated location
 * @throws TechnicianLocationServiceError if mutation fails
 */
export async function upsertTechnicianLocation(
  input: TechnicianLocationInput
): Promise<TechnicianLocation> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TechnicianLocationServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('technician_locations')
    .upsert(input as unknown as Record<string, unknown>, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    throw new TechnicianLocationServiceError(
      'Failed to upsert technician location',
      error.code,
      error
    );
  }

  return data as TechnicianLocation;
}

/**
 * Update a technician's location
 *
 * @param userId - The user ID to update
 * @param updates - Partial location data to update
 * @returns The updated location
 * @throws TechnicianLocationServiceError if mutation fails
 */
export async function updateTechnicianLocation(
  userId: string,
  updates: Partial<TechnicianLocationInput>
): Promise<TechnicianLocation> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TechnicianLocationServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from('technician_locations')
    .update(updates as Record<string, unknown>)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new TechnicianLocationServiceError(
      'Failed to update technician location',
      error.code,
      error
    );
  }

  return data as TechnicianLocation;
}

/**
 * Delete a technician location
 *
 * @param userId - The user ID to delete
 * @throws TechnicianLocationServiceError if deletion fails
 */
export async function deleteTechnicianLocation(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new TechnicianLocationServiceError(
      'Supabase is not configured',
      'NOT_CONFIGURED'
    );
  }

  const { error } = await supabase
    .from('technician_locations')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new TechnicianLocationServiceError(
      'Failed to delete technician location',
      error.code,
      error
    );
  }
}

/**
 * Subscribe to real-time technician location updates
 *
 * @param callback - Function to call when locations change
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToTechnicianLocations(
  callback: (locations: TechnicianLocation[]) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel('technician_locations_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'technician_locations',
      },
      async () => {
        // Refetch all locations on any change
        try {
          const { data } = await supabase!
            .from('technician_locations')
            .select('*')
            .order('last_updated', { ascending: false });
          callback((data ?? []) as TechnicianLocation[]);
        } catch (err) {
          console.error('Error refetching locations:', err);
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
