# OpenCode Orchestration Handoff: OpenSpec Change 'studio-remote-oauth'

## 1. Orchestration Directive
- **Change Name**: `studio-remote-oauth`
- **Target Skill**: `openspec-apply-sub`
- **Architecture Paradigm**: Vertical Slice Architecture (VSA) — shared pure core (`src/utils/graphEdges.ts`, `src/data/catalogSchema.ts`, `src/studio/catalogService.ts`), dev-only plugin (`vite-studio-plugin.ts`), serverless API (`api/studio/*`), and lazy client route (`src/studio/StudioApp.tsx`).
- **Execution Discipline**: Work strictly through `openspec/changes/studio-remote-oauth/tasks.md` in order. Complete all tasks in `## 1. Test Scaffolding (TDD)` and verify failing tests first, then run the `api/studio/ping.ts` Vercel deploy spike in Group 2 before building the full handler set.

---

## 2. Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/utils/graphEdges.ts` | NEW | Pure `deriveEdgesPure(projects, hiddenTags)` with zero `tagRegistry.ts` or `projects.catalog.json` imports |
| `src/utils/graphTopology.ts` | L1–L34 | Re-export/wrap `deriveEdgesPure` with default `HIDDEN_TAGS` for client callers |
| `src/data/catalogSchema.ts` | L1–L3, L279–L293 | Import `deriveEdgesPure` from `../utils/graphEdges` (zero JSON imports) |
| `api/studio/_lib/asset-manifest.json` | NEW (committed) | Canonical `{ assetKeys, capturedKeys }` matching `src/assets/` and `src/data/captured/` |
| `api/studio/_lib/manifest.ts` | NEW | Static ES import of `./asset-manifest.json` so Vercel traces and bundles it cleanly |
| `tsconfig.json` | L21 | Add `"api"` to `"include"` (with minimal `IncomingMessage`/`ServerResponse` or `@vercel/node` types) |
| `api/studio/ping.ts` | NEW | Deploy spike importing `catalogSchema` to validate Vercel ESM bundling early |
| `src/studio/catalogService.ts` | NEW | Shared `CatalogAdapter` interface + HTTP-agnostic `getState`, `putState`, `auditLinks` helpers |
| `vite-studio-plugin.ts` | L43–L61, L185–L295 | Refactor local fs read/write into `LocalFsCatalogAdapter` delegating to `catalogService.ts` |
| `api/studio/_lib/auth.ts` | NEW | PKCE (`S256`), `studio_oauth_tx`, 2h `studio_session` (`{ sub, sid, exp }`), session-bound `studio_csrf` (`HMAC(secret, sid)`), `requireOwner` (`STUDIO_OWNER_ID`), `Origin`/`Sec-Fetch-Site`, `X-Studio-CSRF`, `503` guard, generic error sanitizer |
| `api/studio/login.ts` | NEW | `GET /api/studio/login` (empty `""` scope, exact `STUDIO_OAUTH_REDIRECT_URI`, PKCE + `studio_oauth_tx`) |
| `api/studio/callback.ts` | NEW | `GET /api/studio/callback` (constant-time `state` check, always clears `studio_oauth_tx`, discards access token after `GET /user`, sets `studio_session` + `studio_csrf`) |
| `api/studio/logout.ts` | NEW | `POST /api/studio/logout` (`Origin`/`Sec-Fetch-Site`, clears session & CSRF cookies) |
| `api/studio/_lib/githubAdapter.ts` | NEW | Dynamic `default_branch`, `studio/catalog` ahead-of-base `GET`, Git Refs API create/reset + concurrent `422 Reference already exists`, Contents `PUT`, `409` / SHA-mismatch `422` → `409 Conflict` |
| `api/studio/state.ts` | NEW | `GET` / `PUT /api/studio/state` (`requireOwner`, `X-Studio-CSRF`, `256KB` cap, `validateCatalog` via `manifest.ts`, `GitHubCatalogAdapter`) |
| `api/studio/audit-links.ts` | NEW | `POST /api/studio/audit-links` (`maxDuration = 10`, `requireOwner`, `X-Studio-CSRF`, best-effort rate limit, `retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`) |
| `src/App.tsx` | L26–L28, L52–L53, L270–L271, L382–L391 | Lazy-load `StudioApp` at `/#/studio` in dev and prod; keep `dist/assets/index-*.js` free of `studio-app` UI markers |
| `src/studio/StudioApp.tsx` | L47–L56, L170–L210, L290–L346, L367–L416, sticky mobile bar | Switch `/__studio/api` (dev) vs `/api/studio` (prod, `X-Studio-CSRF`), `sessionStorage` (`studio_pending_draft`) save/restore + base-revision drift warning, `"Sign in with GitHub"` / `503` notice, active mobile Save/Discard, `studio/catalog` link |
| `src/data/projects.test.ts` / `src/utils/studioAuth.test.ts` | NEW / Update | Manifest drift test, pure core check, PKCE/state/CSRF/auth/route-enumeration/GitHub-lifecycle/bounded-audit tests |
| `e2e/studio.spec.ts` / `e2e/smoke.spec.ts` | Update | `sessionStorage` draft-restore + production `/#/studio` auth shell assertions |

