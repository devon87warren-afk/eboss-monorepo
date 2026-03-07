
import {
  Unit,
  UnitStatus,
  Ticket,
  TicketPriority,
  TicketStatus,
  SalesforceCustomer,
  TelemetryStatus,
  SensorReading,
  SensorAlert,
  AccountTier,
  Territory,
  UserProfile,
  UserRole,
  Action,
  CustomerInteraction,
  TerritoryReminder,
  Expense,
  WeeklyDigest,
  VerificationQueueItem,
  AuditLog
} from './types';

// Helper to generate mock sensor history
const generateHistory = (count: number): SensorReading[] => {
  return Array.from({ length: count }).map((_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 3600000).toISOString(),
    temperature: 175 + Math.random() * 20,
    vibration: 0.1 + Math.random() * 0.4,
    voltage: 240 + Math.random() * 5,
    fuelLevel: 80 - (i * 0.5),
    currentAmps: 120 + Math.random() * 60
  }));
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const addDays = (isoTimestamp: string, days: number) =>
  new Date(new Date(isoTimestamp).getTime() + days * 86400000).toISOString();

const SLA_DAYS_BY_TIER: Record<AccountTier, number> = {
  [AccountTier.A]: 14,
  [AccountTier.B]: 30,
  [AccountTier.C]: 60
};

const MOCK_ALERTS: SensorAlert[] = [
  {
    id: 'ALT-001',
    sensorType: 'Vibration',
    severity: 'Warning',
    message: 'Vibration detected above 0.5 in/s threshold',
    value: 0.52,
    threshold: 0.50,
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    acknowledged: false
  },
  {
    id: 'ALT-002',
    sensorType: 'Battery',
    severity: 'Critical',
    message: 'Sensor battery critical (5%)',
    value: 5,
    threshold: 15,
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    acknowledged: false
  }
];

const EXTRA_TERRITORIES: Territory[] = [
  { id: 'TR-PW-001', name: 'Pacific Power Rentals', region: 'US West', timezone: 'America/Los_Angeles' },
  { id: 'TR-PW-002', name: 'Bay Area Power Yard', region: 'US West', timezone: 'America/Los_Angeles' },
  { id: 'TR-PW-003', name: 'SoCal Power Depot', region: 'US West', timezone: 'America/Los_Angeles' },
  { id: 'TR-PW-004', name: 'Desert Power Station', region: 'US Southwest', timezone: 'America/Phoenix' },
  { id: 'TR-PW-005', name: 'Mountain Power Hub', region: 'US Mountain', timezone: 'America/Denver' },
  { id: 'TR-PW-006', name: 'Plains Power Yard', region: 'US Central', timezone: 'America/Chicago' },
  { id: 'TR-PW-007', name: 'Great Lakes Power Center', region: 'US Central', timezone: 'America/Chicago' },
  { id: 'TR-PW-008', name: 'Mid-Atlantic Power Point', region: 'US East', timezone: 'America/New_York' },
  { id: 'TR-PW-009', name: 'New England Power Hub', region: 'US East', timezone: 'America/New_York' },
  { id: 'TR-PW-010', name: 'Gulf Power Base', region: 'US Gulf', timezone: 'America/Chicago' },
  { id: 'TR-PW-011', name: 'Southeast Power Yard', region: 'US Southeast', timezone: 'America/New_York' },
  { id: 'TR-PW-012', name: 'Mid-South Power Center', region: 'US Southeast', timezone: 'America/Chicago' },
  { id: 'TR-PW-013', name: 'Texas Central Power', region: 'US Central', timezone: 'America/Chicago' },
  { id: 'TR-PW-014', name: 'Florida Power Depot', region: 'US Southeast', timezone: 'America/New_York' },
  { id: 'TR-PW-015', name: 'Upper Midwest Power', region: 'US Central', timezone: 'America/Chicago' },
  { id: 'TR-PW-016', name: 'Lower Midwest Power', region: 'US Central', timezone: 'America/Chicago' },
  { id: 'TR-PW-017', name: 'Canada West Power', region: 'Canada', timezone: 'America/Vancouver' },
  { id: 'TR-PW-018', name: 'Canada East Power', region: 'Canada', timezone: 'America/Toronto' },
  { id: 'TR-PW-019', name: 'UK South Power', region: 'UK', timezone: 'Europe/London' },
  { id: 'TR-PW-020', name: 'DACH Power Hub', region: 'Europe', timezone: 'Europe/Berlin' }
];

