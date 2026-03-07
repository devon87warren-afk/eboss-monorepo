# EBOSS Tech App - Comprehensive Codebase Analysis

## 1. Application Overview

**EBOSS Tech App** is a modern, industrial-focused operational management platform designed for field technicians and logistics coordinators. Built as a Next.js 16+ application with a dark theme optimized for high-visibility operations, it provides real-time fleet tracking, job commissioning workflows, expense reconciliation automation, and intelligent travel optimization.

The application targets **field-level technical workers** who manage power generation equipment (EBOSS hybrid generators) deployments, requiring tools for:
- Fleet monitoring and technician location tracking
- Complex commissioning checklists for equipment installation
- Receipt/expense automation with AI-powered matching
- Travel planning with cost optimization and loyalty program integration

**Primary User Types:**
- Field Technicians (site installation, commissioning, troubleshooting)
- Logistics Coordinators (travel planning, expense management)
- Operations Managers (fleet overview, job monitoring)

---

## 2. Tech Stack

### Core Framework & Runtime
- **Next.js** 16.1.3 (React 19.2.3 / React DOM 19.2.3)
- **TypeScript** 5.x (strict mode enabled)
- **Node.js** with ESNext module resolution

### UI & Styling
- **Tailwind CSS** 4.x (PostCSS v4 integration)
- **Radix UI** (accessible headless components)
  - Dialog, Avatar, Checkbox, Label, Slot, Separator
- **shadcn/ui** (New York style, CSS variables, icon library: Lucide)
- **Lucide React** 0.562.0 (icon library)
- **Framer Motion** 12.28.1 (animations)
- **Class Variance Authority (CVA)** 0.7.1 (component styling patterns)

### Utilities
- **clsx** 2.1.1 (conditional class composition)
- **tailwind-merge** 3.4.0 (Tailwind class conflict resolution)
- **date-fns** 4.1.0 (date manipulation)
- **@d3ts/us-atlas** 1.0.0 (US geographic data for maps)
- **tw-animate-css** 1.4.0 (animation utilities)

### Development Tools
- **ESLint** 9.x (code linting)
- **TypeScript** compiler (strict type checking)

---

## 3. Codebase Structure

### Directory Organization

```
F:\Repos\GitHub\EBOSS_Tech_App/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout wrapper
│   │   ├── page.tsx                   # Dashboard (home page)
│   │   ├── globals.css                # Global theme & styling
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── Sidebar.tsx        # Main navigation sidebar
│   │   │   ├── dashboard/
│   │   │   │   ├── FleetMap.tsx       # Interactive technician map
│   │   │   │   ├── StatsOverview.tsx  # KPI metrics cards
│   │   │   │   ├── ActionCenter.tsx   # Alert/notification stream
│   │   │   │   └── SavingsCalculator.tsx # OPEX/CO2 projections
│   │   │   └── workflows/
│   │   │       ├── CommissioningChecklist.tsx # Job completion workflow
│   │   │       ├── ExpenseCamera.tsx  # Receipt scanning & matching
│   │   │       └── TravelOptimizer.tsx # Flight booking optimization
│   │   ├── expenses/
│   │   │   └── page.tsx               # Expense Auto page
│   │   ├── jobs/
│   │   │   └── page.tsx               # Active Jobs page
│   │   ├── travel/
│   │   │   └── page.tsx               # Travel.AI page
│   │   └── lib/
│   │       └── mock-data.ts           # Hardcoded test data
│   ├── components/
│   │   └── ui/                        # Reusable UI primitives
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       └── sheet.tsx
│   └── lib/
│       └── utils.ts                   # Utility functions (cn() for Tailwind)
├── next.config.ts                     # Next.js configuration (minimal)
├── tsconfig.json                      # TypeScript compiler options
├── components.json                    # shadcn/ui config
├── postcss.config.mjs                 # PostCSS configuration
├── eslint.config.mjs                  # ESLint rules
├── package.json                       # Dependencies & scripts
└── public/                            # Static assets
    └── brand/
        └── logo-icon.png
```

---

## 4. Entry Points & Routing

### Next.js App Router Structure (File-Based Routing)

