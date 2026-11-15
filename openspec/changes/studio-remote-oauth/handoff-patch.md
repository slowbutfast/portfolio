# Surgical Patch Handoff: OpenSpec Change 'studio-remote-oauth' [PATCH-01]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `studio-remote-oauth`
- **Patch ID**: `PATCH-01`
- **Objective**: Fix `GitHubCatalogAdapter` branch-reset data loss on `ahead`/`diverged` target branches, bound `auditLinks` within `maxDuration = 10`, enforce `STUDIO_TARGET_BRANCH` and `ping.ts` config guards, harden `studio_oauth_tx` expiry / HMAC domain separation / `sanitizeError`, and align `tasks.md` with actual deployment verification.
- **Feedback & Diagnostic Trace**:
  ```text
  PR #19 (head 972338d) — REQUEST CHANGES (Agents 1 & 2):
  1. githubAdapter.ts (resolveSource & writeCatalog):
     - writeCatalog() force-resets studio/catalog even when ahead, destroying pending PR edits.
     - resolveSource() only reads studio/catalog when Compare says 'ahead'; an unrelated master commit makes Compare 'diverged', hiding pending edits and causing the next save to force-reset the branch.
     - Force-resetting on save creates a concurrent-tab race where B's PATCH force:true overwrites A's commit and returns 200.
     Fix: Compare target branch catalog blob SHA against default branch catalog blob SHA instead of Compare status. When they differ, read target and commit directly on top of it with Contents API sha as the only guard (no force push). Only reset when target branch is absent or its catalog blob equals default branch's.
  2. auditLinks() / audit-links.ts:
     - readCatalog() + readProfile() run before the 8000ms deadline starts, risking Vercel 504 past maxDuration = 10. Start deadline from request start (or reduce budget accordingly) and abort timed-out fetches via AbortController. Evict stale rate-limit entries in hits.
     - Configure functions["api/studio/audit-links.ts"].maxDuration = 10 in vercel.json.
  3. STUDIO_TARGET_BRANCH & ping.ts:
     - readAuthConfig() must return null (503) if STUDIO_TARGET_BRANCH is master/main or invalid, and writeCatalog must never write to defaultBranch.
     - ping.ts returns 200 when unconfigured; gate it on requireConfig() (503 when unconfigured) and test it in studioAuth.test.ts.
  4. Nits:
     - sanitizeError(cause) in http.ts: map GitHubApiError 429 -> 429, 400/422 -> 400, >=500 -> 502 (redacted), and log redacted error class/status server-side.
     - OAuthTransaction in auth.ts/login.ts/callback.ts: add server-side exp check and HMAC domain separation ('session:', 'tx:', 'csrf:').
  5. tasks.md 5.2–5.3:
     - Already updated to [ ] pending activation gates; update verification.md after tests pass.
  ```
- **Root Cause Analysis**:
  - `resolveSource()` relied on GitHub Compare `status === 'ahead'` rather than comparing catalog blob SHAs, and `writeCatalog()` unconditionally called `resetTargetRef(source.baseSha)`.
  - `runBoundedAudit()` started `Date.now()` after `readCatalog`/`readProfile` completed and did not abort underlying requests on timeout.
  - `readAuthConfig()` allowed `STUDIO_TARGET_BRANCH` to match `master`/`main`, and `ping.ts` omitted `requireConfig()`.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `api/studio/_lib/githubAdapter.ts` | `L46-L62`, `L146-L210`, `L262-L311` | Replace Compare-based `resolveSource()` with catalog blob comparison (`defaultFile.sha !== targetFile.sha`); when `source.useTarget` is true, commit directly with `sha: expectedRevision` without `resetTargetRef()`; only reset when target branch is absent or its catalog matches default branch; reject if `source.defaultBranch === this.targetBranch`. |
