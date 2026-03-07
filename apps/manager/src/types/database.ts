/**
 * Database Type Definitions
 *
 * TypeScript interfaces matching Supabase database schema.
 * These types ensure type safety across services, hooks, and components.
 */

// ============================================================================
// TECHNICIAN LOCATIONS
// ============================================================================

/**
 * Technician location status values
 */
export type TechnicianStatus = 'Available' | 'On-Site' | 'Traveling' | 'Offline';

/**
 * Flight information for technicians in transit
 */
export interface TechnicianFlight {
  /** Origin airport code (e.g., "DEN") */
  from: string;
  /** Destination airport code (e.g., "DFW") */
  to: string;
  /** Flight progress percentage (0-100) */
  progress: number;
}

/**
 * Technician location record from database
 */
export interface TechnicianLocation {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to users table */
  user_id: string;
  /** Latitude coordinate */
  latitude: number | null;
  /** Longitude coordinate */
  longitude: number | null;
  /** Current status */
  status: TechnicianStatus;
  /** Current client name (if on-site) */
  current_client: string | null;
  /** Current task description */
  current_task: string | null;
  /** Flight origin airport code */
  flight_from: string | null;
  /** Flight destination airport code */
  flight_to: string | null;
  /** Flight progress percentage */
  flight_progress: number | null;
  /** Last location update timestamp */
  last_updated: string;
}

/**
 * Extended technician location with user profile data
 * Used in FleetMap component
 */
export interface TechnicianLocationWithProfile extends TechnicianLocation {
  /** User's display name */
  name: string;
  /** Flight info object (computed from flight_* fields) */
  flight: TechnicianFlight | null;
}

/**
 * Input for creating/updating technician location
 */
export interface TechnicianLocationInput {
  user_id: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: TechnicianStatus;
  current_client?: string | null;
  current_task?: string | null;
  flight_from?: string | null;
  flight_to?: string | null;
  flight_progress?: number | null;
}

// ============================================================================
// TRIP PROPOSALS
// ============================================================================

/**
 * Trip proposal status values
 */
export type TripStatus = 'proposed' | 'approved' | 'booked' | 'completed' | 'cancelled';

/**
 * Trip proposal record from database
 */
export interface TripProposal {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to users table */
  user_id: string;
  /** Destination city/location */
  destination: string;
  /** Trip start date (YYYY-MM-DD) */
  start_date: string;
  /** Trip end date (YYYY-MM-DD) */
  end_date: string;
  /** Reference to customers table */
  client_id: string | null;
  /** Trip purpose/reason */
  purpose: string | null;
  /** Current status */
  status: TripStatus;
  /** Total estimated cost */
  total_cost: number | null;
  /** Record creation timestamp */
  created_at: string;
  /** Record update timestamp */
  updated_at: string;
}

/**
 * Extended trip proposal with related data
 */
export interface TripProposalWithDetails extends TripProposal {
  /** Client name (from customers table) */
  client_name: string | null;
  /** Flight options for this trip */
  flight_options: FlightOption[];
}

/**
 * Input for creating a trip proposal
 */
export interface CreateTripProposalInput {
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  client_id?: string | null;
  purpose?: string | null;
}

/**
 * Input for updating a trip proposal
 */
export interface UpdateTripProposalInput {
  destination?: string;
  start_date?: string;
  end_date?: string;
  client_id?: string | null;
  purpose?: string | null;
  status?: TripStatus;
  total_cost?: number | null;
}

// ============================================================================
// FLIGHT OPTIONS
// ============================================================================

/**
 * Flight option record from database
 */
export interface FlightOption {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to trip_proposals table */
  trip_id: string;
  /** Airline name */
  airline: string;
  /** Flight price in USD */
  price: number;
  /** Departure timestamp */
  departure_time: string | null;
  /** Arrival timestamp */
  arrival_time: string | null;
  /** Array of perks/benefits */
  perks: string[];
  /** User's preferred airline flag */
  is_preferred: boolean;
  /** Good deal flag */
  is_deal: boolean;
  /** Selected flight flag */
  is_selected: boolean;
}

/**
 * Input for creating a flight option
 */
export interface CreateFlightOptionInput {
  trip_id: string;
  airline: string;
  price: number;
  departure_time?: string | null;
  arrival_time?: string | null;
  perks?: string[];
  is_preferred?: boolean;
  is_deal?: boolean;
}

/**
 * Input for booking a flight (selecting an option)
 */
export interface BookFlightInput {
  trip_id: string;
  flight_id: string;
}

// ============================================================================
// SAVINGS PROJECTIONS
// ============================================================================

/**
 * Savings projection record from database
 */
export interface SavingsProjection {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to units table (serial number) */
  unit_serial_number: string | null;
  /** Daily runtime hours */
  runtime_hours: number;
  /** Fuel price per gallon */
  fuel_price: number;
  /** Project duration in days */
  project_days: number;
  /** Gallons of fuel saved */
  fuel_saved: number | null;
  /** Cost savings in USD */
  cost_saved: number | null;
  /** CO2 saved in tons */
  co2_saved_tons: number | null;
  /** Record creation timestamp */
  created_at: string;
  /** User who created the projection */
  created_by: string | null;
}

/**
 * Input for creating a savings projection
 */
export interface CreateSavingsProjectionInput {
  unit_serial_number?: string | null;
  runtime_hours: number;
  fuel_price: number;
  project_days: number;
  fuel_saved?: number | null;
  cost_saved?: number | null;
  co2_saved_tons?: number | null;
  created_by?: string | null;
}

// ============================================================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================================================

/**
 * Database schema type for Supabase client typing
 */
export interface Database {
  public: {
    Tables: {
      technician_locations: {
        Row: TechnicianLocation;
        Insert: TechnicianLocationInput & { id?: string };
        Update: Partial<TechnicianLocationInput>;
        Relationships: [];
      };
      trip_proposals: {
        Row: TripProposal;
        Insert: CreateTripProposalInput & { id?: string };
        Update: UpdateTripProposalInput;
        Relationships: [];
      };
      flight_options: {
        Row: FlightOption;
        Insert: CreateFlightOptionInput & { id?: string };
        Update: Partial<CreateFlightOptionInput> & { is_selected?: boolean };
        Relationships: [];
      };
      savings_projections: {
        Row: SavingsProjection;
        Insert: CreateSavingsProjectionInput & { id?: string };
        Update: Partial<CreateSavingsProjectionInput>;
        Relationships: [];
      };
      users: {
        Row: { id: string; name: string; email: string };
        Insert: { id?: string; name: string; email: string };
        Update: { name?: string; email?: string };
        Relationships: [];
      };
      customers: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: { name?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      technician_status: TechnicianStatus;
      trip_status: TripStatus;
    };
  };
}
