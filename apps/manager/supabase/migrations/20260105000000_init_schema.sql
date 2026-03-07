-- EBOSS Manager Supabase schema

create table if not exists "territories" (
  "id" text primary key,
  "name" text not null,
  "region" text not null,
  "timezone" text not null,
  "managerUserId" text
);

create table if not exists "users" (
  "id" text primary key,
  "name" text not null,
  "email" text not null,
  "role" text not null,
  "territoryId" text references "territories"("id"),
  "territoryAssignmentSource" text,
  "territoryAssignedAt" timestamptz,
  "searchScope" text not null default 'global',
  "createdAt" timestamptz not null default now(),
  "isActive" boolean not null default true
);

create table if not exists "customers" (
  "id" text primary key,
  "name" text not null,
  "contactEmail" text not null,
  "region" text not null,
  "territoryId" text references "territories"("id"),
  "accountTier" text not null,
  "accountStatus" text not null,
  "lastInteractionAt" timestamptz,
  "nextSlaDueAt" timestamptz,
  "lastSync" timestamptz
);

create table if not exists "units" (
  "serialNumber" text primary key,
  "model" text not null,
  "manufacturingDate" date not null,
  "batchId" text not null,
  "status" text not null,
  "location" text not null,
  "salesforceAccountId" text references "customers"("id"),
  "customerName" text not null,
  "runtimeHours" integer not null,
  "conditionScore" integer not null,
  "imageUrl" text,
  "imonnitGatewayId" text not null,
  "telemetryStatus" text not null,
  "lastSync" timestamptz,
  "recentReadings" jsonb not null default '[]'::jsonb,
  "activeAlerts" jsonb not null default '[]'::jsonb,
  "lastPmDate" date,
  "lastPmHours" integer,
  "lastPmBy" text
);

create table if not exists "tickets" (
  "id" text primary key,
  "unitSerialNumber" text references "units"("serialNumber"),
  "title" text not null,
  "description" text not null,
  "category" text not null,
  "priority" text not null,
  "status" text not null,
  "createdAt" timestamptz not null,
  "technician" text not null,
  "photos" text[] not null default '{}',
  "customerComplaint" text,
  "alarmCodes" text,
  "alarmDescription" text,
  "troubleshootingSteps" text,
  "communicationMethods" text[],
  "actualFaults" text,
  "pmData" jsonb,
  "lastUpdated" timestamptz,
  "lastUpdatedBy" text
);

create table if not exists "actions" (
  "id" text primary key,
  "type" text not null,
  "subjectType" text not null,
  "subjectId" text not null,
  "status" text not null,
  "urgency" text not null,
  "priorityScore" numeric not null,
  "source" text not null,
  "createdAt" timestamptz not null,
  "dueAt" timestamptz,
  "assignedToUserId" text,
  "autoApproved" boolean not null default false
);

create table if not exists "customer_interactions" (
  "id" text primary key,
  "accountId" text references "customers"("id"),
  "contactName" text,
  "channel" text not null,
  "source" text not null,
  "summary" text not null,
  "timestamp" timestamptz not null,
  "confidenceScore" numeric not null,
  "approvalStatus" text not null,
  "actionId" text,
  "autoApproved" boolean default false,
  "afterActionRequired" boolean default false,
  "createdByUserId" text
);

create table if not exists "territory_reminders" (
  "id" text primary key,
  "accountId" text references "customers"("id"),
  "territoryId" text references "territories"("id"),
  "actionId" text,
  "status" text not null,
  "createdAt" timestamptz not null,
  "dueAt" timestamptz not null,
  "lastInteractionAt" timestamptz not null,
  "daysSinceContact" integer not null,
  "slaDays" integer not null,
  "talkingPoints" text[] not null default '{}',
  "openTickets" integer not null default 0,
  "openOpportunities" integer not null default 0
);

create table if not exists "expenses" (
  "id" text primary key,
  "userId" text references "users"("id"),
  "amount" numeric not null,
  "currency" text not null,
  "vendor" text not null,
  "category" text not null,
  "date" date not null,
  "source" text not null,
  "status" text not null,
  "confidenceScore" numeric not null,
  "receiptUrl" text,
  "actionId" text,
  "concurExpenseId" text,
  "linkedAccountId" text references "customers"("id"),
  "linkedTicketId" text references "tickets"("id"),
  "linkedVisitId" text
);

create table if not exists "weekly_digests" (
  "id" text primary key,
  "territoryId" text references "territories"("id"),
  "periodStart" timestamptz not null,
  "periodEnd" timestamptz not null,
  "createdAt" timestamptz not null,
  "contactRate" numeric not null,
  "overdueAccounts" integer not null,
  "averageDaysSinceContact" numeric not null,
  "topRecoveryAccountIds" text[] not null default '{}',
  "planItems" text[] not null default '{}',
  "summary" text not null
);

create table if not exists "verification_queue" (
  "id" text primary key,
  "recordType" text not null,
  "recordId" text not null,
  "reason" text not null,
  "confidenceScore" numeric not null,
  "status" text not null,
  "createdAt" timestamptz not null,
  "resolvedAt" timestamptz,
  "resolvedByUserId" text
);

create table if not exists "audit_logs" (
  "id" text primary key,
  "actorUserId" text not null,
  "eventType" text not null,
  "recordType" text not null,
  "recordId" text not null,
  "createdAt" timestamptz not null,
  "metadata" jsonb not null default '{}'::jsonb
);

create index if not exists "idx_users_territoryId" on "users" ("territoryId");
create index if not exists "idx_customers_territoryId" on "customers" ("territoryId");
create index if not exists "idx_units_salesforceAccountId" on "units" ("salesforceAccountId");
create index if not exists "idx_tickets_unitSerialNumber" on "tickets" ("unitSerialNumber");
create index if not exists "idx_actions_status" on "actions" ("status");
create index if not exists "idx_interactions_accountId" on "customer_interactions" ("accountId");
create index if not exists "idx_reminders_territoryId" on "territory_reminders" ("territoryId");
create index if not exists "idx_expenses_userId" on "expenses" ("userId");
create index if not exists "idx_weekly_digests_territoryId" on "weekly_digests" ("territoryId");
create index if not exists "idx_verification_status" on "verification_queue" ("status");
create index if not exists "idx_audit_logs_record" on "audit_logs" ("recordType", "recordId");
