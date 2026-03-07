-- Migration: Create savings_projections table
-- Description: Stores fuel and emissions savings calculations for EBOSS units
-- Author: Phase 5 Data Layer Integration

-- Create savings_projections table
CREATE TABLE IF NOT EXISTS savings_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Optional reference to specific unit
    unit_serial_number VARCHAR(50),

    -- Input parameters
    runtime_hours INTEGER NOT NULL CHECK (runtime_hours > 0 AND runtime_hours <= 24),
    fuel_price DECIMAL(5, 2) NOT NULL CHECK (fuel_price > 0),
    project_days INTEGER NOT NULL CHECK (project_days > 0),

    -- Calculated outputs
    fuel_saved DECIMAL(10, 2),      -- Gallons saved
    cost_saved DECIMAL(10, 2),      -- USD saved
    co2_saved_tons DECIMAL(10, 2),  -- CO2 tons eliminated

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,

    -- Constraints
    CONSTRAINT positive_savings CHECK (
        fuel_saved IS NULL OR fuel_saved >= 0
    )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_savings_projections_created_by
    ON savings_projections (created_by)
    WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_savings_projections_unit
    ON savings_projections (unit_serial_number)
    WHERE unit_serial_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_savings_projections_created_at
    ON savings_projections (created_at DESC);

-- Composite index for user history queries
CREATE INDEX IF NOT EXISTS idx_savings_projections_user_date
    ON savings_projections (created_by, created_at DESC);

-- Function to auto-calculate savings on insert
-- Based on ANA EBOSS Specs: 75% reduction vs standard diesel generator
CREATE OR REPLACE FUNCTION calculate_savings_projection()
RETURNS TRIGGER AS $$
DECLARE
    standard_burn_rate DECIMAL := 1.5;    -- gal/hr for standard 25kVA diesel
    hybrid_burn_rate DECIMAL := 0.375;    -- gal/hr for EBOSS (75% reduction)
    co2_per_gallon DECIMAL := 22.4;       -- lbs CO2 per gallon diesel (EPA)
    total_standard_fuel DECIMAL;
    total_hybrid_fuel DECIMAL;
    fuel_saved DECIMAL;
    co2_saved_lbs DECIMAL;
BEGIN
    -- Calculate fuel usage
    total_standard_fuel := NEW.runtime_hours * NEW.project_days * standard_burn_rate;
    total_hybrid_fuel := NEW.runtime_hours * NEW.project_days * hybrid_burn_rate;
    fuel_saved := total_standard_fuel - total_hybrid_fuel;

    -- Calculate CO2 savings
    co2_saved_lbs := fuel_saved * co2_per_gallon;

    -- Set calculated fields if not provided
    IF NEW.fuel_saved IS NULL THEN
        NEW.fuel_saved := ROUND(fuel_saved, 2);
    END IF;

    IF NEW.cost_saved IS NULL THEN
        NEW.cost_saved := ROUND(fuel_saved * NEW.fuel_price, 2);
    END IF;

    IF NEW.co2_saved_tons IS NULL THEN
        NEW.co2_saved_tons := ROUND(co2_saved_lbs / 2000, 2);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate on insert
DROP TRIGGER IF EXISTS trigger_calculate_savings ON savings_projections;
CREATE TRIGGER trigger_calculate_savings
    BEFORE INSERT ON savings_projections
    FOR EACH ROW
    EXECUTE FUNCTION calculate_savings_projection();

-- Enable Row Level Security
ALTER TABLE savings_projections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Authenticated users can view all savings projections (public data)
CREATE POLICY "Authenticated users can view all savings projections"
    ON savings_projections
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can create savings projections
CREATE POLICY "Authenticated users can create savings projections"
    ON savings_projections
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Users can update their own projections
CREATE POLICY "Users can update their own projections"
    ON savings_projections
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own projections
CREATE POLICY "Users can delete their own projections"
    ON savings_projections
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Policy: Admins can manage all projections
CREATE POLICY "Admins can manage all savings projections"
    ON savings_projections
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE savings_projections IS 'Fuel and emissions savings calculations for EBOSS hybrid units';
COMMENT ON COLUMN savings_projections.runtime_hours IS 'Daily runtime hours (1-24)';
COMMENT ON COLUMN savings_projections.fuel_price IS 'Fuel price per gallon in USD';
COMMENT ON COLUMN savings_projections.project_days IS 'Project duration in days';
COMMENT ON COLUMN savings_projections.fuel_saved IS 'Calculated gallons of fuel saved vs standard diesel';
COMMENT ON COLUMN savings_projections.co2_saved_tons IS 'Calculated tons of CO2 emissions eliminated';
