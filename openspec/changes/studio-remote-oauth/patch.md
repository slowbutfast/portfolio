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
