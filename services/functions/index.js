const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

// Initialize Firebase Admin SDK
admin.initializeApp();

// ─── ANA Domain Auth ──────────────────────────────────────────────────────────

const ALLOWED_DOMAIN = process.env.ANA_ALLOWED_DOMAIN || "anacorp.com";
// Allow overriding initial admin via environment variable to avoid redeploys for changes
const INITIAL_ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || "dwarren@anacorp.com";
// System sentinel used for server-created/automated actions and audit logs
const SYSTEM_USER_ID = "system";

// ─── Secret Manager ───────────────────────────────────────────────────────────
// Secret IDs in Google Secret Manager (project: openai-mapset-eboss-map):
//   firebaseConfig            – Firebase web app config JSON
//   GOOGLE_MAPS_API_KEY       – Google Maps JavaScript API key
//   ANTHROPIC_GCLOUD_RUNTIME  – Anthropic API key ("gcloud runtime")
//   ANTHROPIC_MAPSET_TAG_PARSER – Anthropic API key ("MapSet Data Tag Parser")
//   Grok_API                  – Grok API key
//   Moonshot_API              – Moonshot/Kimi API key

const _secretClient = new SecretManagerServiceClient();
const _secretCache = new Map();

async function getSecret(secretId) {
  if (_secretCache.has(secretId)) return _secretCache.get(secretId);
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const [version] = await _secretClient.accessSecretVersion({
    name: `projects/${project}/secrets/${secretId}/versions/latest`,
  });
  const value = version.payload.data.toString("utf8");
  _secretCache.set(secretId, value);
  return value;
}

// Lazy Anthropic client — fetches key from Secret Manager on first call
let _anthropicClient = null;
async function getAnthropicClient() {
  if (_anthropicClient) return _anthropicClient;
  const key = await getSecret("ANTHROPIC_GCLOUD_RUNTIME");
  _anthropicClient = new Anthropic({ apiKey: key });
  return _anthropicClient;
}

// ANA EBOSS product line — capacity (kW) to model name mapping
// Used to format AI-generated unit IDs against known product specs
const EBOSS_PRODUCT_LINE = [
  { model: "EBOSS-25", kw: 24, kva: 30 },
  { model: "EBOSS-70", kw: 56, kva: 70 },
  { model: "EBOSS-125", kw: 100, kva: 125 },
  { model: "EBOSS-220", kw: 176, kva: 220 },
  { model: "BOSS400", kw: 320, kva: 400 },
];

// Returns the EBOSS model name for an exact kW match, or null if not found.
// Not called by current Cloud Functions (prompts use _kwToModelMap string instead),
// but retained as a utility for callers that need a programmatic kW→model lookup.
function getEbossModelForKw(capacityKw) {
  const match = EBOSS_PRODUCT_LINE.find(m => m.kw === capacityKw);
  return match ? match.model : null;
}

// Build descriptions dynamically so prompts stay in sync with EBOSS_PRODUCT_LINE
const _productLineDesc = EBOSS_PRODUCT_LINE
  .map(m => `${m.model} (${m.kw}kW/${m.kva}kVA)`)
  .join(", ");

const _kwToModelMap = EBOSS_PRODUCT_LINE
  .map(m => `${m.kw}kW→${m.model}`)
  .join(", ");

// Shared system context injected into all AI prompts for this project
const SITE_CONTEXT = `You are working with MapSet in Abilene, TX.
The generators on-site are ANA EBOSS and BOSS400 mobile battery-hybrid power units.
Product line (by rated output): ${_productLineDesc}.
Unit IDs follow the format: <MODEL>-<SERIAL> e.g. EBOSS-125-000042, BOSS400-000007.
The serial or asset number is a 6-digit number stenciled or painted on the unit (e.g., 000042, 000125).
It may appear without leading zeros on the unit itself (e.g., "42" means "000042").`;


const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// ─── ANA Domain Auth ──────────────────────────────────────────────────────────

const ALLOWED_DOMAIN = process.env.ANA_ALLOWED_DOMAIN || "anacorp.com";

/**
 * Validates and normalizes an email address.
 * Lowercases and trims whitespace, ensures a single '@', no consecutive dots,
 * and a domain with at least two non-empty segments.
 * @param {string} rawEmail
 * @returns {{ normalizedEmail: string, domain: string } | null} Normalized parts or null if invalid
 */
function normalizeEmailIfValid(rawEmail) {
  if (typeof rawEmail !== "string") return null;

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const parts = normalizedEmail.split("@");
  if (parts.length !== 2) return null;

  const [local, domain] = parts;
  if (!local || !domain || normalizedEmail.includes("..")) return null;

  const domainParts = domain.split(".");
  const hasValidDomain = domainParts.length >= 2 && domainParts.every(Boolean);

  return hasValidDomain ? { normalizedEmail, domain } : null;
}

function detectMimeTypeFromBase64(imageBase64, explicitMimeType) {
  if (typeof explicitMimeType === "string") {
    const normalizedType = explicitMimeType.trim().toLowerCase();
    if (ALLOWED_IMAGE_MIME_TYPES.has(normalizedType)) {
      return normalizedType;
    }
  }

  if (typeof imageBase64 !== "string" || imageBase64.trim() === "") {
    return "image/jpeg";
  }

  const trimmed = imageBase64.trim();
  if (trimmed.startsWith("data:")) {
    const headerMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const headerMime = headerMatch?.[1]?.toLowerCase();
    if (headerMime && ALLOWED_IMAGE_MIME_TYPES.has(headerMime)) {
      return headerMime;
    }
  }

  const base64Only = trimmed.includes(",") ? trimmed.split(",")[1] : trimmed;
  if (base64Only.startsWith("/9j/")) return "image/jpeg";
  if (base64Only.startsWith("iVBOR")) return "image/png";
  if (base64Only.startsWith("UklGR")) return "image/webp";
  if (base64Only.startsWith("R0lGOD")) return "image/gif";

  return "image/jpeg";
}

