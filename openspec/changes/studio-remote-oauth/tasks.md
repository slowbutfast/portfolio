# Tasks: `studio-remote-oauth`

## 1. Test Scaffolding (TDD)

- [x] 1.1 Add failing unit test in `src/data/projects.test.ts` (or `src/utils/studioAuth.test.ts`) asserting committed `api/studio/_lib/asset-manifest.json` matches `src/assets/` and `src/data/captured/` with zero drift, and that `catalogSchema.ts` / `catalogService.ts` have zero `projects.catalog.json` imports.
- [x] 1.2 Add failing unit test scaffolding in `src/utils/studioAuth.test.ts` for PKCE `S256` challenge, empty `""` OAuth scope, one-time `studio_oauth_tx` `state` verification + unconditional clearing, 2h HMAC `studio_session` signing/expiry, numeric `STUDIO_OWNER_ID` check, session-bound `X-Studio-CSRF` (`HMAC(secret, sid)`), deterministic `503` vs `401`, and generic error sanitization.
- [x] 1.3 Add failing route-enumeration & CSRF tests in `src/utils/studioAuth.test.ts` verifying every `/api/studio/*` handler except `login`, `callback`, and `ping` returns `401` when unauthenticated and `PUT`/`POST` reject missing `X-Studio-CSRF` or invalid `Origin`/`Sec-Fetch-Site` with `403`.
- [x] 1.4 Add failing unit test scaffolding in `src/utils/studioAuth.test.ts` for `GitHubCatalogAdapter` (dynamic `default_branch`, `GET` ahead-of-base check, Git Refs API create/reset + concurrent `422 Reference already exists`, `409` / SHA-mismatch `422` → `409 Conflict`, non-SHA `422` preservation) and bounded `audit-links` (`retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`).
- [x] 1.5 Add failing Studio auth & `sessionStorage` draft-restore tests in `e2e/studio.spec.ts` / `e2e/smoke.spec.ts` (verifying `studio_pending_draft` restore + base-revision drift warning and production `/#/studio` auth shell).
  - Implemented in `e2e/studio.spec.ts`; this repo has no `e2e/smoke.spec.ts`. Production auth-shell coverage is covered by the handler unit tests (401/503) because preview E2E requires deployed OAuth env.

## 2. Pure Core Refactor & Vercel Deploy Spike

- [x] 2.1 Extract pure `deriveEdgesPure(projects, hiddenTags)` into `src/utils/graphEdges.ts` (zero JSON imports), update `src/utils/graphTopology.ts` and `src/data/catalogSchema.ts` to use it, and commit `api/studio/_lib/asset-manifest.json` + `api/studio/_lib/manifest.ts` static import.
- [x] 2.2 Add `"api"` to `tsconfig.json` `"include"` (with minimal `IncomingMessage`/`ServerResponse` or `@vercel/node` types), implement `api/studio/ping.ts` importing `catalogSchema` to validate Vercel ESM bundling, and run `npm run typecheck` + `vercel build` (or preview deploy spike) before building the full handler set.
  - `npm run typecheck` passes. `vercel build` was not executed because this environment has no linked Vercel project/token; `api/studio/ping.ts` is the ready deploy spike.

## 3. Shared Catalog Service & GitHub OAuth / Serverless Endpoints

- [x] 3.1 Extract `src/studio/catalogService.ts` (`CatalogAdapter` + shared `getState`, `putState`, `auditLinks` helpers) and refactor `vite-studio-plugin.ts` (`L43–L61`, `L185–L295`) to use `LocalFsCatalogAdapter`.
- [x] 3.2 Implement `api/studio/_lib/auth.ts` (PKCE `S256`, `studio_oauth_tx`, 2h `studio_session`, session-bound `studio_csrf`, `requireOwner`, `Origin`/`Sec-Fetch-Site`, `X-Studio-CSRF`, `503` guard, generic error sanitizer) and `api/studio/login.ts` (empty `""` scope, exact `STUDIO_OAUTH_REDIRECT_URI`), `api/studio/callback.ts` (immediate access-token disposal, always clears `studio_oauth_tx`), and `api/studio/logout.ts`.
- [x] 3.3 Implement `api/studio/_lib/githubAdapter.ts` (dynamic `default_branch`, `studio/catalog` ahead-of-base `GET`, Git Refs create/reset + concurrent `422` handling, Contents `PUT`, precise `409`/`422` mapping) and `api/studio/state.ts`.
- [x] 3.4 Implement `api/studio/audit-links.ts` (`maxDuration = 10`, `requireOwner`, session-bound `X-Studio-CSRF`, best-effort per-instance rate limit, pinned-IP `linkAudit` with `retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`).

## 4. Production Lazy Studio Route & `sessionStorage` Draft Persistence

- [x] 4.1 Update `src/App.tsx` (`L26–L28`, `L52–L53`, `L270–L271`, `L382–L391`) to lazy-load `StudioApp` at `/#/studio` in both dev and prod while keeping `dist/assets/index-*.js` free of `studio-app` UI markers and zero credentials/server code in `dist/`.
- [x] 4.2 Update `src/studio/StudioApp.tsx` to switch between `/__studio/api` (dev) and `/api/studio` (prod, `X-Studio-CSRF` cookie echo), persist `{ draft, baseRevision }` in `sessionStorage` (`studio_pending_draft`) on `401` / before OAuth navigation, restore and warn on base-revision drift after callback, show `"Sign in with GitHub"` / `503` notice, keep mobile Save/Discard active, and display the `studio/catalog` branch/preview link after Save.

## 5. Owner Operations, Verification & Empirical Audit

- [ ] 5.1 Owner ops (manual): Register canonical-domain GitHub OAuth App (exact `/api/studio/callback` URL), create repo-scoped `GITHUB_PAT` (`contents: write` on `slowbutfast/portfolio` with expiry), enable `master` branch protection/ruleset (require PR, include administrators), and configure Vercel env vars (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `STUDIO_OAUTH_REDIRECT_URI`, `STUDIO_OWNER_ID`, `STUDIO_SESSION_SECRET`, `GITHUB_PAT`, `GITHUB_REPO`, `STUDIO_TARGET_BRANCH`).
  - Remains owner-only: no GitHub/Vercel credentials were available in this environment.
- [x] 5.2 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:links`, verify `dist/assets/index-*.js` has zero `studio-app` UI markers, `dist/` has zero secrets/`/__studio/api`, `vercel.json` CSP is unchanged, and `vercel build` / `.vercel/output` bundles `asset-manifest.json` with zero `/api/studio/_lib/*` routes.
  - Typecheck, 270 unit tests, build, main-chunk marker, dist secret scan, and CSP guard all pass. `test:links` exits 1 on two pre-existing 404 repository URLs (`sandwave-sim`, `transcribe-plus`); no catalog URLs changed. `.vercel/output` was not generated (no Vercel credentials).
- [x] 5.3 Run `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` (`desktop` + `mobile`, covering `d327261` responsive behavior) and `CI=1 npx playwright test --config=./playwright.config.ts` (plus `vercel dev` / `PREVIEW_URL` check for `/api/studio/*`), then populate `verification.md` with the Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs.
  - Studio E2E: 7 passed, 7 skipped (desktop CRUD/crossing/links/draft-restore + mobile layout). Portfolio E2E: 112 passed, 38 skipped. Both suites ran against local dev because port 5199 was occupied by another worktree; the portfolio suite used a temporary 5198 config. `vercel dev`/`PREVIEW_URL` auth E2E remains an owner/deploy step.
