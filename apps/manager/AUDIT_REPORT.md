# Audit Report: EBOSS-Manager Cleanup Analysis

**Date**: 2026-02-03
**Branch**: `audit-structure-analysis`
**Agents Invoked**: Explorer, Frontend Specialist, Backend Specialist, DevOps Engineer, Test Engineer.

---

## 🚨 Critical Issues (Priority 1)

### 1. Security Vulnerability in `vite.config.ts`
- **Issue**: The `define` block exposes `GEMINI_API_KEY` to the client-side bundle via `process.env`.
- **Location**: `vite.config.ts` lines 14-15.
- **Impact**: Any user can extract the API key from the browser console.
- **Fix**: Move AI processing to a backend proxy or Edge Function. DO NOT expose keys in Vite `define`.

### 2. Duplicate Database Clients
- **Issue**: Both `supabaseClient.ts` (root) and `src/lib/supabase.ts` exist.
- **Status**: `src/lib/supabase.ts` is typed and better structured.
- **Recommendation**: Delete `supabaseClient.ts` (root) and update imports to point to `src/lib/supabase.ts`.

### 3. Missing Development Workflows
- **Issue**: No `.eslintrc`, no `lint` script, no CI/CD workflows.
- **Impact**: Code quality will degrade; bugs will slip into main.
- **Recommendation**: Initialize ESLint and add `.github/workflows/ci.yml`.

---

## 🗑️ Dead Code & Weight (Priority 2)

### 1. The "God Component": `App.tsx`
- **Issue**: File is 484 lines long. Contains:
  - Routing Logic
  - Provider Hell (8 providers nested)
  - **Inline Component Definitions**: `SidebarLink`, `Logo`, `MobileLogo`, `Layout` are defined LOCALLY but `MainLayout` is imported.
- **Dead Code**: The local `const Layout` (lines 336-423) appears to be a duplicate/legacy version of `MainLayout`.

### 2. Unused Files
- `src/lib/design-tokens.ts`: No imported usage found in `src`.
- `supabaseClient.ts`: Legacy duplicate.

---

## 🏗️ Structure Drift (Priority 3)

### 1. Root vs Src
- **Issue**: `App.tsx` is in Root. Standard Vite pattern places it in `src/`.
- **Plan**: Move `App.tsx` -> `src/App.tsx`.

### 2. Missing Directories
- `src/pages`: Does not exist. Pages are scattered or in `components`?
- **Analysis**: Routes point to `components/Dashboard`, `components/Cockpit`.
- **Refactor**: Move page-level components to `src/pages/` to align with `structure.txt`.

---

## 📋 Action Plan (Status: ✅ COMPLETED)

1. [x] **Delete** `supabaseClient.ts` and `src/lib/design-tokens.ts`.
2. [x] **Move** `App.tsx` to `src/`.
3. [x] **Refactor** `App.tsx`:
   - [x] Remove inline `Layout` components.
   - [x] Extract Providers to `src/contexts/ThemeContext.tsx` and `DataProvider.tsx`.
4. [ ] **Setup** ESLint and Prettier (Deferred).
5. [x] **Fix** `vite.config.ts` security issue.
6. [x] **Consolidate** root folders (`components`, `hooks`, `types`) into `src/`.
7. [x] **Fix Imports** in `api.ts`, `ebossData.ts`, `AuthContext.tsx`, `syncService.ts`.
8. [x] **Install Dependencies**: Restored missing node modules (including `framer-motion`).
9. [x] **UI/UX Upgrade**: Applied "Trust & Authority" design system (Slate/Sky palette, Plus Jakarta Sans).
10. [x] **Fix Auth**: Implemented Mock Mode in `AuthContext` to prevent infinite loading when API keys are missing.
11. [x] **Fix Contrast**: Restored legacy `brand`, `dark`, and `navy` color aliases in `tailwind.config.ts` and explicitly linked config in CSS using `@config`. This fixes "White Cards" in `ImportManager`, `TerritoryAnalytics`, and `ExpenseManager`.
12. [x] **Refactor Dashboard**: Transformed Command Center to focus on Sales Support & Commissioning. Removed maintenance tickets and added clickable workflow cards for Analytics, Customers, Expenses, and Travel.
13. [x] **Travel Orchestrator**: Implemented "Gemini Travel Concierge" with proactive D-1/D+1 flight logic, 10-mile hotel rule, and mockup integration for official airline/hotel connectors (Amadeus/Duffel architecture).
14. [x] **Fleet Map Upgrade**: Enhanced `FleetMap` component to show global "open territory" view, dynamic technician locations, and detailed travel paths (dotted lines, mode icons, start/end times). Integrated into Territory Analytics.
15. [x] **Realistic Map**: Replaced abstract map with realistic US States SVG background (Wikimedia) and implemented Mercator projection logic for accurate technician positioning.
16. [x] **Region Coloring**: Implemented custom `StatePaths` SVG component to color-code US regions (West=Red, North=Green, East=Blue, South=Brown) matching the provided Assignments image. Updated FleetMap projection to align with stylized geometry.
17. [x] **Map Polish**: Reverted to realistic high-fidelity map with "Neon Dark Mode" styling. Enhanced border visibility using CSS filters and drop-shadows. Created dynamic contrast with radial gradient backdrops and glowing markers.
18. [x] **Motion Dynamics**: Implemented "Marching Ants" travel line animations associated with travel modes. Added pulsing beacons for technician status and smoothed UI transitions using Framer Motion.
19. [x] **Organic Fluidity**: Engineered dynamic Bezier curves for travel paths with distance-based arc calculations. Added soft gradient trails, floating icon animations, and terminal connection dots to create a "connected 2D world" feel.
20. [x] **Precision Coordinates**: Refactored travel logic to strict Origin/Destination coordinate pairs. Implemented quadratic Bezier interpolation to lock technician position to the travel arc geometry, ensuring visual accuracy for long-distance routes (e.g., LAS -> MIA).
21. [x] **Geospatial Engine**: Deployed `react-leaflet` with CartoDB Dark Matter tiles. Replaced static projection logic with real-world interactive mapping (Pan/Zoom) while maintaining the "Neon/Flux" data visualization layer via custom SVG overlays hooked to the Map Context.
22. [x] **Asset Tracking UI**: Refined map aesthetics for professional legibility (CartoDB Voyager tiles). Replaced decorative neon markers with high-contrast "Pin & Tag" asset markers. Optimized visual hierarchy for clarity in day-to-day operations.
23. [x] **Geodesic Sync**: Resolved map interaction artifacts by migrating travel arcs to Geodesic Polylines (Lat/Lng interpolated). Ensures perfect alignment of travel paths and technician icons during Pan/Zoom operations without rendering lag or drift.
24. [x] **Directional Vectors**: Engineered bearing calculation logic (`Math.atan2`) for travel paths. Technician vehicle icons now dynamically rotate to face their destination, visually reinforcing the direction of travel like navigational arrows.
25. [x] **Travel Itinerary & Calendar**: Implemented interactive `TechScheduleModal` providing a 14-day lookahead for each technician. Clicking a map icon opens this detail view, displaying assigned jobs, flight bookings, and hotel arrangements in a streamlined calendar grid.
26. [x] **Responsive UI Polish**: Optimized the Schedule Modal with independent scrolling regions (`overflow-y-auto`) to ensure content accessibility on smaller viewports without clipping or layout breakage.
