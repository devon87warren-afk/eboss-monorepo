import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  Action,
  AuditLog,
  CustomerInteraction,
  Expense,
  SalesforceCustomer,
  Territory,
  Ticket,
  Unit,
  UserProfile,
  VerificationQueueItem,
  WeeklyDigest,
  TerritoryReminder
} from '../types';

export const EBOSS_TABLES = {
  units: 'units',
  tickets: 'tickets',
  customers: 'customers',
  territories: 'territories',
  users: 'users',
  actions: 'actions',
  interactions: 'customer_interactions',
  territoryReminders: 'territory_reminders',
  expenses: 'expenses',
  weeklyDigests: 'weekly_digests',
  verificationQueue: 'verification_queue',
  auditLogs: 'audit_logs'
} as const;

export interface EbossData {
  units: Unit[];
  tickets: Ticket[];
  customers: SalesforceCustomer[];
  territories: Territory[];
  users: UserProfile[];
  actions: Action[];
  interactions: CustomerInteraction[];
  territoryReminders: TerritoryReminder[];
  expenses: Expense[];
  weeklyDigests: WeeklyDigest[];
  verificationQueue: VerificationQueueItem[];
  auditLogs: AuditLog[];
}

const canUseSupabase = () => Boolean(isSupabaseConfigured && supabase);

type AuthUser = {
  id: string;
  email?: string | null;
};

const fetchTable = async <T>(table: string, fallback: T[]): Promise<T[]> => {
  if (!canUseSupabase()) {
    return fallback;
  }

  const { data, error } = await supabase!.from(table).select('*');
  if (error || !data) {
    return fallback;
  }

  return data as T[];
};

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!canUseSupabase()) {
    return null;
  }

  const { data, error } = await supabase!
    .from(EBOSS_TABLES.users)
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
};

const resolveUserProfile = async (
  authUser: AuthUser,
  fallbackUsers: UserProfile[],
  fallbackUser: UserProfile
): Promise<UserProfile> => {
  const profile = await fetchUserProfile(authUser.id);
  if (profile) {
    return profile;
  }

  const email = authUser.email?.toLowerCase();
  const byEmail = email
    ? fallbackUsers.find(user => user.email.toLowerCase() === email)
    : undefined;

  return byEmail ?? fallbackUser;
};

export const loadEbossData = async (fallbacks: EbossData): Promise<EbossData> => {
  if (!canUseSupabase()) {
    return fallbacks;
  }

  const [
    units,
    tickets,
    customers,
    territories,
    users,
    actions,
    interactions,
    territoryReminders,
    expenses,
    weeklyDigests,
    verificationQueue,
    auditLogs
  ] = await Promise.all([
    fetchTable<Unit>(EBOSS_TABLES.units, fallbacks.units),
    fetchTable<Ticket>(EBOSS_TABLES.tickets, fallbacks.tickets),
    fetchTable<SalesforceCustomer>(EBOSS_TABLES.customers, fallbacks.customers),
    fetchTable<Territory>(EBOSS_TABLES.territories, fallbacks.territories),
    fetchTable<UserProfile>(EBOSS_TABLES.users, fallbacks.users),
    fetchTable<Action>(EBOSS_TABLES.actions, fallbacks.actions),
    fetchTable<CustomerInteraction>(EBOSS_TABLES.interactions, fallbacks.interactions),
    fetchTable<TerritoryReminder>(EBOSS_TABLES.territoryReminders, fallbacks.territoryReminders),
    fetchTable<Expense>(EBOSS_TABLES.expenses, fallbacks.expenses),
    fetchTable<WeeklyDigest>(EBOSS_TABLES.weeklyDigests, fallbacks.weeklyDigests),
    fetchTable<VerificationQueueItem>(EBOSS_TABLES.verificationQueue, fallbacks.verificationQueue),
    fetchTable<AuditLog>(EBOSS_TABLES.auditLogs, fallbacks.auditLogs)
  ]);

  return {
    units,
    tickets,
    customers,
    territories,
    users,
    actions,
    interactions,
    territoryReminders,
    expenses,
    weeklyDigests,
    verificationQueue,
    auditLogs
  };
};

export const loadCurrentUserProfile = async (
  fallbackUsers: UserProfile[],
  fallbackUser: UserProfile
): Promise<UserProfile> => {
  if (!canUseSupabase()) {
    return fallbackUser;
  }

  const { data, error } = await supabase!.auth.getUser();
  const authUser = data?.user;
  if (error || !authUser) {
    return fallbackUser;
  }

  return resolveUserProfile({ id: authUser.id, email: authUser.email }, fallbackUsers, fallbackUser);
};

export const subscribeToAuthChanges = (
  fallbackUsers: UserProfile[],
  fallbackUser: UserProfile,
  onUserResolved: (user: UserProfile) => void
) => {
  if (!canUseSupabase()) {
    return () => undefined;
  }

  const { data } = supabase!.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      onUserResolved(fallbackUser);
      return;
    }

    const resolvedUser = await resolveUserProfile(
      { id: session.user.id, email: session.user.email },
      fallbackUsers,
      fallbackUser
    );

    onUserResolved(resolvedUser);
  });

  return () => {
    data?.subscription.unsubscribe();
  };
};

const upsertRecords = async <T extends object>(table: string, records: T | T[]) => {
  if (!canUseSupabase()) {
    return;
  }

  const payload = Array.isArray(records) ? records : [records];
  if (payload.length === 0) {
    return;
  }

  await supabase!.from(table).upsert(payload);
};

export const upsertTicket = async (ticket: Ticket) =>
  upsertRecords<Ticket>(EBOSS_TABLES.tickets, ticket);

export const upsertUnit = async (unit: Unit) =>
  upsertRecords<Unit>(EBOSS_TABLES.units, unit);

export const upsertCustomers = async (customers: SalesforceCustomer[]) =>
  upsertRecords<SalesforceCustomer>(EBOSS_TABLES.customers, customers);
