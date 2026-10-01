## Why

The portfolio SPA has completed core implementation and local verification, but requires production-grade deployment configuration to host on Vercel's Edge CDN. A hardened edge setup is required to enforce strict Content Security Policy (CSP), ensure universal content-hashed immutable caching for media and code bundles, eliminate dead routing rewrites that mask 404 errors, pin the Node engine to 22.x, enrich HTML metadata for social sharing, and ingest genuine sibling screenshots to replace placeholder title cards.

## What Changes

- **Edge Routing & 404 Integrity**: Remove catch-all rewrites and `cleanUrls` from `vercel.json` since client navigation is hash-based (`#/p/:id`), ensuring non-existent assets and endpoints return true HTTP 404s.
- **Universal Content-Hashed Asset Pipeline**: Move media files into `src/assets/` and import them directly in `src/data/projects.ts` so Vite compiles them into content-hashed URLs, enabling a single immutable edge cache rule (`public, max-age=31536000, immutable`) for `/assets/(.*)`.
- **Strict Edge Security Headers**: Apply strict CSP without `'unsafe-inline'` (`default-src 'self'`, `style-src 'self'`, `img-src 'self'`, `media-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`), `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- **Node Engine Pinning**: Pin `package.json` `"engines"` to `{"node": "22.x"}` matching Vite 7 requirements and eliminating Vercel open-range warnings.
- **Social Metadata & Favicon**: Add `<meta name="description">`, Open Graph tags (`og:title`, `og:description`, `og:type`), and a clean SVG favicon (`/favicon.svg`) to `index.html`.
- **Authentic Screenshot Assets**: Capture real screenshots from sibling repositories (`open-dungeon`, `pict-climate-risk-viz-chatbot`, `attention-max`, `sandwave-sim`) and delete synthetic title card generator `scripts/generate-screenshots.mjs`.
- **Automated Preview E2E Verification**: Extend `playwright.config.ts` to support `PREVIEW_URL` so all 16 Playwright tests run against live Vercel preview deployments to verify zero CSP console violations.

## Capabilities

### New Capabilities

- `edge-deployment`: Edge CDN deployment configuration, zero-rewrite hash routing, strict Content Security Policy, universal immutable asset caching, and automated preview deployment verification.

### Modified Capabilities

- `project-catalog`: Update catalog asset contract to use bundler-imported content-hashed media and real captured screenshots from sibling projects rather than synthetic title cards.

## Impact

- `vercel.json`: Completely rewritten for strict edge headers and immutable asset caching without catch-all rewrites.
- `.vercelignore`: New file preventing build bloat and sensitive dev tooling upload to Vercel.
- `package.json`: Updated `engines` field.
- `index.html`: Enhanced metadata, description, and SVG favicon.
- `public/favicon.svg`: New vector icon.
- `src/assets/`: Media files relocated and imported via ES modules.
- `src/data/projects.ts` & `src/data/projects.test.ts`: Updated to reference imported assets and assert real asset presence.
- `scripts/capture-demos.sh`: Updated to ingest genuine screenshots.
- `scripts/generate-screenshots.mjs`: Removed.
- `playwright.config.ts`: Parameterized with `PREVIEW_URL`.