// ─── getAppConfig ─────────────────────────────────────────────────────────────
// Public HTTP endpoint (no auth) that returns Firebase web config + Maps API key
// fetched from Secret Manager. Called by the frontend before Firebase is initialised.
// Allowed origins are restricted to the hosted app and local dev servers.
const ALLOWED_ORIGINS = [
  "https://openai-mapset-eboss-map.web.app",
  "https://openai-mapset-eboss-map.firebaseapp.com",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
];

exports.getAppConfig = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const [firebaseConfigStr, mapsKey] = await Promise.all([
      getSecret("firebaseConfig"),
      getSecret("GOOGLE_MAPS_API_KEY"),
    ]);
    res.json({
      firebaseConfig: JSON.parse(firebaseConfigStr),
      googleMapsApiKey: mapsKey,
    });
  } catch (err) {
    functions.logger.error("getAppConfig: Secret Manager error", { message: err.message });
    res.status(500).json({ error: "Configuration unavailable" });
  }
});

exports.suggestAssetName = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid request payload.",
      );
    }

    const { metadata, fileName, imageBase64, mimeType } = data;

    if (typeof fileName !== "string" || fileName.trim() === "") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "fileName must be a non-empty string.",
      );
    }

    if (metadata !== undefined &&
      (metadata === null || typeof metadata !== "object" || Array.isArray(metadata))) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "metadata must be an object when provided.",
      );
    }

    if (imageBase64 !== undefined &&
      (typeof imageBase64 !== "string" || imageBase64.trim() === "")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "imageBase64 must be a non-empty base64 string when provided.",
      );
    }

    if (!metadata && !imageBase64) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Provide at least metadata or imageBase64.",
      );
    }

    const anthropic = await getAnthropicClient();
    let extractedInfo = {};

    // Step 1: If image provided, use vision to extract asset number and capacity
    if (imageBase64) {
      try {
        const base64Payload = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
        const mediaType = detectMimeTypeFromBase64(imageBase64, mimeType);

        const visionMessage = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Payload,
                  },
                },
                {
                  type: "text",
                  text: `${SITE_CONTEXT}

You are analyzing a photo of one of these generators. Carefully examine the image and extract EXACTLY what you see:

1. **Unit Serial/Asset Number**: Look for a 6-digit asset number stenciled, painted, or on a label/tag on the unit body. It may appear as fewer digits on the unit (e.g., "42" → asset number "000042"). Extract the number exactly as visible.
2. **Capacity/Rating**: Look for kW or kVA markings on the nameplate, side panel, or display (e.g., "125 kVA", "100 kW", "320kW"). If only kVA visible, calculate kW = kVA × 0.8.
3. **Model Name**: Look for "EBOSS 25", "EBOSS 70", "EBOSS 125", "EBOSS 220", or "BOSS400" text on the unit.
4. **Numeric kW**: The generator's output in kW as a number (e.g., 100 for EBOSS-125, 56 for EBOSS-70, 176 for EBOSS-220, 320 for BOSS400). Null if not determinable.

Be VERY specific. Extract text exactly as it appears on the unit.

Return ONLY valid JSON (no markdown, no extra text):
{"assetNumber": "exact serial/ID from unit or empty string", "capacity": "exact rating text from unit or empty string", "model": "EBOSS model name from unit or empty string", "kw": null}`,
                },
              ],
            },
          ],
        });

        const responseText = Array.isArray(visionMessage?.content) &&
          visionMessage.content.length > 0 &&
          typeof visionMessage.content[0]?.text === "string"
          ? visionMessage.content[0].text
          : "";
        console.log("Vision response:", responseText || "[empty response]");

        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedInfo = JSON.parse(jsonMatch[0]);
            console.log("Extracted info:", extractedInfo);
          }
        } catch (parseErr) {
          console.log("Could not parse vision extraction JSON from:", responseText);
        }
      } catch (visionErr) {
        console.error("Vision extraction error:", visionErr);
        // Continue with EXIF only if vision fails
      }
    }

    // Step 2: Build context from metadata + extracted visual info
    const contextParts = [
      extractedInfo.assetNumber && `Asset Number: ${extractedInfo.assetNumber}`,
      extractedInfo.capacity && `Capacity: ${extractedInfo.capacity}`,
      extractedInfo.model && `Model: ${extractedInfo.model}`,
      metadata?.make && `Camera: ${metadata.make} ${metadata.model || ""}`.trim(),
      metadata?.dateTime && `Taken: ${metadata.dateTime}`,
      Number.isFinite(metadata?.gps?.lat) && Number.isFinite(metadata?.gps?.lng) &&
      `GPS: ${metadata.gps.lat.toFixed(4)}, ${metadata.gps.lng.toFixed(4)}`,
      metadata?.imageDescription &&
      `Description: ${metadata.imageDescription}`,
      metadata?.userComment && `Comment: ${metadata.userComment}`,
      `Filename: ${fileName.trim()}`,
    ].filter(Boolean);

    const context_str = contextParts.join("\n");

    // Step 3: Call Claude to generate the asset name
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 48,
      messages: [
        {
          role: "user",
          content: `${SITE_CONTEXT}

Your task: generate a unit ID for one of these generators based on the extracted photo data below.

UNIT ID FORMAT RULES (strict priority order):
1. **Serial + Model visible**: Combine as <MODEL>-<SERIAL> — e.g. if model=EBOSS-125 and serial=42, output "EBOSS-125-000042" (zero-pad serial to 6 digits)
2. **Serial only (no model)**: If capacity is known, resolve model first (${_kwToModelMap}), then output <MODEL>-<SERIAL> (zero-pad serial to 6 digits)
3. **Model/capacity only (no serial)**: Output just the model name — EBOSS-25, EBOSS-70, EBOSS-125, EBOSS-220, or BOSS400
4. **Nothing useful**: Output "EBOSS-UNKNOWN"

Rules: uppercase, hyphens only, 2-25 characters, serial always zero-padded to 6 digits. Return ONLY the unit ID, no explanation.

Extracted data:
${context_str}`,
        },
      ],
    });

    const rawSuggestion = Array.isArray(message?.content) &&
      message.content.length > 0 &&
      typeof message.content[0]?.text === "string"
      ? message.content[0].text
      : "";

    const normalizedSuggestion = rawSuggestion
      .trim()
      .toUpperCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^A-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const suggestion = /^[A-Z0-9-]{2,25}$/.test(normalizedSuggestion)
      ? normalizedSuggestion
      : "EBOSS-UNKNOWN";

    if (suggestion === "EBOSS-UNKNOWN" && normalizedSuggestion !== "EBOSS-UNKNOWN") {
      functions.logger.warn("Model returned invalid suggestion; using fallback.", {
        rawSuggestion,
        normalizedSuggestion,
      });
    }

    // Parse numeric kW from vision extraction
    let numericKw = null;
    if (typeof extractedInfo.kw === "number" && extractedInfo.kw > 0) {
      numericKw = extractedInfo.kw;
    } else if (typeof extractedInfo.capacity === "string" && extractedInfo.capacity) {
      const kwMatch = extractedInfo.capacity.match(/(\d+(?:\.\d+)?)\s*kw/i);
      const kvaMatch = extractedInfo.capacity.match(/(\d+(?:\.\d+)?)\s*kva/i);
      if (kwMatch) numericKw = parseFloat(kwMatch[1]);
      else if (kvaMatch) numericKw = Math.round(parseFloat(kvaMatch[1]) * 0.8);
      // Snap to known product line kW value if close
      if (numericKw !== null) {
        const snap = EBOSS_PRODUCT_LINE.find(m => Math.abs(m.kw - numericKw) <= 5);
        if (snap) numericKw = snap.kw;
      }
    }

    console.log("Final suggestion:", suggestion, "kW:", numericKw);
    return { success: true, suggestion, kw: numericKw };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    functions.logger.error("Error calling Claude API:", {
      message: error?.message,
      status: error?.status,
      stack: error?.stack,
    });

    let errorCode = "API";
    if (error.status === 401) {
      errorCode = "AUTH";
    } else if (error.status === 429) {
      errorCode = "RATE_LIMIT";
    } else if (error.message?.includes("fetch")) {
      errorCode = "NETWORK";
    }

    throw new functions.https.HttpsError("internal", "AI naming failed", {
      code: errorCode,
    });
  }
});

