/**
 * linear-orchestrator.js
 *
 * Cloud Functions for Linear ↔ AI Agent automation:
 *
 *   linearAgentWebhook  – receives Linear webhooks, validates HMAC,
 *                          writes a run log to Firestore, and dispatches
 *                          a repository_dispatch event to GitHub Actions.
 *
 *   agentRunLogger      – Firestore-triggered function that records timing
 *                          whenever an agent_run doc transitions state.
 *
 * Firestore schema  agent_runs/{runId}
 *   issueId          string   "EBOSS-88"
 *   issueLinearId    string   Linear UUID
 *   title            string
 *   description      string
 *   labels           string[]
 *   agentType        "claude-code" | "devin" | "codex" | "kimi" | "unknown"
 *   status           "dispatched" | "running" | "pr_opened" | "reviewing"
 *                    | "completed" | "failed" | "stalled"
 *   priority         number
 *   branchName       string
 *   startedAt        Timestamp
 *   updatedAt        Timestamp
 *   completedAt      Timestamp | null
 *   stalledAt        Timestamp | null
 *   error            string | null
 *   prUrl            string | null
 *   prNumber         number | null
 *   reviewResult     "approved" | "changes_requested" | null
 *   githubRunId      string | null
 *   durationMs       number | null   (set on completion)
 */

"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const https = require("https");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const db = () => admin.firestore();

/** Map Linear label names → agent types used by the GitHub Actions runner. */
const LABEL_TO_AGENT = {
  "Claude Code": "claude-code",
  "claude code":  "claude-code",
  "claude-code":  "claude-code",
  "Devin":        "devin",
  "devin":        "devin",
  "Codex":        "codex",
  "codex":        "codex",
  "Kimi":         "kimi",
  "kimi":         "kimi",
};

/** Stale threshold in milliseconds (90 minutes). */
const STALE_THRESHOLD_MS = 90 * 60 * 1000;

/**
 * Validate the Linear webhook HMAC-SHA256 signature.
 * Linear signs the raw body with the webhook signing secret.
 */
function validateLinearSignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature || "", "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Determine the agent type from an array of Linear label names.
 * Returns the first matched label or "unknown".
 */
function resolveAgentType(labels = []) {
  for (const label of labels) {
    const agent = LABEL_TO_AGENT[label];
    if (agent) return agent;
  }
  return "unknown";
}

/**
 * POST a repository_dispatch event to GitHub to kick off the agent runner
 * workflow (.github/workflows/agent-runner.yml).
 */
function dispatchToGitHub(payload, githubToken, repo) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      event_type: "linear-agent-dispatch",
      client_payload: payload,
    });

    const [owner, repoName] = repo.split("/");
    const options = {
      hostname: "api.github.com",
      path: `/repos/${owner}/${repoName}/dispatches`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "eboss-linear-orchestrator/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 204) {
        resolve({ ok: true });
      } else {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          reject(new Error(`GitHub dispatch failed ${res.statusCode}: ${data}`))
        );
      }
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Update a Linear issue's state via the Linear GraphQL API.
 * stateId must be the UUID of the target state in Linear.
 */
function updateLinearIssueState(issueId, stateId, linearToken) {
  return new Promise((resolve, reject) => {
    const query = JSON.stringify({
      query: `mutation UpdateIssue($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
          issue { id identifier state { name } }
        }
      }`,
      variables: { id: issueId, stateId },
    });

    const options = {
      hostname: "api.linear.app",
      path: "/graphql",
      method: "POST",
      headers: {
        "Authorization": linearToken,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(query),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });

    req.on("error", reject);
    req.write(query);
    req.end();
  });
}

/**
 * Post a comment on a Linear issue.
 */
