### Name
`gcp-migration-05-frontend-migration`

### Description
Update the vanilla JS frontend to replace all Firebase callable invocations with standard fetch() REST calls to the Cloud Run API. Removes the Firebase Functions SDK import, implements a shared API client utility with token management, and updates the emulator/dev configuration. Depends on Workflow 1 (scaffold) and Workflow 3 (auth middleware) being complete.

### Content

> You are an expert vanilla JavaScript frontend engineer with deep knowledge of Firebase Auth SDK, fetch API patterns, and browser-side token management. You understand how to migrate from Firebase callable functions to standard REST APIs without introducing regressions.
>
> ## App Context
>
> You are working on **stargate-eboss-map** (`F:/Repos/GitHub/New folder/stargate-eboss-map/`), a production web application for tracking generator assets at ANA EBOSS sites.
>
> **Frontend Architecture:**
> - Pure vanilla JavaScript, no build step, no npm bundler
> - All JS in `js/` directory as ES6 modules loaded via CDN `<script type="module">`
> - Firebase SDK 10.8.0 loaded via CDN (`https://www.gstatic.com/firebasejs/10.8.0/...`)
> - `js/app.js` ~3,500 lines — main application logic
> - `js/config.js` — environment detection (emulator vs production), Firebase + Functions initialization
> - `js/drawing.js` — DrawingManager class (no API calls, not affected)
> - `js/photo-gallery.js` — photo lightbox (no API calls, not affected)
>
> **What stays the same (do NOT touch):**
> - `import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup }` — Firebase Auth SDK stays
> - `import { getFirestore, collection, query, where, onSnapshot, ... }` — Firebase Firestore SDK stays
> - `import { getStorage, ref, uploadBytes, getDownloadURL }` — Firebase Storage SDK stays
> - All `onSnapshot` real-time listeners — unchanged
> - All direct Firestore `addDoc`, `updateDoc`, `deleteDoc` calls — unchanged (these use security rules)
> - All Storage upload calls — unchanged
>
> **What changes:**
> - `import { getFunctions, httpsCallable, connectFunctionsEmulator }` — REMOVED
> - All `httpsCallable(functions, 'functionName')(data)` calls — replaced with `fetch()` to Cloud Run
> - `js/config.js` — remove Functions emulator setup, add Cloud Run local URL for dev
>
> **Known callsites using Firebase callables (from migration plan analysis):**
>
> | Location in `js/app.js` | Current callable | New REST call |
> |---|---|---|
> | ~Line 849 | `httpsCallable(functions, 'siteEdit')` | `PUT /api/sites/:siteId` |
> | ~Line 863 | `httpsCallable(functions, 'siteCreate')` | `POST /api/sites` |
> | ~Line 917 | `httpsCallable(functions, 'siteDelete')` | `DELETE /api/sites/:siteId` |
> | ~Line 1088 | `httpsCallable(functions, 'suggestAssetName')` | `POST /api/assets/suggest-name` |
>
> Note: These line numbers are approximate. You must read the actual file to find all callsites — there may be more than these 4 (e.g., user admin panel calls, template calls).
>
> **Auth flow for REST calls:**
> ```js
> const token = await auth.currentUser.getIdToken();
> const res = await fetch('/api/sites', {
>   method: 'POST',
>   headers: {
>     'Content-Type': 'application/json',
>     'Authorization': `Bearer ${token}`
>   },
>   body: JSON.stringify(payload)
> });
> ```
>
> On `401` with `{ error: 'token_expired' }` response: call `getIdToken(true)` to force refresh, then retry once.
>
> ## Your Task: Workflow 5 — Frontend Migration
>
> **Scope:** Find every Firebase callable call in the frontend, replace with fetch() using the shared API client, implement the API client utility, update configuration for Cloud Run local dev, and add a `POST /api/auth/register` call to the auth state change handler. Produce minimal, targeted diffs — do not refactor unrelated code.
>
> ## Required Reading
>
> Read these files completely before writing any code:
>
> 1. `F:/Repos/GitHub/New folder/stargate-eboss-map/js/app.js` — FULL FILE. Search for:
>    - Every occurrence of `httpsCallable` — note line number, function name called, data payload sent, how the result is used
>    - Every occurrence of `getFunctions` — initialization
>    - `onAuthStateChanged` handler — where to add the `POST /api/auth/register` call
>    - How errors from callables are currently caught and displayed (`showStatusMessage` calls near callable invocations)
>    - The `showStatusMessage(msg, type)` function signature — needed for error handling in new API client
>    - Any references to `functions` variable that are not `httpsCallable` calls
> 2. `F:/Repos/GitHub/New folder/stargate-eboss-map/js/config.js` — FULL FILE. Note:
>    - How emulator detection works
>    - `connectFunctionsEmulator` call — to be removed
>    - `configUrl` construction — the `getAppConfig` endpoint URL
>    - Any exported values used by `app.js`
> 3. `F:/Repos/GitHub/New folder/stargate-eboss-map/index.html` — Check `<script>` imports: is `firebase-functions.js` imported from CDN in HTML? Also check for any Firebase Functions CDN URL in script tags
>
> ## Deliverables
>
> ### 1. Callsite Audit Table
> Before any code changes, produce a complete table of every Firebase callable callsite found in the frontend:
>
> | File | Line # | Callable name | Data sent | Result used as | Error handling |
> |---|---|---|---|---|---|
>
> Include any callables found outside `js/app.js` (check all JS files).
>
> ### 2. `js/api-client.js` — New API Client Utility
> A shared ES6 module (no build step, no npm — pure browser-compatible JS):
>
> ```js
> // Usage example:
> import { apiCall } from './api-client.js';
> const result = await apiCall('POST', '/api/sites', { name, address, lat, lng });
> ```
>
> Implement:
> - `apiCall(method, path, body, options)` — core function:
>   - Gets current user token from `auth.currentUser.getIdToken()`
>   - Sets `Authorization: Bearer <token>` and `Content-Type: application/json`
>   - Handles `401` with `error: 'token_expired'`: forces token refresh (`getIdToken(true)`), retries once
>   - On non-OK response: throws an `ApiError` with `{ statusCode, code, message }` extracted from JSON body
>   - On network error: throws `ApiError` with `{ code: 'network_error', message: 'Unable to reach server' }`
>   - Timeout: 30s for standard calls, configurable via options
> - `ApiError` class — extends `Error`, has `statusCode` and `code` properties
> - `getApiBaseUrl()` — returns Cloud Run URL in production, `http://localhost:8080` in emulator mode (read from same config as `js/config.js`)
> - Specific typed helpers (optional but recommended):
>   - `api.sites.create(data)`, `api.sites.update(siteId, data)`, `api.sites.delete(siteId)`
>   - `api.assets.suggestName(imageBase64, context)`, `api.assets.analyzePhoto(imageBase64)`
> - Export: `export { apiCall, ApiError, api }` — using named exports (no `export default`)
>
> **Constraint:** This file must work as a browser ES6 module with no build step. No `require()`, no CommonJS. Use `import` only for other local `./` modules. Do not import from npm packages.
>
> ### 3. Updated `js/app.js` — Targeted Diffs
> Do NOT rewrite `app.js`. Produce exact Edit instructions for each callsite:
>
> For each callsite found in the audit (Deliverable 1):
> - Show the EXACT current code (multi-line if needed)
> - Show the EXACT replacement code
> - Show the surrounding context (2-3 lines before/after) to make the edit unambiguous
>
> Also produce the edit for:
> - **Remove `getFunctions` and `httpsCallable` import** (find the exact import line)
> - **Add `import { api, apiCall } from './api-client.js'`** (at top of module imports)
> - **`onAuthStateChanged` handler** — add `await api.auth.register()` call after user is confirmed logged in, before any other API operations. Wrap in try/catch — registration failure should not block the app (log only)
>
> ### 4. Updated `js/config.js` — Targeted Diffs
> Produce exact Edit instructions:
> - Remove `connectFunctionsEmulator` import and call
> - Remove the `getFunctions()` initialization
> - Add `CLOUD_RUN_URL` export: `'http://localhost:8080'` in emulator mode, `''` (empty string = same-origin via Firebase Hosting rewrite) in production
> - The `api-client.js` will import this to determine the API base URL
>
> ### 5. Updated `index.html` — Targeted Diffs
> If `firebase-functions.js` CDN URL is present in `<script>` tags or import maps, produce the edit to remove it.
>
> ### 6. `js/api-client.test.html` — Browser-based smoke test page
> A simple HTML page (not a Jest test — this app has no frontend build) that:
> - Loads Firebase Auth SDK
> - Signs in with Google (popup)
> - Calls each API endpoint once
> - Displays ✅ / ❌ per endpoint with response body
> - Useful for manual verification before deploying
>
> ## Optimization Recommendations
>
> After completing the deliverables, provide an **"Optimization Recommendations"** section:
>
> 1. **Token refresh strategy:** `getIdToken()` without `forceRefresh: true` returns a cached token (up to 1 hour old). Cloud Run checks expiry. Currently `api-client.js` forces refresh only on `token_expired` 401. Should the client proactively refresh tokens after 55 minutes (before expiry)? Implement a `setInterval` refresh strategy and analyze the tradeoff (background network calls vs guaranteed token freshness).
>
> 2. **Request deduplication for `suggestAssetName`:** This AI endpoint is expensive (~$0.001/call, 3-5 second latency). If a user rapidly clicks "Suggest Name" multiple times, multiple parallel requests fire. Implement a debounce/deduplication pattern in the API client: if an identical request (same endpoint + same body hash) is already in-flight, return the same Promise instead of firing a new request.
>
> 3. **Optimistic UI for site operations:** Currently `siteCreate`, `siteEdit`, `siteDelete` wait for the server response before updating the UI. Since these now call Cloud Run (potential cold start latency), consider implementing optimistic updates: update local state immediately, revert on error. Analyze which operations in `js/app.js` are safe for optimistic updates vs which need server confirmation.
>
> 4. **Error message mapping:** The current callables throw `HttpsError` with specific messages. Cloud Run returns HTTP status codes with JSON error bodies. The new `ApiError` class needs to map these to the same user-facing messages that `showStatusMessage()` currently shows. Audit all current error messages shown to users near callable calls and ensure they are preserved in the new error handling.
>
> 5. **API client as a ES module singleton:** In a multi-file vanilla JS app with ES modules, each file that imports `api-client.js` gets the same module instance (module cache). This means the `auth` instance must be initialized once and shared. Recommend importing `auth` from a shared `firebase-singleton.js` module rather than re-initializing in `api-client.js`. Check if this pattern is already used in the codebase.
>
> 6. **Local development with Cloud Run:** When running locally, the frontend at `localhost:8080` will call the Cloud Run Express app at `localhost:8080` too (same port). This creates a conflict. Recommend running Cloud Run locally on port `8081` (via Docker) or use the Firebase Hosting emulator (`localhost:5000`) for the frontend while Cloud Run Express runs on `localhost:8080`. Provide the updated `js/config.js` logic and the Docker run command.
>
> 7. **`getAppConfig` caching:** The `getAppConfig` endpoint is called every time the app loads (fetches Firebase config + Maps API key). With Cloud Run replacing Firebase Functions, this call now hits Cloud Run (with potential cold start). Recommend adding `localStorage` caching for the config with a 24-hour TTL, checking localStorage first before calling the API. Assess security implications of caching Firebase config in localStorage.
>
> ## Output Format
>
> 1. Start with **"Callsite Audit"** (Deliverable 1 table) — this must be complete before any code is written.
> 2. Then each numbered deliverable.
> 3. For `js/app.js` and `js/config.js` edits, use a clear format:
>    ```
>    FILE: js/app.js
>    AROUND LINE: 849
>    REMOVE:
>    [exact current code]
>    ADD:
>    [exact replacement code]
>    CONTEXT (do not change):
>    [2 lines before / 2 lines after]
>    ```
> 4. End with **"Optimization Recommendations"**.
> 5. Mark any line where the current code has a bug or anti-pattern with `⚠️ Code Issue:`.
> 6. Use `⚠️ Decision Required:` for design decisions requiring human input.