// Site Management Functions

/**
 * Creates a new site document in Firestore
 * @param {string} name - Site name (required, max 100 chars)
 * @param {string} address - Site address (optional)
 * @param {number} lat - Site latitude (optional)
 * @param {number} lng - Site longitude (optional)
 * @returns {Object} {success: boolean, siteId: string}
 */
exports.siteCreate = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);

    const { name, address, lat, lng } = data;

    // Validate required fields
    if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Site name is required and must be 1-100 characters."
      );
    }

    // Validate optional coordinates
    if (lat !== undefined && typeof lat !== "number") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Latitude must be a number."
      );
    }
    if (lng !== undefined && typeof lng !== "number") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Longitude must be a number."
      );
    }

    const db = admin.firestore();
    const siteData = {
      name: name.trim(),
      address: address ? address.trim() : null,
      latitude: (lat != null) ? lat : null,
      longitude: (lng != null) ? lng : null,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("sites").add(siteData);

    functions.logger.info("Site created", { siteId: docRef.id, name: name.trim() });
    return { success: true, siteId: docRef.id };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error creating site", { message: error.message });
    throw new functions.https.HttpsError("internal", "Failed to create site");
  }
});

/**
 * Updates an existing site document
 * @param {string} siteId - Site document ID (required)
 * @param {Object} updates - Fields to update (name, address, lat, lng)
 * @returns {Object} {success: boolean}
 */
exports.siteEdit = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);

    const { siteId, updates } = data;

    if (typeof siteId !== "string" || siteId.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Site ID is required."
      );
    }

    if (!updates || typeof updates !== "object") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Updates object is required."
      );
    }

    const db = admin.firestore();
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only include provided fields
    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Site name must be a non-empty string."
        );
      }
      updateData.name = updates.name.trim();
    }

    if (updates.address !== undefined) {
      updateData.address = updates.address ? updates.address.trim() : null;
    }

    if (updates.latitude !== undefined) {
      if (updates.latitude !== null && typeof updates.latitude !== "number") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Latitude must be a number."
        );
      }
      updateData.latitude = updates.latitude;
    }

    if (updates.longitude !== undefined) {
      if (updates.longitude !== null && typeof updates.longitude !== "number") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Longitude must be a number."
        );
      }
      updateData.longitude = updates.longitude;
    }

    await db.collection("sites").doc(siteId).update(updateData);

    functions.logger.info("Site updated", { siteId });
    return { success: true };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error updating site", { message: error.message });
    throw new functions.https.HttpsError("internal", "Failed to update site");
  }
});

/**
 * Soft-deletes a site (sets status to "archived")
 * Async Cloud Function will trigger hard delete of all sub-collections
 * @param {string} siteId - Site document ID (required)
 * @returns {Object} {success: boolean}
 */
exports.siteDelete = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);

    const { siteId } = data;

    if (typeof siteId !== "string" || siteId.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Site ID is required."
      );
    }

    const db = admin.firestore();

    // Soft delete: mark as archived
    await db.collection("sites").doc(siteId).update({
      status: "archived",
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    functions.logger.info("Site soft-deleted (archiving for hard delete)", { siteId });
    return { success: true };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error deleting site", { message: error.message });
    throw new functions.https.HttpsError("internal", "Failed to delete site");
  }
});

/**
 * Cloud Function trigger: Hard-delete all subcollections when site is archived
 * Runs asynchronously; safe to retry on failure (idempotent)
 */
