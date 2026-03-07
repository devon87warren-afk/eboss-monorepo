### Name
`gcp-migration-04-eventarc-triggers`

### Description
Migrate all Firebase Firestore and Auth triggers to Cloud Functions 2nd gen with Eventarc. Handles the most technically complex part of the migration: Protobuf payload conversion, idempotency for cascade deletes, SendGrid email delivery, and audit logging consolidation. Can be developed in parallel with Workflow 1.

### Content

> You are an expert Google Cloud Platform engineer specializing in Eventarc, Cloud Functions 2nd gen, and Firestore event processing. You have deep knowledge of Protobuf payload formats and Firebase trigger migration patterns.
>
> ## App Context
>
> You are working on **stargate-eboss-map** (`F:/Repos/GitHub/New folder/stargate-eboss-map/`), a production generator asset tracking web app for ANA Corporation field sites.
>
> **Firebase Project:** `openai-mapset-eboss-map` | **Region:** `us-central1`
>
> **Current Trigger Architecture (Firebase Functions v1):**
> Firebase Functions v1 Firestore triggers use the Firebase Functions runtime and Firebase-specific SDK wrappers. They receive `change.before.data()` / `change.after.data()` as plain JavaScript objects.
>
> **Target Architecture (Cloud Functions 2nd gen + Eventarc):**
> Cloud Functions 2nd gen uses Eventarc for event delivery. Firestore events arrive as `CloudEvent` objects with Protobuf-encoded `Value` fields. The `@google-cloud/functions-framework` package handles the CloudEvent envelope. The key transformation challenge: Protobuf `Value` objects must be converted to plain JS objects before use.
>
> **Complete Trigger Inventory:**
>
> | Current Firebase v1 Trigger | Collection | Event | Purpose |
> |---|---|---|---|
> | `hardDeleteArchivedSite` | `sites/{siteId}` | onUpdate | Cascade hard-delete when `status` changes to `'archived'` |
> | `onGeneratorCreate` | `generators/{generatorId}` | onCreate | Write audit log entry |
> | `onGeneratorUpdate` | `generators/{generatorId}` | onUpdate | Write audit log entry with field diff |
> | `onGeneratorDelete` | `generators/{generatorId}` | onDelete | Write audit log entry |
> | `onProjectCreate` | `projects/{projectId}` | onCreate | Write audit log entry |
> | `onDrawingCreate` | `drawings/{drawingId}` | onCreate | Write audit log entry |
> | `onUserProvisioned` | `pendingUsers/{email}` | onCreate | Send SendGrid welcome email |
> | `onProjectMemberAdded` | `projects/{projectId}` | onUpdate | Send project-invite email if members changed |
>
> **Auth Trigger (separate migration):**
> | Current Firebase v1 Trigger | Event | Purpose |
> |---|---|---|
> | `onUserAuth` | Auth user onCreate | Create Firestore user profile; bootstrap admin |
>
> Note: `onUserAuth` is being replaced by an explicit REST endpoint in Workflow 3 (`POST /api/auth/register`). This workflow covers only the Firestore and project-member triggers.
>
> ## Critical Technical Requirement: Protobuf Payload Conversion
>
> **This is the #1 risk in the entire migration.** Firebase v1 Firestore triggers provide:
> ```js
> change.before.data() // → { label: 'EBOSS-125-000042', kw: 100, siteId: 'site-abc' }
> change.after.data()  // → { label: 'EBOSS-125-000042', kw: 200, siteId: 'site-abc' }
> ```
>
> Eventarc delivers:
> ```json
> {
>   "oldValue": {
>     "fields": {
>       "label": { "stringValue": "EBOSS-125-000042" },
>       "kw": { "integerValue": "100" },
>       "siteId": { "stringValue": "site-abc" }
>     }
>   },
>   "value": {
>     "fields": {
>       "label": { "stringValue": "EBOSS-125-000042" },
>       "kw": { "integerValue": "200" },
>       "siteId": { "stringValue": "site-abc" }
>     }
>   }
> }
> ```
>
> Protobuf Value types to handle: `stringValue`, `integerValue`, `doubleValue`, `booleanValue`, `nullValue`, `timestampValue`, `arrayValue` (contains `values: []`), `mapValue` (contains `fields: {}`).
>
> ## Your Task: Workflow 4 — Eventarc Triggers
>
> **Scope:** Migrate all 7 Firestore triggers (not the auth trigger) to Cloud Functions 2nd gen + Eventarc. Implement Protobuf conversion, idempotency patterns, email delivery, and a consolidated audit logging system.
>
> ## Required Reading
>
> Read these files before writing any code:
>
> 1. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/index.js` — Read the FULL file. Focus on:
>    - All trigger function implementations (exact Firestore queries, deletion logic, email payloads)
>    - `hardDeleteArchivedSite` — what subcollections does it delete? Does it paginate? Is it idempotent?
>    - `onUserProvisioned` — exact SendGrid call: template ID, dynamic template data fields, from address
>    - `onProjectMemberAdded` — how does it detect which member was added (diff logic)?
>    - `onGeneratorUpdate` — how does it compute the field diff for the audit log?
>    - The audit log document shape (collection name, fields stored)
>    - Secret names used by email triggers (`sendgrid_api_key` or similar)
> 2. `F:/Repos/GitHub/New folder/stargate-eboss-map/firestore.rules` — understand `sites` subcollection structure (what subcollections are under a site?)
> 3. `F:/Repos/GitHub/New folder/stargate-eboss-map/firestore.indexes.json` — existing composite indexes, to avoid breaking them
> 4. `F:/Repos/GitHub/New folder/stargate-eboss-map/functions/package.json` — current SendGrid and other deps
>
> ## Deliverables
>
> ### 1. `triggers/src/lib/protoConverter.js`
> A complete, tested Protobuf Value → JS object converter:
> - `convertValue(protoValue)` — converts a single Protobuf Value to its JS equivalent
> - `convertFields(fields)` — converts a `fields` object (map of field name → Protobuf Value) to a plain JS object
> - `documentToData(firestoreDocument)` — takes a full Firestore document object from Eventarc payload, returns plain JS data object equivalent to what Firebase v1's `.data()` returned
> - Handle ALL Protobuf value types: `stringValue`, `integerValue` (note: returns as string, must `parseInt`), `doubleValue`, `booleanValue`, `nullValue`, `timestampValue` (convert to JS `Date`), `arrayValue.values`, `mapValue.fields`
> - Handle missing/null `value` (deleted document case)
> - Include comprehensive unit tests in `triggers/src/lib/protoConverter.test.js` covering every type including nested arrays and maps
>
> ### 2. `triggers/src/lib/auditLogger.js`
> A consolidated audit logging utility (replaces 5 separate audit log write patterns):
> - `logEvent({ action, collection, docId, before, after, triggeredBy })` — writes to `auditLogs` collection
> - `diffObjects(before, after)` — returns `{ changed: {field: {from, to}}, added: {field: value}, removed: {field: value} }`
> - Compute `triggeredBy` from document's `updatedBy` field if available, else `'system'`
> - Audit log document shape: `{ action, collection, docId, diff, triggeredBy, timestamp, serverId }` (include a `serverId` from `process.env.K_REVISION` — Cloud Run revision name — for debugging which instance processed it)
>
> ### 3. `triggers/src/hardDeleteArchivedSite.js`
> Port `hardDeleteArchivedSite`. Key requirements:
> - Detect status change: `before.status !== 'archived' && after.status === 'archived'` (use `protoConverter.js`)
> - Idempotency: check if deletion already completed (e.g., check for a `hardDeletedAt` timestamp on the site document before starting; set it after completion)
> - Delete ALL subcollections under `sites/{siteId}`. After reading `firestore.rules` and `index.js`, list every subcollection found. Use recursive batch deletion (Firestore `listCollections()` → iterate)
> - Also delete all documents in flat `generators` and `drawings` collections where `siteId === deletedSiteId` (these are not subcollections in the current schema)
> - Use batched writes (max 500 ops per batch) to avoid timeouts
> - Write a final audit log entry: `{ action: 'site_hard_deleted', siteId, deletedAt }`
> - Handle the case where the Cloud Run instance times out mid-deletion (Cloud Functions 2nd gen timeout is 9 minutes by default): log progress and support resuming via the `hardDeletedAt` checkpoint pattern
>
> ### 4. `triggers/src/auditTriggers.js`
> All 5 audit logging triggers in one file:
> - `onGeneratorCreate`, `onGeneratorUpdate`, `onGeneratorDelete`
> - `onProjectCreate`, `onDrawingCreate`
> - All use the shared `auditLogger.js`
> - For update triggers: use `diffObjects` to record which fields changed
> - Export each as a separate Cloud Functions 2nd gen function with correct Eventarc event type annotation
>
> ### 5. `triggers/src/emailTriggers.js`
> Port `onUserProvisioned` and `onProjectMemberAdded`:
> - Both fetch the SendGrid API key from Secret Manager (use shared `secrets.js` from Workflow 1 if extractable, else duplicate the caching pattern)
> - `onUserProvisioned`: Detect new `pendingUsers/{email}` document creation. Extract email, displayName from converted data. Send welcome email. Handle SendGrid API errors gracefully (log but don't crash — avoid infinite retry loops)
> - `onProjectMemberAdded`: Detect if `members` array changed (compare before vs after). For each newly added member email, send invite email. Handle the case where `before` is null (onCreate case)
> - Dead letter handling: if email fails 3 times (Cloud Functions will retry on non-200 exit), write a `emailFailures/{id}` document for manual review
>
> ### 6. `triggers/package.json`
> - Minimal deps: `@google-cloud/functions-framework`, `firebase-admin`, `@google-cloud/secret-manager`, `@sendgrid/mail`
> - Do NOT include `firebase-functions`
> - Include `@google-cloud/functions-framework` as the entry point pattern
>
> ### 7. `triggers/deploy.sh`
> Shell script to deploy all triggers as Cloud Functions 2nd gen with correct Eventarc triggers:
> - Each function deployed with: `gcloud functions deploy <name> --gen2 --trigger-event-filters ...`
> - Include the exact `--trigger-event-filters` for each Firestore collection and event type
> - Set `--max-instances=10` (prevent runaway billing on large batch operations)
> - Set `--timeout=540s` (9 minutes — important for `hardDeleteArchivedSite`)
> - Service account with `roles/datastore.user`, `roles/secretmanager.secretAccessor`
>
> ### 8. Eventarc Configuration Notes (`triggers/EVENTARC_SETUP.md`)
> - How to enable required APIs: `eventarc.googleapis.com`, `cloudfunctions.googleapis.com`
> - How to grant the Eventarc service account `roles/eventarc.eventReceiver`
> - How to verify trigger registration in GCP Console
> - Known Eventarc limitations: at-least-once delivery, no ordering guarantees, variable delivery latency (seconds to minutes)
>
> ## Optimization Recommendations
>
> After completing the deliverables, provide an **"Optimization Recommendations"** section:
>
> 1. **Audit log consolidation:** Currently there are 5 separate trigger functions all doing nearly the same thing (write an audit log). Recommend consolidating to a single trigger that catches all collection changes using a Pub/Sub pattern: instead of individual Firestore triggers, have each Cloud Run API route publish to a Pub/Sub topic after every write, and a single Cloud Function consumes the topic and writes audit logs. Analyze the tradeoff vs the current approach.
>
> 2. **`hardDeleteArchivedSite` — batching and timeout risk:** Deleting thousands of generator records in a site under a 9-minute timeout is risky. Recommend implementing as a Cloud Tasks chain: trigger enqueues a `DELETE /internal/sites/:siteId/hard-delete` task on the Cloud Run API, which processes 500 records per invocation and re-enqueues itself if more remain. This is more resilient than a single long-running trigger. Provide the Cloud Tasks approach as an alternative implementation.
>
> 3. **Email delivery reliability:** SendGrid is called directly from a Cloud Function with at-least-once Eventarc delivery. If the function succeeds but SendGrid returns 500, Eventarc retries the whole function — potentially sending the email twice. Recommend: (a) write a `emailSent: true` flag to the Firestore document before sending, (b) check this flag at function start, (c) this makes the function idempotent. Implement this pattern.
>
> 4. **Protobuf conversion library:** Rather than implementing a custom converter, evaluate using `@google-cloud/firestore`'s `DocumentSnapshot.fromProto()` or the `firebase-admin` DocumentReference. Check if `firebase-admin` v12+ can reconstruct a document from Eventarc payload directly, which would eliminate the custom converter entirely.
>
> 5. **Eventarc dead letter topics:** Configure a Pub/Sub dead letter topic for each Eventarc trigger so failed events don't disappear silently. Provide the `gcloud` commands to set this up.
>
> 6. **Cost analysis:** Compare Cloud Functions 2nd gen pricing (invocations + compute time) vs Firebase Functions v1 for the current trigger volume. Estimate monthly trigger invocations based on app usage (assume 50 users, 20 asset operations/day each).
>
> ## Output Format
>
> 1. Start with **"Trigger Inventory"** — reproduce the trigger table above, but fill in the exact Firestore collection paths, subcollection structure, and email template IDs found in `index.js`.
> 2. Then **"Protobuf Type Reference"** — a table showing every Protobuf Value type, its JSON key, and its JS equivalent with example conversion.
> 3. Then each numbered deliverable as labeled code blocks.
> 4. End with **"Optimization Recommendations"**.
> 5. Mark idempotency risks with `🔴 Idempotency Risk:`.
> 6. Mark retry/infinite-loop risks with `🔴 Retry Risk:`.
> 7. Use `⚠️ Decision Required:` for design decisions requiring human input.
