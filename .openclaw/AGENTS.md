# EBOSS Monorepo — OpenClaw Agent Context

This file is loaded as additional system instructions for every OpenClaw session
on this machine. It gives the agent the project context it needs to work
autonomously without needing it repeated in every task prompt.

## Repository

- **Name:** eboss-monorepo
- **Structure:** Turborepo + pnpm workspaces
- **Unified app:** `apps/manager` (Vite + React 19 + TypeScript + Tailwind CSS v4)
- **Shared packages:** `packages/ui`, `packages/auth`, `packages/types`, `packages/config`
- **Legacy apps (being retired):** `apps/tech` (Next.js), `apps/map` (vanilla JS)

## Tech Stack

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui components
- Supabase (Auth + Postgres + Realtime) via TanStack Query
- Framer Motion for animation
- HashRouter (not BrowserRouter) — all routes use `#/path`

## Working Rules

1. **Read before writing.** Always read the relevant source files before making changes.
2. **Scope discipline.** Implement only what the Linear issue describes.
3. **Package manager:** Always use `pnpm`, never `npm` or `yarn`.
4. **Typecheck before committing:** `pnpm --dir apps/manager run typecheck && pnpm turbo run lint`
5. **Commit format:** `feat(EBOSS-XX): short description`
6. **PR label:** Always include `ai-agent,openclaw` when opening PRs.
7. **End every task reply** with the PR URL on its own line: `PR: <url>`

## Key File Locations

- App entry: `apps/manager/src/App.tsx` (route definitions here)
- Components: `apps/manager/src/components/`
- Map components: `apps/manager/src/components/map/` (in progress)
- Hooks: `apps/manager/src/hooks/`
- Shared UI: `packages/ui/src/`
- Types: `packages/types/src/`

## GitHub CLI

Use `gh` for all GitHub operations. It is already authenticated on this machine.
Do not use the GitHub REST API directly.