exports.hardDeleteArchivedSite = functions.firestore
  .document("sites/{siteId}")
  .onUpdate(async (change, context) => {
    const { siteId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger hard delete when status changes to "archived"
    if (before?.status !== "archived" && after?.status === "archived") {
      try {
        const db = admin.firestore();
        const storage = admin.storage();

        // Delete all generators in this site (flat collection, filtered by siteId)
        const generatorsSnapshot = await db
          .collection("generators")
          .where("siteId", "==", siteId)
          .get();

        // Batch delete generators in chunks of 500
        const generatorBatch = [];
        for (const doc of generatorsSnapshot.docs) {
          const generatorData = doc.data();

          // Delete associated photo from Storage if it exists
          if (generatorData.photoUrl) {
            try {
              // Extract storage path from URL
              const match = generatorData.photoUrl.match(/\/o\/(.+?)\?/);
              if (match) {
                const filePath = decodeURIComponent(match[1]);
                await storage.bucket().file(filePath).delete().catch(() => {
                  // File may not exist; ignore error
                });
              }
            } catch (storageErr) {
              functions.logger.warn("Could not delete photo", {
                siteId,
                generatorId: doc.id,
                error: storageErr.message
              });
            }
          }

          // Add to batch delete
          generatorBatch.push(db.collection("generators").doc(doc.id).delete());
        }

        // Execute batch deletes for generators
        await Promise.all(generatorBatch);

        // Delete all drawings in this site (flat collection, filtered by siteId)
        const drawingsSnapshot = await db
          .collection("drawings")
          .where("siteId", "==", siteId)
          .get();

        const drawingBatch = [];
        for (const doc of drawingsSnapshot.docs) {
          drawingBatch.push(db.collection("drawings").doc(doc.id).delete());
        }

        // Execute batch deletes for drawings
        await Promise.all(drawingBatch);

        // Finally, hard-delete the site document
        await db.collection("sites").doc(siteId).delete();

        functions.logger.info("Site hard-deleted (including all sub-collections)", {
          siteId,
          generatorsDeleted: generatorsSnapshot.size,
          drawingsDeleted: drawingsSnapshot.size
        });
      } catch (error) {
        functions.logger.error("Error hard-deleting archived site", {
          siteId,
          message: error.message
        });
        // Don't throw; allow function to complete so it can be retried
      }
    }
  });

/**
 * analyzeGeneratorPhoto — Gemini Vision alternative to suggestAssetName.
 *
 * Uses Vertex AI (Gemini 1.5 Flash) to read generator nameplates.
 * HTTP endpoint (POST) — accepts { image: <base64>, mimeType: <string> }
 * Returns { success, data: { id, kva, kw, confidence, notes } }
 *
 * Requires Vertex AI enabled on the Google Cloud project.
 * Optional: deploy with Cloud Function env var VERTEX_ENABLED=true to activate.
 */
exports.analyzeGeneratorPhoto = functions.https.onRequest(
  { cors: true, maxInstances: 10, timeoutSeconds: 60, memory: "512MiB", region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed. Use POST." });
      return;
    }
    try {
      // Lazy-require to avoid breaking jest tests when package not installed
      const { VertexAI } = require("@google-cloud/vertexai");
      const vertexAI = new VertexAI({ project: "openai-mapset-eboss-map", location: "us-central1" });
      const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const { image, mimeType = "image/jpeg" } = req.body;
      if (!image) {
        res.status(400).json({ error: "Missing 'image' field in request body" });
        return;
      }

      const base64Data = image.includes(",") ? image.split(",")[1] : image;

      const NAMEPLATE_PROMPT = `${SITE_CONTEXT}

You are analyzing a photo of one of these ANA EBOSS/BOSS400 generators.
Extract from the image:
1) Unit serial/asset number (stenciled or labeled, e.g. "042", "0127")
2) Model name if visible ("EBOSS 25", "EBOSS 70", "EBOSS 125", "EBOSS 220", "BOSS400")
3) kVA rating from nameplate
4) kW rating from nameplate (if absent but kVA present, set kW = kVA * 0.8)

Format the unit "id" field as: <MODEL>-<SERIAL> (e.g. "EBOSS-125-042").
If only serial found: resolve model from capacity (${_kwToModelMap}).
If no serial: use model name only (e.g. "EBOSS-125").

Respond ONLY with JSON: {"id":"...","kva":null,"kw":null,"confidence":"high|medium|low","notes":"..."}
Return {"error":"Not a generator nameplate","confidence":"high"} if not a generator photo.`;

      const response = await model.generateContent({
        contents: [{
          role: "user", parts: [
            { text: NAMEPLATE_PROMPT },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }],
        generationConfig: { temperature: 0.1, topK: 32, topP: 1, maxOutputTokens: 1024 }
      });

      const rawText = response.response.candidates[0].content.parts[0].text;
      let jsonString = rawText;
      if (rawText.includes("```json")) jsonString = rawText.split("```json")[1].split("```")[0].trim();
      else if (rawText.includes("```")) jsonString = rawText.split("```")[1].split("```")[0].trim();

      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        functions.logger.error("analyzeGeneratorPhoto: failed to parse JSON response", { rawText });
        res.status(500).json({ error: "Failed to parse AI response", rawResponse: rawText });
        return;
      }

      res.status(200).json({ success: true, data: parsedData, timestamp: new Date().toISOString() });
    } catch (error) {
      functions.logger.error("analyzeGeneratorPhoto error:", error.message);
      res.status(500).json({ error: "Failed to process image", details: error.message });
    }
  }
);


/**
 * Validates that the caller is authenticated with an ANA domain email.
 * @param {functions.https.CallableContext} context - Callable function context
 * @throws {functions.https.HttpsError} If unauthenticated, missing email, or domain is not allowed
 */
function validateAnaUser(context) {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required."
    );
  }

  const email = context.auth.token?.email;

  if (typeof email !== "string") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Email not available in auth token."
    );
  }

  const normalizedParts = normalizeEmailIfValid(email);
  if (!normalizedParts) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Invalid email format in auth token."
    );
  }

  if (normalizedParts.domain !== ALLOWED_DOMAIN.toLowerCase()) {
    throw new functions.https.HttpsError(
      "permission-denied",
      `Access restricted to ${ALLOWED_DOMAIN} domain.`
    );
  }
}

/**
 * health — simple health check endpoint.
 */
exports.health = functions.https.onRequest(
  { cors: true, region: "us-central1" },
  (req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "mapset-eboss-map-functions",
      timestamp: new Date().toISOString()
    });
  }
);


// ─── ANA Internal Auth & User Management ──────────────────────────────────────

const INITIAL_ADMIN_EMAIL = "dwarren@anacorp.com";

