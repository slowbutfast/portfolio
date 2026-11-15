# Surgical Patch Handoff: OpenSpec Change 'studio-remote-oauth' [PATCH-02]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `studio-remote-oauth`
- **Patch ID**: `PATCH-02`
- **Objective**: Wire external `AbortSignal` cancellation through `checkUrl()` and `CatalogAdapter` reads (`readCatalog` / `readProfile`) under the shared `auditLinks()` deadline, extract `GitHubApiError` into `api/studio/_lib/errors.ts`, and test the real `checkUrl` cancellation path.
- **Feedback & Diagnostic Trace**:
  ```text
  PR #19 (head ba14ca8) — Round 2 Review:
  1. src/studio/catalogService.ts & src/utils/linkAudit.mjs:
     - runBoundedAudit() passes `signal` via `as LinkCheckOptions`, but `checkUrl()` does not accept or honor an external `AbortSignal`. Real HTTP/HTTPS requests (`requestPinned` / `fetchWithTimeout`) continue until their own timeout.
     - `auditLinks()` awaits `adapter.readCatalog()` and `adapter.readProfile()` before starting `runBoundedAudit()`, with no timeout or cancellation on those GitHub fetches.
     Fix: Add `signal?: AbortSignal` to `LinkCheckOptions` (`linkAudit.d.mts`), honor it in `checkUrl` / `requestPinned` / `fetchWithTimeout` (`linkAudit.mjs`), remove the `as LinkCheckOptions` cast (`catalogService.ts`), and pass a shared deadline `AbortSignal` into `adapter.readCatalog({ signal })` / `adapter.readProfile({ signal })` and `GitHubCatalogAdapter` fetches.
  2. Bundling & Error Status Nits:
     - `http.ts` imports `GitHubApiError` from `githubAdapter.ts`, dragging the adapter and `asset-manifest.json` into `login`, `callback`, and `ping`. Extract `GitHubApiError` into `api/studio/_lib/errors.ts` (re-export from `githubAdapter.ts`).
     - Adapter target-equals-default error should surface as `503` (config error), not `400`.
  ```
- **Root Cause Analysis**:
  - `checkUrl()` only created an internal `AbortController` per request and never listened to an external `signal`.
  - `CatalogAdapter.readCatalog` / `readProfile` lacked an optional `{ signal?: AbortSignal }` parameter.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/utils/linkAudit.d.mts` | `L14-L21` | Add `signal?: AbortSignal;` to `LinkCheckOptions`. |
| `src/utils/linkAudit.mjs` | `L198-L350` | Thread external `signal` into `checkUrl`, `requestPinned` (destroy request on abort, clean up listener), and `fetchWithTimeout` (`AbortSignal.any` or listener); stop retry loop immediately when `signal?.aborted`. |
| `src/studio/catalogService.ts` | `L47-L52`, `L143-L266`, `L292-L300` | Add optional `options?: { signal?: AbortSignal }` to `CatalogAdapter.readCatalog` & `readProfile`; remove `as LinkCheckOptions` cast in `runBoundedAudit`; in `auditLinks`, create a deadline `AbortController` tied to `startedAt + deadlineMs` and pass `{ signal }` to `readCatalog` and `readProfile` (clearing timer in `finally`). |
| `api/studio/_lib/errors.ts` | `(new file)` | Define and export `GitHubApiError` (moved out of `githubAdapter.ts`). |
| `api/studio/_lib/githubAdapter.ts` | `L1-L23`, `L76-L206` | Import and re-export `GitHubApiError` from `./errors`; accept optional `{ signal?: AbortSignal }` in `readCatalog`/`readProfile` and forward `signal` to `resolveSource`, `readContents`, `defaultBranch`, `refSha`, and `request` (`fetchImpl` init); throw `503` if `defaultBranch === this.targetBranch` in `writeCatalog`/`resolveSource` when mismatched config occurs. |
| `api/studio/_lib/http.ts` | `L1-L10` | Import `GitHubApiError` from `./errors` instead of `./githubAdapter`. |
| `src/utils/studioAuth.test.ts` | `L736-L850` | Add tests exercising real `checkUrl` external `AbortSignal` cancellation (using `fetchImpl` or a hanging handler without mocking `checkImpl`) and `auditLinks` aborting slow `adapter.readCatalog`/`readProfile` reads at the shared deadline. |
| `openspec/changes/studio-remote-oauth/tasks.md` | `L47-L52` | Mark `P02.1`–`P02.4` as `[x]` upon completion. |
| `openspec/changes/studio-remote-oauth/patch.md` | `L23-L45` | Mark `PATCH-02` `Status: RESOLVED` with timestamp upon completion. |
| `openspec/changes/studio-remote-oauth/verification.md` | `L115-L180` | Append `PATCH-02` verification log. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and line ranges in the Target Context Map. Work in `/home/node/.local/share/opencode/worktree/af7796ae2766c7d7b6e4521206d2a14998dc77de/eager-chipmunk` (branch `feat/studio-remote-oauth`).
- **FORBIDDEN**:
  - Do NOT modify `vercel.json`, `StudioApp.tsx`, or `.env` files.
  - Do NOT mark `tasks.md` `5.1`, `5.2`, or `5.3` as `[x]`.
- **INVARIANTS TO PRESERVE**: All existing 278+ unit tests, `npm run typecheck`, `npm run build` (`studio-app` absent from main chunk), and `npx openspec validate "studio-remote-oauth" --strict --json` MUST pass.

## 4. Visual & UI Impact
Status: Non-visual patch. No styling or layout modifications permitted.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Add the real `checkUrl` cancellation and slow-adapter-read tests in `src/utils/studioAuth.test.ts` and run `npx vitest run src/utils/studioAuth.test.ts`. Confirm failure before fixing.
2. **Apply Minimal Fix**: Implement the mapped edits.
3. **Verify Fix**: Re-run `npx vitest run src/utils/studioAuth.test.ts` and confirm PASS.
4. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npx openspec validate "studio-remote-oauth" --strict --json`. Confirm 100% clean passes.