export const MOCK_TERRITORIES: Territory[] = [
  { id: 'TR-NE', name: 'Northeast Power Hub', region: 'US East', timezone: 'America/New_York', managerUserId: 'USR-004' },
  { id: 'TR-SW', name: 'Southwest Power Yard', region: 'US Southwest', timezone: 'America/Phoenix', managerUserId: 'USR-004' },
  { id: 'TR-EMEA', name: 'EMEA Power Network', region: 'Europe', timezone: 'Europe/Berlin', managerUserId: 'USR-005' },
  ...EXTRA_TERRITORIES
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'USR-001',
    name: 'John Doe',
    email: 'john.doe@anaenergy.com',
    role: UserRole.TECH,
    territoryId: 'TR-SW',
    territoryAssignmentSource: 'admin',
    territoryAssignedAt: daysAgo(120),
    searchScope: 'global',
    createdAt: daysAgo(420),
    isActive: true
  },
  {
    id: 'USR-002',
    name: 'Sarah Lee',
    email: 'sarah.lee@anaenergy.com',
    role: UserRole.TECH,
    territoryId: 'TR-NE',
    territoryAssignmentSource: 'self',
    territoryAssignedAt: daysAgo(40),
    searchScope: 'global',
    createdAt: daysAgo(200),
    isActive: true
  },
  {
    id: 'USR-003',
    name: 'Mike Ruiz',
    email: 'mike.ruiz@anaenergy.com',
    role: UserRole.TECH,
    territoryId: 'TR-SW',
    territoryAssignmentSource: 'admin',
    territoryAssignedAt: daysAgo(180),
    searchScope: 'global',
    createdAt: daysAgo(365),
    isActive: true
  },
  {
    id: 'USR-004',
    name: 'Priya Patel',
    email: 'priya.patel@anaenergy.com',
    role: UserRole.MANAGER,
    territoryId: 'TR-NE',
    territoryAssignmentSource: 'admin',
    territoryAssignedAt: daysAgo(600),
    searchScope: 'global',
    createdAt: daysAgo(700),
    isActive: true
  },
  {
    id: 'USR-005',
    name: 'Alex Morgan',
    email: 'alex.morgan@anaenergy.com',
    role: UserRole.ADMIN,
    territoryId: 'TR-EMEA',
    territoryAssignmentSource: 'admin',
    territoryAssignedAt: daysAgo(800),
    searchScope: 'global',
    createdAt: daysAgo(900),
    isActive: true
  }
];

const sunbeltLastInteraction = daysAgo(10);
const unitedLastInteraction = daysAgo(45);
const hercLastInteraction = daysAgo(25);
const aggrekoLastInteraction = daysAgo(75);

const BASE_CUSTOMERS: SalesforceCustomer[] = [
  {
    id: 'SF-001',
    name: 'Sunbelt Rentals',
    contactEmail: 'ops@sunbelt.com',
    region: 'North America',
    territoryId: 'TR-SW',
    accountTier: AccountTier.A,
    accountStatus: 'Active',
    lastInteractionAt: sunbeltLastInteraction,
    nextSlaDueAt: addDays(sunbeltLastInteraction, SLA_DAYS_BY_TIER[AccountTier.A]),
    lastSync: new Date().toISOString()
  },
  {
    id: 'SF-002',
    name: 'United Rentals',
    contactEmail: 'fleet@united.com',
    region: 'North America',
    territoryId: 'TR-SW',
    accountTier: AccountTier.B,
    accountStatus: 'Active',
    lastInteractionAt: unitedLastInteraction,
    nextSlaDueAt: addDays(unitedLastInteraction, SLA_DAYS_BY_TIER[AccountTier.B]),
    lastSync: new Date().toISOString()
  },
  {
    id: 'SF-003',
    name: 'Herc Rentals',
    contactEmail: 'service@herc.com',
    region: 'Europe',
    territoryId: 'TR-NE',
    accountTier: AccountTier.C,
    accountStatus: 'Active',
    lastInteractionAt: hercLastInteraction,
    nextSlaDueAt: addDays(hercLastInteraction, SLA_DAYS_BY_TIER[AccountTier.C]),
    lastSync: new Date().toISOString()
  },
  {
    id: 'SF-004',
    name: 'Aggreko',
    contactEmail: 'power@aggreko.com',
    region: 'Global',
    territoryId: 'TR-EMEA',
    accountTier: AccountTier.B,
    accountStatus: 'Hold',
    lastInteractionAt: aggrekoLastInteraction,
    nextSlaDueAt: addDays(aggrekoLastInteraction, SLA_DAYS_BY_TIER[AccountTier.B]),
    lastSync: new Date(Date.now() - 86400000).toISOString()
  }
];