/**
 * Trigger: On user create/sign-in
 * - Creates user profile in Firestore if doesn't exist
 * - First user (dwarren@anacorp.com) becomes admin
 * - Subsequent users get 'pending' role until approved
 */
if (typeof functions.auth?.user === "function") {
  exports.onUserAuth = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    const bootstrapRef = db.collection("bootstrap").doc("admin_created");
    const email = (user.email || user.providerData?.[0]?.email || "").toLowerCase();
    const fallbackDisplayName = email ? email.split("@")[0] : "user";
    let displayName = user.displayName || null;
    let photoUrl = user.photoURL || user.providerData?.[0]?.photoURL || null;

    // Use a transaction to atomically check and set the bootstrap flag
    const wasFirstUser = await db.runTransaction(async (transaction) => {
      const bootstrapDoc = await transaction.get(bootstrapRef);
      if (bootstrapDoc.exists) {
        return false; // Admin already created
      }
      transaction.set(bootstrapRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return true;
    });

    const isInitialAdmin = email === INITIAL_ADMIN_EMAIL.toLowerCase();

    let pendingUserRef = null;
    let pendingUserData = null;
    if (email) {
      pendingUserRef = db.collection("pendingUsers").doc(email.replace(/\./g, "_"));
      const pendingUserDoc = await pendingUserRef.get();
      if (pendingUserDoc.exists) {
        pendingUserData = pendingUserDoc.data();
      }
    }

    const provisionedRole = pendingUserData?.role;
    const role = (wasFirstUser || isInitialAdmin)
      ? "admin"
      : (provisionedRole || "pending");
    const createdBy = (wasFirstUser || isInitialAdmin)
      ? SYSTEM_USER_ID
      : (pendingUserData?.provisionedBy || pendingUserData?.createdBy || null);
    displayName = displayName || pendingUserData?.displayName || fallbackDisplayName;
    photoUrl = photoUrl || pendingUserData?.photoUrl || null;

    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update last login
      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    await userRef.set({
      uid: user.uid,
      email: email,
      displayName: displayName,
      photoUrl: photoUrl,
      role: role,
      status: role === "pending" ? "pending_approval" : "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: createdBy,
    });

    if (pendingUserRef && pendingUserData) {
      await pendingUserRef.set({
        status: "processed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimedUid: user.uid,
      }, { merge: true });
    }

    functions.logger.info("User profile created", {
      uid: user.uid,
      email,
      role,
      isFirstUser: (wasFirstUser || isInitialAdmin)
    });
  });
}

/**
 * Admin: Provision a new user
 * Creates user profile and optionally sends invite
 */
