begin;

insert into "territories" ("id","name","region","timezone","managerUserId") values
  ('TR-NE', 'Northeast Power Hub', 'US East', 'America/New_York', 'USR-004'),
  ('TR-SW', 'Southwest Power Yard', 'US Southwest', 'America/Phoenix', 'USR-004'),
  ('TR-EMEA', 'EMEA Power Network', 'Europe', 'Europe/Berlin', 'USR-005'),
  ('TR-PW-001', 'Pacific Power Rentals', 'US West', 'America/Los_Angeles', null),
  ('TR-PW-002', 'Bay Area Power Yard', 'US West', 'America/Los_Angeles', null),
  ('TR-PW-003', 'SoCal Power Depot', 'US West', 'America/Los_Angeles', null),
  ('TR-PW-004', 'Desert Power Station', 'US Southwest', 'America/Phoenix', null),
  ('TR-PW-005', 'Mountain Power Hub', 'US Mountain', 'America/Denver', null),
  ('TR-PW-006', 'Plains Power Yard', 'US Central', 'America/Chicago', null),
  ('TR-PW-007', 'Great Lakes Power Center', 'US Central', 'America/Chicago', null),
  ('TR-PW-008', 'Mid-Atlantic Power Point', 'US East', 'America/New_York', null),
  ('TR-PW-009', 'New England Power Hub', 'US East', 'America/New_York', null),
  ('TR-PW-010', 'Gulf Power Base', 'US Gulf', 'America/Chicago', null),
  ('TR-PW-011', 'Southeast Power Yard', 'US Southeast', 'America/New_York', null),
  ('TR-PW-012', 'Mid-South Power Center', 'US Southeast', 'America/Chicago', null),
  ('TR-PW-013', 'Texas Central Power', 'US Central', 'America/Chicago', null),
  ('TR-PW-014', 'Florida Power Depot', 'US Southeast', 'America/New_York', null),
  ('TR-PW-015', 'Upper Midwest Power', 'US Central', 'America/Chicago', null),
  ('TR-PW-016', 'Lower Midwest Power', 'US Central', 'America/Chicago', null),
  ('TR-PW-017', 'Canada West Power', 'Canada', 'America/Vancouver', null),
  ('TR-PW-018', 'Canada East Power', 'Canada', 'America/Toronto', null),
  ('TR-PW-019', 'UK South Power', 'UK', 'Europe/London', null),
  ('TR-PW-020', 'DACH Power Hub', 'Europe', 'Europe/Berlin', null)
on conflict ("id") do nothing;

insert into "users" ("id","name","email","role","territoryId","territoryAssignmentSource","territoryAssignedAt","searchScope","createdAt","isActive") values
  ('USR-001', 'John Doe', 'john.doe@anaenergy.com', 'Technician', 'TR-SW', 'admin', now() - interval '120 days', 'global', now() - interval '420 days', true),
  ('USR-002', 'Sarah Lee', 'sarah.lee@anaenergy.com', 'Technician', 'TR-NE', 'self', now() - interval '40 days', 'global', now() - interval '200 days', true),
  ('USR-003', 'Mike Ruiz', 'mike.ruiz@anaenergy.com', 'Technician', 'TR-SW', 'admin', now() - interval '180 days', 'global', now() - interval '365 days', true),
  ('USR-004', 'Priya Patel', 'priya.patel@anaenergy.com', 'Manager', 'TR-NE', 'admin', now() - interval '600 days', 'global', now() - interval '700 days', true),
  ('USR-005', 'Alex Morgan', 'alex.morgan@anaenergy.com', 'Admin', 'TR-EMEA', 'admin', now() - interval '800 days', 'global', now() - interval '900 days', true)
on conflict ("id") do nothing;