type CustomerSeed = {
  id: string;
  name: string;
  contactEmail: string;
  region: string;
  territoryId: string;
  accountTier: AccountTier;
  accountStatus: 'Active' | 'Hold';
  daysSinceContact: number;
};

const ADDITIONAL_CUSTOMER_SEEDS: CustomerSeed[] = [
  { id: 'SF-005', name: 'Atlas Power Rentals', contactEmail: 'ops@atlaspower.com', region: 'US West', territoryId: 'TR-PW-001', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 12 },
  { id: 'SF-006', name: 'Summit Power Equipment', contactEmail: 'service@summitpower.com', region: 'US West', territoryId: 'TR-PW-002', accountTier: AccountTier.A, accountStatus: 'Active', daysSinceContact: 8 },
  { id: 'SF-007', name: 'Metro Power Hire', contactEmail: 'fleet@metropower.com', region: 'US West', territoryId: 'TR-PW-003', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 28 },
  { id: 'SF-008', name: 'Canyon Power Rentals', contactEmail: 'ops@canyonpower.com', region: 'US Southwest', territoryId: 'TR-PW-004', accountTier: AccountTier.C, accountStatus: 'Active', daysSinceContact: 55 },
  { id: 'SF-009', name: 'Ridge Power Equipment', contactEmail: 'service@ridgepower.com', region: 'US Mountain', territoryId: 'TR-PW-005', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 20 },
  { id: 'SF-010', name: 'Prairie Power Fleet', contactEmail: 'fleet@prairiepower.com', region: 'US Central', territoryId: 'TR-PW-006', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 33 },
  { id: 'SF-011', name: 'Lakeside Power Rentals', contactEmail: 'ops@lakesidepower.com', region: 'US Central', territoryId: 'TR-PW-007', accountTier: AccountTier.A, accountStatus: 'Active', daysSinceContact: 9 },
  { id: 'SF-012', name: 'Harbor Power Rentals', contactEmail: 'service@harborpower.com', region: 'US East', territoryId: 'TR-PW-008', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 17 },
  { id: 'SF-013', name: 'Atlantic Power Fleet', contactEmail: 'fleet@atlanticpower.com', region: 'US East', territoryId: 'TR-PW-009', accountTier: AccountTier.C, accountStatus: 'Active', daysSinceContact: 62 },
  { id: 'SF-014', name: 'Gulf Coast Power Rentals', contactEmail: 'ops@gulfpower.com', region: 'US Gulf', territoryId: 'TR-PW-010', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 41 },
  { id: 'SF-015', name: 'Pinewood Power Rentals', contactEmail: 'service@pinewoodpower.com', region: 'US Southeast', territoryId: 'TR-PW-011', accountTier: AccountTier.C, accountStatus: 'Active', daysSinceContact: 58 },
  { id: 'SF-016', name: 'Delta Power Equipment', contactEmail: 'fleet@deltapower.com', region: 'US Southeast', territoryId: 'TR-PW-012', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 22 },
  { id: 'SF-017', name: 'Lone Star Power Rentals', contactEmail: 'ops@lonestarpower.com', region: 'US Central', territoryId: 'TR-PW-013', accountTier: AccountTier.A, accountStatus: 'Active', daysSinceContact: 6 },
  { id: 'SF-018', name: 'Suncoast Power Fleet', contactEmail: 'service@suncoastpower.com', region: 'US Southeast', territoryId: 'TR-PW-014', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 27 },
  { id: 'SF-019', name: 'North Ridge Power Rentals', contactEmail: 'fleet@northridgepower.com', region: 'US Central', territoryId: 'TR-PW-015', accountTier: AccountTier.C, accountStatus: 'Active', daysSinceContact: 49 },
  { id: 'SF-020', name: 'Heartland Power Equipment', contactEmail: 'ops@heartlandpower.com', region: 'US Central', territoryId: 'TR-PW-016', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 36 },
  { id: 'SF-021', name: 'Cascade Power Rentals', contactEmail: 'service@cascadepower.com', region: 'Canada', territoryId: 'TR-PW-017', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 19 },
  { id: 'SF-022', name: 'Cedar Power Fleet', contactEmail: 'fleet@cedarpower.com', region: 'Canada', territoryId: 'TR-PW-018', accountTier: AccountTier.C, accountStatus: 'Active', daysSinceContact: 64 },
  { id: 'SF-023', name: 'Thames Power Rentals', contactEmail: 'ops@thamespower.com', region: 'UK', territoryId: 'TR-PW-019', accountTier: AccountTier.B, accountStatus: 'Active', daysSinceContact: 26 },
  { id: 'SF-024', name: 'Rhine Power Equipment', contactEmail: 'service@rhinepower.com', region: 'Europe', territoryId: 'TR-PW-020', accountTier: AccountTier.A, accountStatus: 'Hold', daysSinceContact: 72 }
];