exports.provisionUser = functions.https.onCall(async (data, context) => {
  try {
    // Verify caller is admin
    const callerEmail = validateAnaUser(context);
    const db = admin.firestore();

    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required."
      );
    }

    // Validate input
    const { email, role = "tech", displayName } = data;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Valid email required."
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split("@")[1];
    if (domain !== ALLOWED_DOMAIN.toLowerCase()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Email must be ${ALLOWED_DOMAIN} domain.`
      );
    }

    if (!["tech", "sales", "admin"].includes(role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Role must be: tech, sales, or admin."
      );
    }

    // Check if user already exists in Auth
    let uid;
    try {
      const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      uid = userRecord.uid;
    } catch (err) {
      // User doesn't exist in Auth yet - they'll be created on first login
      uid = null;
    }

    // Create or update user profile
    const userData = {
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: role,
      status: "active",  // Pre-approved since admin created it
      provisionedBy: context.auth.uid,
      provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (uid) {
      await db.collection("users").doc(uid).update(userData);
    } else {
      // Store by email for lookup when they first sign in
      await db.collection("pendingUsers").doc(normalizedEmail.replace(/\./g, "_")).set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    functions.logger.info("User provisioned", {
      email: normalizedEmail,
      role,
      by: callerEmail
    });

    return {
      success: true,
      email: normalizedEmail,
      role,
      message: uid ? "User updated" : "User will be activated on first login"
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error provisioning user:", error);
    throw new functions.https.HttpsError("internal", "Failed to provision user");
  }
});

/**
 * Admin: List all users
 */
exports.listUsers = functions.https.onCall(async (data, context) => {
  try {
    // Verify caller is admin
    validateAnaUser(context);
    const db = admin.firestore();

    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required."
      );
    }

    const snapshot = await db.collection("users")
      .orderBy("createdAt", "desc")
      .get();

    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      // Remove sensitive timestamps from client
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      lastLoginAt: doc.data().lastLoginAt?.toDate()?.toISOString(),
    }));

    return { success: true, users };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error listing users:", error);
    throw new functions.https.HttpsError("internal", "Failed to list users");
  }
});

/**
 * Admin: Update user role
 */
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  try {
    // Verify caller is admin
    validateAnaUser(context);
    const db = admin.firestore();

    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required."
      );
    }

    const { uid, role } = data;
    if (!uid || !role || !["tech", "sales", "admin"].includes(role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Valid uid and role required."
      );
    }

    await db.collection("users").doc(uid).update({
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    });

    return { success: true, uid, role };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error updating user role:", error);
    throw new functions.https.HttpsError("internal", "Failed to update role");
  }
});

/**
 * Get current user profile
 */
exports.getUserProfile = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);
    const db = admin.firestore();

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found. Contact admin."
      );
    }

    const userData = userDoc.data();
    if (userData.status === "pending_approval") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Account pending admin approval."
      );
    }

    return {
      success: true,
      profile: {
        uid: context.auth.uid,
        ...userData,
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        lastLoginAt: userData.lastLoginAt?.toDate()?.toISOString(),
      }
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error getting user profile:", error);
    throw new functions.https.HttpsError("internal", "Failed to get profile");
  }
});


// ─── Audit Logging System ────────────────────────────────────────────────────

/**
 * Writes an audit log entry without failing the calling flow.
 * Any write error is logged and swallowed by design.
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} logData
 * @returns {Promise<void>}
 */
async function safeAuditLog(db, logData) {
  try {
    await db.collection("auditLogs").add(logData);
  } catch (err) {
    functions.logger.error("Failed to write audit log:", err, { logData });
  }
}

/**
 * Firestore trigger: Log generator creates
 */
exports.onGeneratorCreate = functions.firestore
  .document("generators/{generatorId}")
  .onCreate(async (snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    await safeAuditLog(db, {
      action: "CREATE",
      resourceType: "generator",
      resourceId: context.params.generatorId,
      projectId: data.siteId,
      userId: data.createdBy || SYSTEM_USER_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        label: data.label,
        kw: data.kw,
        latitude: data.latitude,
        longitude: data.longitude
      }
    });
  });

/**
 * Firestore trigger: Log generator updates
 */
exports.onGeneratorUpdate = functions.firestore
  .document("generators/{generatorId}")
  .onUpdate(async (change, context) => {
    const db = admin.firestore();
    const before = change.before.data();
    const after = change.after.data();

    // Only log if meaningful changes
    const changes = {};
    const fieldsToTrack = ['label', 'kw', 'latitude', 'longitude', 'orientationDeg', 'photoUrl', 'project'];

    fieldsToTrack.forEach(field => {
      if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
        changes[field] = { before: before[field], after: after[field] };
      }
    });

    if (Object.keys(changes).length === 0) return;

    await safeAuditLog(db, {
      action: "UPDATE",
      resourceType: "generator",
      resourceId: context.params.generatorId,
      projectId: after.siteId,
      userId: after.updatedBy || after.createdBy || SYSTEM_USER_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: changes
    });
  });

/**
 * Firestore trigger: Log generator deletes (soft delete via flag or actual delete)
 */
exports.onGeneratorDelete = functions.firestore
  .document("generators/{generatorId}")
  .onDelete(async (snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    await safeAuditLog(db, {
      action: "DELETE",
      resourceType: "generator",
      resourceId: context.params.generatorId,
      projectId: data?.siteId || "unknown",
      userId: SYSTEM_USER_ID,  // Delete doesn't have context, track via client
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        label: data?.label || "unknown",
        deletedAt: new Date().toISOString()
      }
    });
  });

/**
 * Firestore trigger: Log project creates
 */
exports.onProjectCreate = functions.firestore
  .document("projects/{projectId}")
  .onCreate(async (snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    await safeAuditLog(db, {
      action: "CREATE",
      resourceType: "project",
      resourceId: context.params.projectId,
      projectId: context.params.projectId,
      userId: data.createdBy || "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        name: data.name,
        visibility: data.visibility
      }
    });
  });

/**
 * Firestore trigger: Log drawing operations
 */
exports.onDrawingCreate = functions.firestore
  .document("drawings/{drawingId}")
  .onCreate(async (snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    await safeAuditLog(db, {
      action: "CREATE",
      resourceType: "drawing",
      resourceId: context.params.drawingId,
      projectId: data.siteId,
      userId: data.createdBy || "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        type: data.type,
        label: data.label
      }
    });
  });

/**
 * Cloud Function: Query audit logs (admin only)
 */
exports.getAuditLogs = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);
    const db = admin.firestore();

    // Verify admin
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }

    const { projectId, limit = 50, startAfter } = data;
    let auditQuery = db.collection("auditLogs")
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (projectId) {
      auditQuery = auditQuery.where("projectId", "==", projectId);
    }

    if (startAfter) {
      const startDoc = await db.collection("auditLogs").doc(startAfter).get();
      if (startDoc.exists) {
        auditQuery = auditQuery.startAfter(startDoc);
      }
    }

    const snapshot = await auditQuery.get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()?.toISOString()
    }));

    return { success: true, logs };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error fetching audit logs:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch logs");
  }
});

/**
 * Cloud Function: Get activity summary for a project
 */
exports.getProjectActivity = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);
    const db = admin.firestore();
    const { projectId } = data;

    if (!projectId) {
      throw new functions.https.HttpsError("invalid-argument", "projectId required");
    }

    // Check membership
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Project not found");
    }

    const isMember = context.auth.uid in (projectDoc.data().members || {});
    if (!isMember && projectDoc.data().visibility !== "internal") {
      throw new functions.https.HttpsError("permission-denied", "Access denied");
    }

    // Get recent activity
    const recentSnapshot = await db.collection("auditLogs")
      .where("projectId", "==", projectId)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentActivity = recentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()?.toISOString()
    }));

    // Get stats
    const stats = {
      generatorsCreated: 0,
      generatorsUpdated: 0,
      drawingsCreated: 0
    };

    const statsSnapshot = await db.collection("auditLogs")
      .where("projectId", "==", projectId)
      .where("timestamp", ">", admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
      .get();

    statsSnapshot.docs.forEach(doc => {
      const log = doc.data();
      if (log.resourceType === "generator" && log.action === "CREATE") stats.generatorsCreated++;
      if (log.resourceType === "generator" && log.action === "UPDATE") stats.generatorsUpdated++;
      if (log.resourceType === "drawing" && log.action === "CREATE") stats.drawingsCreated++;
    });

    return { success: true, recentActivity, stats };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error fetching project activity:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch activity");
  }
});


// ─── Email Notification System ───────────────────────────────────────────────

const SENDGRID_API_KEY_SECRET = "SENDGRID_API_KEY";

/**
 * Send email using SendGrid (if configured) or log for development
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    // Try to get SendGrid API key from Secret Manager
    let apiKey;
    try {
      apiKey = await getSecret(SENDGRID_API_KEY_SECRET);
    } catch (err) {
      functions.logger.info("SendGrid not configured, logging email instead:", {
        to, subject, text: text?.substring(0, 100)
      });
      return { success: true, sent: false, reason: "SendGrid not configured" };
    }

    if (!apiKey) {
      functions.logger.info("No SendGrid API key, logging email:", { to, subject });
      return { success: true, sent: false, reason: "No API key" };
    }

    // Send via SendGrid API
    const axios = require("axios");
    await axios.post("https://api.sendgrid.com/v3/mail/send", {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@anacorp.com", name: "ANA EBOSS Planner" },
      subject: subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    functions.logger.info("Email sent:", { to, subject });
    return { success: true, sent: true };

  } catch (error) {
    functions.logger.error("Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Firestore trigger: Send email when user is provisioned
 */
exports.onUserProvisioned = functions.firestore
  .document("pendingUsers/{email}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const email = context.params.email.replace(/_/g, ".");

    const subject = "Welcome to ANA EBOSS Planner";
    const text = `Hello,

You've been invited to ANA EBOSS Planner by ${data.provisionedBy || "an administrator"}.

Role: ${data.role}
Access: Sign in with your ${ALLOWED_DOMAIN} Google account at the app URL.

The ANA Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Welcome to ANA EBOSS Planner</h2>
        <p>You've been invited by <strong>${data.provisionedBy || "an administrator"}</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your Role:</strong> ${data.role}</p>
          <p><strong>Sign in:</strong> Use your @${ALLOWED_DOMAIN} Google account</p>
        </div>
        <p style="color: #7f8c8d; font-size: 12px;">This is an automated message from ANA EBOSS Planner.</p>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });
  });

