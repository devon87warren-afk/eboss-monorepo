# AGENTS.md - ANA EBOSS Site Planner

**⚠️ INTERNAL DOCUMENT - DO NOT PUBLISH PUBLICLY**

This document provides essential information for AI coding agents working on the MapSet EBOSS Map project.

## Project Overview

**ANA EBOSS Site Planner** is a production web application for geotagging and tracking on-site generators at a MapSet site in Abilene, TX. The application provides:

- Interactive Google Map for placing generator markers
- GPS coordinate extraction from photo EXIF data
- AI-powered asset naming using Claude Haiku vision (via Cloud Functions)
- Drawing/annotation tools (polyline, polygon, rectangle, circle, text labels)
- Generator footprint overlays with rotation support
- Per-asset cost analysis with EBOSS savings calculations
- Real-time Firestore synchronization
- Multi-site project management (create, switch, delete sites)
- Mass photo upload with auto GPS extraction

**Live Deployment:** <https://openai-mapset-eboss-map.web.app>  
**Firebase Project:** `openai-mapset-eboss-map`  
**Cloud Functions Region:** `us-central1`

## Technology Stack

### Frontend

- **HTML5/CSS3/ES6+** — Vanilla JavaScript, no frameworks
- **Google Maps JavaScript API** — `v=weekly`, AdvancedMarkerElement, PinElement
- **Firebase SDK** — `10.8.0` via CDN ES modules (NOT npm)
- **exifr** — EXIF/GPS extraction library (CDN)
- **Builder.io** — Visual CMS for UI editing (optional)

### Backend (Cloud Functions)

- **Node.js 20** runtime
- **Firebase Functions v5**
- **Firebase Admin SDK v12**
- **@anthropic-ai/sdk ^0.28.0** — Claude AI integration
- **@google-cloud/secret-manager** — API key management
- **@google-cloud/vertexai** — Gemini Vision alternative

### Infrastructure

- **Firebase Hosting** — Static site hosting
- **Cloud Firestore** — Real-time database
- **Firebase Storage** — Photo storage
- **Google Secret Manager** — API keys and configuration

## Project Structure

