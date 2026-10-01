## Source material

Verbatim retrospective and review feedback directing this deployment:

1. **Cross-Project Vercel Deployment Retrospective (2026-09-27)**:
   - "Deploying interactive client applications to modern edge CDN platforms like Vercel requires solving fundamentally different architectural problems depending on whether the application is a pure browser-native static application or a full-stack application decoupled for static preview/mockup hosting."
   - "Always set Cache-Control: no-cache for ES modules and application entry points to prevent client-side hash mismatches during deploys."

2. **Deployment Architecture Reviewer Feedback (2026-09-27)**:
   - "Every route in the app is a hash (`#/p/:id`), and the browser never sends the hash to the server. There's no client path that needs rewriting to index.html. What the catch-all rewrite actually does is turn every missing file into a 200 text/html... Delete rewrites and cleanUrls. Without the rewrite, Vercel serves real 404s."
   - "Public assets share a directory with Vite's hashed bundles... The clean fix is to stop putting media in public/. Import them through Vite (`import clipUrl from './assets/clip.mp4'`), which content-hashes them. Then everything under `/assets/` is hashed, and one rule covers it: `{ \"source\": \"/assets/(.*)\", \"headers\": [{ \"key\": \"Cache-Control\", \"value\": \"public, max-age=31536000, immutable\" }] }`."
   - "`node_modules/vite/package.json` declares `\"node\": \"^20.19.0 || >=22.12.0\"`, so Node 20.0 through 20.18 would fail the build... Pin to what you develop on: `\"engines\": { \"node\": \"22.x\" }`."
   - "Tailwind v4 compiles to `index-*.css` with no inline `<style>`... Try the policy without `'unsafe-inline'`. Point Playwright at the preview deployment: `baseURL: process.env.PREVIEW_URL ?? 'http://localhost:5199'`."
   - "Fix the screenshots before deploying: either capture real screenshots or remove the screenshot previews before production."

### Raised but not acted on

- **Report-Only CSP Phase (`Content-Security-Policy-Report-Only`)**: The reviewer suggested testing CSP in report-only mode for a day. We instead opt to test enforced CSP directly in automated Playwright E2E tests against the Vercel preview deployment URL, which immediately catches any browser console security violations deterministically without a lingering transition period.
- **Apex HSTS `includeSubDomains`**: Deliberately omitted because it permanently commits all subdomains to HTTPS before custom apex domain topology is known.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Hash Routing | Client-side routing driven exclusively by `window.location.hash` (`#/p/:id`) | Server-side or HTML5 pushState routing requiring path rewrites |
| Catch-All Rewrite | A server rule mapping `/(.*)` to `/index.html` | A requirement for hash-routed SPAs; without it, missing assets return 404 |
| Universal Hashing | Emitting all static media (video, screenshots, scripts, styles) via bundler with unique content hashes | Hand-maintaining distinct cache TTL rules for unhashed public assets |
| Strict CSP | Policy with `script-src 'self'`, `style-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'` | Permitting `'unsafe-inline'` styles or unnecessary `data:` / `blob:` sources |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| [Vercel Project Configuration Documentation](https://vercel.com/docs/projects/project-configuration) | Structure and semantics of `vercel.json` headers, rewrites, and presets | Proprietary / Official Docs | 2026-09-27 |
| [W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) | CSSOM programmatic style modifications are not blocked by `style-src` | W3C Software and Document License | 2026-09-27 |
| [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html) | Explicit ES module imports of media files emit content-hashed URLs | MIT | 2026-09-27 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Vercel Edge Network | Adopted | Standard deployment target across portfolio projects; supports preview URLs and atomic deploys | 2026-09-27 |
| Cloudflare Pages | Rejected | Sibling projects (`open-dungeon`, `sandwave-sim`) already use Vercel; maintaining consistency minimizes tooling friction | 2026-09-27 |
| Native ES Imports for Media | Adopted | Guarantees bundler content hashing, enabling universal 1-year immutable caching on edge CDN | 2026-09-27 |
| Public Directory for Media | Rejected | Leaves assets unhashed, requiring complex, error-prone split caching heuristics | 2026-09-27 |

## Patterns adopted

- **Universal Content-Hashed Asset Pipeline**: Media files (`clip.mp4`, `screenshots/*.png`) moved into `src/assets/` and imported in `src/data/projects.ts`. Vite emits them as `dist/assets/*-[hash].[ext]`, allowing a single immutable edge cache header (`max-age=31536000, immutable`).
- **Zero-Rewrite Hash Edge Configuration**: Relying purely on hash routing with no catch-all rewrite, preserving authentic HTTP 404 responses for missing files.
- **Preview E2E Validation**: Parameterizing Playwright's `baseURL` with `PREVIEW_URL` so automated tests execute against live Vercel preview deployments, catching CSP console violations before production.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Node engine requirement for Vite 7 | `^20.19.0 \|\| >=22.12.0` | `node_modules/vite/package.json` inspection | 2026-09-27 | stable |
| Tailwind v4 CSS output structure | Emits single `dist/assets/index-*.css` without inline `<style>` | Inspected `dist/index.html` after production build | 2026-09-27 | stable |
| Real sibling UI assets availability | OpenDungeon canvas (1280x720), PICT map (1920x1080), Attention Max popup (700x1040) exist | `file` inspection of sibling paths | 2026-09-27 | stable |
| Sandwave Sim headless capture feasibility | 1280x720 PNG captured headlessly in 1s | Executed Playwright capture on `sandwave-sim/index.html` | 2026-09-27 | stable |
| Hash routing independence from server rewrites | App navigation uses `window.location.hash` | Code inspection of `src/App.tsx` | 2026-09-27 | stable |

## Unverified assumptions

- Vercel's automated git deployment bot correctly builds on push to `master` without custom environment variables. (Cost to check: push commit to GitHub and observe build logs).

## Superseded claims

| What was believed | Why it was wrong | What replaced it |
| :--- | :--- | :--- |
| Catch-all rewrite `/(.*) -> /index.html` is required | Hash routing never sends routes to server; rewrite masks 404s by serving HTML for missing files | No rewrites; static file serving with authentic 404s |
| `'unsafe-inline'` required in `style-src` | Tailwind v4 compiles external CSS; JS style attributes go via CSSOM which CSP does not restrict | Strict `style-src 'self'` |
| `engines: ">=20.0.0"` is safe | Vite 7 rejects Node 20.0–20.18, and Vercel warns on open ranges | Pinned `engines: { "node": "22.x" }` |
| Split cache heuristics for `/assets/` | Unhashed media in `public/assets/` mixed with hashed code in `dist/assets/` | Move media to `src/assets/`, import via Vite, and use single immutable rule |

## Links out

- [Vercel Deployment Plan (Revised)](file:///home/node/.gemini/antigravity-cli/brain/7c5fc18a-da96-425d-9df6-0001a52d0b61/vercel_deployment_plan.md)