| Route | File | Component | Purpose |
|-------|------|-----------|---------|
| `/` | `src/app/page.tsx` | Dashboard | Main landing page with fleet map, stats, alerts |
| `/jobs` | `src/app/jobs/page.tsx` | Active Jobs | Commissioning checklist workflow |
| `/expenses` | `src/app/expenses/page.tsx` | Expense Auto | Receipt scanning & reconciliation |
| `/travel` | `src/app/travel/page.tsx` | Travel.AI | Flight booking optimizer |
| `/docs` | (Not implemented) | — | Planned: Documentation |
| `/data` | (Not implemented) | — | Planned: Data analytics |
| `/settings` | (Not implemented) | — | Planned: User settings |

### Root Layout Entry Point

**File:** `src/app/layout.tsx`
- Wraps all pages with global metadata and styling
- Imports custom Inter font from Google Fonts
- Renders persistent Sidebar component
- Dark mode background (slate-950) applied globally
- Flex layout: Sidebar (fixed left) + Main content (flex-1)

### Navigation Structure

**Sidebar Navigation Items** (from `Sidebar.tsx`):

**Operations Section:**
- Cockpit (Dashboard) → `/`
- Active Jobs → `/jobs`
- Expense Auto → `/expenses`
- Travel.AI → `/travel`

**System Section:**
- Docs → `/docs`
- Data → `/data`
- Settings → `/settings`

---

## 5. Domain Model (Data Entities & Types)

### 1. User/Technician Entity

**Purpose:** Represents a field technician in the system

**Key Fields:**
- `name` (string): Full name (e.g., "John Doe")
- `role` (string): Job title (e.g., "Applications Technician", "Field Level 3")
- `location` (string): Current location (e.g., "Las Vegas")
- `status` (string): Availability state ("Available", "On-Site", "Traveling")

**Relationships:**
- Performs multiple Jobs (has_many)
- Associated with Notifications (has_many)

---

### 2. Technician Location Entity

**Purpose:** Real-time geographic position and status of field personnel

**Key Fields:**
- `id` (number): Unique technician ID
- `name` (string): Technician name
- `status` (string): "On-Site" | "Traveling" | "Available"
- `client` (string, optional): Current client/site name
- `task` (string): Current assigned task
- `lat` (number): Latitude coordinate
- `lng` (number): Longitude coordinate
- `flight` (object, optional):
  - `from` (string): Departure airport code
  - `to` (string): Arrival airport code
  - `progress` (number): Flight completion percentage (0-100)

**Relationships:**
- Linked to User entity
- May have active Flight (has_one)

---

### 3. Notification/Alert Entity

**Purpose:** System-generated alerts and action items for the technician

**Key Fields:**
- `id` (number): Unique identifier
- `type` (string): "travel" | "alert" | "expense"
- `title` (string): Brief notification headline
- `desc` (string): Detailed description
- `action` (string): Suggested action (e.g., "Review Itinerary", "Dispatch", "Verify")
- `priority` (string): "high" | "medium" | "critical"
- `icon` (React component): Icon for visual representation

**Examples from Mock Data:**
1. Travel proposal notification
2. Equipment fault alert (critical)
3. Expense receipt matching notification

---

### 4. Job Entity

**Purpose:** Commissioning or installation task at a customer site

**Key Fields:**
- `id` (string): Job identifier (e.g., "4421")
- `equipment` (string): Equipment model (e.g., "EBOSS-104")
- `site` (string): Installation location (e.g., "Reston Data Center")
- `client` (string): Customer name
- `status` (string): "In Progress" | "Completed" | "On Hold"
- `progress` (number): Completion percentage (0-100)

**Checklist Sub-entity:**
Each job contains multiple checklist items:
- `id` (string): Unique item ID
- `label` (string): Task description
- `type` ("check" | "input"): Checkbox or input field
- `completed` (boolean): Whether item is done
- `value` (string, optional): Input data (e.g., voltage reading)

**Related Fields:**
- Safety checks (grounding, mounting, debris)
- Mechanical checks (oil, coolant, fuel)
- Electrical checks (power connections, phase rotation, insulation)
- VFD/control checks (motor data, auto-tune, cooling)
- Battery/BESS checks (BMS communication, fire suppression)

**Relationships:**
- Assigned to Technician (belongs_to)
- Contains multiple ChecklistItems (has_many)

---

### 5. Expense/Receipt Entity

**Purpose:** Financial transactions requiring reconciliation

**Key Fields:**
- `id` (number): Unique identifier
- `type` (string): "receipt" (other types possible)
- `status` (string): "matching" | "matched"
- `amount` (string): Dollar amount (e.g., "45.20")
- `vendor` (string): Business name (e.g., "Chick-fil-A", "Delta Airlines")
- `date` (string): Transaction timestamp
- `matchFound` (boolean): Whether linked to email/context
- `context` (string, optional): Related trip or project (e.g., "Trip to DC")

