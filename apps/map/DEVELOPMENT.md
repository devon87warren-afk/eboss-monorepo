# ANA EBOSS Planner - Development Guide

## Quick Start

### Option 1: Automated Launch (Recommended)

**Windows:**

```bash
start-dev.bat
```

**Mac/Linux:**

```bash
./start-dev.sh
```

This will start:

- Firebase Emulators (Auth, Firestore, Functions, Storage, Hosting)
- Local HTTP server on <http://localhost:3000>

### Option 2: NPM Scripts

```bash
# Install dependencies
npm run setup

# Start development environment
npm run dev

# Or start individually
npm run dev:firebase    # Firebase emulators only
npm run dev:server      # HTTP server only
```

### Option 3: Manual Start

**Terminal 1 - Firebase Emulators:**

```bash
firebase emulators:start
```

**Terminal 2 - HTTP Server:**

```bash
# Python
python3 -m http.server 3000

# Or Node.js
npx http-server -p 3000
```

## Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| App | <http://localhost:8080> | Main application |
| App (Firebase) | <http://127.0.0.1:5000> | Via Firebase Hosting emulator |
| Emulator UI | <http://127.0.0.1:4000> | Firebase Emulator Suite |
| Firestore | <http://127.0.0.1:4000/firestore> | Database viewer |
| Auth | <http://127.0.0.1:4000/auth> | Auth emulator |

## Emulator Configuration

Emulators are configured in `firebase.json`:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "hosting": { "port": 5000 },
    "ui": { "port": 4000 }
  }
}
```

## Environment Modes

### Toggle Between Emulator and Production

The app automatically detects when running on localhost and connects to emulators. To toggle:

1. **Click the status indicator** (bottom-left corner) to switch modes
2. **Or add URL parameter:** `?emulators=false` to force production mode
3. **Or set in localStorage:**

   ```javascript
   localStorage.setItem('eboss_use_emulators', 'false');
   ```

### Environment Indicator

- **Red indicator**: Connected to emulators (local data)
- **Green indicator**: Connected to production

## First-Time Setup

1. **Install Firebase CLI:**

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Install dependencies:**

   ```bash
   npm run setup
   ```

3. **Configure environment:**

   ```bash
   cp .env.local .env
   # Edit .env with your settings
   ```

4. **Start development:**

   ```bash
   npm run dev
   ```

## Seeding Test Data

```bash
npm run seed
```

This creates sample projects, generators, and users for testing.

## Testing

```bash
# Run function tests
npm test

# Run tests with emulators
npm run test:emulators
```

## Debugging

### Enable Debug Mode

Add `?debug` to URL:

```
http://localhost:8080?debug
```

Or in localStorage:

```javascript
localStorage.setItem('eboss_debug', 'true');
```

### View Emulator Data

1. Open <http://127.0.0.1:4000>
2. Navigate to Firestore/Auth/Storage tabs
3. View and edit emulator data in real-time

### Reset Emulator Data

```bash
# Stop emulators (Ctrl+C)
# Delete emulator data
rm -rf .firebase

# Or use Firebase CLI
firebase emulators:start --import=.firebase --export-on-exit
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 8080 (Firestore emulator) or 3000 (HTTP server)
lsof -i :8080  # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Emulator ports are configured in firebase.json, not via CLI flags
# To change Firestore port, edit firebase.json:
# "emulators": { "firestore": { "port": 8081 } }
firebase emulators:start --only firestore
```

### Emulators Not Connecting

1. Check emulators are running: <http://127.0.0.1:4000>
2. Verify `USE_EMULATORS=true` in environment
3. Check browser console for connection errors
4. Ensure no firewall blocking localhost ports

### Functions Not Working

```bash
# Rebuild functions
cd functions && npm install && cd ..

# Deploy to emulator only
firebase emulators:start --only functions
```

## File Structure

```
├── .env.local              # Environment template
├── .firebase/              # Emulator data (gitignored)
├── css/
│   └── photo-gallery.css   # Photo gallery styles
├── js/
│   ├── app.js             # Main application logic
│   ├── config.js          # Environment configuration
│   └── photo-gallery.js   # Photo gallery module
├── functions/             # Cloud Functions
├── start-dev.bat          # Windows launcher
├── start-dev.sh           # Mac/Linux launcher
└── DEVELOPMENT.md         # This file
```

## Deployment

```bash
# Deploy everything
npm run deploy

# Deploy specific components
npm run deploy:hosting     # Hosting only
npm run deploy:functions   # Functions only
npm run deploy:rules       # Security rules only
```

## Production Checklist

Before deploying to production:

- [ ] Test on emulators first
- [ ] Run function tests: `npm test`
- [ ] Check Firestore rules compile
- [ ] Verify indexes in `firestore.indexes.json`
- [ ] Test authentication flow
- [ ] Verify photo uploads work
- [ ] Test offline persistence

## Support

- Firebase Docs: <https://firebase.google.com/docs/emulator-suite>
- Google Maps API: <https://developers.google.com/maps/documentation/javascript>
- Project Issues: Create a GitHub issue
