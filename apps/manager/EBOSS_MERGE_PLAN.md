# EBOSS Projects Comparison & Merge Plan

## Executive Summary

This document compares **EBOSS_Tech_App** and **EBOSS-Manager** codebases and provides a detailed plan to merge them into a unified platform.

**Recommendation:** Use **EBOSS-Manager** as the base and port unique features from **EBOSS_Tech_App**.

---

## Part 1: Side-by-Side Comparison

### 1.1 Tech Stack Comparison

| Aspect | EBOSS_Tech_App | EBOSS-Manager | Winner |
|--------|----------------|---------------|--------|
| **Framework** | Next.js 16.1.3 | Vite 6.2.0 | Tie (both modern) |
| **React** | 19.2.3 | 19.2.3 | Same |
| **TypeScript** | 5.x (strict) | 5.8.2 (strict) | Same |
| **Styling** | Tailwind CSS 4.x | Tailwind CSS 4.1.18 | Same |
| **UI Components** | Radix + shadcn/ui | Radix UI | Tech_App (more polished) |
| **Animations** | Framer Motion 12.28.1 | None | Tech_App |
| **Icons** | Lucide React | Lucide React | Same |
| **Routing** | Next.js App Router | React Router 7.12 | Manager (more flexible) |
| **Backend** | None (mocked) | Supabase (PostgreSQL) | **Manager** |
| **Auth** | None | Supabase Auth + RBAC | **Manager** |
| **Data Fetching** | None | React Query 5.90.16 | **Manager** |
| **Forms** | None | React Hook Form + Zod | **Manager** |
| **Charting** | None | Recharts 3.6.0 | **Manager** |
| **Search** | None | Fuse.js 7.1.0 | **Manager** |
| **External APIs** | None | Salesforce, Outlook, iMonnit, Gemini | **Manager** |

### 1.2 Feature Comparison

| Feature | EBOSS_Tech_App | EBOSS-Manager | Notes |
|---------|----------------|---------------|-------|
| **Fleet Map** | ✅ Interactive map with flight paths | ❌ | Port to Manager |
| **Technician Tracking** | ✅ Real-time pins on map | ❌ | Port to Manager |
| **Savings Calculator** | ✅ OPEX/CO2 projections | ❌ | Port to Manager |
| **Travel Optimizer** | ✅ Flight booking with loyalty | ❌ | Port to Manager |
| **Expense Camera** | ✅ Receipt scanning UI | ✅ AI-powered expense | Merge (Manager has backend) |
| **Commissioning Checklist** | ✅ Job completion workflow | ✅ PM Checklist | Merge (combine features) |
| **Unit Management** | ✅ Basic (mocked) | ✅ Full CRUD + telemetry | **Manager** |
| **Service Tickets** | ❌ | ✅ Full workflow | **Manager** |
| **Customer CRM** | ❌ | ✅ Salesforce sync | **Manager** |
| **Territory Management** | ❌ | ✅ Full RBAC | **Manager** |
| **Analytics Dashboard** | ❌ | ✅ Territory analytics | **Manager** |
| **User Authentication** | ❌ | ✅ Full auth flow | **Manager** |
| **Audit Logging** | ❌ | ✅ Complete trail | **Manager** |
| **Multi-system Sync** | ❌ | ✅ Outlook, SF, iMonnit | **Manager** |
| **Dark Mode** | ✅ Always dark | ✅ Toggle | Same |
| **Mobile Responsive** | ✅ | ✅ | Same |

### 1.3 Architecture Comparison

| Aspect | EBOSS_Tech_App | EBOSS-Manager |
|--------|----------------|---------------|
| **Data Layer** | Mock data only | Supabase + fallback mocks |
| **State Management** | React useState | Context + React Query |
| **Persistence** | None (lost on refresh) | PostgreSQL + local storage |
| **API Pattern** | None | Service layer + hooks |
| **Component Pattern** | Flat structure | Domain-organized folders |
| **Error Handling** | None | Try/catch + toast |
| **Loading States** | None | React Query managed |

### 1.4 Design System Comparison