**Relationships:**
- Belongs to Technician (belongs_to)
- May relate to Trip (has_one, optional)

---

### 6. Trip Entity

**Purpose:** Business travel itinerary and flight booking

**Key Fields:**
- `id` (string): Trip identifier
- `destination` (string): Target city (e.g., "Washington DC")
- `startDate` (date): First day of travel
- `endDate` (date): Last day of travel
- `client` (string): Customer associated with trip
- `selectedFlightOption` (string): ID of chosen flight
- `cost` (number): Total trip cost

**Sub-entity: FlightOption**
- `id` (string): Unique option ID
- `airline` (string): Airline name (e.g., "Delta", "Southwest")
- `price` (number): Flight price in USD
- `perks` (array): List of benefits (e.g., "Upgrade Eligible", "No Change Fees")
- `isPreferred` (boolean): Loyalty program match
- `isDeal` (boolean): Value/discount indicator

**Relationships:**
- Belongs to Technician (belongs_to)
- Contains multiple FlightOptions (has_many)
- References multiple Expenses (has_many)

---

### 7. Dashboard Statistics Entity

**Purpose:** Aggregated KPI metrics for operations overview

**Key Fields:**
- `label` (string): Metric name (e.g., "Fuel Saved (Gal)")
- `value` (string): Current value (e.g., "1,240")
- `change` (string): Percent change (e.g., "+12%")
- `icon` (React component): Visual representation

**Mock Examples:**
- Fuel Saved: 1,240 gallons, +12% change
- CO2 Reduced: 8.5 tons, +5% change
- Silent Hours: 340 hours, +8% change
- Active Jobs: 3, 0% change

---

### 8. Savings/Environmental Impact Entity

**Purpose:** Calculate and project OPEX and environmental benefits of EBOSS hybrid systems

**Key Fields:**
- `runtime` (number): Daily operating hours (1-24)
- `fuelPrice` (number): Diesel cost per gallon ($)
- `days` (number): Project duration (1-90)
- `fuelSaved` (number): Calculated gallons saved
- `costSaved` (number): Calculated dollar savings
- `co2SavedLbs` (number): CO2 reduction in pounds
- `co2SavedTons` (number): CO2 reduction in metric tons
- `treesEquivalent` (number): Tree-planting equivalent

**Calculation Constants:**
- Standard Diesel Generator: 1.5 gal/hr
- EBOSS Hybrid: 0.375 gal/hr (75% reduction)
- CO2 per gallon: 22.4 lbs
- Trees equivalent: 48 lbs CO2/tree/year

---

## 6. User Roles & Permissions

### Inferred Roles (from Sidebar & Components)

| Role | Implied Capabilities | Component Access |
|------|----------------------|-------------------|
| **Field Technician** | View dashboard, accept jobs, complete checklists, scan receipts, book travel | All main pages |
| **Logistics Coordinator** | Manage travel, process expenses, view fleet | `/travel`, `/expenses` |
| **Operations Manager** | Monitor fleet, view all jobs, access analytics | All pages + planned `/data` |

### Navigation Restrictions (Current State)

Currently, **no explicit authentication/authorization** is implemented. The Sidebar shows all menu items regardless of user type. The system uses hardcoded mock data.

**Planned Features** (visible in Sidebar but unimplemented):
- `/docs` - Documentation system
- `/data` - Analytics dashboard
- `/settings` - User preferences

---

## 7. User Workflows

### Workflow 1: Fleet Monitoring & Real-Time Tracking

**Name:** Real-Time Operations Cockpit

**Primary Actor(s):** Operations Manager, Dispatcher

**Trigger:** User navigates to dashboard (default route `/`)

**Preconditions:**
- User is authenticated (not currently enforced)
- Technicians have active GPS location data
- System has live WebSocket or polling connection

**Main Flow:**
1. User loads dashboard home page
2. Left panel displays interactive map with technician pins
3. Map shows:
   - Technician locations (pins with color coding)
   - Status indicators (Orange=On-Site, Blue=Traveling, Gray=Available)
   - Flight paths for traveling technicians (dashed vector lines)
   - Grid overlay and territory zone visualization
