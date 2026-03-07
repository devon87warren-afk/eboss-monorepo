# PLAN: Unified Operations Hub

## 🎯 Goal
Consolidate `TerritoryAnalytics` and `EnergyBossCommand` into a single, high-performance "Operations Hub" that toggles between Strategic and Operational contexts using the `FleetMap` as the core visual anchor.

---

## 🏗️ Phase 1: Contextual State Management
- [ ] Create `useOperationsContext` to track current "Perspective" (Strategic vs. Operational).
- [ ] Component: `PerspectiveToggle` - A sleek, floating switch at the top center of the screen.

## 🗺️ Phase 2: Map-Centric Refactor
- [ ] Upgrade `FleetMap` to support "Strategic Overlays":
    - [ ] State-based Heatmap layer (based on customer density).
    - [ ] Dynamic Legend that switches based on context.
- [ ] Enhance "Asset Markers" to show "Activity Pulse" (glowing rings) only in Operational mode.

## 📊 Phase 3: Adaptive Sidebars (The "Cockpit")
- [ ] **Left Side**: Metric Shelf.
    - *Strategic Mode*: Shows Growth Trends & Category Pie Charts.
    - *Operational Mode*: Shows Quick Actions & Ticket Priority Stats.
    - *Transition*: Smooth cross-fade using Framer Motion.
- [ ] **Right Side**: Interaction Shelf.
    - *Strategic Mode*: Territory Table (Rankings).
    - *Operational Mode*: Live Activity Feed & Team Status.

## ⚡ Phase 4: Real-time & Performance
- [ ] Integrate Supabase Real-time for Activity Feed.
- [ ] Implement Framer Motion transitions for sidebar "morphing" between modes.

---

## 🛠️ Agent Assignments
- `frontend-specialist`: Contextual UI & Map Layers.
- `backend-specialist`: Unified API for both trends and real-time events.
- `performance-optimizer`: Ensuring the map doesn't lag with multiple SVG/Leaflet layers.