insert into "customers" ("id","name","contactEmail","region","territoryId","accountTier","accountStatus","lastInteractionAt","nextSlaDueAt","lastSync") values
  ('SF-001', 'Sunbelt Rentals', 'ops@sunbelt.com', 'North America', 'TR-SW', 'A', 'Active', now() - interval '10 days', now() - interval '10 days' + interval '14 days', now()),
  ('SF-002', 'United Rentals', 'fleet@united.com', 'North America', 'TR-SW', 'B', 'Active', now() - interval '45 days', now() - interval '45 days' + interval '30 days', now()),
  ('SF-003', 'Herc Rentals', 'service@herc.com', 'Europe', 'TR-NE', 'C', 'Active', now() - interval '25 days', now() - interval '25 days' + interval '60 days', now()),
  ('SF-004', 'Aggreko', 'power@aggreko.com', 'Global', 'TR-EMEA', 'B', 'Hold', now() - interval '75 days', now() - interval '75 days' + interval '30 days', now() - interval '1 day'),
  ('SF-005', 'Atlas Power Rentals', 'ops@atlaspower.com', 'US West', 'TR-PW-001', 'B', 'Active', now() - interval '12 days', now() - interval '12 days' + interval '30 days', now()),
  ('SF-006', 'Summit Power Equipment', 'service@summitpower.com', 'US West', 'TR-PW-002', 'A', 'Active', now() - interval '8 days', now() - interval '8 days' + interval '14 days', now()),
  ('SF-007', 'Metro Power Hire', 'fleet@metropower.com', 'US West', 'TR-PW-003', 'B', 'Active', now() - interval '28 days', now() - interval '28 days' + interval '30 days', now()),
  ('SF-008', 'Canyon Power Rentals', 'ops@canyonpower.com', 'US Southwest', 'TR-PW-004', 'C', 'Active', now() - interval '55 days', now() - interval '55 days' + interval '60 days', now()),
  ('SF-009', 'Ridge Power Equipment', 'service@ridgepower.com', 'US Mountain', 'TR-PW-005', 'B', 'Active', now() - interval '20 days', now() - interval '20 days' + interval '30 days', now()),
  ('SF-010', 'Prairie Power Fleet', 'fleet@prairiepower.com', 'US Central', 'TR-PW-006', 'B', 'Active', now() - interval '33 days', now() - interval '33 days' + interval '30 days', now()),
  ('SF-011', 'Lakeside Power Rentals', 'ops@lakesidepower.com', 'US Central', 'TR-PW-007', 'A', 'Active', now() - interval '9 days', now() - interval '9 days' + interval '14 days', now()),
  ('SF-012', 'Harbor Power Rentals', 'service@harborpower.com', 'US East', 'TR-PW-008', 'B', 'Active', now() - interval '17 days', now() - interval '17 days' + interval '30 days', now()),
  ('SF-013', 'Atlantic Power Fleet', 'fleet@atlanticpower.com', 'US East', 'TR-PW-009', 'C', 'Active', now() - interval '62 days', now() - interval '62 days' + interval '60 days', now()),
  ('SF-014', 'Gulf Coast Power Rentals', 'ops@gulfpower.com', 'US Gulf', 'TR-PW-010', 'B', 'Active', now() - interval '41 days', now() - interval '41 days' + interval '30 days', now()),
  ('SF-015', 'Pinewood Power Rentals', 'service@pinewoodpower.com', 'US Southeast', 'TR-PW-011', 'C', 'Active', now() - interval '58 days', now() - interval '58 days' + interval '60 days', now()),
  ('SF-016', 'Delta Power Equipment', 'fleet@deltapower.com', 'US Southeast', 'TR-PW-012', 'B', 'Active', now() - interval '22 days', now() - interval '22 days' + interval '30 days', now()),
  ('SF-017', 'Lone Star Power Rentals', 'ops@lonestarpower.com', 'US Central', 'TR-PW-013', 'A', 'Active', now() - interval '6 days', now() - interval '6 days' + interval '14 days', now()),
  ('SF-018', 'Suncoast Power Fleet', 'service@suncoastpower.com', 'US Southeast', 'TR-PW-014', 'B', 'Active', now() - interval '27 days', now() - interval '27 days' + interval '30 days', now()),
  ('SF-019', 'North Ridge Power Rentals', 'fleet@northridgepower.com', 'US Central', 'TR-PW-015', 'C', 'Active', now() - interval '49 days', now() - interval '49 days' + interval '60 days', now()),
  ('SF-020', 'Heartland Power Equipment', 'ops@heartlandpower.com', 'US Central', 'TR-PW-016', 'B', 'Active', now() - interval '36 days', now() - interval '36 days' + interval '30 days', now()),
  ('SF-021', 'Cascade Power Rentals', 'service@cascadepower.com', 'Canada', 'TR-PW-017', 'B', 'Active', now() - interval '19 days', now() - interval '19 days' + interval '30 days', now()),
  ('SF-022', 'Cedar Power Fleet', 'fleet@cedarpower.com', 'Canada', 'TR-PW-018', 'C', 'Active', now() - interval '64 days', now() - interval '64 days' + interval '60 days', now()),
  ('SF-023', 'Thames Power Rentals', 'ops@thamespower.com', 'UK', 'TR-PW-019', 'B', 'Active', now() - interval '26 days', now() - interval '26 days' + interval '30 days', now()),
  ('SF-024', 'Rhine Power Equipment', 'service@rhinepower.com', 'Europe', 'TR-PW-020', 'A', 'Hold', now() - interval '72 days', now() - interval '72 days' + interval '14 days', now())