| `src/studio/catalogService.ts` | `L143-L256` | Accept optional `startedAt?: number` in `BoundedAuditOptions` and `auditLinks`, capture `startedAt` before `readCatalog`/`readProfile`, compute remaining budget against `deadlineMs` (`AUDIT_DEADLINE_MS`), pass an `AbortSignal` (or `AbortController` aborted when deadline timer wins) to `checkImpl` if supported, and keep existing behavior intact. |
| `api/studio/audit-links.ts` | `L29-L65` | Prune expired entries from `hits` map during `rateLimited()`; pass `startedAt: now()` into `auditLinks(adapter, { startedAt })`. |
| `vercel.json` | `L1-L7` | Add `"functions": { "api/studio/audit-links.ts": { "maxDuration": 10 } }` while keeping `headers` / CSP completely unchanged. |
| `api/studio/_lib/auth.ts` | `L53-L183`, `L224-L231` | Validate `STUDIO_TARGET_BRANCH` in `readAuthConfig()` (reject `master`, `main`, or invalid git ref characters -> `null`); add domain prefixes (`session:`, `tx:`, `csrf:`) to `hmac()` callers; add `exp: number` to `OAuthTransaction`. |
| `api/studio/login.ts` | `L32-L43` | Populate `exp: Math.floor(Date.now() / 1000) + TX_TTL_SECONDS` in `txCookie(config, { state, verifier, exp })`. |
| `api/studio/callback.ts` | `L70-L80` | Validate `typeof parsed.exp === 'number' && parsed.exp > Math.floor(now() / 1000)` before accepting `parsed` (else throw `403`, still clearing `TX_COOKIE`). |
| `api/studio/_lib/http.ts` | `L114-L128` | Map `GitHubApiError` (duck-typed or imported error with `name === 'GitHubApiError'` and numeric `status`: `429` -> `429`, `400`/`422` -> `400`, `>= 500` -> `502` generic message) and log redacted `{ name, status }` via `console.error` for non-`HttpError` / `>= 500` failures. |
| `api/studio/ping.ts` | `L11-L31` | Call `requireConfig()` at handler start so unconfigured deployments return `503`. |
| `src/utils/studioAuth.test.ts` | `L412-L451`, `L601-L807` | Add/update unit tests for `ahead` & `diverged` target-branch saves without `PATCH force:true`, `STUDIO_TARGET_BRANCH=master`/`main` -> `null`, `studio_oauth_tx` expired `exp` -> `403`, request-start `auditLinks` deadline, `sanitizeError` `GitHubApiError` mapping, and `ping.ts` `503` when unconfigured. |
| `openspec/changes/studio-remote-oauth/tasks.md` | `L40-L46` | Mark `P01.1`–`P01.4` as `[x]` upon completion. |
| `openspec/changes/studio-remote-oauth/verification.md` | `L1-L115` | Append `PATCH-01` verification log and note pending Vercel/OAuth activation gates. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and line ranges in the Target Context Map. Work in `/home/node/.local/share/opencode/worktree/af7796ae2766c7d7b6e4521206d2a14998dc77de/eager-chipmunk` (branch `feat/studio-remote-oauth`).
- **FORBIDDEN**:
  - Do NOT modify `vercel.json` CSP or security headers.
  - Do NOT refactor `StudioApp.tsx` or unrelated UI components.
  - Do NOT modify `.env` or credential files.
  - Do NOT mark `tasks.md` `5.2` or `5.3` as `[x]`.
- **INVARIANTS TO PRESERVE**:
  - All existing 270+ unit tests, `npm run typecheck`, `npm run build` (`studio-app` absent from main chunk), and `npx openspec validate "studio-remote-oauth" --strict --json` MUST pass.

## 4. Visual & UI Impact
Status: Non-visual patch. No styling or layout modifications permitted.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Add/update the tests in `src/utils/studioAuth.test.ts` and run `npx vitest run src/utils/studioAuth.test.ts`. Confirm the new assertions fail against the unpatched code.
2. **Apply Minimal Fix**: Make targeted edits in the mapped files.
3. **Verify Fix**: Re-run `npx vitest run src/utils/studioAuth.test.ts` and confirm all tests pass.
4. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npx openspec validate "studio-remote-oauth" --strict --json`. Confirm 100% clean passes.

## 6. Surgical Patch Checklist
- [ ] P01.1 Add/update failing reproduction tests in `src/utils/studioAuth.test.ts` and confirm failure.
- [ ] P01.2 Implement minimal fixes in the Target Context Map files.
- [ ] P01.3 Re-run `npx vitest run src/utils/studioAuth.test.ts` and confirm PASS.
- [ ] P01.4 Run `npm run typecheck && npm run test:unit && npm run build && npx openspec validate "studio-remote-oauth" --strict --json` and confirm zero regressions.
- [ ] P01.5 Update `tasks.md` (`P01.1`–`P01.4`) and `verification.md`.
