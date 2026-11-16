# Surgical Patch Handoff: OpenSpec Change 'studio-remote-oauth' [PATCH-03]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `studio-remote-oauth`
- **Patch ID**: `PATCH-03`
- **Objective**: Add explicit `.js` extensions and `with { type: 'json' }` attributes for Vercel Node 22 ESM, return HTTP `504` instead of `[]` (`200`) when `auditLinks()` adapter reads time out, and handle mid-body response aborts in `requestPinned()`.
- **Feedback & Diagnostic Trace**:
  ```text
  1. Vercel /api/studio/ping log (2026-11-15T22:51:29Z):
     Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/data/catalogSchema' imported from /var/task/api/studio/ping.js
  2. Code Review Round 3 (head 3dcad7c):
     - src/studio/catalogService.ts:278: If readCatalog/readProfile times out, auditLinks() returns [] (HTTP 200), so StudioApp displays "Checked 0 links" as if the audit succeeded, and can mask concurrent GitHub errors. Throw AuditTimeoutError and map to HTTP 504 in sanitizeError().
     - src/utils/linkAudit.mjs (requestPinned): Attach response 'aborted'/'error'/incomplete-'close' listeners so mid-body aborts reject cleanly instead of staying pending.
  ```
- **Root Cause Analysis**:
  - `package.json` specifies `"type": "module"`. Vercel compiles `api/**/*.ts` to unbundled `.js` ESM files under `/var/task/`, where Node 22 requires explicit `.js` extensions and `with { type: 'json' }`.
  - `auditLinks()` caught `controller.signal.aborted` and returned `[]` instead of throwing an explicit timeout error.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `api/studio/ping.ts` | `L2-L5` | Change JSON import to `with { type: 'json' }` and relative TS imports to `../../src/data/catalogSchema.js`, `./_lib/auth.js`, `./_lib/http.js`. |
| `api/studio/login.ts` | `L2-L10` | Change relative imports to `./_lib/auth.js` and `./_lib/http.js`. |
| `api/studio/callback.ts` | `L2-L22` | Change relative imports to `./_lib/auth.js` and `./_lib/http.js`. |
| `api/studio/logout.ts` | `L2-L8` | Change relative imports to `./_lib/auth.js` and `./_lib/http.js`. |
| `api/studio/state.ts` | `L2-L17` | Change relative imports to `../../src/data/catalogSchema.js`, `../../src/studio/catalogService.js`, `./_lib/auth.js`, `./_lib/githubAdapter.js`, `./_lib/http.js`. |
| `api/studio/audit-links.ts` | `L2-L10` | Change relative imports to `../../src/studio/catalogService.js`, `./_lib/auth.js`, `./state.js`, `./_lib/http.js`. |
| `api/studio/_lib/auth.ts` | `L3` | Change `./http` to `./http.js`. |
| `api/studio/_lib/http.ts` | `L2-L7`, `L120-L132` | Change `../../../src/studio/catalogService` and `./errors` to `.js`; import `AuditTimeoutError` and map `cause instanceof AuditTimeoutError` -> `logFailure(cause, 504)` and `{ status: 504, body: { error: 'Link audit timed out' } }`. |
| `api/studio/_lib/githubAdapter.ts` | `L1-L12` | Change `../../../src/studio/catalogService`, `./errors`, `./manifest` (including `export { GitHubApiError } from './errors.js'`) to `.js`. |
| `api/studio/_lib/manifest.ts` | `L1` | Change `import manifest from './asset-manifest.json';` to `import manifest from './asset-manifest.json' with { type: 'json' };`. |
| `src/data/catalogSchema.ts` | `L1-L3` | Change `../utils/graphEdges` and `../utils/graphPlanarity` to `.js`. |
| `src/studio/catalogService.ts` | `L4-L9`, `L81-L87`, `L271-L285` | Change `../data/catalogSchema` to `../data/catalogSchema.js`; export `AuditTimeoutError`; in `auditLinks()`, only treat abort-triggered failures (`controller.signal.aborted && isAbortError(cause)`) as timeout and throw `new AuditTimeoutError()` instead of returning `[]` (re-throw non-abort errors unchanged). |
| `src/utils/linkAudit.mjs` | `L204-L240` | In `requestPinned()`, ensure `response.on('error', ...)` and `response.on('aborted', ...)` / incomplete `close` reject and call `cleanup()`. |
| `src/utils/studioAuth.test.ts` | `(update/append)` | Add tests for: (1) Node-ESM `.js`/`.mjs`/`.json` extensions and `with { type: 'json' }` across `api/**/*.ts`, `catalogSchema.ts`, `graphEdges.ts`, and `catalogService.ts`; (2) `auditLinks()` throwing `AuditTimeoutError` and `POST /api/studio/audit-links` returning HTTP `504` when adapter reads time out (and not masking non-abort errors). |
| `openspec/changes/studio-remote-oauth/tasks.md` | `P03.1-P03.4` | Mark `P03.1`–`P03.4` as `[x]`. |
| `openspec/changes/studio-remote-oauth/patch.md` | `PATCH-03` | Mark `PATCH-03` `Status: RESOLVED` with timestamp. |
| `openspec/changes/studio-remote-oauth/verification.md` | `(append)` | Append `PATCH-03` verification log. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and targets in the Target Context Map. Work in `/home/node/.local/share/opencode/worktree/af7796ae2766c7d7b6e4521206d2a14998dc77de/eager-chipmunk` (branch `feat/studio-remote-oauth`).
- **FORBIDDEN**:
  - Do NOT change `package.json` `"type": "module"` or `tsconfig.json` `"moduleResolution"`.
  - Do NOT modify `vercel.json`, `StudioApp.tsx`, or `.env` files.
  - Do NOT mark `tasks.md` `5.1`, `5.2`, or `5.3` as `[x]`.
- **INVARIANTS TO PRESERVE**: All existing 281+ unit tests, `npm run typecheck`, `npm run build`, and `npx openspec validate "studio-remote-oauth" --strict --json` MUST pass.

## 4. Visual & UI Impact
Status: Non-visual patch (`StudioApp.tsx` already displays non-2xx API errors via `setError(...)`). No styling or layout modifications permitted.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Add the ESM import-extension test and `504` audit-read-timeout test in `src/utils/studioAuth.test.ts` and run `npx vitest run src/utils/studioAuth.test.ts`. Confirm failure before fixing.
2. **Apply Minimal Fix**: Implement the mapped edits.
3. **Verify Fix**: Re-run `npx vitest run src/utils/studioAuth.test.ts` and confirm PASS.
4. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npx openspec validate "studio-remote-oauth" --strict --json`. Confirm 100% clean passes.
