-- Migration: Create technician_locations table
-- Description: Stores real-time technician location and status for fleet map visualization
-- Author: Phase 5 Data Layer Integration

-- Create technician status enum
DO $$ BEGIN
    CREATE TYPE technician_status AS ENUM ('Available', 'On-Site', 'Traveling', 'Offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create technician_locations table
CREATE TABLE IF NOT EXISTS technician_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to users table (one location per user)
    user_id UUID NOT NULL UNIQUE,

    -- Geographic coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Current status
    status technician_status DEFAULT 'Available',

    -- Current assignment info
    current_client VARCHAR(255),
    current_task TEXT,

    -- Flight tracking (for traveling technicians)
    flight_from VARCHAR(10),     -- Airport code (e.g., 'DEN')
    flight_to VARCHAR(10),       -- Airport code (e.g., 'DFW')
    flight_progress INTEGER CHECK (flight_progress >= 0 AND flight_progress <= 100),

    -- Timestamps
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast territory-based queries
CREATE INDEX IF NOT EXISTS idx_technician_locations_coords
    ON technician_locations (latitude, longitude);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_technician_locations_status
    ON technician_locations (status);

-- Create index for last_updated (for polling queries)
CREATE INDEX IF NOT EXISTS idx_technician_locations_last_updated
    ON technician_locations (last_updated DESC);

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_technician_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on any update
DROP TRIGGER IF EXISTS trigger_update_technician_location_timestamp ON technician_locations;
CREATE TRIGGER trigger_update_technician_location_timestamp
    BEFORE UPDATE ON technician_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_location_timestamp();

-- Enable Row Level Security
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view all technician locations (for fleet map)
CREATE POLICY "Allow authenticated users to view all technician locations"
    ON technician_locations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can only update their own location
CREATE POLICY "Users can update their own location"
    ON technician_locations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own location
CREATE POLICY "Users can insert their own location"
    ON technician_locations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can manage all locations (requires admin role claim)
CREATE POLICY "Admins can manage all technician locations"
    ON technician_locations
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE technician_locations IS 'Real-time technician location and status for fleet map';
COMMENT ON COLUMN technician_locations.user_id IS 'Reference to the user/technician';
COMMENT ON COLUMN technician_locations.status IS 'Current technician status: Available, On-Site, Traveling, Offline';
COMMENT ON COLUMN technician_locations.flight_progress IS 'Percentage of flight completed (0-100) when traveling';
