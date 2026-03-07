# EBOSS-Manager - Comprehensive Codebase Analysis

## 1. Application Overview

**EBOSS-Manager** is a sophisticated field service management and equipment monitoring platform for power generation equipment (EBOSS units). Built as a Vite + React 19 application with Supabase backend, it provides:

- Service ticket management with workflow automation
- Unit telemetry monitoring via iMonnit gateway integration
- Customer relationship management with Salesforce sync
- Territory-based access control and SLA management
- Expense tracking with AI-powered receipt detection
- Multi-system integrations (Outlook, Gmail, Salesforce)

**Primary User Types:**
- Field Technicians (service tickets, PM checklists, customer interactions)
- Supervisors (ticket approval, territory oversight)
- Managers (territory analytics, expense approval, reporting)
- Administrators (user management, system configuration)

---

## 2. Tech Stack

### Core Framework & Runtime
- **Vite** 6.2.0 (build tool)
- **React** 19.2.3 + React DOM 19.2.3
- **TypeScript** 5.8.2 (strict mode)
- **React Router** 7.12.0 (HashRouter)

### UI & Styling
- **Tailwind CSS** 4.1.18
- **Radix UI** (Dialog, Tabs, Avatar, Dropdown, etc.)
- **Lucide React** 0.562.0 (icons)
- **Recharts** 3.6.0 (charting)

### Data & State
- **React Query** (@tanstack/react-query) 5.90.16
- **Supabase** 2.48.1 (PostgreSQL + Auth)
- **React Context** (AppContext, AuthContext, PermissionContext)

### Forms & Validation
- **React Hook Form** 7.70.0
- **Zod** 4.3.5

### External Integrations
- **Salesforce CRM** (OAuth REST API)
- **Outlook/Gmail** (Graph API / OAuth)
- **iMonnit** (telemetry gateway)
- **Google Gemini AI** (@google/genai)

### Utilities
- **Fuse.js** 7.1.0 (fuzzy search)
- **React Hot Toast** 2.6.0 (notifications)
- **clsx**, **tailwind-merge** (class utilities)

---

## 3. Codebase Structure

```
EBOSS-Manager/
├── components/              # 23+ React components
│   ├── Auth/               # LoginPage, ProtectedRoute
│   ├── Layout/             # MainLayout, RightPanel
│   ├── ui/                 # Radix-based UI primitives
│   └── [Features]          # Dashboard, UnitList, TicketList, etc.
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Supabase auth state
│   ├── PermissionContext.tsx # RBAC (5 roles)
│   ├── NotificationContext.tsx
│   └── DensityContext.tsx  # UI density settings
├── hooks/
│   ├── queries/            # React Query fetch hooks
│   └── mutations/          # React Query mutation hooks
├── services/               # API & external integrations
│   ├── api.ts             # Main CRUD operations
│   ├── outlookService.ts  # Outlook Graph API
│   ├── salesforceService.ts # Salesforce REST API
│   └── syncService.ts     # Multi-system sync
├── data/
│   ├── ebossData.ts       # Supabase data layer
│   └── queryClient.ts     # React Query config
├── workflow/               # Workflow engine subsystem
│   ├── engine/            # WorkflowEngine.ts
│   ├── configs/           # Workflow definitions
│   ├── registry/          # Component registry
│   └── templates/         # GenericListPage.tsx
├── supabase/migrations/   # Database schema
├── types/                  # TypeScript definitions
├── mockData.ts            # Development mock data
├── App.tsx                # Root component + routes
├── supabaseClient.ts      # Supabase client
└── vite.config.ts         # Build configuration
```

---

## 4. Routes & Entry Points

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginPage | Authentication |
| `/` | Dashboard | Main overview |
| `/command` | EnergyBossCommand | AI command interface |
| `/units` | UnitList | Equipment inventory |
| `/units/:serialNumber` | UnitDetail | Unit details + telemetry |
| `/customers` | CustomerList | CRM customer list |
| `/customers/:id` | CustomerDetail | Customer profile |
| `/tickets` | TicketList | Service tickets |
| `/tickets/new` | CreateTicket | New ticket form |
| `/tickets/pm/:unitSerialNumber` | PMChecklistForm | PM checklist |
| `/analytics` | TerritoryAnalytics | Territory metrics |
| `/expenses` | ExpenseManager | Expense approval |
| `/admin` | AdminDashboard | Admin controls |
| `/resources` | Resources | Documentation |
| `/tech-lounge` | TechLounge | Community forum |
| `/workflow` | ImportManager | Import management |

