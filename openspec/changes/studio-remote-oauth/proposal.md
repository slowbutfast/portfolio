# Proposal: `studio-remote-oauth`

## Why
Project Studio (`/#/studio`) currently runs only inside the local Vite dev server (`vite-studio-plugin.ts`), blocking remote project/tag/seed management and link auditing from a phone or the deployed portfolio. Adding GitHub OAuth + GitHub-backed Vercel serverless endpoints yields a **static portfolio with authenticated serverless Studio APIs**, letting the repository owner authenticate on the canonical domain and commit catalog updates to a previewable `studio/catalog` branch.

## What Changes
- **Pure Core & Vercel Deploy Spike**:
  - Extract pure `deriveEdgesPure(projects, hiddenTags)` into `src/utils/graphEdges.ts` so `catalogSchema.ts` and `catalogService.ts` have zero JSON imports, and add `api/` to `tsconfig.json`.
  - Ship a minimal `api/studio/ping.ts` Vercel deploy spike importing `catalogSchema` before implementing all five handlers.
  - Commit `api/studio/_lib/asset-manifest.json` (guarded by a unit drift test against `src/assets/` and `src/data/captured/`) so `.vercelignore` (`scripts/`) never breaks Vercel builds.
- **GitHub OAuth (PKCE + One-Time State) & Serverless `/api/studio/*` Endpoints**:
  - Add `/api/studio/login`, `/api/studio/callback`, `/api/studio/logout`, `/api/studio/state` (`GET`/`PUT`), and `/api/studio/audit-links` (`POST`).
  - Enforce owner-only access (`STUDIO_OWNER_ID`, empty `""` OAuth scope, exact canonical `STUDIO_OAUTH_REDIRECT_URI`), HMAC-signed `HttpOnly` `studio_session` (2h TTL, `STUDIO_SESSION_SECRET` kill-switch), session-bound `X-Studio-CSRF` + `Origin`/`Sec-Fetch-Site`, bounded link auditing (`retries: 0`, shared `8000ms` deadline, `maxDuration = 10`), and generic errors (`503` when unconfigured, `401` otherwise).
  - Implement `studio/catalog` branch lifecycle against the repo's `default_branch`: `GET` reads `studio/catalog` only when it exists and is ahead of `default_branch` (otherwise `default_branch`); `PUT` creates/resets `refs/heads/studio/catalog` via Git Refs API (treating concurrent `422 Reference already exists` as success) before Contents `PUT`, mapping `409` and `sha`-mismatch `422` to `409 Conflict`.
- **Production Lazy Route, `sessionStorage` Draft Persistence & Owner Ops**:
  - Enable the lazy-loaded `StudioApp` chunk at `/#/studio` in production (keeping the main portfolio chunk free of Studio UI and zero credentials/server code in client bundles).
  - Persist unsaved `draft` + `baseRevision` in `sessionStorage` across full-page OAuth re-authentication and warn if the server revision moved.
  - Include owner/ops setup & verification tasks (GitHub OAuth App, repo-scoped `GITHUB_PAT`, `master` branch protection/ruleset, Vercel env vars, and `d327261` mobile Studio review).

## Capabilities

### New Capabilities
- `studio-remote-oauth`: Owner-authenticated GitHub OAuth (canonical-domain only, PKCE + one-time `state`), `GitHubCatalogAdapter` branch lifecycle on `studio/catalog`, bounded serverless link auditing, committed `asset-manifest.json`, and `sessionStorage` draft persistence.

### Modified Capabilities
- `project-studio`: **BREAKING** — Rename and modify `Dev-only Project Studio route and zero production exposure` → `Authenticated production Studio route and zero secret exposure` so production builds keep the main chunk Studio-free and ship zero credentials/server code in client bundles while lazy-loading `StudioApp` at `/#/studio` backed by authenticated `/api/studio/*` endpoints.

## Impact
- **Client**: `src/App.tsx`, `src/studio/StudioApp.tsx`, `src/studio/catalogService.ts`, `src/utils/graphEdges.ts`, `src/utils/graphTopology.ts`, `src/data/catalogSchema.ts`.
- **Server / Build**: `vite-studio-plugin.ts`, `api/studio/**`, `tsconfig.json`.
- **CSP & Portfolio**: `vercel.json` (`connect-src 'self'`, `img-src 'self'`, `media-src 'self'`) and `src/data/projects.ts` remain unchanged.