| Aspect | EBOSS_Tech_App | EBOSS-Manager |
|--------|----------------|---------------|
| **Primary Color** | ANA Orange (#F05A28) | ANA Red (#e31b23) |
| **Accent Color** | Orange tints | ANA Green (#8dc63f) |
| **Theme** | Industrial/Technical | Corporate/Professional |
| **Typography** | Inter + Mono | System fonts |
| **Border Radius** | 2px (sharp) | 4-8px (rounded) |
| **Animations** | Framer Motion | None |
| **Density** | Fixed | Configurable |

---

## Part 2: Merge Strategy

### 2.1 Recommended Approach

**Base Platform:** EBOSS-Manager
**Reason:** Has production-ready backend, authentication, RBAC, and enterprise integrations.

**Port From Tech_App:**
1. FleetMap component (with real-time tracking)
2. SavingsCalculator component
3. TravelOptimizer component
4. Industrial design aesthetic
5. Framer Motion animations
6. Enhanced visual polish

### 2.2 Merge Phases

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Create Unified Repository
```bash
# Option A: Extend Manager
cd F:\Repos\GitHub\EBOSS-Manager
git checkout -b feature/unified-platform

# Option B: New repository
mkdir EBOSS-Unified
cd EBOSS-Unified
git init
```

### 1.2 Install Missing Dependencies
```bash
# Add Framer Motion for animations
npm install framer-motion

# Add @d3ts/us-atlas for fleet map
npm install @d3ts/us-atlas

# Ensure shadcn/ui compatible setup
npx shadcn@latest init
```

### 1.3 Configure Path Aliases
Update `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    '@dashboard': path.resolve(__dirname, './src/components/dashboard'),
    '@workflows': path.resolve(__dirname, './src/components/workflows'),
  },
}
```

---

## Phase 2: Component Migration (Week 2)

### 2.1 Create Dashboard Components Folder
```
src/components/dashboard/
├── FleetMap.tsx          # Port from Tech_App
├── StatsOverview.tsx     # Port from Tech_App
├── ActionCenter.tsx      # Port from Tech_App (merge with notifications)
└── SavingsCalculator.tsx # Port from Tech_App
```

### 2.2 Port FleetMap Component

**Source:** `EBOSS_Tech_App/src/app/components/dashboard/FleetMap.tsx`

**Modifications Required:**
1. Replace mock technician data with Supabase users + location tracking
2. Add real-time subscription for location updates
3. Integrate with existing UserProfile entity
4. Add territory-based filtering

**New Data Requirements:**
```typescript
// Add to types.ts
interface TechnicianLocation {
  userId: string;
  name: string;
  status: 'On-Site' | 'Traveling' | 'Available';
  lat: number;
  lng: number;
  currentClient?: string;
  currentTask?: string;
  lastUpdated: Date;
  flight?: {
    from: string;
    to: string;
    progress: number;
  };
}
```

**Database Migration:**
```sql
-- Add technician_locations table
CREATE TABLE technician_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'Available',
  current_client VARCHAR(255),
  current_task TEXT,
  flight_from VARCHAR(10),
  flight_to VARCHAR(10),
  flight_progress INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Port SavingsCalculator Component

**Source:** `EBOSS_Tech_App/src/app/components/dashboard/SavingsCalculator.tsx`

**Modifications Required:**
1. Connect to Unit entity for actual runtime data
2. Add project selection dropdown
3. Store calculations in database for reporting
4. Add export functionality

**Integration Points:**
- Link to specific Unit by serialNumber
- Use actual runtimeHours from telemetry
- Store projections in new `savings_projections` table

### 2.4 Port TravelOptimizer Component

**Source:** `EBOSS_Tech_App/src/app/components/workflows/TravelOptimizer.tsx`

**Modifications Required:**
1. Integrate with Expense entity for cost tracking
2. Link to CustomerInteraction for trip purpose
3. Add flight booking API integration (placeholder → real API)
4. Connect to calendar sync via outlookService

**New Data Requirements:**
```typescript
// Add to types.ts
interface TripProposal {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  clientId?: string;
  purpose: string;
  flightOptions: FlightOption[];
  selectedOptionId?: string;
  status: 'proposed' | 'booked' | 'completed' | 'cancelled';
  totalCost?: number;
  createdAt: Date;
}

interface FlightOption {
  id: string;
  airline: string;
  price: number;
  departureTime: Date;
  arrivalTime: Date;
  perks: string[];
  isPreferred: boolean;
  isDeal: boolean;
}
```

### 2.5 Enhance Commissioning Checklist

**Merge Strategy:** Combine Tech_App's CommissioningChecklist with Manager's PMChecklistForm

**Final Component Features:**
- Safety & Physical checks (from Tech_App)
- Mechanical checks (merged)
- Electrical checks (merged)
- VFD & Controls (from Tech_App)
- BESS/Hybrid checks (from Tech_App)
- Photo capture (from Manager)
- Signature capture (new)
- Offline support (new)
- Progress auto-save (from Manager)

---

## Phase 3: Design System Unification (Week 3)

### 3.1 Color Palette Decision

**Recommendation:** Use Tech_App's industrial orange as accent, Manager's red for alerts

```css
:root {
  /* Primary Actions */
  --color-primary: #F05A28;     /* ANA Orange from Tech_App */
  --color-primary-hover: #d94f22;

  /* Status Colors */
  --color-success: #8dc63f;     /* ANA Green from Manager */
  --color-warning: #f59e0b;
  --color-error: #e31b23;       /* ANA Red from Manager */
  --color-info: #3b82f6;

  /* Dark Theme */
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-bg-card: #262626;
  --color-border: #404040;
  --color-text: #ffffff;
  --color-text-muted: #9ca3af;
}
```

### 3.2 Animation System

Add Framer Motion configurations:
```typescript
// src/lib/animations.ts
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

### 3.3 Component Styling Updates

Update shadcn/ui components with industrial aesthetic:
- Reduce border radius: `rounded-sm` (2px)
- Add subtle borders: `border border-border`
- Use mono fonts for data: `font-mono`
- Add hover glow effects on interactive elements

---

## Phase 4: Route Integration (Week 4)

### 4.1 Updated Route Structure

```typescript
// App.tsx updated routes
<Routes>
  {/* Auth */}
  <Route path="/login" element={<LoginPage />} />

  {/* Dashboard (enhanced) */}
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

  {/* Operations (from Tech_App) */}
  <Route path="/cockpit" element={<ProtectedRoute><Cockpit /></ProtectedRoute>} />
  <Route path="/travel" element={<ProtectedRoute><TravelOptimizer /></ProtectedRoute>} />

  {/* Units (enhanced) */}
  <Route path="/units" element={<ProtectedRoute><UnitList /></ProtectedRoute>} />
  <Route path="/units/:serialNumber" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
  <Route path="/units/:serialNumber/commission" element={<ProtectedRoute><CommissioningChecklist /></ProtectedRoute>} />

  {/* Existing Manager routes */}
  <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
  <Route path="/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
  <Route path="/expenses" element={<ProtectedRoute><ExpenseManager /></ProtectedRoute>} />
  <Route path="/analytics" element={<ProtectedRoute><TerritoryAnalytics /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
</Routes>
```

### 4.2 Navigation Update

Merge sidebar items:
```typescript
const navigationItems = [
  // Operations (Tech_App style)
  { label: 'Cockpit', path: '/cockpit', icon: Gauge },
  { label: 'Fleet Map', path: '/', icon: Map },
  { label: 'Active Jobs', path: '/tickets', icon: ClipboardList },
  { label: 'Expense Auto', path: '/expenses', icon: Receipt },
  { label: 'Travel.AI', path: '/travel', icon: Plane },

  // Management (Manager style)
  { label: 'Units', path: '/units', icon: Cpu },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },

  // System
  { label: 'Resources', path: '/resources', icon: BookOpen },
  { label: 'Settings', path: '/settings', icon: Settings },
];
```

---

## Phase 5: Data Layer Integration (Week 5)

### 5.1 New Database Tables

```sql
-- Trip proposals for travel optimizer
CREATE TABLE trip_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  client_id UUID REFERENCES customers(id),
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'proposed',
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flight options for trip proposals
CREATE TABLE flight_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trip_proposals(id) ON DELETE CASCADE,
  airline VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  perks JSONB DEFAULT '[]',
  is_preferred BOOLEAN DEFAULT false,
  is_deal BOOLEAN DEFAULT false,
  is_selected BOOLEAN DEFAULT false
);

-- Savings projections
CREATE TABLE savings_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_serial_number VARCHAR(50) REFERENCES units(serial_number),
  runtime_hours INTEGER NOT NULL,
  fuel_price DECIMAL(5, 2) NOT NULL,
  project_days INTEGER NOT NULL,
  fuel_saved DECIMAL(10, 2),
  cost_saved DECIMAL(10, 2),
  co2_saved_tons DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Technician locations for fleet map
CREATE TABLE technician_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'Available',
  current_client VARCHAR(255),
  current_task TEXT,
  flight_from VARCHAR(10),
  flight_to VARCHAR(10),
  flight_progress INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 React Query Hooks

```typescript
// hooks/queries/useTechnicianLocations.ts
export const useTechnicianLocations = (territoryId?: string) => {
  return useQuery({
    queryKey: ['technician-locations', territoryId],
    queryFn: () => fetchTechnicianLocations(territoryId),
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

// hooks/queries/useTripProposals.ts
export const useTripProposals = (userId?: string) => {
  return useQuery({
    queryKey: ['trip-proposals', userId],
    queryFn: () => fetchTripProposals(userId),
  });
};

// hooks/mutations/useCreateTripProposal.ts
export const useCreateTripProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTripProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-proposals'] });
    },
  });
};
```

---

## Phase 6: Testing & QA (Week 6)

### 6.1 Test Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Auth flows | 90% | High |
| CRUD operations | 85% | High |
| Fleet Map rendering | 80% | Medium |
| Travel Optimizer flow | 80% | Medium |
| Savings Calculator | 90% | Medium |
| Responsive design | 100% | High |

### 6.2 E2E Test Scenarios

1. Login → View Fleet Map → Click technician → View details
2. Create ticket → Assign → Update status → Resolve
3. Upload receipt → AI detection → Approve expense
4. Create trip proposal → Select flight → Book
5. View unit → Run savings projection → Export

### 6.3 Performance Benchmarks

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Fleet Map render (50 pins) | < 500ms |
| API response (cached) | < 100ms |
| API response (uncached) | < 500ms |

---

## Phase 7: Deployment & Migration (Week 7)

### 7.1 Environment Setup

```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=2.0.0-unified
VITE_ENABLE_FLEET_MAP=true
VITE_ENABLE_TRAVEL_AI=true
VITE_ENABLE_SAVINGS_CALC=true
```

### 7.2 Feature Flags

```typescript
// lib/featureFlags.ts
export const features = {
  fleetMap: import.meta.env.VITE_ENABLE_FLEET_MAP === 'true',
  travelAI: import.meta.env.VITE_ENABLE_TRAVEL_AI === 'true',
  savingsCalc: import.meta.env.VITE_ENABLE_SAVINGS_CALC === 'true',
  frameworkAnimations: true,
};
```

### 7.3 Rollout Plan

1. **Week 7:** Internal testing with feature flags off
2. **Week 8:** Enable fleet map for manager role only
3. **Week 9:** Enable all features for internal users
4. **Week 10:** Gradual rollout to 25% of users
5. **Week 11:** Full rollout

---

## Part 3: Risk Assessment

### High Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fleet map performance with many pins | High | Implement clustering, virtualization |
| Travel API rate limits | Medium | Cache results, implement queue |
| Supabase connection failures | High | Mock data fallback (already exists) |
| Design inconsistencies | Medium | Design system documentation |

### Technical Debt to Address

1. Add comprehensive error boundaries
2. Implement proper loading skeletons
3. Add offline support for commissioning
4. Improve mobile navigation
5. Add comprehensive logging

---

## Part 4: Success Metrics

### KPIs for Merged Platform

| Metric | Current (Manager) | Target |
|--------|-------------------|--------|
| Page load time | 2.5s | < 1.5s |
| User session duration | 8 min | 15 min |
| Feature adoption (new) | N/A | 60% in 30 days |
| Support tickets | 12/week | 8/week |
| User satisfaction | 3.8/5 | 4.5/5 |

---

## Appendix A: File Migration Checklist

### From EBOSS_Tech_App → EBOSS-Manager

| Source File | Target Location | Status |
|-------------|-----------------|--------|
| `components/dashboard/FleetMap.tsx` | `src/components/dashboard/FleetMap.tsx` | Pending |
| `components/dashboard/StatsOverview.tsx` | `src/components/dashboard/StatsOverview.tsx` | Pending |
| `components/dashboard/ActionCenter.tsx` | Merge with NotificationContext | Pending |
| `components/dashboard/SavingsCalculator.tsx` | `src/components/dashboard/SavingsCalculator.tsx` | Pending |
| `components/workflows/TravelOptimizer.tsx` | `src/components/workflows/TravelOptimizer.tsx` | Pending |
| `components/workflows/CommissioningChecklist.tsx` | Merge with PMChecklistForm | Pending |
| `components/ui/Sidebar.tsx` | Merge with Layout/Sidebar | Pending |
| `globals.css` (theme variables) | Merge with existing styles | Pending |
| `lib/mock-data.ts` (technician locations) | Add to mockData.ts | Pending |

---

## Appendix B: API Contracts for New Features

### Technician Location API

```typescript
// GET /api/technician-locations?territoryId={id}
interface TechnicianLocationResponse {
  data: TechnicianLocation[];
  meta: {
    total: number;
    lastUpdated: string;
  };
}

// PUT /api/technician-locations/{userId}
interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  status?: 'On-Site' | 'Traveling' | 'Available';
  currentClient?: string;
  currentTask?: string;
}
```

### Trip Proposal API

```typescript
// POST /api/trip-proposals
interface CreateTripProposalRequest {
  destination: string;
  startDate: string;
  endDate: string;
  clientId?: string;
  purpose?: string;
}

// POST /api/trip-proposals/{id}/book
interface BookTripRequest {
  flightOptionId: string;
}
```

---

*Document Version: 1.0*
*Created: January 2026*
*Author: Claude Code Analysis*