4. User clicks technician pin to expand detailed card
5. Card displays:
   - Technician name and status
   - Current client/site
   - Active task
   - In-transit flight info (if applicable)
6. Right panel shows live alert stream with system notifications
7. Bottom strip displays KPI metrics (Fuel Saved, CO2, Silent Hours, Active Jobs)

**Postconditions:**
- Dashboard reflects current fleet state
- User has visibility into technician locations and tasks
- Alerts are visible for immediate action

**Edge Cases:**
- No technicians active: Map shows empty territory
- Technician in flight: Flight vector and progress indicator visible
- Connection loss: Map becomes static until reconnection

---

### Workflow 2: Equipment Commissioning & Job Completion

**Name:** EBOSS Unit Commissioning Checklist

**Primary Actor(s):** Field Technician

**Trigger:** Technician navigates to `/jobs` or receives job assignment

**Preconditions:**
- Technician is on-site at installation location
- Equipment (EBOSS unit) is physically present and installed
- Job record exists in system with associated checklist template

**Main Flow:**
1. Technician loads "Active Jobs" page (`/jobs`)
2. Page displays:
   - Job header with equipment model (e.g., "EBOSS-104")
   - Site location (e.g., "Reston Data Center, Job #4421")
   - Progress bar showing completion percentage
3. Checklist organized into sections:
   - **Safety & Physical:** Mounting, debris clearance, grounding verification
   - **Mechanical:** Oil, coolant, fuel system checks
   - **Electrical:** Power connections, phase rotation, insulation resistance
   - **VFD & Controls:** Motor nameplate, auto-tune, cooling verification
   - **BESS/Hybrid:** BMS communication, fire suppression pressure
4. For checkbox items:
   - Technician clicks checkbox when task complete
   - Item toggles to "checked" visual state
   - Progress percentage auto-updates
5. For input items (e.g., "Starter Battery Voltage"):
   - Technician enters measured value in text field
   - System accepts input (no validation enforced in current version)
6. Technician adds field notes in "Observations" textarea
7. All data stored locally (in React state)
8. Technician clicks "Finalize_Report" button to submit job
9. System uploads report and transitions job to "Completed" state

**Postconditions:**
- All checklist items recorded
- Field notes captured
- Job marked complete in system
- Report sent to backend/database
- Technician receives confirmation

**Error/Edge Considerations:**
- Incomplete checklist: System may warn but allows submission (flexible)
- Network outage: Data currently stored in-memory; loss on page refresh
- Multiple technicians on same job: No conflict detection (not implemented)

---

### Workflow 3: Automated Expense Reconciliation

**Name:** Receipt Scanner & AI Matching

**Primary Actor(s):** Field Technician, Finance Team

**Trigger:** Technician navigates to `/expenses` or receives receipt prompt

**Preconditions:**
- Receipt/invoice physically exists or digital image available
- Corresponding email transaction (from vendor) exists in inbox
- System has AI/ML context-matching service (mocked in current version)

**Main Flow:**
1. Technician loads "Expense Auto" page (`/expenses`)
2. Camera section displays:
   - "Receipt_Scanner_V2" placeholder
   - "Initialize_Camera" button
3. Technician clicks button to activate camera
4. Live camera view shows:
   - Dashed orange border for receipt alignment guides
   - "Align Receipt Edges" prompt (animated)
   - Circular shutter button for capture
5. Technician captures receipt image
6. (In production) Image sent to OCR service to extract:
   - Vendor name
   - Transaction amount
   - Purchase date
7. System searches for matching email context:
   - Looks for vendor in email history (e.g., "Delta Airlines")
   - Matches amount and date
   - Extracts context (trip purpose, project code)
8. Results appear in "Pending Reconciliation" list:
   - **Matching found:** Green checkmark, shows linked context (e.g., "LINKED: Trip to DC"), "Sync" button
   - **Matching in progress:** Amber spinning icon, "SEARCHING_CONTEXT..." label
9. Technician reviews match and clicks "Sync" to confirm
10. Expense record created with receipt image, amount, vendor, and context

**Postconditions:**
- Receipt linked to business purpose
- Expense entered in system
- Finance team can reconcile with receipts
- Technician compliance verified

**Error/Edge Considerations:**
- OCR fails: Manual entry fallback (not shown in current UI)
- No matching email: Flag for manual review
- Ambiguous vendor name: Show multiple match options
- Duplicate receipt: Conflict detection warning

---