/**
 * Firestore trigger: Notify when added to project
 */
exports.onProjectMemberAdded = functions.firestore
  .document("projects/{projectId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;

    // Find new members
    const beforeMembers = Object.keys(before.members || {});
    const afterMembers = Object.keys(after.members || {});
    const newMembers = afterMembers.filter(uid => !beforeMembers.includes(uid));

    if (newMembers.length === 0) return;

    const db = admin.firestore();

    for (const uid of newMembers) {
      try {
        // Get user email
        const userRecord = await admin.auth().getUser(uid);
        const userEmail = userRecord.email;
        const memberData = after.members[uid];

        const subject = `Added to Project: ${after.name}`;
        const text = `Hello,

You've been added to the project "${after.name}" as a ${memberData.role}.

Access the project in ANA EBOSS Planner.

The ANA Team`;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2c3e50;">Added to Project</h2>
            <p>You've been added to <strong>${after.name}</strong> as a <strong>${memberData.role}</strong>.</p>
            <p>Access the project in ANA EBOSS Planner.</p>
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Project:</strong> ${after.name}</p>
              <p style="margin: 10px 0 0;"><strong>Your Role:</strong> ${memberData.role}</p>
            </div>
          </div>
        `;

        await sendEmail({ to: userEmail, subject, text, html });

      } catch (err) {
        functions.logger.error("Failed to send project invite email:", err);
      }
    }
  });

/**
 * Cloud Function: Test email configuration
 */
exports.testEmailConfig = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);
    const db = admin.firestore();

    // Only admins can test
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin required");
    }

    const email = context.auth.token.email;
    const result = await sendEmail({
      to: email,
      subject: "ANA EBOSS Planner - Email Test",
      text: "This is a test email from ANA EBOSS Planner.",
      html: "<h1>Test Email</h1><p>Your email configuration is working!</p>"
    });

    return result;

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message);
  }
});


// ─── Project Templates ───────────────────────────────────────────────────────

const PROJECT_TEMPLATES = {
  "mapset-abilene": {
    name: "MapSet Abilene Standard",
    description: "Standard layout for an Abilene MapSet site",
    center: { lat: 32.4487, lng: -99.7331 },
    zoom: 16,
    generators: [
      { label: "EBOSS-125-001", kw: 100, widthM: 2.5, lengthM: 4.2, orientationDeg: 0 },
      { label: "EBOSS-125-002", kw: 100, widthM: 2.5, lengthM: 4.2, orientationDeg: 0 },
      { label: "EBOSS-220-001", kw: 176, widthM: 3.0, lengthM: 5.0, orientationDeg: 0 },
    ],
    drawings: [
      {
        type: "rectangle",
        label: "Building A",
        category: "existing",
        bounds: { north: 32.4490, south: 32.4484, east: -99.7328, west: -99.7334 }
      }
    ]
  },
  "standard-10mw": {
    name: "10MW Data Center",
    description: "10MW capacity with redundant generators",
    generators: [
      { label: "BOSS400-001", kw: 320, widthM: 4.0, lengthM: 12.0, orientationDeg: 0 },
      { label: "BOSS400-002", kw: 320, widthM: 4.0, lengthM: 12.0, orientationDeg: 0 },
      { label: "BOSS400-003", kw: 320, widthM: 4.0, lengthM: 12.0, orientationDeg: 0 },
    ]
  },
  "mobile-temporary": {
    name: "Mobile Temporary Power",
    description: "Temporary power setup for events or maintenance",
    generators: [
      { label: "EBOSS-70-001", kw: 56, widthM: 2.0, lengthM: 3.5, orientationDeg: 0 },
      { label: "EBOSS-70-002", kw: 56, widthM: 2.0, lengthM: 3.5, orientationDeg: 0 },
    ]
  },
  "blank": {
    name: "Blank Project",
    description: "Start from scratch with empty project",
    generators: [],
    drawings: []
  }
};

/**
 * Cloud Function: List available project templates
 */
exports.listTemplates = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);

    // Return template metadata (without full data for efficiency)
    const templates = Object.entries(PROJECT_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      generatorCount: template.generators?.length || 0,
      drawingCount: template.drawings?.length || 0,
      hasCenter: !!template.center
    }));

    return { success: true, templates };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Create project from template
 */
exports.createProjectFromTemplate = functions.https.onCall(async (data, context) => {
  try {
    const email = validateAnaUser(context);
    const db = admin.firestore();
    const { templateId, projectName, address, lat, lng } = data;

    // Validate
    if (!templateId || !PROJECT_TEMPLATES[templateId]) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid template ID");
    }

    if (!projectName || projectName.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Project name required");
    }

    const template = PROJECT_TEMPLATES[templateId];

    // Create project
    const projectData = {
      name: projectName.trim(),
      address: address || null,
      latitude: lat || template.center?.lat || null,
      longitude: lng || template.center?.lng || null,
      zoom: template.zoom || 16,
      visibility: "internal",
      status: "active",
      createdBy: context.auth.uid,
      members: {
        [context.auth.uid]: { role: "admin", addedAt: admin.firestore.FieldValue.serverTimestamp() }
      },
      template: templateId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const projectRef = await db.collection("projects").add(projectData);
    const projectId = projectRef.id;

    // Create generators from template
    const generatorPromises = (template.generators || []).map((gen, index) => {
      // Offset positions slightly to prevent overlap
      const offsetLat = (index * 0.0001);
      const offsetLng = (index * 0.0001);

      return db.collection("generators").add({
        label: gen.label,
        kw: gen.kw,
        siteId: projectId,
        latitude: (lat || template.center?.lat || 32.4487) + offsetLat,
        longitude: (lng || template.center?.lng || -99.7331) + offsetLng,
        widthM: gen.widthM,
        lengthM: gen.lengthM,
        orientationDeg: gen.orientationDeg || 0,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await Promise.all(generatorPromises);

    // Create drawings from template
    const drawingPromises = (template.drawings || []).map(drawing => {
      return db.collection("drawings").add({
        ...drawing,
        siteId: projectId,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await Promise.all(drawingPromises);

    functions.logger.info("Project created from template", {
      projectId,
      template: templateId,
      by: email,
      generators: template.generators?.length || 0,
      drawings: template.drawings?.length || 0
    });

    return {
      success: true,
      projectId,
      projectName: projectData.name,
      generatorCount: template.generators?.length || 0,
      drawingCount: template.drawings?.length || 0
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error creating project from template:", error);
    throw new functions.https.HttpsError("internal", "Failed to create project");
  }
});

/**
 * Cloud Function: Save current project as template (admin only)
 */
exports.saveAsTemplate = functions.https.onCall(async (data, context) => {
  try {
    const email = validateAnaUser(context);
    const db = admin.firestore();
    const { projectId, templateName, templateDescription } = data;

    // Verify admin
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin required");
    }

    if (!projectId || !templateName) {
      throw new functions.https.HttpsError("invalid-argument", "Project ID and template name required");
    }

    // Get project data
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Project not found");
    }

    const project = projectDoc.data();

    // Get generators
    const generatorsSnapshot = await db.collection("generators")
      .where("siteId", "==", projectId)
      .get();

    const generators = generatorsSnapshot.docs.map(doc => {
      const g = doc.data();
      return {
        label: g.label,
        kw: g.kw,
        widthM: g.widthM,
        lengthM: g.lengthM,
        orientationDeg: g.orientationDeg || 0
      };
    });

    // Get drawings
    const drawingsSnapshot = await db.collection("drawings")
      .where("siteId", "==", projectId)
      .get();

    const drawings = drawingsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        type: d.type,
        label: d.label,
        category: d.category,
        color: d.color,
        strokeWeight: d.strokeWeight,
        fillOpacity: d.fillOpacity,
        path: d.path,
        bounds: d.bounds,
        center: d.center,
        radius: d.radius,
        position: d.position
      };
    });

    // Create template (stored in Firestore for persistence)
    const templateData = {
      name: templateName,
      description: templateDescription || `Template from ${project.name}`,
      center: project.latitude && project.longitude
        ? { lat: project.latitude, lng: project.longitude }
        : null,
      zoom: project.zoom || 16,
      generators,
      drawings,
      createdFrom: projectId,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isCustom: true
    };

    const templateRef = await db.collection("projectTemplates").add(templateData);

    functions.logger.info("Custom template created", {
      templateId: templateRef.id,
      name: templateName,
      fromProject: projectId,
      by: email
    });

    return {
      success: true,
      templateId: templateRef.id,
      name: templateName,
      generatorCount: generators.length,
      drawingCount: drawings.length
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error saving template:", error);
    throw new functions.https.HttpsError("internal", "Failed to save template");
  }
});

/**
 * Cloud Function: List custom templates (from Firestore)
 */
exports.listCustomTemplates = functions.https.onCall(async (data, context) => {
  try {
    validateAnaUser(context);
    const db = admin.firestore();

    const snapshot = await db.collection("projectTemplates")
      .orderBy("createdAt", "desc")
      .get();

    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      generatorCount: doc.data().generators?.length || 0,
      drawingCount: doc.data().drawings?.length || 0,
      hasCenter: !!doc.data().center,
      isCustom: true,
      createdAt: doc.data().createdAt?.toDate()?.toISOString()
    }));

    return { success: true, templates };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Create project from custom template
 */
exports.createFromCustomTemplate = functions.https.onCall(async (data, context) => {
  try {
    const email = validateAnaUser(context);
    const db = admin.firestore();
    const { templateId, projectName, address, lat, lng } = data;

    // Get custom template
    const templateDoc = await db.collection("projectTemplates").doc(templateId).get();
    if (!templateDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Template not found");
    }

    const template = templateDoc.data();

    // Create project
    const projectData = {
      name: projectName?.trim() || `${template.name} Copy`,
      address: address || null,
      latitude: lat || template.center?.lat || null,
      longitude: lng || template.center?.lng || null,
      zoom: template.zoom || 16,
      visibility: "internal",
      status: "active",
      createdBy: context.auth.uid,
      members: {
        [context.auth.uid]: { role: "admin", addedAt: admin.firestore.FieldValue.serverTimestamp() }
      },
      template: templateId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const projectRef = await db.collection("projects").add(projectData);
    const projectId = projectRef.id;

    // Create generators
    const generatorPromises = (template.generators || []).map((gen, index) => {
      const offsetLat = (index * 0.0001);
      const offsetLng = (index * 0.0001);

      return db.collection("generators").add({
        label: gen.label,
        kw: gen.kw,
        siteId: projectId,
        latitude: (lat || template.center?.lat || 32.4487) + offsetLat,
        longitude: (lng || template.center?.lng || -99.7331) + offsetLng,
        widthM: gen.widthM,
        lengthM: gen.lengthM,
        orientationDeg: gen.orientationDeg || 0,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await Promise.all(generatorPromises);

    // Create drawings
    const drawingPromises = (template.drawings || []).map(drawing => {
      return db.collection("drawings").add({
        ...drawing,
        siteId: projectId,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await Promise.all(drawingPromises);

    return {
      success: true,
      projectId,
      projectName: projectData.name,
      generatorCount: template.generators?.length || 0,
      drawingCount: template.drawings?.length || 0
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("Error creating from custom template:", error);
    throw new functions.https.HttpsError("internal", "Failed to create project");
  }
});