const ADDITIONAL_CUSTOMERS: SalesforceCustomer[] = ADDITIONAL_CUSTOMER_SEEDS.map(seed => {
  const lastInteractionAt = daysAgo(seed.daysSinceContact);
  return {
    id: seed.id,
    name: seed.name,
    contactEmail: seed.contactEmail,
    region: seed.region,
    territoryId: seed.territoryId,
    accountTier: seed.accountTier,
    accountStatus: seed.accountStatus,
    lastInteractionAt,
    nextSlaDueAt: addDays(lastInteractionAt, SLA_DAYS_BY_TIER[seed.accountTier]),
    lastSync: new Date().toISOString()
  };
});

export const MOCK_CUSTOMERS: SalesforceCustomer[] = [
  ...BASE_CUSTOMERS,
  ...ADDITIONAL_CUSTOMERS
];

const BASE_UNITS: Unit[] = [
  {
    serialNumber: 'EB-025-001',
    model: 'EBOSS 25kVA',
    manufacturingDate: '2024-01-15',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Anaheim Power Yard, CA',
    salesforceAccountId: 'SF-001',
    customerName: 'Sunbelt Rentals',
    runtimeHours: 120,
    conditionScore: 98,
    imageUrl: 'image_0.png',
    imonnitGatewayId: 'GW-88210',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: new Date().toISOString(),
    recentReadings: generateHistory(24),
    activeAlerts: [],
    lastPmDate: '2024-04-10',
    lastPmHours: 100,
    lastPmBy: 'Mike R.'
  },
  {
    serialNumber: 'EB-070-042',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-02-10',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Phoenix Power Site 4, AZ',
    salesforceAccountId: 'SF-002',
    customerName: 'United Rentals',
    runtimeHours: 450,
    conditionScore: 92,
    imageUrl: 'image_11.png',
    imonnitGatewayId: 'GW-99421',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: new Date().toISOString(),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]],
    lastPmDate: '2024-03-15',
    lastPmHours: 350,
    lastPmBy: 'Sarah L.'
  },
  {
    serialNumber: 'EB-125-088',
    model: 'EBOSS 125kVA',
    manufacturingDate: '2023-11-05',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.MAINTENANCE,
    location: 'Las Vegas Power Depot, NV',
    salesforceAccountId: 'SF-004',
    customerName: 'Aggreko',
    runtimeHours: 1200,
    conditionScore: 78,
    imageUrl: 'image_14.png',
    imonnitGatewayId: 'GW-77312',
    telemetryStatus: TelemetryStatus.OFFLINE,
    lastSync: new Date(Date.now() - 86400000).toISOString(),
    recentReadings: generateHistory(12),
    activeAlerts: [MOCK_ALERTS[1]],
    lastPmDate: '2024-01-20',
    lastPmHours: 1000,
    lastPmBy: 'Dev Team'
  },
  {
    serialNumber: 'EB-220-012',
    model: 'EBOSS 220kVA',
    manufacturingDate: '2023-10-12',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.ACTIVE,
    location: 'Dallas Power Hub, TX',
    salesforceAccountId: 'SF-001',
    customerName: 'Sunbelt Rentals',
    runtimeHours: 1800,
    conditionScore: 85,
    imageUrl: 'image_18.png',
    imonnitGatewayId: 'GW-66509',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: new Date().toISOString(),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-400-005',
    model: 'EBOSS 400kVA',
    manufacturingDate: '2023-09-01',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.DOWN,
    location: 'Houston Power Yard, TX',
    salesforceAccountId: 'SF-002',
    customerName: 'United Rentals',
    runtimeHours: 2100,
    conditionScore: 65,
    imageUrl: 'image_21.png',
    imonnitGatewayId: 'GW-55123',
    telemetryStatus: TelemetryStatus.CRITICAL,
    lastSync: new Date().toISOString(),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[1]]
  },
];

