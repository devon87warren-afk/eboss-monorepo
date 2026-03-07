-- Migration: Create flight_options table
-- Description: Stores flight options for trip proposals in the travel optimizer
-- Author: Phase 5 Data Layer Integration

-- Create flight_options table
CREATE TABLE IF NOT EXISTS flight_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to trip_proposals (cascade delete)
    trip_id UUID NOT NULL REFERENCES trip_proposals(id) ON DELETE CASCADE,

    -- Flight details
    airline VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),

    -- Schedule
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,

    -- Perks stored as JSON array
    perks JSONB DEFAULT '[]'::jsonb,

    -- Flags for UI display
    is_preferred BOOLEAN DEFAULT false,  -- User's loyalty airline
    is_deal BOOLEAN DEFAULT false,        -- Good value option
    is_selected BOOLEAN DEFAULT false,    -- User's final selection

    -- Constraints
    CONSTRAINT valid_flight_times CHECK (
        arrival_time IS NULL OR
        departure_time IS NULL OR
        arrival_time > departure_time
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flight_options_trip_id
    ON flight_options (trip_id);

CREATE INDEX IF NOT EXISTS idx_flight_options_price
    ON flight_options (price);

-- Partial index for selected flights
CREATE INDEX IF NOT EXISTS idx_flight_options_selected
    ON flight_options (trip_id)
    WHERE is_selected = true;

-- GIN index for perks array queries
CREATE INDEX IF NOT EXISTS idx_flight_options_perks
    ON flight_options USING GIN (perks);

-- Function to ensure only one flight is selected per trip
CREATE OR REPLACE FUNCTION ensure_single_flight_selection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_selected = true THEN
        -- Deselect all other flights for this trip
        UPDATE flight_options
        SET is_selected = false
        WHERE trip_id = NEW.trip_id
          AND id != NEW.id
          AND is_selected = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single selection
DROP TRIGGER IF EXISTS trigger_single_flight_selection ON flight_options;
CREATE TRIGGER trigger_single_flight_selection
    BEFORE INSERT OR UPDATE OF is_selected ON flight_options
    FOR EACH ROW
    WHEN (NEW.is_selected = true)
    EXECUTE FUNCTION ensure_single_flight_selection();

-- Enable Row Level Security
ALTER TABLE flight_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from trip_proposals via trip_id)

-- Policy: Users can view flight options for their trips
CREATE POLICY "Users can view flight options for their trips"
    ON flight_options
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_proposals tp
            WHERE tp.id = trip_id
              AND tp.user_id = auth.uid()
        )
    );

-- Policy: Users can insert flight options for their trips
CREATE POLICY "Users can insert flight options for their trips"
    ON flight_options
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_proposals tp
            WHERE tp.id = trip_id
              AND tp.user_id = auth.uid()
        )
    );

-- Policy: Users can update flight options for their trips
CREATE POLICY "Users can update flight options for their trips"
    ON flight_options
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_proposals tp
            WHERE tp.id = trip_id
              AND tp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_proposals tp
            WHERE tp.id = trip_id
              AND tp.user_id = auth.uid()
        )
    );

-- Policy: Admins can manage all flight options
CREATE POLICY "Admins can manage all flight options"
    ON flight_options
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE flight_options IS 'Flight options for trip proposals in travel optimizer';
COMMENT ON COLUMN flight_options.perks IS 'JSON array of flight perks/benefits';
COMMENT ON COLUMN flight_options.is_preferred IS 'Flag for user loyalty airline preference';
COMMENT ON COLUMN flight_options.is_deal IS 'Flag indicating a good value option';
COMMENT ON COLUMN flight_options.is_selected IS 'User final selection (only one per trip)';