function postLinearComment(issueId, body, linearToken) {
  return new Promise((resolve, reject) => {
    const query = JSON.stringify({
      query: `mutation AddComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }`,
      variables: { issueId, body },
    });

    const options = {
      hostname: "api.linear.app",
      path: "/graphql",
      method: "POST",
      headers: {
        "Authorization": linearToken,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(query),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.write(query);
    req.end();
  });
}

// ─── Cloud Function: linearAgentWebhook ──────────────────────────────────────

exports.linearAgentWebhook = functions.https.onRequest(async (req, res) => {
  // Only accept POST
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Validate Linear HMAC signature
  const linearSecret = process.env.LINEAR_WEBHOOK_SECRET;
  const signature = req.headers["linear-signature"];
  const rawBody = JSON.stringify(req.body); // Firebase parses JSON automatically

  if (linearSecret && !validateLinearSignature(rawBody, signature, linearSecret)) {
    functions.logger.warn("linearAgentWebhook: invalid signature", { signature });
    res.status(401).send("Unauthorized");
    return;
  }

  const event = req.body;
  functions.logger.info("linearAgentWebhook: received event", {
    type: event.type,
    action: event.action,
  });

  // We only care about Issue state changes to "In Progress"
  if (
    event.type !== "Issue" ||
    event.action !== "update" ||
    event.data?.state?.name !== "In Progress"
  ) {
    res.status(200).send("ignored");
    return;
  }

  // Skip if issue has no AI agent label
  const issue = event.data;
  const labelNames = (issue.labels || []).map((l) => l.name);
  const agentType = resolveAgentType(labelNames);

  if (agentType === "unknown") {
    functions.logger.info("linearAgentWebhook: no agent label, skipping", {
      issueId: issue.identifier,
    });
    res.status(200).send("no agent label");
    return;
  }

  const runId = `${issue.identifier}-${Date.now()}`;
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Write initial run log
  const runRef = db().collection("agent_runs").doc(runId);
  const runData = {
    runId,
    issueId:       issue.identifier,
    issueLinearId: issue.id,
    title:         issue.title || "",
    description:   issue.description || "",
    labels:        labelNames,
    agentType,
    status:        "dispatched",
    priority:      issue.priority || 0,
    branchName:    issue.branchName || "",
    startedAt:     now,
    updatedAt:     now,
    completedAt:   null,
    stalledAt:     null,
    error:         null,
    prUrl:         null,
    prNumber:      null,
    reviewResult:  null,
    githubRunId:   null,
    durationMs:    null,
  };

  await runRef.set(runData);
  functions.logger.info("linearAgentWebhook: run logged", { runId, agentType });

  // Dispatch to GitHub Actions
  const githubToken = process.env.GITHUB_DISPATCH_TOKEN;
  const githubRepo  = process.env.GITHUB_REPO; // "owner/repo"

  if (!githubToken || !githubRepo) {
    const err = "Missing GITHUB_DISPATCH_TOKEN or GITHUB_REPO env vars";
    functions.logger.error(err);
    await runRef.update({ status: "failed", error: err, updatedAt: now });
    res.status(500).send("Configuration error");
    return;
  }

  try {
    await dispatchToGitHub(
      {
        run_id:         runId,
        issue_id:       issue.identifier,
        issue_linear_id: issue.id,
        title:          issue.title || "",
        description:    issue.description || "",
        labels:         labelNames,
        agent_type:     agentType,
        branch_name:    issue.branchName || "",
        priority:       issue.priority || 0,
      },
      githubToken,
      githubRepo
    );

    functions.logger.info("linearAgentWebhook: dispatched to GitHub", { runId });
    res.status(200).json({ ok: true, runId, agentType });
  } catch (err) {
    functions.logger.error("linearAgentWebhook: GitHub dispatch failed", { err: err.message });
    await runRef.update({
      status:    "failed",
      error:     err.message,
      updatedAt: now,
    });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Cloud Function: agentRunStatusUpdate ────────────────────────────────────
//
// Called by GitHub Actions (via HTTP POST) to update a run's state.
// Accepts: { runId, status, prUrl, prNumber, githubRunId, error, reviewResult }

exports.agentRunStatusUpdate = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  // Verify shared secret (GitHub Actions passes it in Authorization header)
  const secret = process.env.AGENT_CALLBACK_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).send("Unauthorized");
    return;
  }

  const { runId, status, prUrl, prNumber, githubRunId, error, reviewResult } = req.body;
  if (!runId || !status) { res.status(400).send("runId and status required"); return; }

  const runRef = db().collection("agent_runs").doc(runId);
  const snap = await runRef.get();
  if (!snap.exists) { res.status(404).send("run not found"); return; }

  const existing = snap.data();
  const now = admin.firestore.Timestamp.now();

  const update = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(prUrl       != null && { prUrl }),
    ...(prNumber    != null && { prNumber }),
    ...(githubRunId != null && { githubRunId }),
    ...(error       != null && { error }),
    ...(reviewResult != null && { reviewResult }),
  };

  // Calculate duration when terminal state is reached
  if (["completed", "failed"].includes(status)) {
    update.completedAt = admin.firestore.FieldValue.serverTimestamp();
    if (existing.startedAt) {
      const startMs = existing.startedAt.toMillis();
      update.durationMs = now.toMillis() - startMs;
    }
  }

  await runRef.update(update);

  functions.logger.info("agentRunStatusUpdate", { runId, status, durationMs: update.durationMs });

  res.status(200).json({ ok: true });
});

