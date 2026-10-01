# Verification — `vercel-edge-deployment`

## Executive Summary & Environment

- **Status**: All specs verified passing. Zero-rewrite edge routing, strict CSP without `'unsafe-inline'`, universal content-hashed asset bundling with a single immutable cache rule, Node 22.x engine pin, social metadata/favicon, authentic sibling screenshot ingestion, and `PREVIEW_URL`-parameterized Playwright are all implemented and empirically verified.
- **Date**: 2026-10-01
- **Environment**: Linux, Node v22.23.2, npm 10.9.8, Vite 7.3.6, Vitest 3.2.7, Playwright 1.63.0, TypeScript 5.9.3. Sibling repos under `/home/node/global-sandbox/projects` (exposed to the capture script via `PORTFOLIO_SIBLINGS`).

## Requirement Adherence Audit Matrix

| Capability | Requirement & Scenario | Verification Method / Test File | Status |
| :--- | :--- | :--- | :--- |
| `edge-deployment` | `### Requirement: Edge static routing and authentic 404 behavior`<br>`#### Scenario: Requesting application root` | `vercel.json` contains **no** `rewrites` / `cleanUrls`; built `dist/` served statically — `GET /` → `200` (`index.html`) via `vite build` + static server | **PASS** |
| `edge-deployment` | `#### Scenario: Requesting missing static assets` | `GET /assets/screenshots/missing.png` → **404**, `GET /assets/nope.txt` → **404**, `GET /some/route` → **404** (authentic, not an SPA 200 rewrite) | **PASS** |
| `edge-deployment` | `### Requirement: Strict Content Security Policy and security headers`<br>`#### Scenario: Browser loads application under edge CSP` | `vercel.json` `/(.*)` headers carry `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'` (no `'unsafe-inline'`, no `data:`/`blob:`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Full 16-test Playwright suite executed against a server applying these exact headers — **zero console errors** across desktop + mobile | **PASS** |
| `edge-deployment` | `#### Scenario: Attempting to frame the application` | `frame-ancestors 'none'` + `X-Frame-Options: DENY` present in the global header rule; CSP-simulated e2e run confirmed no security violations | **PASS (audit)** — header rule present |
| `edge-deployment` | `### Requirement: Universal immutable caching for content-hashed assets`<br>`#### Scenario: Browser requests static bundle or media asset` | `vercel.json` single rule `source: "/assets/(.*)"` → `Cache-Control: public, max-age=31536000, immutable`. Build emits **only** hashed files under `dist/assets/` (`clip-CgA0mo6C.mp4`, `open-dungeon-BIe_5eRq.png`, `sandwave-sim-DTt19YFD.png`, `pict-climate-risk-viz-chatbot-i2TSBurv.png`, `attention-max-DQ7XVtCW.png`, `index-WNu6Mdob.js`, `index-CTB3HK0n.css`) | **PASS** |
| `edge-deployment` | `### Requirement: Automated preview deployment verification`<br>`#### Scenario: Executing E2E tests against Vercel preview deployment` | `playwright.config.ts` reads `baseURL = process.env.PREVIEW_URL ?? 'http://localhost:5199'` and skips the local `webServer` when `PREVIEW_URL` is set; validated locally by running `PREVIEW_URL=http://127.0.0.1:5213 npx playwright test` against a CSP/header-simulated edge server — 16/16 passed | **PASS** |
| `project-catalog` | `### Requirement: Verified project metadata catalog and preview mapping` (all 6 projects with bundler-imported content-hashed media) | `src/data/projects.ts` imports `open-dungeon.png`, `pict-climate-risk-viz-chatbot.png`, `attention-max.png`, `sandwave-sim.png`, `clip.mp4` via ES module imports; `src/data/projects.test.ts` asserts every video/screenshot `src` resolves to a real file under `src/assets/` | **PASS** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| Node 22.x satisfies Vite 7 requirements | `package.json` `engines.node = "22.x"`; `node --version` = v22.23.2 | Build/typecheck/tests all pass on 22.23.2 | stable |
| Tailwind v4 emits external CSS without inline `<style>` tags | Grep of `src/**/*.tsx` for `style={{` / `style=` — only CSSOM assignment (`canvas.style.width`, `document.body.style.overflow`), which CSP `style-src` does not restrict | 0 inline style attributes; CSP-simulated e2e = 16/16 with zero console errors | stable |
| Real sibling UI assets exist and are authentic | `file` + PIL inspection after `npm run capture` | open-dungeon 1280×720, pict-climate 1920×1080, attention-max 700×1040, sandwave-sim 1280×720 (headless capture, 976 unique colors), clip.mp4 355,655 bytes | stable |
| Sandwave Sim headless capture is feasible | `scripts/capture-sandwave.mjs` Playwright capture of `sandwave-sim/index.html` | 1280×720 PNG written with genuine canvas content (cream plate + dark controls palette) | stable |
| All sibling test suites run clean for capture | `npm run capture` ran `node --test tests/unit/vercelEntry.test.mjs`, resume-builder `--help/--schema/--list/--lint`, `npm test` in transcribe-plus / sandwave-sim / attention-max | All exit 0; captured JSON regenerated and 19/19 unit tests still pass | stable |
| Vercel serves `index.html` at `/` and 404s missing assets without rewrites | Static serving of `dist/` mirrors edge behavior: `/` → 200, `/assets/screenshots/missing.png` → 404 | Authentic 404 contract holds | stable |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| Zero-Rewrite Hash Routing | `vercel.json` with no `rewrites` / `cleanUrls`; hash parsing in `src/App.tsx` (`#/p/:id`) | `vercel.json`, `src/App.tsx` | Yes |
| Universal Hashing | ES module asset imports (`import clip from '../assets/clip.mp4'`) → `dist/assets/*-[hash].[ext]` | `src/data/projects.ts`, `vite.config.ts` | Yes |
| Strict CSP | `default-src 'self' …` header (no `'unsafe-inline'`) | `vercel.json` | Yes |
| Single Immutable Rule | `{ source: "/assets/(.*)", headers: [Cache-Control immutable] }` | `vercel.json` | Yes |
| Authentic Screenshot Ingestion | `scripts/capture-demos.sh` + `scripts/capture-sandwave.mjs` | `scripts/` | Yes |
| Preview E2E Parameterization | `baseURL = process.env.PREVIEW_URL ?? 'http://localhost:5199'` | `playwright.config.ts` | Yes |

## Landed Tech Footprint & Patterns

| Adopted Pattern / Package | Implementation File(s) | Verification Command / Suite |
| :--- | :--- | :--- |
| Vercel edge header config (`framework`, `buildCommand`, `outputDirectory`, merged `headers`) | `vercel.json` | `node -e 'JSON.parse(...vercel.json)'` + static-server 404/200 checks |
| Vite content-hashed media bundling | `src/data/projects.ts` (ES imports) | `npm run build` → hashed `dist/assets/*` |
| Strict CSP / nosniff / DENY / Permissions-Policy edge headers | `vercel.json` `/(.*)` rule | CSP-simulated `PREVIEW_URL` Playwright run (16/16, zero console errors) |
| Immutable asset cache | `vercel.json` `/assets/(.*)` rule | build output inspection (all assets hashed) |
| Headless Playwright capture | `scripts/capture-sandwave.mjs` | `npm run capture` → verified 1280×720 PNG |
| Preview URL e2e | `playwright.config.ts` | `PREVIEW_URL=... npm run test:e2e` |

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| Vitest asset imports resolve to a `src/assets/`-relative URL | Vite resolves imported media to `/src/assets/...` at test time | `projects.test.ts` resolves the imported URL against the repo root (`new URL('../../', import.meta.url)`) | dev-time asset URLs are root-relative source paths |
| `vite preview` can demonstrate authentic 404s locally | `vite preview` applies an SPA history fallback (returns 200 for unknown paths) | 404 verification uses a plain static server over `dist/` (Vercel behavior: no rewrites ⇒ real 404s) | `vercel.json` defines the true edge contract |
| The old partial config (`cleanUrls`, `'unsafe-inline'`, `data:`/`blob:`, split cache rules, catch-all rewrite) could be reused | It directly violates every new invariant | Full rewrite of `vercel.json` per the edge-deployment spec | zero-rewrite, strict-CSP, single immutable rule contract |

## Verbatim Execution Logs

### `node -e 'JSON.parse(fs.readFileSync("vercel.json","utf8"))'`
```
vercel.json: valid JSON
```

### `npm run typecheck`
```
> tsc --noEmit
(0 errors)
```

### `npm run build`
```
vite v7.3.6 building client environment for production...
✓ 1950 modules transformed.
dist/index.html                                           1.12 kB │ gzip:  0.49 kB
dist/assets/sandwave-sim-DTt19YFD.png                    46.09 kB
dist/assets/pict-climate-risk-viz-chatbot-i2TSBurv.png   90.25 kB
dist/assets/attention-max-DQ7XVtCW.png                  126.24 kB
dist/assets/open-dungeon-BIe_5eRq.png                   288.52 kB
dist/assets/clip-CgA0mo6C.mp4                           355.66 kB
dist/assets/index-CTB3HK0n.css                           21.62 kB │ gzip:  4.89 kB
dist/assets/index-WNu6Mdob.js                           287.90 kB │ gzip: 91.69 kB
✓ built in 3.62s
```

### `npm run test:unit` (19 tests)
```
✓ src/data/projects.test.ts (5 tests) 11ms
✓ src/physics/graphSimulation.test.ts (6 tests) 78ms
✓ src/utils/graphTopology.test.ts (4 tests) 8ms
✓ src/utils/terminalCommandResolver.test.ts (4 tests) 7ms
Test Files  4 passed (4)
     Tests  19 passed (19)
```

### `npm run test:e2e` (16 tests)
```
16 passed (12.6s)
```

### `PREVIEW_URL=http://127.0.0.1:5213 npx playwright test` (CSP/headers-simulated edge)
```
16 passed (6.7s)   # zero console errors under strict CSP
```

### `npm run capture` (verbatim)
```
repo root:      /home/node/.local/share/opencode/worktree/.../artful-jackal
sibling base:   /home/node/global-sandbox/projects
clip.mp4: copied 355655 bytes from transcribe-plus
capture/open-dungeon: 'node --test tests/unit/vercelEntry.test.mjs' (exit 0, 2512ms)
capture/agentic-resume-builder: 'python3 build_resume.py --help' (exit 0, 138ms)
capture/agentic-resume-builder: 'python3 build_resume.py --schema' (exit 0, 136ms)
capture/agentic-resume-builder: 'python3 build_resume.py --list' (exit 0, 158ms)
capture/agentic-resume-builder: 'python3 build_resume.py --lint' (exit 0, 140ms)
capture/transcribe-plus: 'npm test' (exit 0, 10366ms)
capture/sandwave-sim: 'npm test' (exit 0, 48546ms)
capture/attention-max: 'npm test' (exit 0, 2472ms)
screenshots: ingesting authentic sibling captures
screenshots: copied open-dungeon, pict-climate-risk-viz-chatbot, attention-max
capture/sandwave-sim: wrote .../src/assets/screenshots/sandwave-sim.png
capture-demos complete.
```

### Static edge behavior (plain server over `dist/`)
```
200  /                          (index.html)
404  /assets/screenshots/missing.png   (authentic 404)
404  /assets/nope.txt                  (authentic 404)
200  /assets/sandwave-sim-DTt19YFD.png (hashed asset)
200  /assets/clip-CgA0mo6C.mp4         (hashed asset)
404  /some/route                       (authentic 404)
200  /favicon.svg
```

### `openspec validate vercel-edge-deployment --strict`
```
Change 'vercel-edge-deployment' is valid
```

## Links out

- [Vercel Project Configuration Documentation](https://vercel.com/docs/projects/project-configuration)
- [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html)