### Workflow 4: Intelligent Travel Booking

**Name:** Travel.AI Flight Optimizer

**Primary Actor(s):** Field Technician, Logistics Coordinator

**Trigger:** Travel proposal detected (from calendar or manual creation)

**Preconditions:**
- Customer meeting scheduled for specific dates
- Technician has travel preferences configured (loyalty programs, budget)
- Flight inventory and pricing available (mocked in current version)

**Main Flow:**
1. System detects travel proposal (e.g., "Meeting with Sunbelt Rentals, Feb 12-14")
2. Alert appears in action center: "Trip Proposal: Washington DC"
3. Technician navigates to `/travel` page
4. Page displays trip summary:
   - Destination and dates
   - Associated client
   - Date slider (visual timeline of trip days)
5. System recommends flight options based on:
   - Loyalty program status (airline preference, elite status)
   - Price comparison (value deals highlighted)
   - Route optimization (direct flights preferred)
6. Two example options shown:
   - **Option 1 (Loyalty Choice):** Delta, $450, upgrade eligible, 9x points, preferred seat
   - **Option 2 (Value Deal):** Southwest, $320, no change fees, 2 bags free
7. Technician selects preferred option (orange border, checkmark indicator)
8. Technician reviews perks and benefits
9. Clicks "Confirm & Book ($XXX)" button
10. System books flight and creates trip record
11. Receipt added to expense system automatically
12. Calendar updated with flight times
13. Confirmation sent to technician and logistics team

**Postconditions:**
- Flight booked and confirmed
- Travel itinerary created
- Expense recorded
- Technician notified
- Logistics team has visibility into schedule

**Edge Considerations:**
- No preferred airline: Show balanced options
- Budget override: Technician can force selection
- Sold out flights: Recommend alternatives
- Last-minute changes: Rebooking with cancellation analysis

---

### Workflow 5: Environmental Impact Projection

**Name:** OPEX & Carbon Savings Calculator

**Primary Actor(s):** Sales Engineer, Customer, Operations Manager

**Trigger:** User views dashboard or accesses impact metrics

**Preconditions:**
- EBOSS unit specifications loaded
- Operational parameters (runtime, fuel cost, duration) available
- Environmental conversion factors configured

**Main Flow:**
1. Component renders savings calculator on dashboard or proposal page
2. Displays default scenario:
   - Daily Runtime: 24 hours
   - Fuel Price: $4.50/gallon
   - Project Duration: 30 days
3. System auto-calculates:
   - **Standard Diesel Fuel Used:** 24h × 30d × 1.5 gal/hr = 1,080 gallons
   - **EBOSS Hybrid Fuel Used:** 24h × 30d × 0.375 gal/hr = 270 gallons
   - **Fuel Saved:** 810 gallons
   - **Cost Saved:** 810 gal × $4.50 = $3,645
   - **CO2 Eliminated:** 810 gal × 22.4 lbs/gal ÷ 2000 = 9.07 tons
   - **Tree Equivalent:** 810 lbs ÷ 48 lbs/tree = ~16.9 trees
4. User adjusts sliders:
   - **Daily Runtime:** 1-24 hours (impacts fuel burn rate)
   - **Project Duration:** 1-90 days (expands timeline)
5. Calculations update in real-time
6. Comparison bar shows visual ratio:
   - Gray bar = standard diesel consumption
   - Green bar = EBOSS hybrid (25% of gray) with glow effect
7. Header displays:
   - Status badge: "LTO_ACTIVE" (Long-Term Operations)

**Postconditions:**
- Customer sees projected ROI and environmental benefit
- Sales team can quantify value proposition
- Operations can justify capital investment

**Validation:**
- Uses EPA standard: 22.4 lbs CO2 per gallon diesel
- Tree equivalence: 48 lbs CO2/tree/year (industry standard)
- Fuel burn rates: Based on EBOSS system specifications

---

## 8. System Constraints & Invariants

### Business Rules (Enforced in Code)

1. **Job Completion Progress:**
   - Progress % = (completed items ÷ total checklist items) × 100
   - Progress updates only when items marked complete
   - No manual override of progress percentage

2. **Fuel Savings Calculation:**
   - Standard generator: 1.5 gal/hr (constant)
   - EBOSS hybrid: 0.375 gal/hr (75% reduction, non-configurable)
   - Always calculated as: `totalStandardFuel - totalHybridFuel`
   - CO2 per gallon: 22.4 lbs (EPA standard, immutable)

