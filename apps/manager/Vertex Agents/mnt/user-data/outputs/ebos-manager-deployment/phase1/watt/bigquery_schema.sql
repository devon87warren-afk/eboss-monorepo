-- eBOS Manager - BigQuery Schema Initialization
-- This script creates all tables in the ebos_manager dataset

-- Dataset should already be created by infrastructure setup
-- If not, create with: bq mk --dataset --location=us-central1 your-project:ebos_manager

-- Table 1: Systems (eBoss Hybrid Gen units)
CREATE TABLE IF NOT EXISTS `ebos_manager.systems` (
  system_id STRING NOT NULL,
  model STRING NOT NULL,  -- "30kW", "60kW", "100kW", "150kW"
  installation_date DATE,
  customer_id STRING NOT NULL,
  location_state STRING,
  location_city STRING,
  location_zip STRING,
  elevation_ft INT64,  -- Important for altitude derating
  region STRING NOT NULL,  -- "West", "North", "East", "South"
  commissioning_tech STRING,
  baseline_electrical_output_kw FLOAT64,
  baseline_thermal_output_btu FLOAT64,
  baseline_electrical_efficiency_pct FLOAT64,
  baseline_thermal_efficiency_pct FLOAT64,
  baseline_combined_efficiency_pct FLOAT64,
  fuel_type STRING,  -- "Natural Gas", "Propane"
  grid_connected BOOLEAN,
  bms_integrated BOOLEAN,
  status STRING,  -- "Active", "Warranty", "Maintenance", "Decommissioned"
  warranty_start_date DATE,
  warranty_end_date DATE,
  last_maintenance_date DATE,
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(installation_date)
CLUSTER BY region, status, model;

-- Table 2: Customers
CREATE TABLE IF NOT EXISTS `ebos_manager.customers` (
  customer_id STRING NOT NULL,
  company_name STRING NOT NULL,
  industry STRING,  -- "Data Center", "Utility", "Manufacturing", "Agriculture", etc.
  customer_segment STRING,  -- More specific categorization
  location_state STRING,
  location_city STRING,
  region STRING NOT NULL,
  primary_contact_name STRING,
  primary_contact_email STRING,
  primary_contact_phone STRING,
  technical_contact_name STRING,
  technical_contact_email STRING,
  billing_contact_name STRING,
  billing_contact_email STRING,
  satisfaction_score FLOAT64,  -- 1.0-5.0
  last_survey_date DATE,
  nps_score INT64,  -- Net Promoter Score: -100 to 100
  customer_since DATE,
  total_systems_count INT64,
  total_contract_value_usd FLOAT64,
  warranty_status STRING,  -- "Active", "Pending Renewal", "Expired"
  vip_status BOOLEAN,
  at_risk_flag BOOLEAN,
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(customer_since)
CLUSTER BY region, industry, warranty_status;

-- Table 3: Commissioning Records
CREATE TABLE IF NOT EXISTS `ebos_manager.commissioning_records` (
  record_id STRING NOT NULL,
  system_id STRING NOT NULL,
  commissioning_date DATE NOT NULL,
  technician STRING NOT NULL,
  duration_hours FLOAT64,
  travel_hours FLOAT64,
  travel_distance_miles FLOAT64,
  completion_status STRING,  -- "Completed", "Partial", "Failed"
  customer_training_completed BOOLEAN,
  training_duration_hours FLOAT64,
  warranty_activated BOOLEAN,
  issues_encountered STRING,
  baseline_electrical_output_kw FLOAT64,
  baseline_thermal_output_btu FLOAT64,
  baseline_fuel_consumption_therms_hr FLOAT64,
  baseline_electrical_efficiency_pct FLOAT64,
  baseline_thermal_efficiency_pct FLOAT64,
  baseline_combined_efficiency_pct FLOAT64,
  ambient_temperature_f FLOAT64,
  altitude_ft INT64,
  weather_conditions STRING,
  bms_integration_completed BOOLEAN,
  grid_interconnection_completed BOOLEAN,
  safety_systems_verified BOOLEAN,
  customer_satisfaction_score FLOAT64,
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(commissioning_date)
CLUSTER BY technician, completion_status;

-- Table 4: Performance Metrics (time-series data)
CREATE TABLE IF NOT EXISTS `ebos_manager.performance_metrics` (
  metric_id STRING NOT NULL,
  system_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  electrical_output_kw FLOAT64,
  thermal_output_btu FLOAT64,
  fuel_consumption_therms_hr FLOAT64,
  electrical_efficiency_pct FLOAT64,
  thermal_efficiency_pct FLOAT64,
  combined_efficiency_pct FLOAT64,
  oil_pressure_psi FLOAT64,
  coolant_temp_f FLOAT64,
  engine_rpm INT64,
  voltage_output_v FLOAT64,
  frequency_hz FLOAT64,
  supply_water_temp_f FLOAT64,
  return_water_temp_f FLOAT64,
  water_flow_rate_gpm FLOAT64,
  ambient_temp_f FLOAT64,
  uptime_hours FLOAT64,
  operating_mode STRING,  -- "Baseload", "Load Following", "Peak Shaving", "Scheduled"
  fault_codes STRING,
  alert_count INT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(timestamp)
CLUSTER BY system_id;

-- Table 5: Work Orders
CREATE TABLE IF NOT EXISTS `ebos_manager.work_orders` (
  work_order_id STRING NOT NULL,
  system_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  technician STRING,
  scheduled_date DATE,
  completion_date DATE,
  job_type STRING,  -- "Commissioning", "Maintenance", "Repair", "Troubleshooting", "Training"
  priority INT64,  -- 1=Critical, 2=Urgent, 3=Normal, 4=Low
  duration_hours FLOAT64,
  travel_hours FLOAT64,
  travel_distance_miles FLOAT64,
  parts_used STRING,  -- JSON or comma-separated
  parts_cost_usd FLOAT64,
  labor_cost_usd FLOAT64,
  total_cost_usd FLOAT64,
  billable BOOLEAN,
  warranty_claim BOOLEAN,
  status STRING,  -- "Scheduled", "In Progress", "Completed", "Cancelled"
  customer_satisfaction_score FLOAT64,
  issue_description STRING,
  resolution_notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(scheduled_date)
CLUSTER BY technician, status, job_type;

-- Table 6: Wins & Losses (Competitive Analysis)
CREATE TABLE IF NOT EXISTS `ebos_manager.wins_losses` (
  deal_id STRING NOT NULL,
  deal_date DATE NOT NULL,
  region STRING NOT NULL,
  customer_name STRING,
  customer_type STRING,
  deal_size_usd FLOAT64,
  system_model STRING,
  system_quantity INT64,
  winner STRING,  -- "eBoss" or competitor name
  competitor_evaluated STRING,
  competitors_evaluated ARRAY<STRING>,  -- Multiple competitors
  decision_factors STRING,  -- Comma-separated: "Price", "Efficiency", "Service", "Specs"
  price_quoted_usd FLOAT64,
  competitor_price_usd FLOAT64,
  efficiency_advantage_pct FLOAT64,
  service_advantage STRING,
  technical_advantage STRING,
  technician STRING,
  sales_rep STRING,
  technician_notes STRING,
  sales_notes STRING,
  follow_up_action STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(deal_date)
CLUSTER BY region, winner;

-- Table 7: Inventory
CREATE TABLE IF NOT EXISTS `ebos_manager.inventory` (
  part_id STRING NOT NULL,
  part_name STRING NOT NULL,
  part_number STRING,
  part_category STRING,  -- "Engine", "Electrical", "Thermal", "Consumables", "Specialized"
  part_tier STRING,  -- "A" (critical), "B" (important), "C" (specialty), "D" (drop-ship)
  quantity_on_hand INT64,
  warehouse_location STRING,
  region STRING,
  unit_cost_usd FLOAT64,
  reorder_threshold INT64,
  reorder_quantity INT64,
  lead_time_days INT64,
  supplier STRING,
  supplier_part_number STRING,
  compatible_models ARRAY<STRING>,  -- ["30kW", "60kW", "100kW", "150kW"]
  last_ordered_date DATE,
  last_used_date DATE,
  turnover_rate FLOAT64,  -- Annual turns
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) CLUSTER BY region, part_category, part_tier;

-- Table 8: Alerts & Notifications
CREATE TABLE IF NOT EXISTS `ebos_manager.alerts` (
  alert_id STRING NOT NULL,
  system_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  priority INT64,  -- 1=Critical, 2=Urgent, 3=Maintenance, 4=Informational
  alert_type STRING,  -- "Safety", "Performance", "Maintenance", "System"
  alert_category STRING,  -- "Engine", "Generator", "Thermal", "Electrical", "Control"
  fault_code STRING,
  description STRING,
  recommended_action STRING,
  assigned_to STRING,  -- Technician
  acknowledged BOOLEAN,
  acknowledged_at TIMESTAMP,
  acknowledged_by STRING,
  resolved BOOLEAN,
  resolved_at TIMESTAMP,
  resolved_by STRING,
  resolution_notes STRING,
  customer_notified BOOLEAN,
  customer_notification_method STRING,
  escalated BOOLEAN,
  escalation_level STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(timestamp)
CLUSTER BY system_id, priority, resolved;

-- Table 9: Training Records
CREATE TABLE IF NOT EXISTS `ebos_manager.training_records` (
  training_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  system_id STRING,
  training_date DATE NOT NULL,
  trainer STRING,
  training_type STRING,  -- "Onboarding", "Refresher", "Advanced", "Safety"
  duration_hours FLOAT64,
  attendees ARRAY<STRING>,
  topics_covered ARRAY<STRING>,
  competency_verified BOOLEAN,
  certification_issued BOOLEAN,
  certification_expiration DATE,
  customer_satisfaction_score FLOAT64,
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(training_date)
CLUSTER BY customer_id;

-- Table 10: Warranty Claims
CREATE TABLE IF NOT EXISTS `ebos_manager.warranty_claims` (
  claim_id STRING NOT NULL,
  system_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  claim_date DATE NOT NULL,
  issue_description STRING,
  fault_code STRING,
  covered BOOLEAN,
  claim_amount_usd FLOAT64,
  approved_amount_usd FLOAT64,
  parts_replaced STRING,
  labor_hours FLOAT64,
  technician STRING,
  resolution_date DATE,
  claim_status STRING,  -- "Submitted", "Under Review", "Approved", "Denied", "Completed"
  denial_reason STRING,
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) PARTITION BY DATE(claim_date)
CLUSTER BY system_id, claim_status;

-- Create views for common queries

-- View: Regional Performance Summary
CREATE OR REPLACE VIEW `ebos_manager.vw_regional_performance` AS
SELECT 
  s.region,
  COUNT(DISTINCT s.system_id) as total_systems,
  COUNT(DISTINCT s.customer_id) as total_customers,
  AVG(c.satisfaction_score) as avg_customer_satisfaction,
  AVG(cr.duration_hours) as avg_commissioning_hours,
  SUM(CASE WHEN cr.completion_status = 'Completed' THEN 1 ELSE 0 END) / COUNT(cr.record_id) as commissioning_success_rate,
  COUNT(DISTINCT wo.work_order_id) as total_work_orders,
  AVG(wo.duration_hours) as avg_work_order_hours
FROM `ebos_manager.systems` s
LEFT JOIN `ebos_manager.customers` c ON s.customer_id = c.customer_id
LEFT JOIN `ebos_manager.commissioning_records` cr ON s.system_id = cr.system_id
LEFT JOIN `ebos_manager.work_orders` wo ON s.system_id = wo.system_id
GROUP BY s.region;

-- View: Technician Performance
CREATE OR REPLACE VIEW `ebos_manager.vw_technician_performance` AS
SELECT 
  cr.technician,
  s.region,
  COUNT(DISTINCT cr.record_id) as total_commissionings,
  AVG(cr.duration_hours) as avg_commissioning_hours,
  AVG(cr.travel_hours) as avg_travel_hours,
  SUM(CASE WHEN cr.completion_status = 'Completed' THEN 1 ELSE 0 END) / COUNT(cr.record_id) as success_rate,
  AVG(cr.customer_satisfaction_score) as avg_customer_satisfaction
FROM `ebos_manager.commissioning_records` cr
JOIN `ebos_manager.systems` s ON cr.system_id = s.system_id
GROUP BY cr.technician, s.region;

-- View: System Health Summary
CREATE OR REPLACE VIEW `ebos_manager.vw_system_health` AS
WITH latest_metrics AS (
  SELECT 
    system_id,
    MAX(timestamp) as latest_timestamp
  FROM `ebos_manager.performance_metrics`
  GROUP BY system_id
)
SELECT 
  s.system_id,
  s.model,
  s.region,
  c.company_name,
  pm.electrical_efficiency_pct,
  pm.thermal_efficiency_pct,
  pm.combined_efficiency_pct,
  pm.uptime_hours,
  pm.fault_codes,
  CASE 
    WHEN pm.combined_efficiency_pct >= s.baseline_combined_efficiency_pct * 0.95 THEN 'Excellent'
    WHEN pm.combined_efficiency_pct >= s.baseline_combined_efficiency_pct * 0.90 THEN 'Good'
    WHEN pm.combined_efficiency_pct >= s.baseline_combined_efficiency_pct * 0.85 THEN 'Fair'
    ELSE 'Poor'
  END as health_status
FROM `ebos_manager.systems` s
JOIN latest_metrics lm ON s.system_id = lm.system_id
JOIN `ebos_manager.performance_metrics` pm ON s.system_id = pm.system_id AND lm.latest_timestamp = pm.timestamp
JOIN `ebos_manager.customers` c ON s.customer_id = c.customer_id;

-- Grant permissions to service account (will be done via gcloud, but documented here)
-- GRANT `roles/bigquery.dataEditor` ON DATASET `ebos_manager` TO "serviceAccount:watt-sa@PROJECT_ID.iam.gserviceaccount.com";
-- GRANT `roles/bigquery.jobUser` ON PROJECT TO "serviceAccount:watt-sa@PROJECT_ID.iam.gserviceaccount.com";

-- Initialization complete
SELECT 'BigQuery schema initialization complete!' as status;
