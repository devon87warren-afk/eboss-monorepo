# Deployment Guide: LLM Vision Backend for Generator Photo Upload

> **Note:** Replace `YOUR_PROJECT_ID` with your actual Firebase/Google Cloud project ID throughout this guide.

## Overview

This guide covers deploying the LLM vision backend that enables:

1. Accurate GPS extraction from photos using the exifr library
2. Automatic generator nameplate reading via Gemini Vision API
3. Auto-population of Generator ID and kW fields

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud project with billing enabled (replace `YOUR_PROJECT_ID` below)
- Vertex AI API enabled on the project

## Step 1: Deploy Cloud Functions

```bash
# Navigate to your project directory
cd /path/to/your/project

# Login to Firebase (if not already)
firebase login

# Install Cloud Function dependencies
cd functions
npm install

# Return to project root
cd ..

# Deploy only the Cloud Functions
firebase deploy --only functions
```

After deployment, you'll receive the Cloud Function URL. It should be:

```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/analyzeGeneratorPhoto
```

## Step 2: Verify the Deployment

Test the health endpoint:

```bash
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/health
```

Expected response:

```json
{"status": "healthy", "service": "mapset-eboss-vision", "timestamp": "..."}
```

## Step 3: Deploy Hosting (Optional)

If you want to deploy the frontend to Firebase Hosting:

```bash
firebase deploy --only hosting
```

## Architecture

### Client-Side Flow (app.js)

1. User uploads a photo
2. Photo preview displays immediately
3. In parallel:
   - exifr extracts GPS coordinates and populates lat/lng fields
   - Photo is sent to Cloud Function for nameplate analysis
4. Cloud Function returns {id, kw, kva, confidence}
5. Generator ID and kW fields auto-populate
6. User reviews and clicks Save
7. Pin placed at GPS coordinates with all data

### Cloud Function (functions/index.js)

- Receives base64-encoded image
- Calls Gemini 1.5 Flash via Vertex AI
- Uses a specialized prompt for nameplate reading
- Parses JSON response
- Returns structured data: {id, kva, kw, confidence, notes}

## EXIF GPS Parser Fix

### The Bug (Old Code)

```javascript
function parseRational(view, offset, le) {
  const num = view.getUint32(offset, le);
  const den = view.getUint32(offset + 4, le);
  return den === 0 ? 0 : num / den;  // Only reads ONE rational!
}
```

GPS coordinates in EXIF are stored as THREE rationals:

- Degrees (e.g., 32/1)
- Minutes (e.g., 26/1)
- Seconds (e.g., 55/1)

The old code only read degrees, causing ~30 mile errors.

### The Fix (New Code)

```javascript
async function extractExifGps(file) {
  const gps = await exifr.gps(file);  // Handles all 3 rationals correctly
  if (gps && gps.latitude !== undefined && gps.longitude !== undefined) {
    return { lat: gps.latitude, lng: gps.longitude };
  }
  return null;
}
```

## Troubleshooting

### Cloud Function Returns 403

**⚠️ SECURITY WARNING:** The function currently allows unauthenticated access via `onRequest` options.

**Why unauthenticated access?**

- Simplifies development and testing
- Allows direct browser/mobile app calls without OAuth flows

**Security Risks:**

- Exposes the Vertex AI endpoint to anyone on the internet
- Can lead to unauthorized usage and unexpected billing
- No rate limiting or request validation by default

**When is this appropriate?**

- Development/testing environments only
- Public demos with low usage
- **NOT recommended for production** without additional protections

**Recommended mitigations for production:**

- Enforce Firebase Authentication (check `context.auth` in function)
- Use API keys with domain/IP restrictions
- Implement rate limiting (Firebase App Check, Cloud Armor)
- Add request validation and input sanitization
- Use IP allowlists for known clients
- Set billing quotas and alerts
- Consider Firebase Callable functions for built-in auth

**Example: Adding authentication**

```javascript
exports.analyzePhoto = onRequest({cors: true}, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token with Firebase Admin SDK
  const token = authHeader.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(token);
    // Proceed with request
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
});
```

- Check that Vertex AI API is enabled

### GPS Not Extracting

- Ensure the photo has GPS EXIF data (not all phones embed this)
- Check browser console for exifr errors

### Vision API Not Working

- Verify Gemini API is enabled on the project
- Check Cloud Function logs: `firebase functions:log`

## Files Modified/Created

| File | Purpose |
|------|---------|
| `js/app.js` | Updated with exifr GPS extraction and Vision API integration |
| `index.html` | Added exifr CDN script |
| `functions/index.js` | Cloud Function for Gemini Vision API |
| `functions/package.json` | Cloud Function dependencies |
| `firebase.json` | Firebase configuration |
| `.firebaserc` | Firebase project binding |
