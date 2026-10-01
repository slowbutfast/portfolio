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
5. Click **Deploy**. Vercel builds and serves the app on the global edge network, with preview deployments for every pull request and automatic production updates on push to `master`.

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

Run all 16 Playwright E2E tests against a Vercel preview deployment to verify zero CSP console violations:

```bash
PREVIEW_URL=https://portfolio-git-<branch>.vercel.app npm run test:e2e
```

When `PREVIEW_URL` is set, Playwright targets the live edge deployment and skips booting a local dev server.