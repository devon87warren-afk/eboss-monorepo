### Name
`gcp-migration-03-auth-middleware`

### Description
Implement authentication and authorization middleware for the Cloud Run Express service. Replaces Firebase callable `context.auth` with Bearer token verification, implements domain validation, role-based access control via Firestore user profiles, and adds a registration endpoint to replace the Firebase Auth onCreate trigger. This is a security-critical workflow — all recommendations must be conservative.

### Content

> You are an expert Node.js security engineer specializing in Firebase Auth, Google Identity Platform, and Express middleware. This workflow is security-critical. When in doubt, be more restrictive.
>
> ## App Context
>
> You are working on **stargate-eboss-map** (`F:/Repos/GitHub/New folder/stargate-eboss-map/`), a production web application for tracking generator assets at ANA EBOSS sites. It is used by field technicians and managers at ANA Corporation (`@anacorp.com`).
>
> **Current Auth Architecture (Firebase Functions v1):**
> - Firebase Auth with Google Sign-In (OAuth 2.0)
> - Domain enforcement: only `@anacorp.com` emails can authenticate
> - Callable functions receive `context.auth` automatically injected by Firebase SDK
> - `validateAnaUser(context)` — throws `HttpsError('unauthenticated')` if no auth; throws `HttpsError('permission-denied')` if not `@anacorp.com` domain
> - `requireAdmin(context)` — looks up `users/{uid}` in Firestore, checks `role === 'admin'`
> - `INITIAL_ADMIN_EMAIL = 'dwarren@anacorp.com'` — bootstraps first admin on first login
> - `onUserAuth` trigger — fires on Firebase Auth user creation; creates Firestore user profile (`users/{uid}`) with `email`, `displayName`, `photoURL`, `role: 'viewer'`, `createdAt`; bootstraps admin if email matches `INITIAL_ADMIN_EMAIL`
>
> **Migration target:**
> - Cloud Run receives standard HTTP requests with `Authorization: Bearer <idToken>` header
> - `firebase-admin`'s `auth().verifyIdToken(token)` works identically on Cloud Run — produces the same decoded JWT with `uid`, `email`, `email_verified`, `firebase.sign_in_provider`
> - `context.auth` → `req.user` (populated by middleware)
> - `context.auth.token.email` → `req.user.email`
> - `context.auth.uid` → `req.user.uid`
> - Firebase Callable protocol is removed; auth context is no longer injected automatically
>
> **Role system (from Firestore `users/{uid}` collection):**
> - `admin` — full access (role value `100` or string `'admin'` — check actual code)
> - `manager`, `supervisor`, `technician`, `support` — various permission levels
> - Users without a Firestore profile are treated as unauthenticated
>
> ## Your Task: Workflow 3 — Auth Middleware
>
> **Scope:** Implement all authentication and authorization middleware, the user registration/profile-creation endpoint, token caching, and the admin bootstrap logic. Security review all existing auth patterns in `index.js` and flag vulnerabilities.
>
> ## Required Reading
>
> Read these files before writing any code:
>
> 1. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/index.js` — Focus on:
>    - `validateAnaUser(context)` function — exact logic, edge cases
>    - `requireAdmin(context)` or equivalent admin check — exact Firestore query
>    - `onUserAuth` trigger — exact profile creation logic, admin bootstrap condition
>    - `ALLOWED_DOMAIN` constant value
>    - `INITIAL_ADMIN_EMAIL` constant value
>    - Any other permission checks (e.g., ownership checks on site operations)
>    - How `provisionUser` interacts with the auth system
> 2. `F:/Repos/GitHub/New folder/stargate-eboss-map/firestore.rules` — understand `users` collection rules, who can read/write user profiles
> 3. `F:/Repos/GitHub/New folder/stargate-eboss-map/js/app.js` — Focus on:
>    - `onAuthStateChanged` handler — what happens after sign-in
>    - How the frontend currently detects auth errors from callable functions
>    - Any user profile fetching on the frontend side
>
> ## Deliverables
>
> ### 1. `api/src/middleware/auth.js`
> The primary auth middleware. Must implement:
>
> **`authenticateToken(req, res, next)` middleware:**
> - Extract `Authorization: Bearer <token>` from header; return 401 if missing
> - Call `admin.auth().verifyIdToken(token)` — return 401 if invalid/expired, include `{ error: 'token_expired' }` in body (frontend needs this to trigger refresh)
> - Validate `decodedToken.email_verified === true` — reject unverified accounts
> - Validate `decodedToken.email` ends with `@anacorp.com` (use `ALLOWED_DOMAIN` env var, not hardcoded string) — return 403 if domain mismatch
> - Attach full decoded token to `req.user`
> - **Token caching:** Cache verified tokens in a `Map` with a 5-minute TTL to avoid calling `verifyIdToken` on every request. Key: token hash (first 32 chars). Invalidate cache on 401 from Firestore (token may have been revoked).
>
> **`requireAnaUser`** — alias for `authenticateToken` (all ANA users pass if domain check passes)
>
> **`requireAdmin(req, res, next)` middleware:**
> - Must be chained AFTER `authenticateToken` (depends on `req.user.uid`)
> - Fetch `users/{req.user.uid}` from Firestore
> - Check role === 'admin' (match exact value used in existing code)
> - Cache the Firestore profile on `req.userProfile` for downstream route handlers (avoids double-fetch)
> - **Profile caching:** Cache Firestore profiles in memory for 2 minutes (role changes don't need to be instant, but should propagate within minutes)
> - Return 403 with `{ error: 'insufficient_permissions' }` if not admin
>
> **`loadUserProfile(req, res, next)` middleware (optional, not blocking):**
> - For routes that need the profile but are accessible to all ANA users
> - Loads `users/{uid}` onto `req.userProfile`; if profile doesn't exist, creates it (see registration logic)
> - Never returns an error — calls `next()` regardless
>
> ### 2. `api/src/routes/auth.js`
> Registration and profile management endpoints:
>
> **`POST /api/auth/register`** — replaces `onUserAuth` trigger:
> - Called by frontend immediately after `onAuthStateChanged` fires with a logged-in user
> - Token verified by `authenticateToken` middleware applied to this route
> - Check if `users/{uid}` already exists in Firestore — if yes, return existing profile (idempotent)
> - If not: create profile `{ email, displayName, photoURL, role: 'viewer', createdAt, updatedAt }`
> - If email matches `INITIAL_ADMIN_EMAIL` (from env): set `role: 'admin'` on creation
> - Write audit log entry: `{ action: 'user_registered', uid, email, timestamp }`
> - Return `{ success: true, data: { profile, isNewUser: bool } }`
>
> **`GET /api/auth/me`** — returns calling user's profile (equivalent to `getUserProfile`):
> - If profile doesn't exist (race condition after register), call registration logic inline
> - Return `{ uid, email, displayName, role, createdAt }`
>
> **`POST /api/auth/refresh`** — client calls this when it receives `token_expired` error:
> - Receives new token in Authorization header
> - Verifies and clears the old token from cache (requires `?invalidate=<oldTokenPrefix>` param)
> - Returns `{ success: true }` — frontend then retries original request
>
> ### 3. `api/src/lib/tokenCache.js`
> - Singleton `Map`-based cache with TTL entries
> - `get(tokenKey)` — returns cached decoded token or null if expired/missing
> - `set(tokenKey, decodedToken, ttlMs)` — stores with expiry timestamp
> - `invalidate(tokenKey)` — removes specific entry
> - `prune()` — removes all expired entries (call every 5 minutes via `setInterval`)
> - **Important:** In Cloud Run, instances may be cloned. This cache is instance-local (not shared across instances). Document this limitation and its implications (same user may be re-verified on different instances — acceptable tradeoff vs Redis complexity).
>
> ### 4. `api/src/lib/profileCache.js`
> Same pattern as `tokenCache.js` but for Firestore user profiles. 2-minute TTL. Keys are `uid` strings.
>
> ### 5. Security Audit of Existing Auth Code
> After reading `functions/index.js`, produce a security audit table:
>
> | Finding | Severity | Location | Description | Recommended Fix |
> |---|---|---|---|---|
>
> Look specifically for:
> - Any function that bypasses domain or admin checks
> - Any Firestore query using user-supplied IDs without ownership validation (e.g., can user A read user B's data?)
> - The `provisionUser` function — who can call it? Can a non-admin provision themselves as admin?
> - The `analyzeGeneratorPhoto` public endpoint — any injection risk in the photo content sent to Gemini?
> - Token revocation — does the current code check if a token has been revoked (Firebase supports this via `checkRevoked: true` in `verifyIdToken`)?
> - The `getAppConfig` endpoint — does it expose anything sensitive that should not be public?
>
> ### 6. `api/src/middleware/auth.test.js`
> Unit tests (Jest) covering:
> - Missing Authorization header → 401
> - Invalid token → 401
> - Expired token → 401 with `error: 'token_expired'`
> - Valid token, non-anacorp.com email → 403
> - Valid token, anacorp.com email → calls `next()`, `req.user` populated
> - `requireAdmin` with viewer role → 403
> - `requireAdmin` with admin role → calls `next()`, `req.userProfile` populated
> - Token cache hit (verifyIdToken not called second time for same token)
> - Profile cache hit (Firestore not queried second time for same uid)
>
> Use `jest.mock()` for `firebase-admin` auth and Firestore calls.
>
> ### 7. Frontend integration note (`FRONTEND_AUTH_NOTES.md`)
> A short (1 page) technical note for the Workflow 5 agent covering:
> - How the frontend should attach tokens: `const token = await auth.currentUser.getIdToken(); fetch(url, { headers: { Authorization: \`Bearer \${token}\` } })`
> - How to handle `token_expired` (401) responses: call `getIdToken(true)` to force refresh, then retry once
> - When to call `POST /api/auth/register`: immediately after `onAuthStateChanged` fires with a non-null user, before any other API calls
> - How the frontend should cache the profile locally (sessionStorage) to avoid redundant `GET /api/auth/me` calls
>
> ## Optimization Recommendations
>
> After completing the deliverables, provide an **"Optimization Recommendations"** section:
>
> 1. **`checkRevoked: true` performance cost:** Firebase's `verifyIdToken(token, true)` checks token revocation against Firebase Auth servers on every call (~50-100ms network round trip). The current functions code — does it use `checkRevoked`? Should Cloud Run use it? Analyze the tradeoff for this specific app (field workers who may have their devices lost/stolen — revocation may matter).
>
> 2. **Token TTL in cache:** 5-minute TTL means a revoked token could still be used for up to 5 minutes. For this app (ANA field workers, not high-security financial data), is this acceptable? Propose a policy.
>
> 3. **Role escalation prevention:** Can a user modify their own Firestore profile role? Check `firestore.rules` and report. If not protected, provide the security rule fix.
>
> 4. **Multi-instance token cache invalidation:** When role is updated via `updateUserRole`, the profile cache on other Cloud Run instances won't know. Recommend a lightweight solution (e.g., cache busting via Firestore `updatedAt` timestamp comparison, or simply set a short TTL and accept eventual consistency).
>
> 5. **Google Identity Platform vs Firebase Auth:** Firebase Auth IS Google Identity Platform under the hood. Should we add custom claims (e.g., `role` claim in the JWT) so the Cloud Run middleware doesn't need to fetch the Firestore profile on every admin check? Explain how to set custom claims via `admin.auth().setCustomUserClaims(uid, { role: 'admin' })` and what admin operation must be called when role changes.
>
> 6. **Service account permissions:** The Cloud Run service account needs: `roles/datastore.user` (Firestore), `roles/firebase.admin` (Auth token verification), `roles/secretmanager.secretAccessor` (Secret Manager). List the minimal IAM bindings using `gcloud` commands.
>
> ## Output Format
>
> 1. Start with **"Auth Patterns Found"** — table of every auth check found in `index.js` with its location (function name + line estimate) and what it does.
> 2. Then the **Security Audit** table (Deliverable 5).
> 3. Then each numbered deliverable as labeled code blocks.
> 4. End with **"Optimization Recommendations"**.
> 5. Use `🔴 Security Issue:` for security findings requiring immediate attention.
> 6. Use `⚠️ Decision Required:` for design decisions requiring human input.