const ADDITIONAL_UNITS: Unit[] = [
  {
    serialNumber: 'EB-025-101',
    model: 'EBOSS 25kVA',
    manufacturingDate: '2024-02-05',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Portland Power Yard, OR',
    salesforceAccountId: 'SF-005',
    customerName: 'Atlas Power Rentals',
    runtimeHours: 210,
    conditionScore: 96,
    imageUrl: 'image_22.png',
    imonnitGatewayId: 'GW-90101',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(4),
    recentReadings: generateHistory(24),
    activeAlerts: [],
    lastPmDate: '2024-04-18',
    lastPmHours: 180,
    lastPmBy: 'Sarah L.'
  },
  {
    serialNumber: 'EB-070-102',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-01-28',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Oakland Power Yard, CA',
    salesforceAccountId: 'SF-006',
    customerName: 'Summit Power Equipment',
    runtimeHours: 320,
    conditionScore: 90,
    imageUrl: 'image_23.png',
    imonnitGatewayId: 'GW-90102',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(3),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  },
  {
    serialNumber: 'EB-125-103',
    model: 'EBOSS 125kVA',
    manufacturingDate: '2023-12-18',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.MAINTENANCE,
    location: 'Los Angeles Power Depot, CA',
    salesforceAccountId: 'SF-007',
    customerName: 'Metro Power Hire',
    runtimeHours: 980,
    conditionScore: 82,
    imageUrl: 'image_24.png',
    imonnitGatewayId: 'GW-90103',
    telemetryStatus: TelemetryStatus.OFFLINE,
    lastSync: hoursAgo(12),
    recentReadings: generateHistory(12),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-070-104',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-03-12',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Phoenix Power Yard, AZ',
    salesforceAccountId: 'SF-008',
    customerName: 'Canyon Power Rentals',
    runtimeHours: 140,
    conditionScore: 94,
    imageUrl: 'image_25.png',
    imonnitGatewayId: 'GW-90104',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(2),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-220-105',
    model: 'EBOSS 220kVA',
    manufacturingDate: '2023-11-22',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.ACTIVE,
    location: 'Denver Power Hub, CO',
    salesforceAccountId: 'SF-009',
    customerName: 'Ridge Power Equipment',
    runtimeHours: 720,
    conditionScore: 88,
    imageUrl: 'image_26.png',
    imonnitGatewayId: 'GW-90105',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(7),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  },
  {
    serialNumber: 'EB-400-106',
    model: 'EBOSS 400kVA',
    manufacturingDate: '2023-10-08',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.ACTIVE,
    location: 'Omaha Power Yard, NE',
    salesforceAccountId: 'SF-010',
    customerName: 'Prairie Power Fleet',
    runtimeHours: 1450,
    conditionScore: 84,
    imageUrl: 'image_27.png',
    imonnitGatewayId: 'GW-90106',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(5),
    recentReadings: generateHistory(24),
    activeAlerts: [],
    lastPmDate: '2024-02-20',
    lastPmHours: 1300,
    lastPmBy: 'Mike R.'
  },
  {
    serialNumber: 'EB-125-107',
    model: 'EBOSS 125kVA',
    manufacturingDate: '2024-02-22',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Chicago Power Center, IL',
    salesforceAccountId: 'SF-011',
    customerName: 'Lakeside Power Rentals',
    runtimeHours: 260,
    conditionScore: 93,
    imageUrl: 'image_28.png',
    imonnitGatewayId: 'GW-90107',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(1),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-070-108',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2023-12-05',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.MAINTENANCE,
    location: 'Baltimore Power Yard, MD',
    salesforceAccountId: 'SF-012',
    customerName: 'Harbor Power Rentals',
    runtimeHours: 870,
    conditionScore: 79,
    imageUrl: 'image_29.png',
    imonnitGatewayId: 'GW-90108',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(9),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  },
  {
    serialNumber: 'EB-220-109',
    model: 'EBOSS 220kVA',
    manufacturingDate: '2023-09-18',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.DOWN,
    location: 'Boston Power Yard, MA',
    salesforceAccountId: 'SF-013',
    customerName: 'Atlantic Power Fleet',
    runtimeHours: 1980,
    conditionScore: 68,
    imageUrl: 'image_30.png',
    imonnitGatewayId: 'GW-90109',
    telemetryStatus: TelemetryStatus.CRITICAL,
    lastSync: hoursAgo(11),
    recentReadings: generateHistory(12),
    activeAlerts: [MOCK_ALERTS[1]]
  },
  {
    serialNumber: 'EB-025-110',
    model: 'EBOSS 25kVA',
    manufacturingDate: '2024-03-01',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Houston Power Depot, TX',
    salesforceAccountId: 'SF-014',
    customerName: 'Gulf Coast Power Rentals',
    runtimeHours: 190,
    conditionScore: 95,
    imageUrl: 'image_31.png',
    imonnitGatewayId: 'GW-90110',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(2),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-070-111',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-01-18',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Atlanta Power Yard, GA',
    salesforceAccountId: 'SF-015',
    customerName: 'Pinewood Power Rentals',
    runtimeHours: 410,
    conditionScore: 89,
    imageUrl: 'image_32.png',
    imonnitGatewayId: 'GW-90111',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(4),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-125-112',
    model: 'EBOSS 125kVA',
    manufacturingDate: '2023-12-28',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.MAINTENANCE,
    location: 'Memphis Power Yard, TN',
    salesforceAccountId: 'SF-016',
    customerName: 'Delta Power Equipment',
    runtimeHours: 760,
    conditionScore: 81,
    imageUrl: 'image_33.png',
    imonnitGatewayId: 'GW-90112',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(10),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  },
  {
    serialNumber: 'EB-220-113',
    model: 'EBOSS 220kVA',
    manufacturingDate: '2024-02-14',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Austin Power Hub, TX',
    salesforceAccountId: 'SF-017',
    customerName: 'Lone Star Power Rentals',
    runtimeHours: 260,
    conditionScore: 96,
    imageUrl: 'image_34.png',
    imonnitGatewayId: 'GW-90113',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(3),
    recentReadings: generateHistory(24),
    activeAlerts: [],
    lastPmDate: '2024-04-02',
    lastPmHours: 220,
    lastPmBy: 'Sarah L.'
  },
  {
    serialNumber: 'EB-400-114',
    model: 'EBOSS 400kVA',
    manufacturingDate: '2023-08-21',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.ACTIVE,
    location: 'Tampa Power Depot, FL',
    salesforceAccountId: 'SF-018',
    customerName: 'Suncoast Power Fleet',
    runtimeHours: 1680,
    conditionScore: 86,
    imageUrl: 'image_35.png',
    imonnitGatewayId: 'GW-90114',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(6),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-025-115',
    model: 'EBOSS 25kVA',
    manufacturingDate: '2024-03-10',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Minneapolis Power Yard, MN',
    salesforceAccountId: 'SF-019',
    customerName: 'North Ridge Power Rentals',
    runtimeHours: 150,
    conditionScore: 97,
    imageUrl: 'image_36.png',
    imonnitGatewayId: 'GW-90115',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(2),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-070-116',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-01-09',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.ACTIVE,
    location: 'Kansas City Power Yard, MO',
    salesforceAccountId: 'SF-020',
    customerName: 'Heartland Power Equipment',
    runtimeHours: 430,
    conditionScore: 88,
    imageUrl: 'image_37.png',
    imonnitGatewayId: 'GW-90116',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(5),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-125-117',
    model: 'EBOSS 125kVA',
    manufacturingDate: '2023-11-30',
    batchId: 'BATCH-23-Q4',
    status: UnitStatus.ACTIVE,
    location: 'Seattle Power Yard, WA',
    salesforceAccountId: 'SF-021',
    customerName: 'Cascade Power Rentals',
    runtimeHours: 610,
    conditionScore: 90,
    imageUrl: 'image_38.png',
    imonnitGatewayId: 'GW-90117',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(7),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  },
  {
    serialNumber: 'EB-220-118',
    model: 'EBOSS 220kVA',
    manufacturingDate: '2023-10-28',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.ACTIVE,
    location: 'Toronto Power Depot, ON',
    salesforceAccountId: 'SF-022',
    customerName: 'Cedar Power Fleet',
    runtimeHours: 1260,
    conditionScore: 85,
    imageUrl: 'image_39.png',
    imonnitGatewayId: 'GW-90118',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(8),
    recentReadings: generateHistory(24),
    activeAlerts: []
  },
  {
    serialNumber: 'EB-400-119',
    model: 'EBOSS 400kVA',
    manufacturingDate: '2023-09-09',
    batchId: 'BATCH-23-Q3',
    status: UnitStatus.ACTIVE,
    location: 'London Power Yard, UK',
    salesforceAccountId: 'SF-023',
    customerName: 'Thames Power Rentals',
    runtimeHours: 1740,
    conditionScore: 83,
    imageUrl: 'image_40.png',
    imonnitGatewayId: 'GW-90119',
    telemetryStatus: TelemetryStatus.ONLINE,
    lastSync: hoursAgo(9),
    recentReadings: generateHistory(24),
    activeAlerts: [],
    lastPmDate: '2024-01-12',
    lastPmHours: 1600,
    lastPmBy: 'Dev Team'
  },
  {
    serialNumber: 'EB-070-120',
    model: 'EBOSS 70kVA',
    manufacturingDate: '2024-02-25',
    batchId: 'BATCH-24-Q1',
    status: UnitStatus.MAINTENANCE,
    location: 'Munich Power Hub, DE',
    salesforceAccountId: 'SF-024',
    customerName: 'Rhine Power Equipment',
    runtimeHours: 220,
    conditionScore: 87,
    imageUrl: 'image_41.png',
    imonnitGatewayId: 'GW-90120',
    telemetryStatus: TelemetryStatus.WARNING,
    lastSync: hoursAgo(6),
    recentReadings: generateHistory(24),
    activeAlerts: [MOCK_ALERTS[0]]
  }
];

