### Name
`gcp-migration-01-cloud-run-scaffold`

### Description
Scaffold the Cloud Run Express service for the stargate-eboss-map backend migration. Creates the project structure, Dockerfile, base Express app, middleware skeleton, and deployment configuration. This is the critical-path foundation that all other migration phases depend on.

### Content

> You are an expert Node.js and Google Cloud Platform engineer specializing in migrating Firebase Functions to Cloud Run.
>
> ## App Context
>
> You are working on **stargate-eboss-map** (`F:/Repos/GitHub/New folder/stargate-eboss-map/`), a production web application for geotagging and tracking on-site generators at ANA EBOSS sites.
>
> **Current Architecture:**
> - Frontend: Vanilla JS + Firebase SDK 10.8.0 (CDN ES modules), Google Maps JS API, Builder.io CMS
> - Backend: Firebase Cloud Functions v5 (Node.js 20, ~27 exported functions in `functions/index.js`)
> - Database: Cloud Firestore (collections: `sites`, `generators`, `drawings`, `users`, `projects`, `drawings`, `auditLogs`)
> - Storage: Firebase Storage for generator photos
> - Auth: Firebase Auth with `@anacorp.com` domain restriction + role-based Firestore profiles
> - Secrets: Google Secret Manager (already using `@google-cloud/secret-manager` directly)
> - AI: Anthropic Claude Haiku (vision) + Vertex AI Gemini (alternative)
> - Live: `https://openai-mapset-eboss-map.web.app` | Firebase project: `openai-mapset-eboss-map`
>
> **Migration Goal (Option C — Hybrid):**
> - Firebase Functions v1 runtime → Cloud Run (Express, containerized)
> - Firestore, Storage, Secret Manager, Vertex AI, Anthropic SDK: UNCHANGED (already native GCP)
> - Firebase Auth SDK: UNCHANGED (produces standard GCP identity tokens)
> - Firebase Hosting: UNCHANGED initially (rewrites updated in Workflow 6)
>
> **Why Cloud Run (not Firebase Functions 2nd gen):**
> - Cloud Run provides VPC access, longer timeouts (60min vs 9min), custom concurrency control, and container-level dependency management without Firebase abstraction overhead
> - AI endpoints (suggestAssetName, analyzeGeneratorPhoto) benefit from persistent connections and memory control
> - Cloud Run allows running all 27 functions as a single deployable unit with shared middleware
>
> ## Your Task: Workflow 1 — Cloud Run Service Scaffold
>
> **Scope:** Create the full directory structure, Dockerfile, base Express app, shared middleware skeleton, and deployment configuration. Do NOT port individual functions yet (that is Workflow 2). Do NOT implement auth middleware yet (that is Workflow 3).
>
> ## Required Reading
>
> Before writing any code or recommendations, read these files in this order:
>
> 1. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/package.json` — current dependencies, Node version, scripts
> 2. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/index.js` — full file (~66KB). Note: read in sections if needed. Focus on: (a) all imports at top, (b) `_secretCache` pattern, (c) Anthropic lazy client init, (d) `ALLOWED_DOMAIN` and `INITIAL_ADMIN_EMAIL` constants, (e) CORS origin list in `getAppConfig`
> 3. `F:/Repos/GitHub/New folder/stargate-eboss-map/firebase.json` — current hosting/functions config and rewrites
> 4. `F:/Repos/GitHub/New folder/stargate-eboss-map/.firebaserc` — project name and aliases
>
> ## Deliverables
>
> Produce all of the following. For each file, write the complete file content (no placeholders):
>
> ### 1. Directory Structure
> Output a tree showing the new `api/` directory structure alongside the existing repo layout. Explain why you structured it this way.
>
> ### 2. `api/package.json`
> - Remove: `firebase-functions`
> - Keep: `firebase-admin`, `@google-cloud/secret-manager`, `@anthropic-ai/sdk`, `@google-cloud/vertexai`
> - Add: `express`, `cors`, `helmet`, `express-rate-limit`, `compression`, `morgan` (structured logging)
> - Pin Node.js engine to `>=20.0.0`
> - Include scripts: `start`, `dev` (with `--watch`), `test`, `lint`
> - Justify every dependency added or removed
>
> ### 3. `api/Dockerfile`
> - Multi-stage build (deps stage + runtime stage)
> - Node.js 20 Alpine base
> - Non-root user for security
> - Expose `PORT` env var (Cloud Run requirement)
> - Health check instruction
> - `.dockerignore` contents included as a comment
>
> ### 4. `api/cloudbuild.yaml`
> - Build and push to Artifact Registry (`us-central1-docker.pkg.dev/openai-mapset-eboss-map/...`)
> - Deploy to Cloud Run (`us-central1`) with:
>   - `--memory=512Mi` for standard routes
>   - `--concurrency=80`
>   - `--min-instances=0` (adjustable)
>   - `--service-account` pointing to a dedicated service account
>   - `--allow-unauthenticated` (auth is handled at app layer)
>   - Environment variables: `GCLOUD_PROJECT`, `ANA_ALLOWED_DOMAIN`, `INITIAL_ADMIN_EMAIL`
>
> ### 5. `api/src/index.js` — Base Express App
> - `express()` instance
> - Middleware stack in correct order: `helmet`, `compression`, `cors` (configurable origins), `morgan` (JSON structured logs), `express.json()`, `express-rate-limit` (global 100 req/15min, AI endpoints 10 req/min)
> - Health check route: `GET /api/health` — returns `{ status: 'ok', version, uptime, timestamp }`
> - Router mounting stubs: `/api/config`, `/api/sites`, `/api/assets`, `/api/users`, `/api/projects`, `/api/templates`, `/api/admin`
> - Global error handler middleware (structured JSON error responses matching the existing HttpsError codes: `invalid-argument` → 400, `unauthenticated` → 401, `permission-denied` → 403, `not-found` → 404, `already-exists` → 409, `internal` → 500)
> - `PORT` from env (default `8080`)
> - Graceful shutdown handler (`SIGTERM`)
>
> ### 6. `api/src/lib/secrets.js`
> - Port the `_secretCache` Map and `getSecret(name)` function exactly from `functions/index.js`
> - Replace `functions.logger` with `console.log` (structured JSON for Cloud Run)
> - Add JSDoc explaining the caching behavior and TTL considerations
>
> ### 7. `api/src/lib/firebase.js`
> - Initialize `firebase-admin` app (singleton pattern)
> - Export `db` (Firestore), `auth` (Auth), `storage` (Storage bucket)
> - Handle `GCLOUD_PROJECT` env var
>
> ### 8. `api/src/lib/anthropic.js`
> - Port the lazy Anthropic client initialization from `functions/index.js`
> - Add retry wrapper (3 attempts, exponential backoff) for transient API errors
>
> ### 9. Deployment Commands
> Provide the exact `gcloud` CLI commands to:
> - Enable required APIs (Cloud Run, Artifact Registry, Cloud Build)
> - Create Artifact Registry repository
> - Create dedicated service account with minimum required IAM roles
> - Run Cloud Build
> - Deploy to Cloud Run
> - Set Cloud Run environment variables from Secret Manager (not inline values)
>
> ## Optimization Recommendations
>
> After completing the deliverables, provide a section titled **"Optimization Recommendations"** covering:
>
> 1. **Cold start mitigation:** Should `min-instances` be 0 or 1? Consider the app's usage pattern (field workers, business hours only). Provide cost estimate for both.
> 2. **Memory allocation per endpoint type:** Should AI endpoints (`/api/assets/suggest-name`, `/api/assets/analyze-photo`) have a separate Cloud Run service with higher memory (1Gi+), or share with the API service?
> 3. **Secret caching:** The current `_secretCache` never expires. In a long-running Cloud Run container (vs short-lived functions), this is fine. But recommend adding a TTL (e.g., 1 hour) with justification.
> 4. **Structured logging:** Replace all `console.log` with a structured logger (e.g., `@google-cloud/logging-winston` or `pino`) so Cloud Run logs appear correctly in Cloud Logging with severity levels.
> 5. **VPC connector:** Is one needed for this app? (Consider: Secret Manager and Firestore are public GCP APIs, no private VPC resources exist). Justify your answer.
> 6. **Rate limiting:** Are the proposed limits (100 req/15min global, 10 req/min AI) appropriate? Adjust based on the app's user base (field workers, expected ~10-50 concurrent users max).
>
> ## Output Format
>
> 1. Start with a "Pre-flight: Files Read" section listing what you read and key observations from each.
> 2. Then produce each numbered deliverable as a labeled code block.
> 3. End with the "Optimization Recommendations" section.
> 4. Flag any ambiguity or decision point with `⚠️ Decision Required:` so the human can resolve it.
> 5. Do NOT skip any deliverable. If a file is straightforward, still write it completely.
