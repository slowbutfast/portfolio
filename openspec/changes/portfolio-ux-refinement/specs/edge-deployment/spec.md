## MODIFIED Requirements

### Requirement: Strict Content Security Policy and security headers
The system SHALL enforce edge security headers on all responses, including a strict Content Security Policy without `'unsafe-inline'` styles (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; frame-src 'self' https://drive.google.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`, with policy invariants pinned in `src/utils/csp.ts` (`SPEC_CSP`) and guarded by automated Vitest assertions.

#### Scenario: Browser loads application under edge CSP
- **WHEN** a user visits the deployed application URL
- **THEN** all compiled scripts, external stylesheets, images, and video assets execute cleanly with zero CSP console error violations.

#### Scenario: Browser loads click-to-load Google Drive resume preview
- **WHEN** the About modal renders the click-to-load Google Drive resume preview iframe
- **THEN** the browser renders the `https://drive.google.com/file/d/.../preview` frame without Content Security Policy blocking errors.

#### Scenario: Attempting to frame the application
- **WHEN** an external site attempts to embed the portfolio within an `<iframe>`
- **THEN** the browser blocks framing according to `frame-ancestors 'none'`.