---

## 3. Technical & Architectural Boundaries
- **Production Model**: Static portfolio with authenticated serverless Studio APIs (`/api/studio/*`) + lazy-loaded `StudioApp` chunk. Zero secrets (`GITHUB_PAT`, `GITHUB_CLIENT_SECRET`, `STUDIO_SESSION_SECRET`) or server-only code enter client bundles; `vercel.json` (`connect-src 'self'`, `img-src 'self'`, `media-src 'self'`) stays untouched.
- **No `scripts/` on Vercel**: `.vercelignore` excludes `scripts/`. Never invoke `scripts/*` during `npm run build`. `api/studio/_lib/asset-manifest.json` is committed and guarded by a unit drift test.
- **Pure Server Core**: `catalogSchema.ts` and `catalogService.ts` MUST NOT import `tagRegistry.ts` or `projects.catalog.json`.
- **Canonical-Domain OAuth & Session**: Empty `""` scope, immediate disposal of user access token, exact `STUDIO_OAUTH_REDIRECT_URI` (no wildcards), always clear `studio_oauth_tx`, 2h `studio_session` TTL, `studio_csrf = HMAC(STUDIO_SESSION_SECRET, sid)`, deterministic `503` (missing env) vs `401` (unauthenticated), and generic client errors.
- **Branch Lifecycle**: Query `default_branch` dynamically (never hard-code `master`). `GET` reads `studio/catalog` only if it exists and is ahead of `default_branch`; `PUT` creates/resets `refs/heads/studio/catalog` via Git Refs API (handling concurrent `422 Reference already exists`) before Contents `PUT`.

---