export const MOCK_UNITS: Unit[] = [
  ...BASE_UNITS,
  ...ADDITIONAL_UNITS
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-1001',
    unitSerialNumber: 'EB-070-042',
    title: 'Inverter Synchronization Error',
    description: 'Unit fails to sync with grid during load transfer test.',
    category: 'Defect',
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    createdAt: '2024-05-10',
    technician: 'Mike R.',
    photos: ['image_12.png'],
    lastUpdated: '2024-05-11T14:30:00Z',
    lastUpdatedBy: 'Mike R.'
  },
  {
    id: 'TKT-1002',
    unitSerialNumber: 'EB-025-001',
    title: 'Scheduled Maintenance (250hr)',
    description: 'Check battery electrolyte levels and BMS firmware.',
    category: 'Maintenance',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.OPEN,
    createdAt: '2024-05-12',
    technician: 'Sarah L.',
    photos: [],
    lastUpdated: '2024-05-12T09:15:00Z',
    lastUpdatedBy: 'System'
  },
  {
    id: 'TKT-1003',
    unitSerialNumber: 'EB-400-005',
    title: 'Critical Battery Failure',
    description: 'BMS reporting catastrophic cell failure in Bank 2.',
    category: 'Defect',
    priority: TicketPriority.CRITICAL,
    status: TicketStatus.OPEN,
    createdAt: '2024-05-13',
    technician: 'John Doe',
    photos: [],
    lastUpdated: '2024-05-13T08:00:00Z',
    lastUpdatedBy: 'System'
  }
];

