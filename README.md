# Node Portfolio Graph

A minimalist, Obsidian-inspired interactive 2D force-directed graph portfolio showcasing software projects with equal visual weight, tag-derived relational topology, dynamic hover gravitation, client-side interactive terminal simulations, and full keyboard/screen-reader accessibility.

---

## Architecture & Features

- **Physics Engine (`d3-force`)**:
  - Decentralized equal-mass node layout (uniform 18px radius, uniform charge, soft link spring).
  - Weak centering forces with soft boundary damping to prevent edge pinning.
  - Pointer interaction state machine (`idle -> hover -> drag -> coasting`) with dynamic velocity decay preserving fling inertia.
  - Hover gravitation pulling directly connected neighbors toward the pinned target node.
- **Relational Topology**: Exactly 9 unique undirected edges derived from a controlled `ParadigmTag` vocabulary (`LLM`, `Express`, `Vanilla JS`, `Audio`, `Agent Tooling`, `LaTeX`, `Geospatial`, `WebExtension`).
- **Interactive Project Drawer**: Accessible dialog (`role="dialog" aria-modal="true"`, focus trap) rendering discriminated preview modalities:
  - Interactive client-side terminal simulator with real captured CLI/test outputs, history navigation, and exit codes.
  - HTML5 video playback (`clip.mp4`) and authentic high-resolution screenshots captured from sibling projects.
  - Direct repository and live deployment linkouts.
- **Controls & Navigation**:
  - View mode toggle (interactive 2D canvas graph vs responsive card list).
  - Semantic tag filtering (OR-combined) and real-time search dimming (`data-dimmed="true"`).
  - Keyboard focus mirroring (`Tab`) rendering high-contrast focus rings and camera pans.
  - Deep linking (`#/p/:id`) with non-polluting hash history replacement.
  - `prefers-reduced-motion` compliance falling back to an accessible static circular ring.

---

## Local Development

### Requirements
- Node.js 22.x (`"engines": { "node": "22.x" }`)
- npm >= 10.0.0

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests (Vitest)
npm run test:unit

# Run end-to-end tests (Playwright, local dev server)
npm run test:e2e

# Run all 19 unit tests + 16 E2E tests
npm test

# Typecheck and build for production
npm run typecheck
npm run build

