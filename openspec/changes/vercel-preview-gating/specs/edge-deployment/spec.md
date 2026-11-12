## MODIFIED Requirements

### Requirement: Universal immutable caching for content-hashed assets
The system SHALL configure Vercel edge cache headers such that all assets under `/assets/(.*)` (scripts, stylesheets, fonts, images, and video) are marked with `public, max-age=31536000, immutable` by a single header rule, while the entry document is revalidated via default edge cache semantics rather than long-cached.

#### Scenario: Browser requests static bundle or media asset
- **WHEN** a client requests any file under `/assets/`
- **THEN** the response includes `Cache-Control: public, max-age=31536000, immutable`.

#### Scenario: Browser requests a self-hosted font
- **WHEN** a client requests a `.woff2` file emitted into `/assets/`
- **THEN** the response status is 200, `Content-Type` is `font/woff2`, and `Cache-Control` is `public, max-age=31536000, immutable`.

#### Scenario: Browser requests the entry document
- **WHEN** a client requests `/` or `/index.html`
- **THEN** the response does not carry a long-lived `max-age` and is revalidated on each visit.

### Requirement: Automated preview deployment verification
The system SHALL support testing live preview deployments by configuring Playwright with an optional `PREVIEW_URL` environment variable and, when `VERCEL_AUTOMATION_BYPASS_SECRET` is also set, sending the `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie: true` headers on every request, executing the E2E suite against the remote edge URL.

#### Scenario: Executing E2E tests against Vercel preview deployment
- **WHEN** `PREVIEW_URL` is set to a Vercel preview deployment URL and `npm run test:e2e` is executed
- **THEN** Playwright navigates to the preview URL, runs tests against the live edge deployment, and verifies zero console errors across desktop and mobile viewports.

#### Scenario: Preview is protected and the bypass secret is provided
- **WHEN** `PREVIEW_URL` points at a protected preview and `VERCEL_AUTOMATION_BYPASS_SECRET` is set
- **THEN** requests carry the bypass headers and the tests exercise the application, not the Vercel authentication page.

#### Scenario: Preview is protected and no bypass secret is provided
- **WHEN** a request to `PREVIEW_URL` returns the Vercel authentication page or a 401
- **THEN** the run fails immediately with a message naming the missing bypass secret, rather than reporting unrelated test failures.

#### Scenario: Test depends on a development-only build feature
- **WHEN** `PREVIEW_URL` is set and a test relies on behaviour absent from production builds (for example the React Profiler commit counter)
- **THEN** that test is skipped instead of passing vacuously.

## ADDED Requirements

### Requirement: Self-hosted font assets are emitted as files
The system SHALL emit every `.woff2` file as a separate content-hashed asset and SHALL NOT inline font data as `data:` URIs, because the served CSP does not permit `data:` fonts (inherited from `default-src 'self'`).

#### Scenario: Production build output is inspected
- **WHEN** `npm run build` completes
- **THEN** `dist/assets/` contains at least one `.woff2` file and no built JS or CSS file contains `data:font` or `data:application/font`.

### Requirement: Build provenance resolves on every deploy path
The system SHALL resolve the build-time `__COMMIT_HASH__` global in this order, never throwing and never printing git error output: the first 7 characters of a non-empty `VERCEL_GIT_COMMIT_SHA`, then the output of `git rev-parse --short HEAD`, then the literal `dev`.

#### Scenario: Git-integration build on Vercel
- **WHEN** `VERCEL_GIT_COMMIT_SHA` is set during the build
- **THEN** `__COMMIT_HASH__` equals its first 7 characters.

#### Scenario: Build without Vercel variables but with a git checkout
- **WHEN** `VERCEL_GIT_COMMIT_SHA` is unset or empty and `.git` is present
- **THEN** `__COMMIT_HASH__` equals the output of `git rev-parse --short HEAD`.

#### Scenario: Build without Vercel variables and without git
- **WHEN** `VERCEL_GIT_COMMIT_SHA` is unset and `git rev-parse` fails
- **THEN** the build still succeeds and `__COMMIT_HASH__` equals `dev`.

### Requirement: Committed edge configuration is pinned by tests
The system SHALL include automated tests that fail if `vercel.json` stops matching this specification: exactly one header rule for `/assets/(.*)` with the immutable `Cache-Control` value, and a Content Security Policy whose directives equal those in the strict CSP requirement.

#### Scenario: Cache rule is changed or removed
- **WHEN** `vercel.json` no longer contains exactly one `/assets/(.*)` rule with `public, max-age=31536000, immutable`
- **THEN** the unit test suite fails.

#### Scenario: CSP is loosened
- **WHEN** `vercel.json`'s CSP gains a directive or source not in the specified policy (for example `'unsafe-inline'` in `style-src`)
- **THEN** the unit test suite fails.

### Requirement: Served headers are asserted against the specification
The system SHALL include a preview-only test that fetches the deployed application and asserts the served security headers, the cache headers of the discovered font assets, root-document revalidation, and the 404 behavior of a missing asset, so the deployed configuration cannot drift from this specification unnoticed.

#### Scenario: Deployed CSP is compared to the specified policy
- **WHEN** the header test runs against a deployment URL
- **THEN** the served `Content-Security-Policy` contains exactly the directives specified in the CSP requirement, compared as a set independent of order and whitespace.

#### Scenario: Font assets are discovered and checked
- **WHEN** the application loads on the deployment URL
- **THEN** at least one `.woff2` response is observed and every one has status 200, `Content-Type: font/woff2`, and the immutable `Cache-Control` value.

#### Scenario: Missing path returns a real 404
- **WHEN** the test requests `/assets/does-not-exist.woff2`
- **THEN** the response status is 404.

### Requirement: Console and CSP error tracking across interaction flows
The system SHALL fail the E2E run on any `console` error or uncaught page error during page load, deep-link open, project drawer open, About modal open, and terminal command execution, not only during initial load.

#### Scenario: Drawer open under edge CSP
- **WHEN** a project drawer is opened (including via `#/p/:id` on cold load) on a deployment URL
- **THEN** no console error or page error is recorded.

#### Scenario: About modal under edge CSP
- **WHEN** the About modal is opened (including via `#/about` on cold load)
- **THEN** no console error or page error is recorded.

#### Scenario: Terminal command under edge CSP
- **WHEN** a terminal command chip is executed in the drawer on a deployment URL
- **THEN** no console error or page error is recorded.