on conflict ("id") do nothing;

insert into "units" ("serialNumber","model","manufacturingDate","batchId","status","location","salesforceAccountId","customerName","runtimeHours","conditionScore","imageUrl","imonnitGatewayId","telemetryStatus","lastSync","recentReadings","activeAlerts","lastPmDate","lastPmHours","lastPmBy") values
  ('EB-025-001', 'EBOSS 25kVA', '2024-01-15', 'BATCH-24-Q1', 'In Service', 'Anaheim Power Yard, CA', 'SF-001', 'Sunbelt Rentals', 120, 98, 'image_0.png', 'GW-88210', 'Online', now(), '[]'::jsonb, '[]'::jsonb, '2024-04-10', 100, 'Mike R.'),
  ('EB-070-042', 'EBOSS 70kVA', '2024-02-10', 'BATCH-24-Q1', 'In Service', 'Phoenix Power Site 4, AZ', 'SF-002', 'United Rentals', 450, 92, 'image_11.png', 'GW-99421', 'Warning', now(), '[]'::jsonb, '[]'::jsonb, '2024-03-15', 350, 'Sarah L.'),
  ('EB-125-088', 'EBOSS 125kVA', '2023-11-05', 'BATCH-23-Q4', 'Maintenance', 'Las Vegas Power Depot, NV', 'SF-004', 'Aggreko', 1200, 78, 'image_14.png', 'GW-77312', 'Offline', now() - interval '1 day', '[]'::jsonb, '[]'::jsonb, '2024-01-20', 1000, 'Dev Team'),
  ('EB-220-012', 'EBOSS 220kVA', '2023-10-12', 'BATCH-23-Q3', 'In Service', 'Dallas Power Hub, TX', 'SF-001', 'Sunbelt Rentals', 1800, 85, 'image_18.png', 'GW-66509', 'Online', now(), '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-400-005', 'EBOSS 400kVA', '2023-09-01', 'BATCH-23-Q3', 'Down', 'Houston Power Yard, TX', 'SF-002', 'United Rentals', 2100, 65, 'image_21.png', 'GW-55123', 'Critical', now(), '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-025-101', 'EBOSS 25kVA', '2024-02-05', 'BATCH-24-Q1', 'In Service', 'Portland Power Yard, OR', 'SF-005', 'Atlas Power Rentals', 210, 96, 'image_22.png', 'GW-90101', 'Online', now() - interval '4 hours', '[]'::jsonb, '[]'::jsonb, '2024-04-18', 180, 'Sarah L.'),
  ('EB-070-102', 'EBOSS 70kVA', '2024-01-28', 'BATCH-24-Q1', 'In Service', 'Oakland Power Yard, CA', 'SF-006', 'Summit Power Equipment', 320, 90, 'image_23.png', 'GW-90102', 'Warning', now() - interval '3 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-125-103', 'EBOSS 125kVA', '2023-12-18', 'BATCH-23-Q4', 'Maintenance', 'Los Angeles Power Depot, CA', 'SF-007', 'Metro Power Hire', 980, 82, 'image_24.png', 'GW-90103', 'Offline', now() - interval '12 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-070-104', 'EBOSS 70kVA', '2024-03-12', 'BATCH-24-Q1', 'In Service', 'Phoenix Power Yard, AZ', 'SF-008', 'Canyon Power Rentals', 140, 94, 'image_25.png', 'GW-90104', 'Online', now() - interval '2 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-220-105', 'EBOSS 220kVA', '2023-11-22', 'BATCH-23-Q4', 'In Service', 'Denver Power Hub, CO', 'SF-009', 'Ridge Power Equipment', 720, 88, 'image_26.png', 'GW-90105', 'Warning', now() - interval '7 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-400-106', 'EBOSS 400kVA', '2023-10-08', 'BATCH-23-Q3', 'In Service', 'Omaha Power Yard, NE', 'SF-010', 'Prairie Power Fleet', 1450, 84, 'image_27.png', 'GW-90106', 'Online', now() - interval '5 hours', '[]'::jsonb, '[]'::jsonb, '2024-02-20', 1300, 'Mike R.'),
  ('EB-125-107', 'EBOSS 125kVA', '2024-02-22', 'BATCH-24-Q1', 'In Service', 'Chicago Power Center, IL', 'SF-011', 'Lakeside Power Rentals', 260, 93, 'image_28.png', 'GW-90107', 'Online', now() - interval '1 hour', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-070-108', 'EBOSS 70kVA', '2023-12-05', 'BATCH-23-Q4', 'Maintenance', 'Baltimore Power Yard, MD', 'SF-012', 'Harbor Power Rentals', 870, 79, 'image_29.png', 'GW-90108', 'Warning', now() - interval '9 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-220-109', 'EBOSS 220kVA', '2023-09-18', 'BATCH-23-Q3', 'Down', 'Boston Power Yard, MA', 'SF-013', 'Atlantic Power Fleet', 1980, 68, 'image_30.png', 'GW-90109', 'Critical', now() - interval '11 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-025-110', 'EBOSS 25kVA', '2024-03-01', 'BATCH-24-Q1', 'In Service', 'Houston Power Depot, TX', 'SF-014', 'Gulf Coast Power Rentals', 190, 95, 'image_31.png', 'GW-90110', 'Online', now() - interval '2 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-070-111', 'EBOSS 70kVA', '2024-01-18', 'BATCH-24-Q1', 'In Service', 'Atlanta Power Yard, GA', 'SF-015', 'Pinewood Power Rentals', 410, 89, 'image_32.png', 'GW-90111', 'Online', now() - interval '4 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-125-112', 'EBOSS 125kVA', '2023-12-28', 'BATCH-23-Q4', 'Maintenance', 'Memphis Power Yard, TN', 'SF-016', 'Delta Power Equipment', 760, 81, 'image_33.png', 'GW-90112', 'Warning', now() - interval '10 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-220-113', 'EBOSS 220kVA', '2024-02-14', 'BATCH-24-Q1', 'In Service', 'Austin Power Hub, TX', 'SF-017', 'Lone Star Power Rentals', 260, 96, 'image_34.png', 'GW-90113', 'Online', now() - interval '3 hours', '[]'::jsonb, '[]'::jsonb, '2024-04-02', 220, 'Sarah L.'),
  ('EB-400-114', 'EBOSS 400kVA', '2023-08-21', 'BATCH-23-Q3', 'In Service', 'Tampa Power Depot, FL', 'SF-018', 'Suncoast Power Fleet', 1680, 86, 'image_35.png', 'GW-90114', 'Online', now() - interval '6 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-025-115', 'EBOSS 25kVA', '2024-03-10', 'BATCH-24-Q1', 'In Service', 'Minneapolis Power Yard, MN', 'SF-019', 'North Ridge Power Rentals', 150, 97, 'image_36.png', 'GW-90115', 'Online', now() - interval '2 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-070-116', 'EBOSS 70kVA', '2024-01-09', 'BATCH-24-Q1', 'In Service', 'Kansas City Power Yard, MO', 'SF-020', 'Heartland Power Equipment', 430, 88, 'image_37.png', 'GW-90116', 'Online', now() - interval '5 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-125-117', 'EBOSS 125kVA', '2023-11-30', 'BATCH-23-Q4', 'In Service', 'Seattle Power Yard, WA', 'SF-021', 'Cascade Power Rentals', 610, 90, 'image_38.png', 'GW-90117', 'Warning', now() - interval '7 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-220-118', 'EBOSS 220kVA', '2023-10-28', 'BATCH-23-Q3', 'In Service', 'Toronto Power Depot, ON', 'SF-022', 'Cedar Power Fleet', 1260, 85, 'image_39.png', 'GW-90118', 'Online', now() - interval '8 hours', '[]'::jsonb, '[]'::jsonb, null, null, null),
  ('EB-400-119', 'EBOSS 400kVA', '2023-09-09', 'BATCH-23-Q3', 'In Service', 'London Power Yard, UK', 'SF-023', 'Thames Power Rentals', 1740, 83, 'image_40.png', 'GW-90119', 'Online', now() - interval '9 hours', '[]'::jsonb, '[]'::jsonb, '2024-01-12', 1600, 'Dev Team'),
  ('EB-070-120', 'EBOSS 70kVA', '2024-02-25', 'BATCH-24-Q1', 'Maintenance', 'Munich Power Hub, DE', 'SF-024', 'Rhine Power Equipment', 220, 87, 'image_41.png', 'GW-90120', 'Warning', now() - interval '6 hours', '[]'::jsonb, '[]'::jsonb, null, null, null)
on conflict ("serialNumber") do nothing;

insert into "tickets" ("id","unitSerialNumber","title","description","category","priority","status","createdAt","technician","photos","lastUpdated","lastUpdatedBy") values
  ('TKT-1001', 'EB-070-042', 'Inverter Synchronization Error', 'Unit fails to sync with grid during load transfer test.', 'Defect', 'High', 'In Progress', '2024-05-10T00:00:00Z', 'Mike R.', array['image_12.png'], '2024-05-11T14:30:00Z', 'Mike R.'),
  ('TKT-1002', 'EB-025-001', 'Scheduled Maintenance (250hr)', 'Check battery electrolyte levels and BMS firmware.', 'Maintenance', 'Medium', 'Open', '2024-05-12T00:00:00Z', 'Sarah L.', array[]::text[], '2024-05-12T09:15:00Z', 'System'),
  ('TKT-1003', 'EB-400-005', 'Critical Battery Failure', 'BMS reporting catastrophic cell failure in Bank 2.', 'Defect', 'Critical', 'Open', '2024-05-13T00:00:00Z', 'John Doe', array[]::text[], '2024-05-13T08:00:00Z', 'System')
on conflict ("id") do nothing;

insert into "actions" ("id","type","subjectType","subjectId","status","urgency","priorityScore","source","createdAt","dueAt","assignedToUserId","autoApproved") values
  ('ACT-1001', 'recover', 'account', 'SF-002', 'open', 'overdue', 92, 'system', now() - interval '1 day', now(), null, false),
  ('ACT-1002', 'recover', 'account', 'SF-004', 'open', 'overdue', 88, 'system', now() - interval '3 days', now() - interval '1 day', null, false),
  ('ACT-2001', 'approve_log', 'interaction', 'INT-002', 'open', 'medium', 55, 'integration', now() - interval '6 hours', null, null, false),
  ('ACT-2002', 'approve_log', 'interaction', 'INT-001', 'completed', 'low', 18, 'integration', now() - interval '2 hours', null, null, true),
  ('ACT-3001', 'after_action_required', 'interaction', 'INT-003', 'open', 'high', 70, 'integration', now() - interval '4 hours', null, null, false),
  ('ACT-4001', 'approve_receipt', 'expense', 'EXP-001', 'open', 'medium', 42, 'integration', now() - interval '8 hours', null, null, false),
  ('ACT-5001', 'verify_link', 'link', 'VQ-001', 'open', 'low', 30, 'system', now() - interval '12 hours', null, null, false)
on conflict ("id") do nothing;

insert into "customer_interactions" ("id","accountId","contactName","channel","source","summary","timestamp","confidenceScore","approvalStatus","actionId","autoApproved","afterActionRequired","createdByUserId") values
  ('INT-001', 'SF-001', 'Ava King', 'email', 'gmail', 'Confirmed generator runtime increase; scheduling PM window for next week.', now() - interval '10 hours', 0.93, 'approved', 'ACT-2002', true, false, 'USR-001'),
  ('INT-002', 'SF-002', 'Luis Ramirez', 'email', 'outlook', 'Customer asked about battery replacement timeline; reply drafted.', now() - interval '18 hours', 0.58, 'pending', 'ACT-2001', false, false, 'USR-002'),
  ('INT-003', 'SF-004', 'Nina Roberts', 'call', 'ios_call', 'Call completed, after-action notes required.', now() - interval '6 hours', 0.81, 'pending', 'ACT-3001', false, true, 'USR-003')
on conflict ("id") do nothing;

insert into "territory_reminders" ("id","accountId","territoryId","actionId","status","createdAt","dueAt","lastInteractionAt","daysSinceContact","slaDays","talkingPoints","openTickets","openOpportunities") values
  ('TRM-001', 'SF-002', 'TR-SW', 'ACT-1001', 'open', now() - interval '1 day', now(), now() - interval '45 days', 45, 30, array['Review open service ticket TKT-1001', 'Confirm generator runtime spike from last telemetry sync', 'Discuss upcoming site visit schedule'], 1, 2),
  ('TRM-002', 'SF-004', 'TR-EMEA', 'ACT-1002', 'open', now() - interval '3 days', now() - interval '1 day', now() - interval '75 days', 75, 30, array['Confirm spare battery delivery ETA', 'Review open opportunities for Q3 expansion'], 1, 1)
on conflict ("id") do nothing;

insert into "expenses" ("id","userId","amount","currency","vendor","category","date","source","status","confidenceScore","receiptUrl","actionId","concurExpenseId","linkedAccountId","linkedTicketId","linkedVisitId") values
  ('EXP-001', 'USR-001', 186.45, 'USD', 'Hilton Garden Inn', 'Lodging', now() - interval '2 days', 'email', 'pending', 0.77, '/receipts/exp-001.pdf', 'ACT-4001', null, 'SF-002', null, null),
  ('EXP-002', 'USR-003', 42.15, 'USD', 'Fuel Station 22', 'Fuel', now() - interval '1 day', 'photo', 'pending', 0.49, '/receipts/exp-002.jpg', null, null, 'SF-001', null, null)
on conflict ("id") do nothing;

insert into "weekly_digests" ("id","territoryId","periodStart","periodEnd","createdAt","contactRate","overdueAccounts","averageDaysSinceContact","topRecoveryAccountIds","planItems","summary") values
  ('WD-2024-05-06-TR-SW', 'TR-SW', now() - interval '7 days', now(), now() - interval '2 hours', 0.62, 2, 28, array['SF-002', 'SF-004'], array['Schedule outreach for United Rentals and Aggreko', 'Review open tickets tied to recovery actions', 'Confirm follow-up visits for Phoenix and Houston'], 'Contact rate dipped due to two overdue accounts; prioritize recovery actions first.')
on conflict ("id") do nothing;

insert into "verification_queue" ("id","recordType","recordId","reason","confidenceScore","status","createdAt","resolvedAt","resolvedByUserId") values
  ('VQ-001', 'expense_link', 'EXP-002', 'Ambiguous account match between Sunbelt Rentals and United Rentals.', 0.48, 'pending', now() - interval '12 hours', null, null)
on conflict ("id") do nothing;

insert into "audit_logs" ("id","actorUserId","eventType","recordType","recordId","createdAt","metadata") values
  ('AUD-001', 'USR-004', 'create', 'action', 'ACT-1001', now() - interval '1 day', '{"source":"system","workflow":"WF-11"}'::jsonb),
  ('AUD-002', 'USR-002', 'approve', 'interaction', 'INT-001', now() - interval '2 hours', '{"workflow":"WF-03","autoApproved":true}'::jsonb),
  ('AUD-003', 'USR-001', 'create', 'expense', 'EXP-001', now() - interval '8 hours', '{"workflow":"WF-06","confidence":0.77}'::jsonb)
on conflict ("id") do nothing;

commit;