# Preview production build locally
npm run preview
```

### Capturing Demo Assets

Media (`clip.mp4`, `screenshots/*.png`) is committed under `src/assets/` and imported through Vite so production bundles emit content-hashed URLs. To regenerate the assets from sibling repositories, run:

```bash
# Point PORTFOLIO_SIBLINGS at the directory that contains sibling projects
PORTFOLIO_SIBLINGS=/path/to/projects npm run capture
```

This is a maintainer tool, not a build step: it fails loudly if a sibling repo or its test suite is unavailable.

---

## Deployment to Vercel Edge

The application is configured for the Vercel Edge CDN. Because navigation is fully hash-based (`#/p/:id`), `vercel.json` deliberately omits catch-all rewrites, so missing files and endpoints return authentic HTTP 404s instead of being silently rewritten to `index.html`.

### Option A: GitHub Git Integration (Recommended)

1. Push changes to the GitHub repository: `https://github.com/slowbutfast/portfolio`.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New... > Project**.
3. Import the `portfolio` repository.
4. Vercel automatically detects the Vite framework preset:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Vercel builds and serves the app on the global edge network, with preview deployments for every pull request and automatic production updates on push to the project's configured production branch (see [Promotion and Rollback](#promotion-and-rollback)).

### Option B: Vercel CLI

```bash
# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

### Edge Configuration Highlights (`vercel.json`)

- **Zero-Rewrite Hash Routing**: No `rewrites` or `cleanUrls`; hash routes resolve client-side and missing assets return real HTTP 404s.
- **Security Headers** (applied to every response):
  - Strict Content Security Policy **without** `'unsafe-inline'`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'`.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
  - `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Universal Immutable Asset Caching**: Every file under `/assets/` (hashed code bundles and media alike) is served with `Cache-Control: public, max-age=31536000, immutable`, so a single rule covers all subresources with zero risk of stale media.
- **Upload Hygiene (`.vercelignore`)**: Excludes developer tooling (`.agent/`, `.claude/`, `.codex/`, `.opencode/`, `openspec/`), E2E tests, capture scripts, and generated artifacts from build uploads.

### Validating a Live Preview Deployment

Run the Playwright E2E suite against a Vercel preview deployment to verify zero CSP console violations and the served headers:

```bash
PREVIEW_URL=https://portfolio-git-<branch>.vercel.app npm run test:e2e
```

When `PREVIEW_URL` is set, Playwright targets the live edge deployment, skips booting a local dev server, and also runs `e2e/preview-headers.spec.ts`, which compares the served CSP, security headers, font cache headers, and 404 behavior against the `edge-deployment` spec.

Previews are normally behind Vercel Deployment Protection. Set the project's **Protection Bypass for Automation** secret so requests are authorised; the suite fails fast with a clear message if it hits the Vercel login page instead of the app:

```bash
PREVIEW_URL=https://portfolio-git-<branch>.vercel.app \
VERCEL_AUTOMATION_BYPASS_SECRET=<secret> \
npm run test:e2e
```

With the secret set, Playwright tracing is forced off because traces record request headers and would leak the secret into any uploaded report. Two tests are skipped against a deployment because they depend on a development build (the React Profiler zero-commit check).

### Checking Headers Locally Before Deploying

`vite dev` and `vite preview` do not apply the headers from `vercel.json`, so the strict CSP is otherwise only exercised on a real deployment. To approximate it locally:

```bash
npm run build
node scripts/serve-with-vercel-headers.mjs          # serves dist/ on :5198 with vercel.json headers
PREVIEW_URL=http://localhost:5198 npx playwright test
```

This is an approximation of the Vercel edge (it applies the `vercel.json` header rules and returns real 404s, but does not reproduce anything else Vercel adds), so a preview deployment remains the authoritative check.

### Release Gating (CI)

- **`ci` (pull requests)**: `npm run typecheck`, `npm run build`, `npm run test:unit` (with `REQUIRE_DIST=1` so the build-output guards run), then `npm run test:e2e` against the local server. Mark it as a required check in branch protection.
- **`deployment-gate` (Vercel deployments)**: when Vercel dispatches a `vercel.deployment.success` `repository_dispatch` event, runs the E2E suite and header assertions against the preview (using the bypass secret), or the header assertions and load check against production, then posts a `preview-e2e` or `production-smoke` commit status. Mark `preview-e2e` as required once it has reported once.
- GitHub reads `repository_dispatch` workflows from the repository's **default branch**, so `deployment-gate` must be merged there before it fires. (`deployment_status` is not used: Vercel does not create GitHub Deployments for this project.)
- Every per-deployment URL, including production ones, is behind Deployment Protection, so the gate always needs the bypass secret. Only the production alias is public.
- Repository secret needed: `VERCEL_AUTOMATION_BYPASS_SECRET` (from the Vercel project's Protection Bypass for Automation).

### Promotion and Rollback

- **Production branch**: the branch Vercel promotes to production is set in the Vercel project's **Settings > Git**. It defaults to the repository's default branch, which is not necessarily `master`; confirm it there before relying on merge-to-promote.
- **Promotion**: merge to the production branch. Vercel builds (`tsc --noEmit && vite build`) and promotes; `deployment-gate` then verifies the production headers and load.
- **Rollback**: in the Vercel dashboard open **Deployments**, pick the last good production deployment, and choose **Instant Rollback** (or `vercel rollback <deployment-url>`). This repoints the production alias without rebuilding. Plan limits on which deployments can be rolled back to depend on your Vercel plan; check yours before you need it.
- **Roll back when**: browsers report CSP violations on production, fonts fall back to system faces, the production header check fails, or an accessibility regression ships.
- **Header spot-check after any rollout**: `curl -sI https://<deployment-url>/` (CSP, nosniff), and `curl -sI` a `.woff2` URL from the page (`font/woff2`, `immutable`).