# ANA EBOSS Site Planner

ANA EBOSS Site Planner is a MapSet-based multi-site project management app that maps and tracks generator assets with real-time Firestore sync, collaborative field updates, and AI-powered asset naming from uploaded photos.

## Architecture Overview

- Frontend: static `index.html`, `styles.css`, and ES modules in `js/` (`app.js`, `drawing.js`, `photo-gallery.js`).
- Data layer: Cloud Firestore collections for `sites`, `generators`, and `drawings`; Firebase Storage for photos.
- Backend: Firebase Cloud Functions in `functions/index.js` for config delivery, AI naming, site CRUD, and maintenance triggers.
- Runtime flow: browser fetches app config from `getAppConfig`, initializes Firebase/Maps, subscribes to Firestore snapshots per active `siteId`.

## Installation / Setup

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- Access to Firebase project `openai-stargate-eboss-map` (or your target project alias)

### Setup

```bash
npm run setup
cd functions
npm install
cd ..
```

### Local Development Start

```bash
# Windows
start-dev.bat

# macOS/Linux
./start-dev.sh
```

## Usage

### Common Commands

```bash
# Start emulators + local server
npm run dev

# Functions tests
cd functions && npm test

# Deploy hosting only
npm run deploy:hosting

# Deploy functions only
npm run deploy:functions
```

### App URLs (local)

- `http://localhost:8080` — frontend-only static server. Start it with one of:

  - `npm run dev:server` (recommended) — runs `python3 -m http.server 8080` (falls back to `python -m http.server 8080` on some systems)
  - `npm run dev:node` — runs `npx http-server -p 8080 -c-1` (Node-based server)

  Change the port if needed by editing the script or passing a different port to the underlying command.
- `http://127.0.0.1:5000` — Firebase Hosting emulator for full local end-to-end testing (hosting + emulated backend).
- `http://127.0.0.1:4000` — Firebase Emulator UI for inspecting local emulator state and data.

## Development / Contributing

- Follow coding, security, and workflow guidance in [AGENTS.md](./AGENTS.md).
- Keep Firestore queries scoped by `siteId`.
- Add and maintain composite indexes for site-scoped query paths:
  - `generators`: `siteId + createdAt` (or `siteId + timestamp`)
  - `drawings`: `siteId + createdAt` (or `siteId + timestamp`)
- Declare those indexes in `firestore.indexes.json` so site-filtered ordered queries stay performant as data volume increases.
- Run tests before commit:

```bash
cd functions && npm test
```

- Validate Firestore rules before deploy:

```bash
firebase deploy --only firestore:rules --dry-run
```

## Security

### Warning

**WARNING: Never use open Firestore rules (`allow read, write: if true;`) in production.**

### Current Security Considerations

- This project has a live deployment target, so treat all environments as production-sensitive by default.
- Firestore rules are defined in [firestore.rules](./firestore.rules) and are expected to enforce authenticated, role-aware access.
- Review operational security guidance in [AGENTS.md](./AGENTS.md), including API key handling and Secret Manager usage.

### Production Hardening Checklist

1. Restrict Firestore reads/writes to authenticated users with role/ownership checks.
2. Ensure all site-scoped writes enforce canonical `siteId` values from `/sites/{siteId}`.
3. Validate rules locally/emulator and run:

```bash
firebase deploy --only firestore:rules --dry-run
```

1. Before any security rules rollout, export/backup critical data.
4. Before any security rules rollout, export/backup critical data.
2. After rollout, audit Firebase/Firestore access logs for unexpected access patterns.

## License

No license file is currently present in this repository. Treat all code as internal/proprietary unless a `LICENSE` file is added.
