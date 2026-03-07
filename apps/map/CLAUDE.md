# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MapSet** is a production web application for asset planning through an interactive map. It helps site planners show current assets and proposed changes to visualize and contextualize pain points, needs, and wants. Features include click-to-add generator markers with photos, GPS coordinate extraction from EXIF data, AI-powered asset naming via Cloud Functions (Claude Haiku + vision), drawing/annotation tools, generator footprint overlays, per-asset cost analysis, real-time Firestore sync, and multi-site project management.

**Deployed:** <https://openai-mapset-eboss-map.web.app> | Cloud Functions in us-central1
**Active branch:** `devon87warren/REQ-1-multi-site-project-management-create-switch-delete`
**Multi-site status:** Phases 1–5 complete (Firestore rules, Cloud Functions, UI wired). Phase 6–8 remaining (data scoping queries, per-site stats).

## Tech Stack

- **Frontend:** Vanilla HTML5/CSS3/ES6+ (no frameworks), Google Maps JS API (`v=weekly`, `AdvancedMarkerElement`)
- **Firebase CDN SDK:** `10.8.0` (CDN ES modules, not npm — all imports from `https://www.gstatic.com/firebasejs/10.8.0/`)
- **Backend:** Node.js 20 Cloud Functions (`functions/index.js`), `@anthropic-ai/sdk ^0.28.0`
- **Storage:** Firestore real-time sync + Firebase Storage for photos

## File Structure

```
mapset-eboss-map/
├── index.html              # App shell, Google Maps loader, UI structure
├── styles.css              # All styling
├── js/app.js               # All frontend logic (~1660 lines), initApp() entry point
├── functions/
│   ├── index.js            # Cloud Functions (suggestAssetName, siteCreate/Edit/Delete)
│   └── package.json        # Node.js 20, jest test runner
├── firestore.rules         # Firestore security rules (sites + legacy collections)
├── firestore.indexes.json  # Composite indexes (siteId + createdAt/timestamp)
├── storage.rules
├── firebase.json           # Hosting, Functions, Firestore, Storage config
└── map_style.json          # Custom Google Maps styling
```

## Running Locally

```bash
python3 -m http.server 8080     # Recommended dev server at http://localhost:8080
npx http-server -p 8080         # Alternative

# Cloud Functions tests (Jest)
cd functions && npm test
```

App connects to live Firestore (`openai-mapset-eboss-map`) — no local emulator configured by default.

## Deployment

```bash
npx firebase deploy --only hosting,firestore:rules,firestore:indexes
cd functions && npm run deploy   # Cloud Functions only

firebase functions:log           # View backend logs
```

## Architecture: js/app.js

All application state and logic lives in a single `js/app.js` module (~1660 lines). Firebase config is inlined at the top (no separate config file).

### Global State

