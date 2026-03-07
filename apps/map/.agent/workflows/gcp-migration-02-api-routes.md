### Name
`gcp-migration-02-api-routes`

### Description
Port all 17 Firebase callable and HTTP functions to Express REST routes in the Cloud Run service. Maps each Firebase function to a REST endpoint, converts Firebase HttpsError patterns to HTTP status codes, implements CORS, and standardizes request/response envelopes. Depends on Workflow 1 (scaffold) being complete.

### Content

> You are an expert Node.js REST API engineer migrating Firebase Cloud Functions to Express on Cloud Run.
>
> ## App Context
>
> You are working on **stargate-eboss-map** (`F:/Repos/GitHub/New folder/stargate-eboss-map/`), a production web app for geotagging and managing generator assets at ANA EBOSS sites.
>
> **Firebase Project:** `openai-mapset-eboss-map` | **Region:** `us-central1`
> **Domain restriction:** Only `@anacorp.com` Google accounts can authenticate
> **Admin bootstrap:** `dwarren@anacorp.com` is the initial admin
>
> **Current function types:**
> - **HTTP endpoints (3):** `getAppConfig` (GET), `analyzeGeneratorPhoto` (POST), `health` (GET) — invoked via direct HTTP
> - **Callable functions (14):** All others — invoked via Firebase callable protocol (not standard REST)
>
> **Migration target:** Single Express app on Cloud Run. All callables become REST endpoints. Auth middleware (Workflow 3) will be integrated separately — your routes should expect `req.user` to be populated by middleware already applied upstream.
>
> **Complete Function → REST Route Mapping:**
>
> | Firebase Function | Method | Route | Auth Level |
> |---|---|---|---|
> | `getAppConfig` | GET | `/api/config` | None (public) |
> | `health` | GET | `/api/health` | None (public) |
> | `analyzeGeneratorPhoto` | POST | `/api/assets/analyze-photo` | None (public, validate mime) |
> | `suggestAssetName` | POST | `/api/assets/suggest-name` | ANA domain user |
> | `siteCreate` | POST | `/api/sites` | ANA domain user |
> | `siteEdit` | PUT | `/api/sites/:siteId` | ANA domain user |
> | `siteDelete` | DELETE | `/api/sites/:siteId` | ANA domain user |
> | `provisionUser` | POST | `/api/admin/users` | Admin only |
> | `listUsers` | GET | `/api/admin/users` | Admin only |
> | `updateUserRole` | PUT | `/api/admin/users/:uid/role` | Admin only |
> | `getUserProfile` | GET | `/api/users/me` | ANA domain user |
> | `getAuditLogs` | GET | `/api/admin/audit-logs` | Admin only |
> | `getProjectActivity` | GET | `/api/projects/:projectId/activity` | ANA domain user |
> | `listTemplates` | GET | `/api/templates` | ANA domain user |
> | `createProjectFromTemplate` | POST | `/api/projects/from-template` | ANA domain user |
> | `saveAsTemplate` | POST | `/api/admin/templates` | Admin only |
> | `listCustomTemplates` | GET | `/api/custom-templates` | ANA domain user |
> | `createFromCustomTemplate` | POST | `/api/projects/from-custom-template` | ANA domain user |
> | `testEmailConfig` | POST | `/api/admin/test-email` | Admin only |
>
> ## Your Task: Workflow 2 — REST Route Implementation
>
> **Scope:** Port the business logic of all 17 HTTP/callable functions into Express route handlers. Use `req.user` for auth context (populated by Workflow 3 middleware). Implement proper HTTP semantics, input validation, and error handling. Do NOT implement auth middleware itself — reference it as `requireAnaUser` and `requireAdmin` imports from `../middleware/auth`.
>
> ## Required Reading
>
> Read these files before writing any code:
>
> 1. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/index.js` — Read the FULL file. Map out:
>    - Exact Firestore queries used per function (collection names, `where` clauses, `orderBy`, limits)
>    - Anthropic API call patterns (model, max_tokens, message format)
>    - Gemini Vertex AI call patterns
>    - SendGrid email templates and payload shapes
>    - Error throwing patterns (`HttpsError` codes and messages)
>    - Secret names fetched per function
>    - Input field names expected from `data` parameter in callables
> 2. `F:/Repos/GitHub/New folder/stargate-eboss-map/firestore.rules` — understand which collections exist and their access patterns
> 3. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/package.json` — confirm all dependencies available
>
> ## Deliverables
>
> ### 1. `api/src/routes/config.js`
> Port `getAppConfig` exactly. Key behaviors to preserve:
> - CORS origin whitelist (extract origins from the existing hardcoded list in `index.js`)
> - Secret Manager fetch for `firebaseConfig` and `GOOGLE_MAPS_API_KEY`
> - Cache hits vs misses (use the shared `secrets.js` lib from Workflow 1)
> - Return shape must be identical (frontend depends on it)
>
> ### 2. `api/src/routes/sites.js`
> Port `siteCreate`, `siteEdit`, `siteDelete`. Key behaviors:
> - `siteCreate`: Validate `name` (required, 1-100 chars), `address`, `lat`, `lng` (valid coordinate ranges). Write to `sites` collection with `status: 'active'`, `createdAt`, `updatedAt` server timestamps
> - `siteEdit`: Validate siteId exists. Only allow updating `name`, `address`, `latitude`, `longitude` fields (not `status`, `createdAt`)
> - `siteDelete`: Soft-delete only — set `status: 'archived'`. The hard delete cascade is handled by an Eventarc trigger (Workflow 4). Return confirmation with siteId
> - Return consistent JSON: `{ success: true, data: { siteId, ...fields } }`
>
> ### 3. `api/src/routes/assets.js`
> Port `suggestAssetName` and `analyzeGeneratorPhoto`. Key behaviors:
> - `suggestAssetName`: Receives base64 image + optional context. Calls Anthropic Claude Haiku vision. Return `{ suggestedName, confidence, reasoning }` (match existing response shape from `index.js`)
> - `analyzeGeneratorPhoto`: Public endpoint (no auth). Receives base64 or multipart. Calls Vertex AI Gemini Vision. Validate MIME type (allow only `image/jpeg`, `image/png`, `image/webp`). Hard limit base64 payload to 10MB
> - Add request timeout (30s for AI calls) and surface timeout errors distinctly (504 status)
>
> ### 4. `api/src/routes/users.js`
> Port `provisionUser`, `listUsers`, `updateUserRole`, `getUserProfile`. Key behaviors:
> - `getUserProfile`: Return calling user's Firestore profile from `users/{uid}`; create profile if not exists (graceful first-login handling)
> - `provisionUser`: Write to `pendingUsers/{email}` collection (triggers Eventarc welcome email in Workflow 4). Validate email format and `@anacorp.com` domain
> - `listUsers`: Paginated (default 50, max 200). Support `?after=<lastDocId>` cursor. Return array of user profiles
> - `updateUserRole`: Validate role is one of `['admin', 'manager', 'supervisor', 'technician', 'support']`; prevent an admin from downgrading their own role
>
> ### 5. `api/src/routes/admin.js`
> Port `getAuditLogs`, `saveAsTemplate`, `testEmailConfig`. Key behaviors:
> - `getAuditLogs`: Query `auditLogs` collection. Support filters: `?siteId=`, `?userId=`, `?action=`, `?startDate=`, `?endDate=`. Paginated (50/page). Validate date formats
> - `saveAsTemplate`: Write template to `templates` collection with admin uid as owner
> - `testEmailConfig`: Send test email via SendGrid using the same template as `onUserProvisioned`. Return delivery status
>
> ### 6. `api/src/routes/projects.js`
> Port `getProjectActivity`, `listTemplates`, `createProjectFromTemplate`, `listCustomTemplates`, `createFromCustomTemplate`. Preserve all Firestore query logic exactly as found in `index.js`.
>
> ### 7. `api/src/middleware/validate.js`
> Reusable input validation middleware factory. Example:
> - `validate(schema)` — takes a Zod or simple object schema, validates `req.body`, returns 400 with field-level errors if invalid
> - Use this in all route files instead of inline validation
>
> ### 8. `api/src/lib/errors.js`
> - `AppError` class extending `Error` with `statusCode` and `code` (matching Firebase error codes)
> - `firebaseErrorToHttp(code)` mapping function
> - `asyncHandler(fn)` wrapper to eliminate try/catch boilerplate in route handlers
>
> ### 9. Route index `api/src/routes/index.js`
> Mount all routers with correct base paths. Apply `requireAnaUser` and `requireAdmin` middleware to appropriate router groups.
>
> ## Optimization Recommendations
>
> After completing the deliverables, provide an **"Optimization Recommendations"** section covering:
>
> 1. **Response envelope standardization:** Evaluate whether the current mix of Firebase callable response shapes (some return `{ data }` wrapper, some return flat objects) should be normalized. Propose a consistent envelope: `{ success, data, error, meta }`. List every callsite in `js/app.js` that would need updating if you change the shape.
>
> 2. **Input validation library:** Should we use Zod, Joi, or express-validator? Evaluate each against the existing codebase's patterns and the team's likely familiarity. Recommend one with justification.
>
> 3. **Pagination:** `listUsers` and `getAuditLogs` currently have no pagination in the Firebase Functions. Add Firestore cursor-based pagination. Explain why offset-based pagination is problematic with Firestore and why cursor-based is correct.
>
> 4. **AI endpoint isolation:** Should `suggestAssetName` and `analyzeGeneratorPhoto` be split into a separate Cloud Run service with `--memory=1Gi` and `--concurrency=10`? Analyze the tradeoff: operational complexity vs performance/cost.
>
> 5. **Caching `getAppConfig`:** This endpoint is called on every page load. Add `Cache-Control: public, max-age=3600` response header so Firebase Hosting CDN caches it. Assess security implications of caching Firebase config (it contains API keys — are these safe to cache publicly?).
>
> 6. **Photo upload flow improvement:** Currently `analyzeGeneratorPhoto` receives base64 in the request body. Recommend switching to a signed upload URL pattern: (a) client calls `POST /api/assets/upload-url` to get a signed Cloud Storage URL, (b) client uploads directly to Storage, (c) Cloud Run reads from Storage path. This eliminates the 10MB base64 payload in the API request.
>
> 7. **Audit log performance:** If `auditLogs` is a flat Firestore collection with `siteId`, `userId`, `action`, `timestamp` — queries filtering by multiple fields require composite indexes. List the composite indexes that should be added to `firestore.indexes.json` for the audit log query patterns.
>
> ## Output Format
>
> 1. Start with **"Pre-flight: Functions Inventory"** — a table listing all 27 functions found in `index.js` with their type (HTTP/callable/trigger/auth), the Firestore collections they touch, and external services they call.
> 2. Produce each numbered deliverable as a labeled code block with the file path as the label.
> 3. End with the **"Optimization Recommendations"** section.
> 4. Mark any place where the existing `index.js` logic is unclear or likely buggy with `⚠️ Potential Bug:`.
> 5. Mark decisions requiring human input with `⚠️ Decision Required:`.
