/**
 * linear-bridge — Tailscale-native Linear → OpenClaw webhook bridge
 *
 * Receives Linear webhooks, validates HMAC, and dispatches OpenClaw tasks
 * for issues labelled "OpenClaw" that move to "In Progress".
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in values
 *   2. pnpm dev          (or: pnpm start)
 *   3. tailscale funnel 3000
 *   4. Add https://<machine>.ts.net/linear as a Linear webhook URL
 */

import "dotenv/config";
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

// ── Config ──────────────────────────────────────────────────────────────────

const PORT                 = parseInt(process.env.PORT                 ?? "3000");
const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET        ?? "";
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN      ?? "";
const OPENCLAW_WHATSAPP_TO  = process.env.OPENCLAW_WHATSAPP_TO         ?? "";
const OPENCLAW_HOST         = process.env.OPENCLAW_HOST                ?? "127.0.0.1";
const OPENCLAW_PORT         = parseInt(process.env.OPENCLAW_PORT       ?? "18789");
const GITHUB_REPO           = process.env.GITHUB_REPO                  ?? "";   // e.g. "org/repo"

const OPENCLAW_BASE = `http://${OPENCLAW_HOST}:${OPENCLAW_PORT}`;

// Labels that route an issue to OpenClaw
const OPENCLAW_LABELS = new Set(["OpenClaw", "openclaw", "Openclaw"]);

// ── HMAC validation ──────────────────────────────────────────────────────────

function validateSignature(rawBody: string, signature: string): boolean {
  if (!LINEAR_WEBHOOK_SECRET) return true; // disabled — warn on startup
  const expected = createHmac("sha256", LINEAR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature ?? "", "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

// ── OpenClaw helpers ─────────────────────────────────────────────────────────

async function callOpenClaw(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${OPENCLAW_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENCLAW_GATEWAY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(32 * 60 * 1000), // 32 min
  });
  if (!res.ok) throw new Error(`OpenClaw ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendWhatsApp(message: string): Promise<void> {
  if (!OPENCLAW_WHATSAPP_TO) return;
  try {
    await callOpenClaw("/hooks/agent", {
      message,
      deliver: true,
      channel: "whatsapp",
      to: OPENCLAW_WHATSAPP_TO,
      timeoutSeconds: 30,
    });
  } catch (err) {
    console.error("[bridge] WhatsApp delivery failed:", err);
  }
}

// ── Prompt (mirrors agent-runner.yml) ────────────────────────────────────────

function buildPrompt(
  issueId: string,
  title: string,
  description: string | undefined,
  branchName: string,
): string {
  return `You are working in the EBOSS monorepo (Vite + React + Supabase, pnpm workspaces).
The unified app is apps/manager. Shared packages live in packages/.

## Linear Issue: ${issueId} — ${title}

${description ?? "(no description provided)"}

## Instructions
1. Read relevant source files before making any changes.
2. Implement only what the issue describes — no scope creep.
3. Create and push the branch:
   git checkout -b ${branchName} && git push origin ${branchName}
4. After implementing, run: pnpm --dir apps/manager run typecheck && pnpm turbo run lint
5. Commit all changes with message: feat(${issueId}): <short description>
6. Push the branch: git push origin ${branchName}
7. Open a PR using gh cli:
   gh pr create --title "${issueId}: ${title}" --body "Automated OpenClaw implementation" --label "ai-agent,openclaw" --base main --head "${branchName}"
8. In your FINAL reply, include the PR URL on its own line starting with PR:
   Example: PR: https://github.com/${GITHUB_REPO}/pull/123

Repo: ${GITHUB_REPO}`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

// ── Task processor (runs in background after 200 is sent) ────────────────────

interface LinearIssueData {
  identifier: string;
  title: string;
  description?: string;
  branchName?: string;
  labels?: Array<{ name: string }>;
}

async function processIssue(data: LinearIssueData): Promise<void> {
  const { identifier: issueId, title, description, branchName } = data;
  const branch = branchName ?? `openclaw/${issueId.toLowerCase()}-${slugify(title)}`;
  const runId  = `${issueId}-${Date.now()}`;

  console.log(`[bridge] ▶ ${issueId}: ${title} (branch: ${branch})`);

  try {
    const response = await callOpenClaw("/v1/responses", {
      model:  "openclaw",
      input:  buildPrompt(issueId, title, description, branch),
      stream: false,
      user:   runId,
    }) as { output?: Array<{ content?: Array<{ type: string; text: string }> }> };

    // Extract agent's text reply
    const text = response?.output
      ?.flatMap((o) => o.content ?? [])
      .find((c) => c.type === "text")?.text ?? "";

    const prMatch = text.match(/PR:\s*(https?:\/\/\S+)/i);
    const prUrl   = prMatch?.[1] ?? "(no PR URL in response)";

    console.log(`[bridge] ✓ ${issueId} complete — PR: ${prUrl}`);
    await sendWhatsApp(`✅ OpenClaw task complete\n${issueId}: ${title}\nPR: ${prUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[bridge] ✗ ${issueId} failed:`, msg);
    await sendWhatsApp(`❌ OpenClaw task failed\n${issueId}: ${title}\nError: ${msg}`);
  }
}

// ── HTTP server ──────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // Health check — useful for Tailscale Funnel verification
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.method !== "POST" || req.url !== "/linear") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  // Buffer raw body before parsing (needed for HMAC over exact bytes)
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const rawBody = Buffer.concat(chunks).toString("utf-8");

  const signature = (req.headers["linear-signature"] as string) ?? "";
  if (!validateSignature(rawBody, signature)) {
    console.warn("[bridge] Invalid Linear signature — rejected");
    res.writeHead(401);
    res.end("Unauthorized");
    return;
  }

  let payload: { type?: string; action?: string; data?: LinearIssueData };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  const { type, action, data } = payload;
  const isIssueUpdate    = type === "Issue" && action === "update";
  const isInProgress     = data?.labels !== undefined && true; // state checked below
  const stateName        = (payload as { data?: { state?: { name?: string } } }).data?.state?.name;
  const hasOpenClawLabel = data?.labels?.some((l) => OPENCLAW_LABELS.has(l.name)) ?? false;

  if (!isIssueUpdate || stateName !== "In Progress" || !hasOpenClawLabel) {
    // Acknowledge but skip — not our concern
    res.writeHead(200);
    res.end("ok");
    return;
  }

  // Respond immediately so Linear doesn't time out
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("accepted");

  // Fire and forget — OpenClaw task runs in background
  processIssue(data!).catch((err) => console.error("[bridge] Unhandled:", err));
});

server.listen(PORT, () => {
  console.log(`[bridge] Listening on :${PORT}`);
  console.log(`[bridge] OpenClaw: ${OPENCLAW_BASE}`);
  if (!LINEAR_WEBHOOK_SECRET)  console.warn("[bridge] ⚠ LINEAR_WEBHOOK_SECRET not set — HMAC disabled");
  if (!OPENCLAW_GATEWAY_TOKEN) console.warn("[bridge] ⚠ OPENCLAW_GATEWAY_TOKEN not set");
  if (!OPENCLAW_WHATSAPP_TO)   console.warn("[bridge] ⚠ OPENCLAW_WHATSAPP_TO not set — WhatsApp disabled");
  if (!GITHUB_REPO)            console.warn("[bridge] ⚠ GITHUB_REPO not set — PR URLs will be incomplete");
});
