# edge-deployment Specification

## Purpose
Defines the Vercel Edge CDN configuration, security header enforcement, zero-rewrite hash routing, universal immutable asset caching, and automated preview verification.
## Requirements
### Requirement: Edge static routing and authentic 404 behavior
The system SHALL deploy to Vercel without catch-all SPA rewrites, serving client hash routes (`#/p/:id`) statically and returning true HTTP 404 status codes for missing assets and endpoints.

#### Scenario: Requesting application root
- **WHEN** a client requests `/`
- **THEN** Vercel edge serves `index.html` with status 200.

#### Scenario: Requesting missing static assets
- **WHEN** a client or browser requests a non-existent asset (e.g., `/assets/screenshots/missing.png` or `/favicon.ico` before creation)
- **THEN** Vercel edge returns a real HTTP 404 Not Found error rather than rewriting to `index.html` with status 200.

### Requirement: Strict Content Security Policy and security headers
The system SHALL enforce edge security headers on all responses, including a strict Content Security Policy without `'unsafe-inline'` styles (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

#### Scenario: Browser loads application under edge CSP
- **WHEN** a user visits the deployed application URL
- **THEN** all compiled scripts, external stylesheets, images, and video assets execute cleanly with zero CSP console error violations.

#### Scenario: Attempting to frame the application
- **WHEN** an external site attempts to embed the portfolio within an `<iframe>`
- **THEN** the browser blocks framing according to `frame-ancestors 'none'`.

### Requirement: Universal immutable caching for content-hashed assets
The system SHALL configure Vercel edge cache headers such that all assets under `/assets/(.*)` are marked with `public, max-age=31536000, immutable`, while the entry document is revalidated via default edge cache semantics.

#### Scenario: Browser requests static bundle or media asset
- **WHEN** a client requests any file under `/assets/`
- **THEN** the response includes `Cache-Control: public, max-age=31536000, immutable`.

### Requirement: Automated preview deployment verification
The system SHALL support testing live preview deployments by configuring Playwright with an optional `PREVIEW_URL` environment variable, executing all 16 E2E tests against the remote edge URL.

#### Scenario: Executing E2E tests against Vercel preview deployment
- **WHEN** `PREVIEW_URL` is set to a Vercel preview deployment URL and `npm run test:e2e` is executed
- **THEN** Playwright navigates to the preview URL, runs tests against the live edge deployment, and verifies zero console errors across desktop and mobile viewports.

