
// UnitStatus members used in the application
export enum UnitStatus {
  ACTIVE = 'In Service',
  MAINTENANCE = 'Maintenance',
  DOWN = 'Down',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum TelemetryStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  WARNING = 'Warning',
  CRITICAL = 'Critical'
}

export enum AccountTier {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  TECH = 'Technician',
}

export type TerritoryAssignmentSource = 'self' | 'admin';
export type DataAccessScope = 'global' | 'territory';

export interface Territory {
  id: string;
  name: string;
  region: string;
  timezone: string;
  managerUserId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  territoryId: string | null;
  territoryAssignmentSource: TerritoryAssignmentSource | null;
  territoryAssignedAt: string | null;
  searchScope: DataAccessScope;
  createdAt: string;
  isActive: boolean;
}

export interface SalesforceCustomer {
  id: string;
  name: string;
  contactEmail: string;
  region: string;
  territoryId: string;
  accountTier: AccountTier;
  accountStatus: 'Active' | 'Hold';
  lastInteractionAt: string;
  nextSlaDueAt: string;
  lastSync: string;
}

export interface SensorReading {
  timestamp: string;
  temperature: number;
  vibration: number;
  voltage: number;
  fuelLevel: number;
  currentAmps: number;
}

export interface SensorAlert {
  id: string;
  sensorType: string; // e.g. 'Vibration', 'Temperature'
  severity: 'Warning' | 'Critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface PMChecklist {
  id: string;
  unitSerialNumber: string;
  date: string;
  technician: string;
  hoursAtPm: number;
  batteryStatus: 'Pass' | 'Fail';
  driveStatus: 'Pass' | 'Fail';
  contactorStatus: 'Pass' | 'Fail';
  commSystemStatus: 'Pass' | 'Fail';
  notes: string;
}

export interface Unit {
  serialNumber: string;
  model: string;
  manufacturingDate: string;
  batchId: string;
  status: UnitStatus;
  location: string;
  salesforceAccountId: string;
  customerName: string;
  runtimeHours: number;
  conditionScore: number;
  imageUrl?: string;
  
  // iMonnit Telemetry
  imonnitGatewayId: string;
  telemetryStatus: TelemetryStatus;
  lastSync: string;
  recentReadings: SensorReading[];
  activeAlerts: SensorAlert[];
  
  // PM Tracking
  lastPmDate?: string;
  lastPmHours?: number;
  lastPmBy?: string;
}

export interface Ticket {
  id: string;
  unitSerialNumber: string;
  title: string;
  description: string;
  category: 'Defect' | 'Maintenance' | 'Training' | 'Other' | 'PM Checklist';
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  technician: string;
  photos: string[]; // URLs
  
  // Detailed Logging Fields
  customerComplaint?: string;
  alarmCodes?: string;
  alarmDescription?: string; 
  troubleshootingSteps?: string;
  communicationMethods?: string[];
  actualFaults?: string;
  pmData?: PMChecklist; // Link to PM specific data

  // Audit Trail
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

export type ActionType =
  | 'recover'
  | 'approve_log'
  | 'after_action_required'
  | 'approve_receipt'
  | 'verify_link'
  | 'approve_sync';

export type ActionStatus = 'open' | 'in_progress' | 'completed' | 'blocked';
export type ActionUrgency = 'overdue' | 'high' | 'medium' | 'low';
export type ActionSource = 'system' | 'user' | 'integration';
export type ActionSubjectType = 'account' | 'interaction' | 'expense' | 'reminder' | 'visit' | 'link';

export interface Action {
  id: string;
  type: ActionType;
  subjectType: ActionSubjectType;
  subjectId: string;
  status: ActionStatus;
  urgency: ActionUrgency;
  priorityScore: number;
  source: ActionSource;
  createdAt: string;
  dueAt?: string;
  assignedToUserId?: string;
  autoApproved?: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type InteractionChannel = 'email' | 'call' | 'visit' | 'other';
export type InteractionSource = 'gmail' | 'outlook' | 'ios_call' | 'calendar' | 'manual';

export interface CustomerInteraction {
  id: string;
  accountId: string;
  contactName?: string;
  channel: InteractionChannel;
  source: InteractionSource;
  summary: string;
  timestamp: string;
  confidenceScore: number;
  approvalStatus: ApprovalStatus;
  actionId?: string;
  autoApproved?: boolean;
  afterActionRequired?: boolean;
  createdByUserId?: string;
}

export type ReminderStatus = 'open' | 'cleared';

export interface TerritoryReminder {
  id: string;
  accountId: string;
  territoryId: string;
  actionId: string;
  status: ReminderStatus;
  createdAt: string;
  dueAt: string;
  lastInteractionAt: string;
  daysSinceContact: number;
  slaDays: number;
  talkingPoints: string[];
  openTickets: number;
  openOpportunities: number;
}

export type ExpenseSource = 'email' | 'photo' | 'manual';
export type ExpenseStatus = 'pending' | 'approved' | 'submitted' | 'rejected';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  vendor: string;
  category: string;
  date: string;
  source: ExpenseSource;
  status: ExpenseStatus;
  confidenceScore: number;
  receiptUrl?: string;
  actionId?: string;
  concurExpenseId?: string;
  linkedAccountId?: string;
  linkedTicketId?: string;
  linkedVisitId?: string;
}

export interface WeeklyDigest {
  id: string;
  territoryId: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  contactRate: number;
  overdueAccounts: number;
  averageDaysSinceContact: number;
  topRecoveryAccountIds: string[];
  planItems: string[];
  summary: string;
}

export type VerificationStatus = 'pending' | 'resolved';
export type VerificationItemType = 'expense_link' | 'interaction_match' | 'receipt' | 'calendar_link';

export interface VerificationQueueItem {
  id: string;
  recordType: VerificationItemType;
  recordId: string;
  reason: string;
  confidenceScore: number;
  status: VerificationStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
}

export type AuditEventType = 'approve' | 'edit' | 'reject' | 'sync' | 'create' | 'update';

export interface AuditLog {
  id: string;
  actorUserId: string;
  eventType: AuditEventType;
  recordType: string;
  recordId: string;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
}