---

## 5. Domain Model (12 Core Entities)

### Unit (Power Equipment)
- `serialNumber` (PK), `model`, `status`, `location`
- `runtimeHours`, `conditionScore`, `telemetryStatus`
- `recentReadings[]` (sensor data), `activeAlerts[]`
- PM tracking: `lastPmDate`, `lastPmHours`, `lastPmBy`

### Ticket (Service Request)
- `id`, `unitSerialNumber`, `title`, `description`
- `category`, `priority`, `status`, `technician`
- `troubleshootingSteps`, `alarmCodes`, `photos[]`

### SalesforceCustomer
- `id`, `name`, `contactEmail`, `region`, `territoryId`
- `accountTier` (A/B/C for SLA), `lastInteractionAt`, `nextSlaDueAt`

### Territory
- `id`, `name`, `region`, `timezone`, `managerUserId`

### UserProfile
- `id`, `name`, `email`, `role` (5 levels)
- `territoryId`, `searchScope` (global/territory)

### Action (Workflow Item)
- `id`, `type`, `subjectType`, `subjectId`
- `status`, `urgency`, `priorityScore`, `dueAt`

### CustomerInteraction
- `id`, `accountId`, `channel`, `source`
- `summary`, `confidenceScore`, `approvalStatus`

### Expense
- `id`, `userId`, `amount`, `vendor`, `category`
- `source`, `status`, `confidenceScore`, `receiptUrl`

### TerritoryReminder
- `id`, `accountId`, `territoryId`, `dueAt`
- `daysSinceContact`, `slaDays`, `talkingPoints[]`

### WeeklyDigest
- `id`, `territoryId`, `periodStart/End`
- `contactRate`, `overdueAccounts`, `planItems[]`

### VerificationQueueItem
- `id`, `recordType`, `recordId`, `reason`, `confidenceScore`

### AuditLog
- `id`, `actorUserId`, `eventType`, `recordType`, `metadata`

---

## 6. User Roles & Permissions (RBAC)

| Role | Level | Capabilities |
|------|-------|--------------|
| Admin | 100 | Full access, user management, system config |
| Manager | 80 | Territory oversight, expense approval, reporting |
| Supervisor | 60 | Ticket approval, team management |
| Technician | 40 | Create/update own tickets, customer interactions |
| Support | 20 | Read-only access, limited updates |

**Scope Levels:** own, territory, all

---

## 7. Key Workflows

1. **Service Ticket Management** - Create → Assign → Work → Resolve → Approve
2. **Preventive Maintenance (PM)** - Checklist form → Photo capture → Submit
3. **Customer Account Recovery** - SLA timer → Auto-reminder → Contact → Log
4. **Interaction Auto-Logging** - Email/Calendar sync → AI detection → Approval
5. **Expense Reporting** - Receipt upload → AI extraction → Manager approval
6. **Unit Telemetry Monitoring** - Sensor data → Threshold alerts → Auto-ticket
7. **Territory Analytics** - Weekly digest → Metrics dashboard → Export

---

## 8. Backend Integration (Supabase)

- **12 PostgreSQL tables** with RLS (Row Level Security)
- **Authentication:** Email/password, OAuth-ready
- **Real-time:** Supabase subscriptions available
- **Fallback:** Graceful degradation to mock data

---

## 9. External Integrations

| System | Purpose | Method |
|--------|---------|--------|
| Salesforce | Customer CRM sync | OAuth + REST API |
| Outlook | Email/calendar detection | Graph API |
| Gmail | Email detection | OAuth |
| iMonnit | Unit telemetry | Gateway polling |
| Google Gemini | AI commands, interaction detection | REST API |

---

## 10. Current State

- **Stage:** Production-ready enterprise application
- **Backend:** Supabase PostgreSQL (with mock fallback)
- **Auth:** Full RBAC with 5 role levels
- **Integrations:** Salesforce, Outlook, iMonnit, Gemini AI
- **Testing:** Manual testing (no automated test suite)

---

*Generated: January 2026*
*Analysis performed by Claude Code*
