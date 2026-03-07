# Remove `projects` Fallback From Firestore Rules

## Overview

This change removes the legacy `/projects/{id}` fallback used when resolving `siteId` in Firestore rules. After this change, generator and drawing authorization resolves only against `/sites/{siteId}`.

## Motivation

- Reduce authorization ambiguity between legacy `projects` and canonical `sites`.
- Tighten access controls by eliminating an unintended allow path.
- Align rules behavior with the active multi-site model (`sites` collection only).

## Scope

- Rules helper update in `firestore.rules`: `isResolvableContainer(siteId)` now checks `siteExists(siteId)` only.
- Test matrix update in `functions/__tests__/firestore.rules.matrix.test.js`:
  - Deny generator reads keyed only by `/projects/{id}`.
  - Deny drawing create keyed only by `/projects/{id}`.
  - Deny drawing update keyed only by `/projects/{id}`.

No runtime feature flag exists for this fallback. The effective control point is the Firestore rules helper function name `isResolvableContainer`.

## Step-by-Step Removal

1. Apply the patch:

```bash
git apply docs/followups/remove-projects-fallback.patch
```

1. Verify test updates:

```bash
cd functions
npm test -- firestore.rules.matrix.test.js
```

1. Validate Firestore rules compile:

```bash
firebase deploy --only firestore:rules --dry-run
```

1. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

1. Post-deployment verification:

- Confirm deployed rules timestamp/version in Firebase Console matches this rollout.
- Run a quick access sanity check to validate path behavior:
  - `/sites/{id}` reads should succeed for valid authenticated users.
  - `/projects/{id}` fallback-based access should be denied.

Example (emulator-style quick check using the Firebase Emulator):

```bash
# Runs the Firestore emulator and executes the test against it
firebase emulators:exec --only firestore "cd functions && npm test -- firestore.rules.matrix.test.js"
```

For a direct smoke test, use a small Admin/Client SDK script that attempts:

- read/write against a valid `siteId` in `/sites/{id}`-scoped docs
- read/write using a `siteId` that exists only in `/projects/{id}`

## Data / Migration Notes

- No data migration script is required.
- Existing documents with `siteId` values that only map to `/projects/{id}` will be denied for create/update paths and for guarded read paths.
- If legacy data must remain accessible, migrate those documents so `siteId` points to valid `/sites/{id}` documents before rollout.
- Before rollout, identify affected records in `generators`, `drawings`, and any other `siteId`-scoped collections.

Copy-paste Admin SDK check (Node.js) to find `siteId` values that exist under `/projects/{id}` but not `/sites/{id}`:

```js
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

async function findProjectOnlySiteIds(collectionName) {
  const snap = await db.collection(collectionName).get();
  const hits = [];
  for (const doc of snap.docs) {
    const siteId = doc.get("siteId");
    if (!siteId || typeof siteId !== "string") continue;
    const [siteDoc, projectDoc] = await Promise.all([
      db.collection("sites").doc(siteId).get(),
      db.collection("projects").doc(siteId).get(),
    ]);
    if (!siteDoc.exists && projectDoc.exists) {
      hits.push({ collection: collectionName, id: doc.id, siteId });
    }
  }
  return hits;
}

(async () => {
  const collections = ["generators", "drawings"];
  const results = (await Promise.all(collections.map(findProjectOnlySiteIds))).flat();
  console.table(results);
  // Export/save this list before rollout for migration tracking.
})();
```

## Rollout Guidance

- Roll out in a low-traffic window.
- Confirm all active sites exist in `/sites` and that client flows write `siteId` from site IDs only.
- Monitor client error rates for permission-denied (`403`) responses on `generators` and `drawings`.
- Suggested baseline: typical `403` rate should remain below `0.1%` of total requests for each collection in normal traffic.
- Alert threshold:
  - Trigger warning if `403` rate increases by `>0.3%` above established baseline.
  - Trigger critical alert if `403` rate exceeds `0.5%` sustained for `5 minutes`.
- Evaluate in rolling windows of `5–15 minutes` to reduce false positives while catching rollout regressions quickly.

## Rollback Guidance

1. Revert the patch:

```bash
git apply --reverse docs/followups/remove-projects-fallback.patch
```

1. Re-run validation:

```bash
cd functions
npm test -- firestore.rules.matrix.test.js
firebase deploy --only firestore:rules --dry-run
```

1. Redeploy rules:

```bash
firebase deploy --only firestore:rules
```

## Verification Checklist

- `firestore.rules.matrix.test.js` passes for sites-only behavior.
- Reads/writes with valid `/sites/{id}` succeed.
- Reads/creates/updates keyed only by `/projects/{id}` are denied.
- Existing legacy unscoped read behavior (if intentionally retained in rules) is unchanged.