3. **Technician Status Values:**
   - Allowed states: "On-Site", "Traveling", "Available"
   - Status determines map pin color (Orange, Blue, Gray)
   - Flight info only visible when status = "Traveling"

4. **Notification Priority Levels:**
   - Allowed: "critical", "high", "medium"
   - Critical = Red border + CRIT badge + extra visual emphasis
   - Priority determines action urgency

5. **Expense Matching States:**
   - "matching" = OCR complete, searching for context
   - "matched" = Email context found, ready for sync
   - Unmatched receipts cannot be synced to finance

6. **Trip Date Constraints:**
   - End date must be >= start date
   - Date slider prevents invalid ranges
   - Flight times must fall within trip window

### Architectural Constraints

1. **State Management:**
   - Uses React local state (`useState`) only
   - No centralized store (Redux, Zustand, etc.)
   - Data lost on page refresh
   - No persistence to backend

2. **Type Safety:**
   - Strict TypeScript mode enforced
   - All components have explicit prop types
   - React 19 React Server Components supported but not utilized

3. **UI Framework:**
   - Tailwind CSS only (no inline styles)
   - 2px border radius minimum (industrial aesthetic)
   - Dark theme always active (no light mode toggle)
   - All modals/dialogs use Radix UI primitives

4. **Performance:**
   - Images optimized via Next.js Image component
   - Framer Motion animations use GPU acceleration
   - Lucide React SVG icons (tree-shakeable)

### Data Validation

**Currently Not Enforced:**
- No schema validation on expense amounts
- No format validation on voltage/measurement inputs
- No duplicate detection for receipts
- No date format validation
- No email format checks

**Should Be Implemented:**
- Checklist completion warnings (incomplete items on submit)
- Date range validation (trip start < end)
- Numeric range validation (runtime 1-24, duration 1-90)
- Required field enforcement

---

## 9. Component Architecture

### Component Hierarchy & Relationships

```
RootLayout (src/app/layout.tsx)
├── Sidebar (always visible)
└── Main Content Area
    ├── Dashboard (page.tsx)
    │   ├── FleetMap
    │   │   ├── TechLocation pins (interactive)
    │   │   └── TechCard popup (detail view)
    │   ├── StatsOverview
    │   │   └── 4x Stat Cards with animated entrance
    │   ├── ActionCenter
    │   │   └── Alert/Notification Cards (staggered animation)
    │   └── SavingsCalculator
    │       ├── Impact Metrics (OPEX, CO2)
    │       ├── Runtime/Duration Sliders
    │       └── Fuel Comparison Bar
    │
    ├── Jobs Page (jobs/page.tsx)
    │   └── CommissioningChecklist
    │       ├── Job Header with Progress
    │       ├── Checklist Items
    │       │   ├── Checkbox Items
    │       │   └── Input Items
    │       ├── Observations Textarea
    │       └── Finalize Button
    │
    ├── Expenses Page (expenses/page.tsx)
    │   └── ExpenseCamera
    │       ├── Camera View (placeholder)
    │       └── Pending Expenses List
    │           └── Expense Items with match status
    │
    └── Travel Page (travel/page.tsx)
        └── TravelOptimizer
            ├── Trip Header
            ├── Date Slider
            ├── Flight Options (cards)
            │   └── Selectable option buttons
            └── Book Confirmation Button
```

### UI Component Library

**Location:** `src/components/ui/` (shadcn/ui based)

All components use Radix UI headless primitives with Tailwind styling:
- **Card:** Container with header, title, description, action, content, footer
- **Button:** Styled button with variants (default, destructive, outline, secondary, ghost, link) and sizes
- **Avatar:** User image display with fallback
- **Badge:** Keyword/status label
- **Checkbox:** Accessible checkbox input
- **Dialog:** Modal dialog wrapper
- **Input:** Text input field
- **Label:** Form label
- **Separator:** Horizontal divider line
- **Sheet:** Side drawer/panel

### Styling Approach

