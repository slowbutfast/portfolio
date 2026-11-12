## Automated Tests

- `npm run typecheck`: Compiles `src/utils/commitHash.ts`, the updated `vite.config.ts`, `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/preview-headers.spec.ts`, and the new guard tests with zero errors.
- `npm run test:unit` (Vitest): Runs the existing unit suite unchanged plus:
  - `resolveCommitHash` tests: a set `VERCEL_GIT_COMMIT_SHA` yields its first 7 characters and does not call the git runner; an unset or empty variable falls back to the injected git runner's trimmed output; an unset variable plus a throwing git runner yields `dev` without throwing; a variable shorter than 7 characters is returned as-is; a whitespace-only git output falls through to `dev`.
  - `vercel.json` guard tests: exactly one header rule whose source is `/assets/(.*)` with `public, max-age=31536000, immutable`; no other rule sets a different `Cache-Control` for `/assets/`; the CSP parsed into a directive map equals the spec's policy map; `script-src` is exactly `'self'`; the headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are present with the specified values; a negative fixture (a CSP with `'unsafe-inline'` in `style-src`) is rejected by the same comparison function.
  - `package.json` guard: the `build` script runs `tsc --noEmit` before `vite build`.
- Build-output guard (Vitest, run against a fresh `npm run build`): `dist/assets/` contains at least one `.woff2`, and no built `.js` or `.css` contains `data:font` or `data:application/font`.
- `npm run build`: Fails when a deliberate type error is introduced (checked once, then reverted) and succeeds on a clean tree.
- `npm run test:e2e` (local server): Existing tests pass unchanged; the drawer-open, deep-link, About, and terminal tests now assert zero console and page errors.
- Local CSP emulation run: Serve `dist/` with the headers from `vercel.json` and run the e2e suite against it; zero console errors expected. Any failure is recorded as a finding, not silently worked around.
- `PREVIEW_URL=<preview> VERCEL_AUTOMATION_BYPASS_SECRET=<secret> npm run test:e2e`: Runs the full suite plus `e2e/preview-headers.spec.ts` against a protected preview. The header spec verifies:
  - The served CSP equals the specified policy as a set of directives, independent of order and whitespace.
  - The other specified security headers are present.
  - Every `.woff2` response during page load is 200, `font/woff2`, and immutable, and at least one is observed.
  - `/` and `/index.html` carry no long-lived `max-age`.
  - A missing `/assets/does-not-exist.woff2` returns 404.
  - The Profiler-based zero-commit test is skipped in this mode.
- Pre-flight failure test: With `PREVIEW_URL` set and the secret unset against a protected preview, the run aborts in `globalSetup` with a message naming `VERCEL_AUTOMATION_BYPASS_SECRET`, and no individual test reports failures.
- Workflow lint: `actionlint` (or equivalent YAML validation if unavailable) accepts `ci.yml` and `preview.yml`; a grep of both files confirms no step echoes the secret and `permissions:` is limited to `contents: read` and `statuses: write`.
- Secret-leak scan: After a preview gate run, download the uploaded artifacts and logs and assert the bypass secret value appears in none of them.

## Manual Verification

- **Vercel project state**:
  - **WHEN** the Vercel MCP has team access (user-approved) and `get_project` / `list_projects` are called for the `slowbutfast/portfolio` repository
  - **THEN** the project link, production branch, Deployment Protection state, and system-env exposure are recorded in `verification.md` as resolved assumptions.

- **Preview gate fires on a real preview**:
  - **WHEN** a trivial commit is pushed to a branch after `preview.yml` exists on the default branch
  - **THEN** a `repository_dispatch` (`vercel.deployment.success`) run starts, checks out the deployed SHA, runs against the preview deployment URL, and a `preview-e2e` commit status appears.

- **Preview gate does not fire before bootstrapping**:
  - **WHEN** a push is made before `preview.yml` is on the default branch
  - **THEN** no `repository_dispatch` workflow run appears, confirming the default-branch constraint.

- **Protection bypass works and is minimal**:
  - **WHEN** a preview URL is opened in a normal browser without the secret
  - **THEN** the Vercel authentication page is shown, while the CI run with the bypass header reaches the application.

- **Header spot-check with curl**:
  - **WHEN** `curl -sI <deployment-url>/` and a `.woff2` URL from the page are requested
  - **THEN** the CSP and nosniff headers appear, the font is `font/woff2` with `immutable`, and `/` is not long-cached.

- **Required checks block merge**:
  - **WHEN** `ci` or `preview-e2e` is failing on a PR and both are marked required in branch protection
  - **THEN** the merge button is disabled until they pass.

- **Instant Rollback**:
  - **WHEN** the production alias is rolled back to the previous deployment (Vercel MCP `request_rollback` or the dashboard), with explicit user approval
  - **THEN** the previous build is served within seconds, the entry document is not stale, and the production header test passes against it.
