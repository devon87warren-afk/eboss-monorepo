#!/usr/bin/env node
/**
 * Kimi Code Swarm — MapSet EBOSS Map
 *
 * Calls Moonshot AI's moonshot-v1-32k in parallel with 5 specialized roles.
 * Usage: node scripts/kimi-swarm.js "<task description>"
 *
 * Requires: KIMI_API_KEY environment variable
 * Node.js 18+ (uses native fetch)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// ─── Constants ────────────────────────────────────────────────────────────────

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const MODEL = 'moonshot-v1-32k';
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.2;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

const WORKERS = [
  {
    name: 'architect',
    outputFile: 'architect-output.md',
    instructions: `Design the complete file structure for this feature.
List every file to create or modify, its purpose, and the exported functions/types.
Include interface contracts and data flow between modules.
Output as Markdown with code blocks for type signatures and function signatures.
Be specific about which existing files (js/app.js, index.html, styles.css) need edits and exactly where.`,
  },
  {
    name: 'implementer',
    outputFile: 'implementer-output.js',
    instructions: `Write the complete implementation for this feature.
Rules you MUST follow:
- Use existing patterns from the injected app.js code exactly
- Firebase imports: CDN ES6 only (https://www.gstatic.com/firebasejs/10.8.0/...)  — NEVER npm
- No var — only const and let
- All async functions need try/catch with showStatusMessage() for user-facing errors
- Firestore field names: camelCase (photoURL, widthM, siteId)
- Global state variables: camelCase declared at top of js/app.js
- DOM IDs: kebab-case (#cost-analysis-button)
- Functions: camelCase, verb-first (updateAssetList, deleteAsset)
Output raw JavaScript only. No markdown prose outside of JSDoc comments.`,
  },
  {
    name: 'test-writer',
    outputFile: 'tests-output.js',
    instructions: `Write a comprehensive Jest test suite for this feature.
Cover: happy path, error cases, edge cases, and boundary conditions.
Use describe/it blocks with descriptive names.
Mock Firebase (jest.mock) and DOM APIs as needed.
Follow patterns used in functions/__tests__/ if relevant.
Output raw JavaScript only.`,
  },
  {
    name: 'security-auditor',
    outputFile: 'security-report.md',
    instructions: `Audit the proposed implementation for security vulnerabilities.
Check each of the following and mark PASS or FAIL:
1. NoSQL Injection — user input sanitized before Firestore queries
2. XSS — no innerHTML with untrusted content; textContent used instead
3. API Key Exposure — no hardcoded keys; Cloud Functions proxy used
4. Firestore Rules — rules validate siteId, reject unauthorized writes
5. Input Validation — all user inputs validated before use
6. CORS — no cross-origin risks introduced
7. Unvalidated Redirects — no redirect logic with user-controlled URLs
8. Prototype Pollution — no Object.assign from untrusted sources
For each FAIL: provide the specific line/pattern and the fix.
Output as Markdown with a summary table at the top.`,
  },
  {
    name: 'integrator',
    outputFile: 'integrator-output.js',
    instructions: `Write the Firestore onSnapshot listeners, DOM event listener bindings,
and localStorage persistence code for this feature.
Follow the exact pattern of listenToAssets() in the injected app.js code.
Key requirements:
- Clean up listeners on site switch (store unsubscribe functions)
- localStorage keys must use 'eboss_' prefix
- Event listeners attached in initApp() or a dedicated init function
- Use the existing showStatusMessage() for feedback
- siteId must be included in all Firestore queries (where('siteId', '==', activeSiteId))
Output raw JavaScript only.`,
  },
];

// ─── Context Loading ──────────────────────────────────────────────────────────

function readProjectContext() {
  const snippets = {};

  // CLAUDE.md — full file (project conventions + schema)
  try {
    snippets.claudeMd = readFileSync(join(PROJECT_ROOT, 'CLAUDE.md'), 'utf8');
  } catch {
    snippets.claudeMd = '(CLAUDE.md not found)';
  }

  // js/app.js — first 500 lines
  try {
    const appJs = readFileSync(join(PROJECT_ROOT, 'js', 'app.js'), 'utf8');
    snippets.appJs = appJs.split('\n').slice(0, 500).join('\n');
  } catch {
    snippets.appJs = '(js/app.js not found)';
  }

  // functions/index.js — first 300 lines
  try {
    const fnJs = readFileSync(join(PROJECT_ROOT, 'functions', 'index.js'), 'utf8');
    snippets.functionsJs = fnJs.split('\n').slice(0, 300).join('\n');
  } catch {
    snippets.functionsJs = '(functions/index.js not found)';
  }

  return snippets;
}

// ─── Prompt Building ──────────────────────────────────────────────────────────

function buildSystemPrompt(worker, context) {
  return `You are an expert JavaScript developer working on the MapSet EBOSS Map project.
Your output will be reviewed by a verification agent and must pass strict standards.

## Project Architecture
- Vanilla HTML5/CSS3/JS (ES6+, no frameworks)
- Google Maps JavaScript API with AdvancedMarkerElement
- Firebase Firestore (CDN ES6 imports, NOT npm)
- Firebase Cloud Functions (Node.js 20, Firebase Functions v5)
- Firebase Storage for photo uploads

## Critical Conventions
- Global state: camelCase at top of js/app.js
- DOM IDs: kebab-case (#cost-analysis-button)
- CSS classes: kebab-case (.asset-details)
- Firestore fields: camelCase (photoURL, widthM, siteId)
- Functions: camelCase, verb-first (updateAssetList, deleteAsset)
- Firebase imports: CDN URLs ONLY (https://www.gstatic.com/firebasejs/10.8.0/...)
- Error handling: try/catch with showStatusMessage() for user-facing errors

## Firestore Schema
generators/{docId}: { id, name, lat, lng, capacity(kW), project, widthM, lengthM, orientationDeg, photoURL, siteId, timestamp }
drawings/{docId}: { type, label, category, color, strokeWeight, path, siteId }
sites/{siteId}: { name, address, latitude, longitude, status, createdAt, updatedAt }

## Existing Code — js/app.js (first 500 lines)
\`\`\`javascript
${context.appJs}
\`\`\`

## Existing Code — functions/index.js (first 300 lines)
\`\`\`javascript
${context.functionsJs}
\`\`\`

## Project Documentation (CLAUDE.md excerpt — conventions & schema)
${context.claudeMd.slice(0, 3000)}

---

## Your Role: ${worker.name.toUpperCase()}
${worker.instructions}`;
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function callKimiWithRetry(worker, systemPrompt, task, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `TASK: ${task}\n\nYour role: ${worker.name}\n\nProduce ONLY code/markdown. No explanations outside code blocks.`,
          },
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      }),
    });

    clearTimeout(timer);

    // Rate limit — exponential backoff
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`  [${worker.name}] Rate limited (429). Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return callKimiWithRetry(worker, systemPrompt, task, attempt + 1);
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const tokens = data.usage?.total_tokens ?? 0;
    return { content, tokens };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
}

// ─── Swarm Orchestration ──────────────────────────────────────────────────────

async function runSwarm(task, context) {
  console.log(`\nKimi Swarm starting — task: "${task}"`);
  console.log(`Running ${WORKERS.length} workers in parallel...\n`);

  const results = await Promise.allSettled(
    WORKERS.map(async (worker) => {
      console.log(`  [${worker.name}] Starting...`);
      const systemPrompt = buildSystemPrompt(worker, context);

      try {
        const { content, tokens } = await callKimiWithRetry(worker, systemPrompt, task);
        console.log(`  [${worker.name}] Done ✓ (${tokens} tokens)`);
        return { worker, content, tokens, error: null };
      } catch (err) {
        console.error(`  [${worker.name}] Failed: ${err.message}`);
        return { worker, content: `ERROR: ${err.message}`, tokens: 0, error: err.message };
      }
    })
  );

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { ...r.reason, error: r.reason?.message }));
}

// ─── Output Writing ───────────────────────────────────────────────────────────

function writeOutputs(task, results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = join(PROJECT_ROOT, 'kimi-output', timestamp);

  mkdirSync(outputDir, { recursive: true });

  const summary = {
    task,
    timestamp: new Date().toISOString(),
    outputDir,
    workers: {},
  };

  for (const result of results) {
    const { worker, content, tokens, error } = result;
    const filePath = join(outputDir, worker.outputFile);

    writeFileSync(filePath, content, 'utf8');

    summary.workers[worker.name] = {
      status: error ? 'error' : 'success',
      file: worker.outputFile,
      tokens,
      ...(error ? { error } : {}),
    };
  }

  const summaryPath = join(outputDir, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  return { outputDir, summary, summaryPath };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const task = process.argv.slice(2).join(' ').trim();

  if (!task) {
    console.error('Usage: node scripts/kimi-swarm.js "<task description>"');
    process.exit(1);
  }

  if (!process.env.KIMI_API_KEY) {
    console.error(
      'Error: KIMI_API_KEY environment variable is not set.\n' +
      'Set it with:\n' +
      '  Linux/Mac: export KIMI_API_KEY=sk-...\n' +
      '  Windows CMD: set KIMI_API_KEY=sk-...\n' +
      '  Windows PowerShell: $env:KIMI_API_KEY="sk-..."'
    );
    process.exit(1);
  }

  const context = readProjectContext();
  const results = await runSwarm(task, context);
  const { outputDir, summary, summaryPath } = writeOutputs(task, results);

  // Print summary
  console.log('\n─── Swarm Complete ─────────────────────────────────');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Summary: ${summaryPath}\n`);

  const statuses = Object.entries(summary.workers);
  const successes = statuses.filter(([, w]) => w.status === 'success').length;
  const failures = statuses.filter(([, w]) => w.status === 'error').length;

  console.log(`Workers: ${successes}/${statuses.length} succeeded`);
  if (failures > 0) {
    console.log('\nFailed workers:');
    statuses
      .filter(([, w]) => w.status === 'error')
      .forEach(([name, w]) => console.log(`  ✗ ${name}: ${w.error}`));
  }

  console.log('\nNext step: Say "verify kimi output" to run the code verifier agent.');

  // Exit with error code if any workers failed
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