## 4. Visual & UI Design Specifications
- Reuse existing CSS tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-accent`, `--color-divider`) and responsive `< lg` 3-tab mobile layout (`min-h-11` touch targets, `text-base sm:text-sm` inputs).
- Add Sign-In card (`401`), mid-edit re-auth banner + `sessionStorage` restored-draft drift warning, `503` unconfigured notice, and post-save `studio/catalog` branch/preview link.

---

## 5. Test Scaffolding & Verification Commands
Run TDD Group 1 first, confirm failures, then implement Groups 2–4 and verify:
- Typecheck & Unit & Build & Links: `npm run typecheck && npm run test:unit && npm run build && npm run test:links`
- Bundle & Route Checks: verify `dist/assets/index-*.js` has zero `studio-app` UI markers, `dist/` has zero secrets/`/__studio/api`, `vercel.json` CSP is unchanged, and `vercel build` / `.vercel/output` bundles `asset-manifest.json` with zero `/api/studio/_lib/*` routes.
- E2E: `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` (`desktop` + `mobile`) and `CI=1 npx playwright test --config=./playwright.config.ts` (plus `vercel dev` / `PREVIEW_URL` check for `/api/studio/*`).

---

## 6. Implementation Task Checklist
- [ ] 1.1 Add failing unit test in `src/data/projects.test.ts` (or `src/utils/studioAuth.test.ts`) asserting committed `api/studio/_lib/asset-manifest.json` matches `src/assets/` and `src/data/captured/` with zero drift, and that `catalogSchema.ts` / `catalogService.ts` have zero `projects.catalog.json` imports.
- [ ] 1.2 Add failing unit test scaffolding in `src/utils/studioAuth.test.ts` for PKCE `S256` challenge, empty `""` OAuth scope, one-time `studio_oauth_tx` `state` verification + unconditional clearing, 2h HMAC `studio_session` signing/expiry, numeric `STUDIO_OWNER_ID` check, session-bound `X-Studio-CSRF` (`HMAC(secret, sid)`), deterministic `503` vs `401`, and generic error sanitization.
- [ ] 1.3 Add failing route-enumeration & CSRF tests in `src/utils/studioAuth.test.ts` verifying every `/api/studio/*` handler except `login`, `callback`, and `ping` returns `401` when unauthenticated and `PUT`/`POST` reject missing `X-Studio-CSRF` or invalid `Origin`/`Sec-Fetch-Site` with `403`.
- [ ] 1.4 Add failing unit test scaffolding in `src/utils/studioAuth.test.ts` for `GitHubCatalogAdapter` (dynamic `default_branch`, `GET` ahead-of-base check, Git Refs API create/reset + concurrent `422 Reference already exists`, `409` / SHA-mismatch `422` → `409 Conflict`, non-SHA `422` preservation) and bounded `audit-links` (`retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`).
- [ ] 1.5 Add failing Studio auth & `sessionStorage` draft-restore tests in `e2e/studio.spec.ts` / `e2e/smoke.spec.ts` (verifying `studio_pending_draft` restore + base-revision drift warning and production `/#/studio` auth shell).
- [ ] 2.1 Extract pure `deriveEdgesPure(projects, hiddenTags)` into `src/utils/graphEdges.ts` (zero JSON imports), update `src/utils/graphTopology.ts` and `src/data/catalogSchema.ts` to use it, and commit `api/studio/_lib/asset-manifest.json` + `api/studio/_lib/manifest.ts` static import.
- [ ] 2.2 Add `"api"` to `tsconfig.json` `"include"` (with minimal `IncomingMessage`/`ServerResponse` or `@vercel/node` types), implement `api/studio/ping.ts` importing `catalogSchema` to validate Vercel ESM bundling, and run `npm run typecheck` + `vercel build` (or preview deploy spike) before building the full handler set.
- [ ] 3.1 Extract `src/studio/catalogService.ts` (`CatalogAdapter` + shared `getState`, `putState`, `auditLinks` helpers) and refactor `vite-studio-plugin.ts` (`L43–L61`, `L185–L295`) to use `LocalFsCatalogAdapter`.
- [ ] 3.2 Implement `api/studio/_lib/auth.ts` (PKCE `S256`, `studio_oauth_tx`, 2h `studio_session`, session-bound `studio_csrf`, `requireOwner`, `Origin`/`Sec-Fetch-Site`, `X-Studio-CSRF`, `503` guard, generic error sanitizer) and `api/studio/login.ts` (empty `""` scope, exact `STUDIO_OAUTH_REDIRECT_URI`), `api/studio/callback.ts` (immediate access-token disposal, always clears `studio_oauth_tx`), and `api/studio/logout.ts`.
- [ ] 3.3 Implement `api/studio/_lib/githubAdapter.ts` (dynamic `default_branch`, `studio/catalog` ahead-of-base `GET`, Git Refs create/reset + concurrent `422` handling, Contents `PUT`, precise `409`/`422` mapping) and `api/studio/state.ts`.
- [ ] 3.4 Implement `api/studio/audit-links.ts` (`maxDuration = 10`, `requireOwner`, session-bound `X-Studio-CSRF`, best-effort per-instance rate limit, pinned-IP `linkAudit` with `retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`).
- [ ] 4.1 Update `src/App.tsx` (`L26–L28`, `L52–L53`, `L270–L271`, `L382–L391`) to lazy-load `StudioApp` at `/#/studio` in both dev and prod while keeping `dist/assets/index-*.js` free of `studio-app` UI markers and zero credentials/server code in `dist/`.
- [ ] 4.2 Update `src/studio/StudioApp.tsx` to switch between `/__studio/api` (dev) and `/api/studio` (prod, `X-Studio-CSRF` cookie echo), persist `{ draft, baseRevision }` in `sessionStorage` (`studio_pending_draft`) on `401` / before OAuth navigation, restore and warn on base-revision drift after callback, show `"Sign in with GitHub"` / `503` notice, keep mobile Save/Discard active, and display the `studio/catalog` branch/preview link after Save.
- [ ] 5.1 Owner ops (manual): Register canonical-domain GitHub OAuth App (exact `/api/studio/callback` URL), create repo-scoped `GITHUB_PAT` (`contents: write` on `slowbutfast/portfolio` with expiry), enable `master` branch protection/ruleset (require PR, include administrators), and configure Vercel env vars (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `STUDIO_OAUTH_REDIRECT_URI`, `STUDIO_OWNER_ID`, `STUDIO_SESSION_SECRET`, `GITHUB_PAT`, `GITHUB_REPO`, `STUDIO_TARGET_BRANCH`).
- [ ] 5.2 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:links`, verify `dist/assets/index-*.js` has zero `studio-app` UI markers, `dist/` has zero secrets/`/__studio/api`, `vercel.json` CSP is unchanged, and `vercel build` / `.vercel/output` bundles `asset-manifest.json` with zero `/api/studio/_lib/*` routes.
- [ ] 5.3 Run `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` (`desktop` + `mobile`, covering `d327261` responsive behavior) and `CI=1 npx playwright test --config=./playwright.config.ts` (plus `vercel dev` / `PREVIEW_URL` check for `/api/studio/*`), then populate `verification.md` with the Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs.

---

## 7. Post-Implementation & Verification Obligations
1. Mark all completed code/test tasks in `openspec/changes/studio-remote-oauth/tasks.md` as `- [x]` (note `5.1` owner ops status clearly if executed manually by the repo owner).
2. Populate `openspec/changes/studio-remote-oauth/verification.md` with exact commands, exit codes, test counts, `.vercel/output` & `dist/` checks, and `d327261` mobile layout audit notes.
3. Run `npx openspec validate "studio-remote-oauth" --strict --json` without archiving.
4. Create feature branch `feat/studio-remote-oauth`, commit all changes cleanly, push to `origin`, and open a Pull Request via `gh pr create --fill`.