```javascript
let map;                      // Google Maps instance
let taggedAssets = [];        // All generator objects in memory (source of truth)
let activeInfoWindow = null;  // Currently open marker info window
let selectedProject = '';     // Project filter (empty = all)
let userLocation = null;      // { lat, lng, address }

// Multi-site
let activeSiteId = null;      // Currently active site (null = no site selected)
let allSites = [];            // Cached list of all sites
let unsubscribeAssets = null; // Firestore listener teardown (prevents ghost markers)
let unsubscribeDrawings = null;

// Drawing tools
let drawingMode = false;
let drawnShapes = [];
let AdvancedMarkerElementClass = null;

// Undo delete
let deletedAssetBackup = null;
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `initApp()` | Bootstrap: loads Maps API, geolocation, Firestore listeners, event handlers |
| `getUserMapCenter()` | localStorage → browser geolocation → Abilene, TX fallback |
| `addAsset(lat, lng, photoDataUrl)` | Creates marker + calls AI naming |
| `updateAssetList()` | Re-renders asset list in side panel with project filter and search |
| `updateStats()` | Recalculates kW totals and cost analysis for filtered assets |
| `deleteAsset(assetId)` | Removes from Firestore + map, saves to `deletedAssetBackup` for undo |
| `listenToAssets(callback)` | Sets up `onSnapshot` listener; returns unsubscribe function |
| `enableDrawingMode(toolType)` | Activates polyline/polygon/rectangle/circle/text |
| `buildFootprintPath(...)` | Rotated rectangle polygon using WGS84 projection (meters ↔ lat/lng) |
| `calculateAssetCost(asset)` | Annual fuel cost and EBOSS savings per generator |
| `exportData()` | Downloads all assets as JSON |

Always call `updateAssetList()` + `updateStats()` together when the filter or data changes.

## Firestore Schema

### generators (flat collection, legacy + multi-site)

```javascript
{
  label: "EBOSS-125-000042",  // Display name / asset ID
  kw: 100,                    // Capacity in kW
  lat: 32.4487,
  lng: -99.7331,
  project: "Phase 1",
  siteId: "site-abc123",      // Multi-site scoping field
  widthM: 2.5,
  lengthM: 4.2,
  orientationDeg: 45,
  photoUrl: "https://firebasestorage.googleapis.com/...",
  timestamp: Timestamp,
  createdAt: Timestamp
}
```

> **Note:** Field names are `label`/`kw` (not `name`/`capacity`). Export JSON uses these same field names.

### drawings (flat collection)

```javascript
{
  siteId: "site-abc123",
  type: "polyline" | "polygon" | "rectangle" | "circle" | "text",
  label: "Building A",
  category: "existing" | "proposed",
  color: "#FF0000",
  strokeWeight: 2,
  path: [[lat, lng], ...],    // or bounds/center/radius/position depending on type
  createdAt: Timestamp
}
```

### sites (multi-site collection)

```javascript
{
  name: "Abilene Phase 1",
  address: "...",
  latitude: 32.4487,
  longitude: -99.7331,
  status: "active" | "archived",
  createdAt: Timestamp
}
// Subcollections: /sites/{siteId}/generators and /sites/{siteId}/drawings
// (defined in rules but queries currently use flat collection with siteId filter)
```

## Cloud Functions (functions/index.js)

### `suggestAssetName` (httpsCallable)

**Requires Firebase Auth** — unauthenticated calls return `HttpsError("unauthenticated")`.

Two-pass AI pipeline:

1. **Vision pass** (Claude Haiku vision): extracts asset number, capacity, model from photo
2. **Naming pass** (Claude Haiku text): generates unit ID using `<MODEL>-<SERIAL>` format

Returns `{ success: true, suggestion: "EBOSS-125-000042", kw: 100 }`.

Payload: `{ metadata, fileName, imageBase64, mimeType }` — at least one of `metadata` or `imageBase64` required.

### Site management functions

`siteCreate()`, `siteEdit()`, `siteDelete()` — CRUD for the `/sites` collection. `siteDelete` triggers async hard-delete of subcollections.

### Tests

```bash
cd functions && npm test    # Jest, runs with --runInBand
```

## Critical Patterns

### Firebase CDN imports (not npm)

```javascript
// Always use CDN version 10.8.0
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
```

### Real-time sync with listener cleanup

```javascript
// Store unsubscribe to prevent ghost markers on site switch
unsubscribeAssets = onSnapshot(q, (snapshot) => {
  taggedAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateAssetList();
});

// Call before switching sites
if (unsubscribeAssets) unsubscribeAssets();
```

### Cost inputs — avoid stale closures

Cost params (fuel cost $/gal, consumption gal/hr, hours/year) are stored in `localStorage`, not Firestore. Always read `taggedAssets` inline inside the reduce callback — don't capture it in a closure.

### Drawing mode guard

Drawing mode disables the map click listener that creates markers. Always check `drawingMode` before processing map clicks.

## Multi-Site Implementation (Phases 1–5 done)

- **Firestore rules:** `/sites/{siteId}` + subcollections + legacy flat collections
- **Indexes:** composite `siteId + createdAt` for generators and drawings
- **Cloud Functions:** `siteCreate/Edit/Delete` + async hard-delete trigger
- **UI:** site switcher dropdown, create/manage dialogs, no-site overlay
- **localStorage:** `eboss_active_site_id` persists across sessions
- **Listener cleanup:** `unsubscribeAssets`/`unsubscribeDrawings` called on site switch

**Remaining (Phases 6–8):**

1. Scope `addAsset`/`addDrawing` to include `siteId` field
2. Update queries: `where('siteId', '==', activeSiteId)`
3. Per-site stats/cost analysis

## BrainGrid MCP

`.mcp.json` configured with BrainGrid HTTP server. Tools appear as `mcp__plugin_braingrid_braingrid__*`. First use triggers OAuth flow creating `.braingrid/project.json`.

## Autonomous Agents Plugin

Plugin at `C:/Users/User/.claude/plugins/mapset-agents/` with 4 agents:

| Trigger phrase | Agent | Color |
|---------------|-------|-------|
| "audit the MapSet app" | mapset-design-auditor | cyan |
| "fix the bugs" | mapset-bug-resolver | red |
| "wire the features" | mapset-feature-connector | green |
| "clean up the code" | mapset-code-pruner | yellow |

Recommended order: auditor → bug-resolver → feature-connector → code-pruner → auditor (verify).

## Git Workflow

```bash
git checkout -b devon87warren/REQ-XX-feature-name
git commit -m "feat: description"
git push -u origin devon87warren/REQ-XX-feature-name
```