**Design System:**
- **Color Palette:** OKLCH color space (perceptual uniformity)
- **Dark Theme:** Slate 950 background, white foreground
- **Accent Color:** ANA Orange (#F05A28, high-visibility safety standard)
- **Industrial Aesthetic:** 2px radius, sharp edges, technical fonts
- **Typography:** Inter (body), mono fonts for system labels

**Tailwind Configuration:**
- CSS variables enabled for theming
- Custom `@theme` block in `globals.css`
- Sidebar color variables defined in `:root` and `.dark` selector
- Grid animations via `tw-animate-css` plugin

---

## 10. Current Limitations & TODOs

### Not Implemented (Planned Features)

1. **Backend Integration:**
   - No API endpoints defined
   - No database persistence
   - All data is hardcoded mocks
   - No authentication/authorization system

2. **Real-Time Features:**
   - No WebSocket connection for live updates
   - Fleet map data is static
   - No push notifications
   - Polling infrastructure absent

3. **Advanced Features:**
   - Camera/OCR integration (Receipt Scanner is UI-only mockup)
   - Flight booking integration (no real booking engine)
   - Email context matching (fully mocked)
   - AI recommendation system (hardcoded options)

4. **Navigation Pages:**
   - `/docs` - Documentation system
   - `/data` - Analytics dashboard
   - `/settings` - User preferences

5. **Error Handling:**
   - No error boundaries
   - No fallback UI for failures
   - No loading states during operations
   - No toast/alert notifications

6. **Accessibility:**
   - No ARIA labels on custom controls
   - Map pins not keyboard navigable
   - Some color-only indicators (need labels)

7. **Testing:**
   - No unit tests
   - No integration tests
   - No E2E test suite

---

## 11. File Inventory & Key Locations

### Configuration Files
- `tsconfig.json` - TypeScript settings (strict mode, path aliases @/*)
- `next.config.ts` - Next.js config (minimal, no custom plugins)
- `components.json` - shadcn/ui configuration
- `postcss.config.mjs` - PostCSS/Tailwind setup
- `eslint.config.mjs` - Linting rules
- `.gitignore` - Git exclusions (node_modules, .next, etc.)

### Source Files by Category

**Pages (Route Handlers):**
- `src/app/page.tsx` (Dashboard)
- `src/app/jobs/page.tsx` (Active Jobs)
- `src/app/expenses/page.tsx` (Expense Auto)
- `src/app/travel/page.tsx` (Travel.AI)

**Dashboard Components:**
- `src/app/components/dashboard/FleetMap.tsx` (Interactive map)
- `src/app/components/dashboard/StatsOverview.tsx` (KPI cards)
- `src/app/components/dashboard/ActionCenter.tsx` (Alerts)
- `src/app/components/dashboard/SavingsCalculator.tsx` (ROI projections)

**Workflow Components:**
- `src/app/components/workflows/CommissioningChecklist.tsx` (Job completion)
- `src/app/components/workflows/ExpenseCamera.tsx` (Receipt scanning)
- `src/app/components/workflows/TravelOptimizer.tsx` (Flight booking)

**Navigation:**
- `src/app/components/ui/Sidebar.tsx` (Main navigation)

**Mock Data:**
- `src/app/lib/mock-data.ts` (Hardcoded test data)

**UI Primitives (10 components):**
- All located in `src/components/ui/`

**Utilities:**
- `src/lib/utils.ts` (Class merging utility)

**Styling:**
- `src/app/globals.css` (Theme + industrial aesthetic)

---

## 12. Summary & Key Insights

### Strengths
1. **Modern Tech Stack:** Next.js 16, React 19, latest Tailwind CSS 4
2. **Type Safety:** Full TypeScript strict mode implementation
3. **Accessibility Foundation:** Radix UI primitives for keyboard/screen reader support
4. **Visual Polish:** Framer Motion animations, professional industrial design
5. **Component Reusability:** Well-organized shadcn/ui library
6. **Clear Navigation:** Intuitive sidebar menu with collapsible mobile support

### Current State
- **Stage:** Early MVP/Prototype
- **Data:** 100% mocked (no backend)
- **User Auth:** Not implemented
- **Persistence:** Client-side state only (lost on refresh)
- **Real-Time:** Not implemented

### Next Steps for Production
1. Implement backend API (REST/GraphQL endpoints)
2. Add database layer (PostgreSQL, MongoDB, etc.)
3. Integrate authentication (OAuth, JWT tokens)
4. Connect real GPS tracking for fleet map
5. Implement actual camera/OCR for expense scanning
6. Add WebSocket for real-time notifications
7. Build `/docs`, `/data`, and `/settings` pages
8. Comprehensive error handling and loading states
9. Unit and E2E test suite
10. User role-based access control (RBAC)

---

*Generated: January 2026*
*Analysis performed by Claude Code*
