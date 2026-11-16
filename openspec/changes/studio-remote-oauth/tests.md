# Tests: `studio-remote-oauth`

## Automated Tests
- `npm run test:unit` (`src/utils/studioAuth.test.ts`, `src/data/projects.test.ts`):
  - **Manifest drift test**: Verifies committed `api/studio/_lib/asset-manifest.json` exactly matches `src/assets/**/*.{png,jpg,jpeg,webp,mp4,webm}` and `src/data/captured/*.json`.
  - **Pure core**: Verifies `catalogSchema.ts` and `catalogService.ts` import `graphEdges.ts` with zero `projects.catalog.json` imports.
  - **OAuth, Session & CSRF**: Verifies PKCE `S256` challenge, empty `""` scope, one-time `studio_oauth_tx` `state` verification + unconditional clearing, 2h HMAC `studio_session` signing/expiry, numeric `STUDIO_OWNER_ID` enforcement, session-bound `X-Studio-CSRF` (`HMAC(secret, sid)`), deterministic `503` (missing env) vs `401` (unauthenticated), and generic error sanitization.
  - **Route enumeration**: Enumerates every `/api/studio/*` handler except `login`, `callback`, and `ping` and asserts `401` when unauthenticated and `403` on invalid CSRF/`Origin`/`Sec-Fetch-Site`.
  - **GitHub branch lifecycle & bounded audit**: Verifies dynamic `default_branch` resolution, `studio/catalog` ahead-of-base check on `GET`, Git Refs API create/reset + concurrent `422 Reference already exists` handling on `PUT`, `409` / SHA-mismatch `422` → `409 Conflict` vs non-SHA `422` preservation, and `audit-links` (`retries: 0`, shared `8000ms` deadline, max `50` URLs, concurrency `4`).
- `npm run typecheck && npm run build && npm run test:links`:
  - Typechecks `api/` alongside `src/` and `e2e/`; verifies `dist/assets/index-*.js` contains zero `studio-app` UI markers, `dist/` contains zero secrets/`/__studio/api`, and `vercel build` / `.vercel/output` bundles `asset-manifest.json` while exposing zero `/api/studio/_lib/*` routes.
- `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` & `CI=1 npx playwright test --config=./playwright.config.ts`:
  - Verifies local dev Studio (`desktop` + `mobile`, including `d327261` responsive checks) works with zero OAuth, and `vercel dev` / `PREVIEW_URL` E2E verifies `/#/studio` auth shell (`Sign in with GitHub` / `503` notice) and `sessionStorage` draft restore/base-drift warning.

## Manual Verification
- **Canonical Domain OAuth & `studio/catalog` Preview**:
  - **WHEN** the owner opens `https://<canonical-domain>/#/studio` on desktop and mobile, signs in via GitHub OAuth, edits a project, and clicks **Save**
  - **THEN** `/api/studio/state` commits `src/data/projects.catalog.json` to `studio/catalog` and displays the branch/preview link (arbitrary preview URLs are for visual verification after Save, not OAuth login).
