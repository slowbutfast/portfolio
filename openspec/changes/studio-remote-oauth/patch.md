# Patches: `studio-remote-oauth`

### [PATCH-01] Fix GitHub branch-reset data loss, audit deadline budget, target-branch guard, and verification alignment
- **Date**: 2026-11-15 22:18:00 UTC
- **Feedback Source**: Code Review (PR #19, head `972338d`)
- **Reported Issue**:
  1. `GitHubCatalogAdapter.resolveSource()` and `writeCatalog()` can silently destroy unmerged edits: `writeCatalog()` force-resets `studio/catalog` even when `ahead`, and `resolveSource()` falls back to `master` when `studio/catalog` is `diverged`.
  2. `auditLinks()` starts its 8s deadline after `readCatalog()` + `readProfile()`, risking a Vercel `504` past `maxDuration = 10`, and `vercel.json` does not explicitly declare `functions` `maxDuration`.
  3. `STUDIO_TARGET_BRANCH` can silently point at `master`/`main`; `ping.ts` returns `200` when unconfigured; `sanitizeError` maps GitHub `429`/`422` to `500` without logging; `studio_oauth_tx` lacks server-side `exp` and HMAC domain separation.
  4. `tasks.md` `5.2`–`5.3` are marked `[x]` despite `.vercel/output` and live OAuth E2E not having been executed.
- **Root Cause**:
  - Branch source resolution relied on GitHub Compare status (`ahead`) instead of comparing catalog blob SHAs, and `writeCatalog()` unconditionally reset the target ref.
  - `runBoundedAudit()` initialized its timer after adapter reads completed.
  - `readAuthConfig()` did not reject `master`/`main` target branch names, and `ping.ts` skipped `requireConfig()`.
- **Target Files**: `api/studio/_lib/githubAdapter.ts, api/studio/_lib/auth.ts, api/studio/_lib/http.ts, api/studio/login.ts, api/studio/callback.ts, api/studio/audit-links.ts, api/studio/ping.ts, src/studio/catalogService.ts, vercel.json, src/utils/studioAuth.test.ts, openspec/changes/studio-remote-oauth/tasks.md, openspec/changes/studio-remote-oauth/verification.md`
- **Expected Resolution**:
  - `resolveSource()` and `writeCatalog()` preserve pending edits on `ahead` and `diverged` target branches without force-resetting, committing atomically via Contents API `sha`.
  - `auditLinks()` bounds total execution (including adapter reads) within `maxDuration = 10`, aborts timed-out checks, and `vercel.json` declares `functions` `maxDuration`.
  - `readAuthConfig()` rejects `master`/`main`/invalid branch names; `ping.ts` enforces `requireConfig()`; `sanitizeError` maps GitHub errors and logs redacted details; `studio_oauth_tx` checks `exp` and uses domain-separated HMACs.
  - `tasks.md` `5.2`–`5.3` reflect pending Vercel/OAuth deployment checks; unit tests, typecheck, and build pass.
- **Status**: RESOLVED (2026-11-15 22:24:28 UTC)

### [PATCH-02] Wire AbortSignal through checkUrl and adapter reads, and decouple GitHubApiError
- **Date**: 2026-11-15 22:34:00 UTC
- **Feedback Source**: Code Review Round 2 (PR #19, head `ba14ca8`)
- **Reported Issue**:
  1. `runBoundedAudit()` passes `signal` via `as LinkCheckOptions`, but `checkUrl()` in `src/utils/linkAudit.mjs` does not accept or honor an external `AbortSignal`, so real HTTP/HTTPS requests are not cancelled when the deadline fires.
  2. `auditLinks()` awaits `adapter.readCatalog()` and `adapter.readProfile()` without a timeout or `AbortSignal`, so slow GitHub reads can still exceed `maxDuration = 10`.
  3. `http.ts` imports `GitHubApiError` from `githubAdapter.ts`, pulling the adapter and `asset-manifest.json` into `login`, `callback`, and `ping`; and adapter target-equals-default errors surface as `400` instead of `503`.
- **Root Cause**:
  - `checkUrl()` / `requestPinned()` / `fetchWithTimeout()` only created internal timeout controllers and never wired an external `signal`.
  - `CatalogAdapter.readCatalog` / `readProfile` had no `{ signal?: AbortSignal }` parameter.
  - `GitHubApiError` was co-located in `githubAdapter.ts`.
- **Target Files**: `src/utils/linkAudit.mjs, src/utils/linkAudit.d.mts, src/studio/catalogService.ts, api/studio/_lib/errors.ts, api/studio/_lib/githubAdapter.ts, api/studio/_lib/http.ts, src/utils/studioAuth.test.ts, openspec/changes/studio-remote-oauth/tasks.md, openspec/changes/studio-remote-oauth/verification.md`
- **Expected Resolution**:
  - `checkUrl()` honors external `signal` on both `requestPinned()` and `fetchWithTimeout()`, and `auditLinks()` bounds adapter reads with a shared deadline `AbortSignal`.
  - Tests exercise real `checkUrl` cancellation and slow adapter read abortion.
  - `GitHubApiError` lives in `api/studio/_lib/errors.ts` so `login`/`callback`/`ping` stay lean.
- **Status**: RESOLVED (2026-11-15 22:36:46 UTC)

### [PATCH-03] Add explicit .js extensions and JSON import attributes for Vercel Node 22 ESM, and return 504 on timed-out audit reads
- **Date**: 2026-11-16 00:08:00 UTC
- **Feedback Source**: Vercel Preview Smoke Check (`/api/studio/ping` `500 FUNCTION_INVOCATION_FAILED`) + Code Review Round 3 (`3dcad7c`)
- **Reported Issue**:
  1. `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/data/catalogSchema' imported from /var/task/api/studio/ping.js`
  2. `auditLinks()` in `src/studio/catalogService.ts` returns `[]` with HTTP `200` when `readCatalog`/`readProfile` times out, causing `StudioApp.tsx` to display `"Checked 0 links"` as if the audit succeeded.
  3. `requestPinned` in `src/utils/linkAudit.mjs` does not listen to `response` `aborted`/`error`/`close` events if aborted mid-body.
- **Root Cause**:
  1. `package.json` sets `"type": "module"`, and Vercel's `@vercel/node` compiles `api/**/*.ts` to unbundled Node 22 ESM `.js` files requiring explicit `.js`/`.mjs`/`.json` extensions and `with { type: 'json' }`.
  2. `auditLinks()` caught abort errors and returned `[]` instead of throwing a timeout error mapped to `504`.
- **Target Files**: `api/studio/ping.ts, api/studio/login.ts, api/studio/callback.ts, api/studio/logout.ts, api/studio/state.ts, api/studio/audit-links.ts, api/studio/_lib/auth.ts, api/studio/_lib/http.ts, api/studio/_lib/githubAdapter.ts, api/studio/_lib/manifest.ts, src/data/catalogSchema.ts, src/studio/catalogService.ts, src/utils/linkAudit.mjs, src/utils/studioAuth.test.ts, openspec/changes/studio-remote-oauth/tasks.md, openspec/changes/studio-remote-oauth/verification.md`
- **Expected Resolution**:
  - Every relative runtime import in `api/**/*.ts` and its shared `src/` dependencies uses `.js`/`.mjs`/`.json`, and JSON imports use `with { type: 'json' }`.
  - Timed-out `auditLinks()` adapter reads throw `AuditTimeoutError`, mapped to HTTP `504` (`{ error: 'Link audit timed out' }`) so `StudioApp.tsx` displays an error.
  - `requestPinned` rejects cleanly on mid-body `response` `aborted`/`error`/incomplete `close`.
  - `/api/studio/ping` on Vercel preview returns JSON `503` instead of `500 FUNCTION_INVOCATION_FAILED`.
- **Status**: RESOLVED (2026-11-16 00:11:02 UTC)