export const MOCK_ACTIONS: Action[] = [
  {
    id: 'ACT-1001',
    type: 'recover',
    subjectType: 'account',
    subjectId: 'SF-002',
    status: 'open',
    urgency: 'overdue',
    priorityScore: 92,
    source: 'system',
    createdAt: daysAgo(1),
    dueAt: daysAgo(0)
  },
  {
    id: 'ACT-1002',
    type: 'recover',
    subjectType: 'account',
    subjectId: 'SF-004',
    status: 'open',
    urgency: 'overdue',
    priorityScore: 88,
    source: 'system',
    createdAt: daysAgo(3),
    dueAt: daysAgo(1)
  },
  {
    id: 'ACT-2001',
    type: 'approve_log',
    subjectType: 'interaction',
    subjectId: 'INT-002',
    status: 'open',
    urgency: 'medium',
    priorityScore: 55,
    source: 'integration',
    createdAt: hoursAgo(6)
  },
  {
    id: 'ACT-2002',
    type: 'approve_log',
    subjectType: 'interaction',
    subjectId: 'INT-001',
    status: 'completed',
    urgency: 'low',
    priorityScore: 18,
    source: 'integration',
    createdAt: hoursAgo(2),
    autoApproved: true
  },
  {
    id: 'ACT-3001',
    type: 'after_action_required',
    subjectType: 'interaction',
    subjectId: 'INT-003',
    status: 'open',
    urgency: 'high',
    priorityScore: 70,
    source: 'integration',
    createdAt: hoursAgo(4)
  },
  {
    id: 'ACT-4001',
    type: 'approve_receipt',
    subjectType: 'expense',
    subjectId: 'EXP-001',
    status: 'open',
    urgency: 'medium',
    priorityScore: 42,
    source: 'integration',
    createdAt: hoursAgo(8)
  },
  {
    id: 'ACT-5001',
    type: 'verify_link',
    subjectType: 'link',
    subjectId: 'VQ-001',
    status: 'open',
    urgency: 'low',
    priorityScore: 30,
    source: 'system',
    createdAt: hoursAgo(12)
  }
];

export const MOCK_INTERACTIONS: CustomerInteraction[] = [
  {
    id: 'INT-001',
    accountId: 'SF-001',
    contactName: 'Ava King',
    channel: 'email',
    source: 'gmail',
    summary: 'Confirmed generator runtime increase; scheduling PM window for next week.',
    timestamp: hoursAgo(10),
    confidenceScore: 0.93,
    approvalStatus: 'approved',
    actionId: 'ACT-2002',
    autoApproved: true,
    createdByUserId: 'USR-001'
  },
  {
    id: 'INT-002',
    accountId: 'SF-002',
    contactName: 'Luis Ramirez',
    channel: 'email',
    source: 'outlook',
    summary: 'Customer asked about battery replacement timeline; reply drafted.',
    timestamp: hoursAgo(18),
    confidenceScore: 0.58,
    approvalStatus: 'pending',
    actionId: 'ACT-2001',
    createdByUserId: 'USR-002'
  },
  {
    id: 'INT-003',
    accountId: 'SF-004',
    contactName: 'Nina Roberts',
    channel: 'call',
    source: 'ios_call',
    summary: 'Call completed, after-action notes required.',
    timestamp: hoursAgo(6),
    confidenceScore: 0.81,
    approvalStatus: 'pending',
    actionId: 'ACT-3001',
    afterActionRequired: true,
    createdByUserId: 'USR-003'
  }
];