// ─── Cloud Function: stalenessMonitor ────────────────────────────────────────
//
// Runs on a Cloud Scheduler job (every 30 min).
// Finds agent_runs stuck in "dispatched" or "running" for > STALE_THRESHOLD_MS.
// Marks them stalled in Firestore and posts a Linear comment.

exports.stalenessMonitor = functions.https.onRequest(async (req, res) => {
  // Verify internal cron caller header (Cloud Scheduler sets this)
  if (req.headers["x-cloudscheduler-jobname"] === undefined &&
      req.headers["x-appengine-cron"] === undefined &&
      req.headers["authorization"] !== `Bearer ${process.env.AGENT_CALLBACK_SECRET}`) {
    res.status(403).send("Forbidden");
    return;
  }

  const cutoff = admin.firestore.Timestamp.fromMillis(
    Date.now() - STALE_THRESHOLD_MS
  );

  const snap = await db()
    .collection("agent_runs")
    .where("status", "in", ["dispatched", "running"])
    .where("startedAt", "<", cutoff)
    .get();

  if (snap.empty) {
    functions.logger.info("stalenessMonitor: no stalled runs");
    res.status(200).json({ stalled: 0 });
    return;
  }

  const linearToken = process.env.LINEAR_API_KEY;
  const stalledIds = [];

  await Promise.all(
    snap.docs.map(async (doc) => {
      const run = doc.data();
      stalledIds.push(run.runId);

      functions.logger.warn("stalenessMonitor: stalled run detected", {
        runId:     run.runId,
        issueId:   run.issueId,
        agentType: run.agentType,
        status:    run.status,
        startedAt: run.startedAt?.toDate().toISOString(),
      });

      // Mark stalled in Firestore
      await doc.ref.update({
        status:    "stalled",
        stalledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Post comment on the Linear issue
      if (linearToken && run.issueLinearId) {
        const elapsedMin = Math.round(
          (Date.now() - run.startedAt.toMillis()) / 60000
        );
        const comment = [
          `⚠️ **Agent stalled** — no progress in ${elapsedMin} minutes.`,
          ``,
          `| Field | Value |`,
          `|---|---|`,
          `| Run ID | \`${run.runId}\` |`,
          `| Agent | \`${run.agentType}\` |`,
          `| Last status | \`${run.status}\` |`,
          `| Started | ${run.startedAt?.toDate().toISOString()} |`,
          ``,
          `Action: check the GitHub Actions run or re-trigger the agent.`,
        ].join("\n");

        await postLinearComment(run.issueLinearId, comment, linearToken).catch(
          (e) => functions.logger.error("stalenessMonitor: failed to post comment", { e: e.message })
        );
      }
    })
  );

  functions.logger.info("stalenessMonitor: marked stalled", { count: stalledIds.length, stalledIds });
  res.status(200).json({ stalled: stalledIds.length, stalledIds });
});
