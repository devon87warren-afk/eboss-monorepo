-- Migration: Create trip_proposals table
-- Description: Stores travel trip proposals for the travel optimizer workflow
-- Author: Phase 5 Data Layer Integration

-- Create trip status enum
DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('proposed', 'approved', 'booked', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create trip_proposals table
CREATE TABLE IF NOT EXISTS trip_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to users table
    user_id UUID NOT NULL,

    -- Trip details
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Client association (optional)
    client_id UUID,

    -- Trip metadata
    purpose TEXT,
    status trip_status DEFAULT 'proposed',
    total_cost DECIMAL(10, 2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trip_proposals_user_id
    ON trip_proposals (user_id);

CREATE INDEX IF NOT EXISTS idx_trip_proposals_status
    ON trip_proposals (status);

CREATE INDEX IF NOT EXISTS idx_trip_proposals_dates
    ON trip_proposals (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_trip_proposals_client_id
    ON trip_proposals (client_id)
    WHERE client_id IS NOT NULL;

-- Composite index for user dashboard queries
CREATE INDEX IF NOT EXISTS idx_trip_proposals_user_status
    ON trip_proposals (user_id, status, created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_proposal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_trip_proposal_timestamp ON trip_proposals;
CREATE TRIGGER trigger_update_trip_proposal_timestamp
    BEFORE UPDATE ON trip_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_proposal_timestamp();

-- Enable Row Level Security
ALTER TABLE trip_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own trip proposals
CREATE POLICY "Users can view their own trip proposals"
    ON trip_proposals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can create their own trip proposals
CREATE POLICY "Users can create their own trip proposals"
    ON trip_proposals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own trip proposals
CREATE POLICY "Users can update their own trip proposals"
    ON trip_proposals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all trip proposals
CREATE POLICY "Admins can view all trip proposals"
    ON trip_proposals
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Policy: Admins can manage all trip proposals
CREATE POLICY "Admins can manage all trip proposals"
    ON trip_proposals
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE trip_proposals IS 'Travel trip proposals for the travel optimizer workflow';
COMMENT ON COLUMN trip_proposals.status IS 'Trip status: proposed, approved, booked, completed, cancelled';
COMMENT ON COLUMN trip_proposals.total_cost IS 'Total estimated/actual trip cost in USD';