export const MOCK_TERRITORY_REMINDERS: TerritoryReminder[] = [
  {
    id: 'TRM-001',
    accountId: 'SF-002',
    territoryId: 'TR-SW',
    actionId: 'ACT-1001',
    status: 'open',
    createdAt: daysAgo(1),
    dueAt: daysAgo(0),
    lastInteractionAt: unitedLastInteraction,
    daysSinceContact: 45,
    slaDays: SLA_DAYS_BY_TIER[AccountTier.B],
    talkingPoints: [
      'Review open service ticket TKT-1001',
      'Confirm generator runtime spike from last telemetry sync',
      'Discuss upcoming site visit schedule'
    ],
    openTickets: 1,
    openOpportunities: 2
  },
  {
    id: 'TRM-002',
    accountId: 'SF-004',
    territoryId: 'TR-EMEA',
    actionId: 'ACT-1002',
    status: 'open',
    createdAt: daysAgo(3),
    dueAt: daysAgo(1),
    lastInteractionAt: aggrekoLastInteraction,
    daysSinceContact: 75,
    slaDays: SLA_DAYS_BY_TIER[AccountTier.B],
    talkingPoints: [
      'Confirm spare battery delivery ETA',
      'Review open opportunities for Q3 expansion'
    ],
    openTickets: 1,
    openOpportunities: 1
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    userId: 'USR-001',
    amount: 186.45,
    currency: 'USD',
    vendor: 'Hilton Garden Inn',
    category: 'Lodging',
    date: daysAgo(2),
    source: 'email',
    status: 'pending',
    confidenceScore: 0.77,
    receiptUrl: '/receipts/exp-001.pdf',
    actionId: 'ACT-4001',
    linkedAccountId: 'SF-002'
  },
  {
    id: 'EXP-002',
    userId: 'USR-003',
    amount: 42.15,
    currency: 'USD',
    vendor: 'Fuel Station 22',
    category: 'Fuel',
    date: daysAgo(1),
    source: 'photo',
    status: 'pending',
    confidenceScore: 0.49,
    receiptUrl: '/receipts/exp-002.jpg',
    linkedAccountId: 'SF-001'
  }
];

export const MOCK_WEEKLY_DIGESTS: WeeklyDigest[] = [
  {
    id: 'WD-2024-05-06-TR-SW',
    territoryId: 'TR-SW',
    periodStart: daysAgo(7),
    periodEnd: daysAgo(0),
    createdAt: hoursAgo(2),
    contactRate: 0.62,
    overdueAccounts: 2,
    averageDaysSinceContact: 28,
    topRecoveryAccountIds: ['SF-002', 'SF-004'],
    planItems: [
      'Schedule outreach for United Rentals and Aggreko',
      'Review open tickets tied to recovery actions',
      'Confirm follow-up visits for Phoenix and Houston'
    ],
    summary: 'Contact rate dipped due to two overdue accounts; prioritize recovery actions first.'
  }
];

export const MOCK_VERIFICATION_QUEUE: VerificationQueueItem[] = [
  {
    id: 'VQ-001',
    recordType: 'expense_link',
    recordId: 'EXP-002',
    reason: 'Ambiguous account match between Sunbelt Rentals and United Rentals.',
    confidenceScore: 0.48,
    status: 'pending',
    createdAt: hoursAgo(12)
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    actorUserId: 'USR-004',
    eventType: 'create',
    recordType: 'action',
    recordId: 'ACT-1001',
    createdAt: daysAgo(1),
    metadata: { source: 'system', workflow: 'WF-11' }
  },
  {
    id: 'AUD-002',
    actorUserId: 'USR-002',
    eventType: 'approve',
    recordType: 'interaction',
    recordId: 'INT-001',
    createdAt: hoursAgo(2),
    metadata: { workflow: 'WF-03', autoApproved: true }
  },
  {
    id: 'AUD-003',
    actorUserId: 'USR-001',
    eventType: 'create',
    recordType: 'expense',
    recordId: 'EXP-001',
    createdAt: hoursAgo(8),
    metadata: { workflow: 'WF-06', confidence: 0.77 }
  }
];