```
mapset-eboss-map/
├── index.html                 # Main HTML shell, Google Maps loader, UI structure
├── styles.css                 # All styling (~1600 lines, CSS custom properties)
├── js/
│   ├── app.js                 # All frontend logic (~3500 lines), initApp() entry
│   ├── config.js              # Environment configuration & emulator detection
│   ├── photo-gallery.js       # Photo gallery, lightbox, thumbnail system
│   ├── builder-integration.js # Builder.io visual CMS integration
│   └── builder-components.jsx # React components for Builder.io (optional)
├── css/
│   └── photo-gallery.css      # Photo gallery styles
├── functions/
│   ├── index.js               # Cloud Functions (~1000+ lines)
│   ├── package.json           # Node.js 20 dependencies
│   ├── jest.config.cjs        # Jest test configuration
│   └── __tests__/
│       ├── index.test.js      # Jest test suite (~580 lines)
│       └── firestore.rules.matrix.test.js # Firestore rules matrix tests
├── scripts/
│   ├── kimi-swarm.js          # Multi-agent code generation tool
│   ├── open-builder.js        # Builder.io launch helper
│   └── seed-data.js           # Development data seeding
├── firebase.json              # Firebase Hosting, Functions, Emulators config
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Composite indexes for queries
├── storage.rules              # Firebase Storage rules
├── map_style.json             # Custom Google Maps styling
├── .firebaserc                # Firebase project alias
├── .env.local                 # Environment template
├── package.json               # NPM scripts for dev/build/deploy
├── start-dev.bat              # Windows development launcher
├── start-dev.sh               # Mac/Linux development launcher
├── DEVELOPMENT.md             # Development guide
└── sw.js                      # Service Worker for offline support
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `firebase.json` | Hosting public dir, rewrite rules, Functions source |
| `firestore.rules` | Security rules for sites, generators, drawings collections |
| `firestore.indexes.json` | Composite indexes (siteId + createdAt/timestamp) |
| `storage.rules` | Public read/write for generator-photos path |
| `functions/package.json` | Node.js 20, Functions v5, Jest testing |
| `.firebaserc` | Default project: `openai-mapset-eboss-map` |

## Firestore Schema

### generators (flat collection)

```javascript
{
  label: "EBOSS-125-000042",     // Display name / asset ID
  kw: 100,                        // Capacity in kW
  latitude: 32.4487,
  longitude: -99.7331,
  project: "Phase 1",             // Optional project grouping
  siteId: "site-abc123",          // Multi-site scoping field
  widthM: 2.5,                    // Physical width in meters
  lengthM: 4.2,                   // Physical length in meters
  orientationDeg: 45,             // Rotation angle (0-360)
  photoUrl: "https://firebasestorage.googleapis.com/...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### drawings (flat collection)

```javascript
{
  siteId: "site-abc123",
  type: "polyline" | "polygon" | "rectangle" | "circle" | "text",
  label: "Building A",
  category: "existing" | "proposed",
  color: "#FF0000",
  strokeWeight: 2,
  fillOpacity: 0.2,
  path: [{lat, lng}, ...],        // For polyline/polygon
  bounds: {north, south, east, west}, // For rectangle
  center: {lat, lng},             // For circle
  radius: 100,                    // For circle (meters)
  position: {lat, lng},           // For text
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### sites (multi-site collection)

```javascript
{
  name: "Abilene Phase 1",
  address: "123 Tech Drive, Abilene, TX",
  latitude: 32.4487,
  longitude: -99.7331,
  status: "active" | "archived",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Development Environment

### Quick Start

**Windows:**

```bash
start-dev.bat
```

**Mac/Linux:**

```bash
./start-dev.sh
```

This starts Firebase emulators + HTTP server automatically.

### Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| App | <http://localhost:8080> | Main application |
| App (Firebase) | <http://127.0.0.1:5000> | Via Hosting emulator |
| Emulator UI | <http://127.0.0.1:4000> | Firebase Emulator Suite |

### NPM Scripts

```bash
# Install dependencies
npm run setup

# Start development (emulators + server)
npm run dev

# Start individually
npm run dev:firebase    # Emulators only
npm run dev:server      # HTTP server only
npm run dev:functions   # Functions emulator only
npm run dev:emulators   # Full emulator suite

# Testing
npm test                # Run function tests
npm run test:emulators  # Test with emulators
npm run lint            # Lint frontend JavaScript

# Deployment
npm run deploy          # Deploy all
npm run deploy:hosting  # Deploy hosting only
npm run deploy:functions  # Deploy functions only
npm run deploy:rules    # Deploy Firestore + Storage rules
npm run deploy:indexes  # Deploy Firestore indexes
npm run logs            # View Cloud Functions logs

# Utilities
npm run seed            # Seed sample Firestore data
npm run builder         # Open Builder.io helper
```

### Configuration Loading

Firebase configuration and Google Maps API key are fetched from Secret Manager via the `getAppConfig` Cloud Function:

```javascript
// Uses EBOSSConfig to auto-detect emulator vs production
const _configUrl = EBOSSConfig.configUrl;
```

### Emulator Mode

The app auto-detects localhost and connects to Firebase emulators. Toggle modes:

- **Click indicator** (bottom-left corner)
- **URL param:** `?emulators=false`
- **localStorage:** `localStorage.setItem('eboss_use_emulators', 'false')`

See `DEVELOPMENT.md` for complete guide.

## Build and Test Commands

### Cloud Functions Testing

```bash
cd functions
npm test                    # Run Jest tests (--runInBand)
npm run serve               # Start Functions emulator
npm run deploy              # Deploy to Firebase
```

### Frontend

No build step required — pure static files. Serve with any HTTP server.

### Kimi Swarm (Optional)

```bash
npm run kimi -- "<task description>"   # Run multi-agent code generation
# Requires: KIMI_API_KEY environment variable
```

## Testing Strategy

### Unit Tests (Jest)

Located in `functions/__tests__/index.test.js`:

- Site CRUD operations (`siteCreate`, `siteEdit`, `siteDelete`)
- Hard delete trigger (`hardDeleteArchivedSite`)
- AI asset naming (`suggestAssetName`)
- Validation and error handling

Run with: `cd functions && npm test`

### Manual Testing Checklist

1. Map loads centered on user location (or Abilene, TX fallback)
2. Click on map opens "Add Generator" dialog
3. Photo upload extracts GPS and triggers AI naming
4. Asset appears in side panel with correct stats
5. Cost analysis calculates per-asset and total savings
6. Site switcher creates/switches/deletes sites
7. Drawing tools create annotations saved to Firestore
8. Export downloads valid JSON

## Cloud Functions Reference

| Function | Type | Purpose |
|----------|------|---------|
| `getAppConfig` | HTTP (GET) | Returns Firebase config + Maps API key from Secret Manager |
| `suggestAssetName` | Callable | AI-powered asset naming (requires auth) |
| `siteCreate` | Callable | Create new site document |
| `siteEdit` | Callable | Update existing site |
| `siteDelete` | Callable | Soft-delete site (triggers hard delete) |
| `hardDeleteArchivedSite` | Firestore trigger | Hard-delete subcollections when site archived |
| `analyzeGeneratorPhoto` | HTTP (POST) | Gemini Vision alternative for nameplate reading |
| `health` | HTTP (GET) | Health check endpoint |

## Security Considerations

### API Key Management

- **No hardcoded keys** — All API keys (Google Maps, Anthropic) stored in Google Secret Manager
- Keys fetched at runtime via `getAppConfig` Cloud Function
- CORS-restricted to allowed origins in production

### Firestore Rules (Current)

- **MVP Mode:** Open reads/writes for rapid development
- **Validation:** Drawing writes validated for required fields and types
- **TODO:** Implement auth-based ownership checks (marked as SEC-001 in code)

### Input Sanitization

- All user inputs validated in Cloud Functions
- File uploads: MIME type detection, base64 validation
- EXIF parsing: Bounds checking on binary data

### Secrets in Secret Manager

**🔒 SENSITIVE: Secret details are stored in Google Secret Manager and internal documentation only.**

The following secrets are used by the application:

- Firebase configuration (project config)
- Google Maps API Key  
- Anthropic API keys (primary and alternative)
- Additional API keys for development tools

For access to specific secret IDs and purposes, refer to the internal security vault or contact the project administrator. Never commit secret values or detailed secret configurations to version control.

## Code Style Guidelines

### JavaScript (Frontend)

- **Global state:** camelCase, declared at top of `js/app.js`
- **DOM IDs:** kebab-case (e.g., `#cost-analysis-button`)
- **CSS classes:** kebab-case (e.g., `.asset-details`)
- **Functions:** camelCase, verb-first (e.g., `updateAssetList`, `deleteAsset`)
- **Firestore fields:** camelCase (e.g., `photoUrl`, `widthM`, `siteId`)
- **Constants:** UPPER_SNAKE_CASE for product line data
- **Firebase imports:** CDN URLs ONLY (version 10.8.0)

```javascript
// Correct Firebase import
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Correct function naming
async function addAsset(location, label, kw, photoDataUrl) { ... }
```

### Error Handling Pattern

```javascript
try {
  // Operation
} catch (error) {
  console.error("Descriptive context:", error);
  showStatusMessage('User-friendly error message');
}
```

### CSS Conventions

- CSS custom properties (variables) in `:root`
- BEM-like naming for components
- Z-index scale: panel (10), toggle (11), toolbar (12), dialog (20), toast (30)

### Real-time Sync Pattern

```javascript
// Store unsubscribe to prevent ghost markers on site switch
unsubscribeAssets = onSnapshot(q, (snapshot) => {
  taggedAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateAssetList();
});

// Call before switching sites
if (unsubscribeAssets) unsubscribeAssets();
```

## Deployment Process

### Full Deployment

```bash
# Deploy hosting, Firestore rules, and indexes
npx firebase deploy --only hosting,firestore:rules,firestore:indexes

# Deploy Cloud Functions only
cd functions && npm run deploy

# Or deploy everything
npx firebase deploy
```

### View Logs

```bash
firebase functions:log        # Cloud Functions logs
firebase hosting:channel:list # Preview channels
```

### Pre-deployment Checklist

1. Run `cd functions && npm test` — all tests pass
2. Verify Firestore rules compile: `firebase deploy --only firestore:rules --dry-run`
3. Check indexes are defined in `firestore.indexes.json`
4. Test locally on `localhost:8080`

## Environment Variables

### Required for Local Development

None — Firebase config fetched from Secret Manager via Cloud Function.

### Required for Cloud Functions (set via Firebase CLI)

```bash
firebase functions:config:set anthropic.key="sk-..."
```

### For Kimi Swarm Script

```bash
export KIMI_API_KEY="sk-..."  # Moonshot API key
```

## Browser Compatibility

- Modern browsers supporting ES6+ modules
- Google Maps JavaScript API (AdvancedMarkerElement requires newer browsers)
- FileReader API for image processing
- CSS Grid and Flexbox

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close any open dialog |
| `Ctrl/Cmd + F` | Focus search input |
| `Ctrl/Cmd + S` | Export data as JSON |

## Data Export Format

The "Export Data" button downloads a JSON file with this structure:

```javascript
{
  exportDate: "2024-01-15T10:30:00.000Z",
  totalGenerators: 42,
  totalKw: 4200,
  generators: [
    {
      id: "abc123",
      label: "EBOSS-125-000042",
      kw: 100,
      latitude: 32.4487,
      longitude: -99.7331,
      project: "Phase 1",
      widthM: 2.5,
      lengthM: 4.2,
      orientationDeg: 45,
      siteId: "site-abc123"
    }
  ]
}
```

## ANA EBOSS Product Line Reference

```javascript
const EBOSS_MODELS = [
  { name: 'EBOSS 25', kw: 24, kva: 30 },
  { name: 'EBOSS 70', kw: 56, kva: 70 },
  { name: 'EBOSS 125', kw: 100, kva: 125 },
  { name: 'EBOSS 220', kw: 176, kva: 220 },
  { name: 'BOSS400', kw: 320, kva: 400 }
];
```

Unit IDs follow format: `<MODEL>-<SERIAL>` (e.g., `EBOSS-125-000042`, `BOSS400-000007`)

## Multi-Site Implementation Status

**Completed:**

- Firestore rules for sites + subcollections + legacy collections
- Composite indexes for site-scoped queries
- Cloud Functions: `siteCreate`, `siteEdit`, `siteDelete`, hard-delete trigger
- UI: Site switcher dropdown, create/manage dialogs, no-site overlay
- localStorage persistence: `eboss_active_site_id`
- Listener cleanup on site switch
- All queries scoped to active site

## Builder.io Visual Editing (Optional)

Builder.io integration allows non-developers to visually edit UI components.

### Setup

1. Get API key from <https://builder.io>
2. In browser console: `localStorage.setItem('builder_api_key', 'YOUR_KEY')`
3. Click "Edit in Builder.io" button (appears in development mode)

### Editable Components

| Component | Model Name | Description |
|-----------|------------|-------------|
| Generator Card | `asset-card` | Asset list item design |
| Side Panel Header | `side-panel-header` | Panel header area |
| Stats Badge | `stats-badge` | Statistics display |
| Action Button | `action-button` | Button components |
| Dialog | `dialog` | Modal/popup templates |

### Scripts

```bash
# Open visual editor
npm run builder

# Read setup guide
cat BUILDER_IO_SETUP.md
```

### Custom Components

React components for Builder.io are defined in `js/builder-components.jsx`:

- `GeneratorCard` - Editable asset card
- `SidePanelHeader` - Customizable header
- `StatsBadge` - Configurable statistics
- `ActionButton` - Styled buttons
- `Dialog` - Modal templates

## Contact & Resources

- **Google Maps JS API:** <https://developers.google.com/maps/documentation/javascript>
- **Firebase Documentation:** <https://firebase.google.com/docs>
- **Anthropic API:** <https://docs.anthropic.com/>
- **Claude Code:** See `CLAUDE.md` for detailed conventions
