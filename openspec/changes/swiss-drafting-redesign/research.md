## Source material

### User Prompt & Motion Specimen Brief (2026-11-11)
> "This piece is a high-precision typographic brand reveal and motion specimen, heavily rooted in Swiss Modernism, technical drafting, and generative minimalism. It frames typography not merely as text, but as mathematical architecture and a functional tool for intelligence.
>
> ### Adopted Aesthetic Principles
> * **Swiss Modernism & Editorial Rigor:** Strict invisible grid, asymmetrical balance, generous negative space, and disciplined margin annotations (running headers, corner crop marks, coordinates).
> * **Monochrome with Surgical Color Accents:** Binary black and white base (`#0a0a0c` / `#f4f4f5`) maximizing contrast. Surgical cyan (`#00f0ff`) for active selection, and amber (`#eab308`) for non-zero terminal exit codes.
> * **Deconstructed Technical Drafting:** Center crosshairs (`+`), concentric guide rings with 4 cardinal ticks, and relational projection vectors with distance callouts on the active node.
> * **Scale Juxtaposition:** Monumental macro-numerals (`01`–`06`) in background contrasted with micro-monospaced data (coordinates, plate numbers, build SHA).
> * **Stepped Character Mapping:** 12fps hard-cut glyph decoding running once on drawer open, strictly inside an `aria-hidden` overlay over the semantic `<h2>`.
> * **Respect Reduced Motion:** Bypasses canvas write-in and title scramble completely."

### Agent 1 & Agent 2 Review Feedback (2026-11-11)
- The real CSP in `vercel.json` is `default-src 'self'` and `style-src 'self' 'unsafe-inline'`. Fonts fall back to `default-src 'self'`.
- Vite by default inlines assets $<4\text{KB}$ as `data:` URIs; since `data:` is not in `default-src 'self'`, `vite.config.ts` must set `assetsInlineLimit: 0` to prevent font subsets being inlined as `data:font`.
- `#52525b` on `#0a0a0c` is only 2.56:1 (failing WCAG 1.4.11 3:1). Must use `#71717a` (4.09:1) for interactive boundaries.
- axe-core does NOT audit WCAG 1.4.11 boundary contrast; must add a dedicated Vitest token contrast test.
- `ProjectDrawer.tsx` already has `aria-label={`${title} project details`}` and the page already has `<h1>` in `ControlsOverlay.tsx`. Keep `<h2>` for the drawer title to avoid duplicate `<h1>` headings.
- Scramble layout jitter: Space Grotesk is proportional; render authentic text invisibly in the same CSS grid cell as the overlay to reserve exact dimensions.
- `__COMMIT_HASH__`: Wrap `git rev-parse --short HEAD` in try/catch with fallback to `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'`. Add global TS declaration in `src/vite-env.d.ts`.
- Canvas font gate: Explicitly call `document.fonts.load('12px "JetBrains Mono Variable"')` and trigger canvas repaint. Physics and vector lines initialize immediately; only text awaits the font promise.
- Rename "tangent projections" to "relational projection vectors" since graph edges are straight lines.
- Sweep `rounded-none` across `MediaView.tsx`, `ListView.tsx`, `TerminalSimulator.tsx`, and `ProjectDrawer.tsx`.

### Raised but not acted on
- **Drafting Paper Ivory Theme Toggle**: Deferred to future release. Shipping Dark Room Technical Monitor (`#0a0a0c`) first avoids doubling visual QA surface area.
- **Hover-Triggered Title Scrambling**: Constant noise across graph nodes violates motion hygiene. Restricted strictly to drawer open.
- **Timed Brand Reveal / Intro Video Sequence**: The 44-second logotype sequence was rejected in favor of immediate portfolio interactivity.

---

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| **Swiss Modernism** | Asymmetrical grid balance, rigorous negative space, neo-grotesque typography, peripheral annotations | Cluttered brutalism or chaotic neo-brutalist sticker design |
| **Technical Drafting** | Exposed construction lines, center crosshairs, cardinal ticks, projection vectors, hairline borders | Broken, unfinished, or wireframe placeholder UI |
| **Surgical Color** | Monochrome black/white base with isolated, high-significance color accents (cyan for active, amber for warning) | Multi-colored themes, rainbow tags, or gradient fills |
| **Stepped Character Mapping** | 12fps non-interpolated glyph decoding effect running strictly within an `aria-hidden` visual overlay | Corrupting DOM text nodes or announcing gibberish to screen readers |
| **Drafting HUD** | Peripheral margin coordinate tickers and corner registration crop marks | Heavy floating modals or obscuring dashboards |

---

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| `@google/design.md` spec (`github.com/google-labs-code/design.md@main`) | Standard specification for machine-readable tokens and markdown design systems | Apache-2.0 | 2026-11-11 |
| W3C WCAG 2.1 / 2.2 Guidelines | Contrast ratios (1.4.11 UI components $\ge 3:1$, 1.4.3 text $\ge 4.5:1$) and flashing thresholds (2.3.1) | W3C Software Notice | 2026-11-11 |
| Fontsource Variable Packages | Bundled, self-hosted variable font files compliant with strict local CSPs | MIT / OFL | 2026-11-11 |
| `@axe-core/playwright` | Automated accessibility assertions within Playwright e2e test suite | MPL-2.0 | 2026-11-11 |

---

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Google Fonts CDN (`fonts.googleapis.com`) | **Rejected** | Violates strict CSP in `vercel.json` (`default-src 'self'`); introduces external network dependency and render blocking | 2026-11-11 |
| `@fontsource-variable/space-grotesk` & `@fontsource-variable/jetbrains-mono` | **Adopted** | Self-hosted, content-hashed by Vite, zero CSP violations, enables variable weight interpolation | 2026-11-11 |
| CSS Pseudo-Elements for Brackets (`::before`/`::after`) | **Adopted** | Keeps accessible name clean for screen readers and `getByRole` selectors while delivering `[ TAG ]` aesthetic | 2026-11-11 |
| React State for Hover Coordinates | **Rejected** | Re-renders React HUD tree on every mousemove, thrashing 60fps canvas animation loop | 2026-11-11 |
| Direct DOM Ref for Hover Coordinates | **Adopted** | Updates `ref.current.textContent` imperatively throttled to rAF with zero React component reconciliation | 2026-11-11 |
| `#52525b` for Interactive Boundaries | **Rejected** | Actual contrast on `#0a0a0c` is 2.56:1, failing WCAG 1.4.11 3:1 minimum | 2026-11-11 |
| `#71717a` for Interactive Boundaries | **Adopted** | Delivers 4.09:1 on `#0a0a0c` and 3.86:1 on `#111215`, passing WCAG 1.4.11 | 2026-11-11 |

---

## Patterns adopted

- **CSS-Driven Design System**: Tokens declared in `DESIGN.md` mirrored to CSS custom properties in `src/styles.css`.
- **Canvas Font Gate**: Awaiting `document.fonts.load('12px "JetBrains Mono Variable"')` prior to drawing typography on canvas.
- **A11y Scramble Grid Pattern**: CSS grid cell containing invisible authentic `<h2 className="sr-only">` and `<span aria-hidden="true">{scrambled}</span>` to prevent layout width jitter.
- **Focal-Only Geometry Overhead**: Restricting incident vector measurements and projection lines exclusively to the selected or hovered node.

---

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Current Unit Tests Passing | 19 / 19 | Ran `npm run test:unit` via Vitest | 2026-11-11 | stable |
| Current TypeScript Typecheck | Clean (0 errors) | Ran `npm run typecheck` via `tsc --noEmit` | 2026-11-11 | stable |
| `vercel.json` CSP policy | `default-src 'self'; style-src 'self' 'unsafe-inline'` | Inspected `vercel.json` | 2026-11-11 | stable |
| `#71717a` contrast on `#0a0a0c` | 4.09:1 | Computed relative luminance math | 2026-11-11 | stable |
| `DESIGN.md` validates with 0 errors | 0 errors, 0 warnings | Ran `npx @google/design.md lint DESIGN.md` | 2026-11-11 | stable |
| Canonical physics hit radius | 18px | Inspected `src/physics/graphSimulation.ts` and `src/components/GraphCanvas.tsx` | 2026-11-11 | stable |

---

## Unverified assumptions

- *Assumption*: Frame rate on low-end mobile devices will remain $\ge 50\text{fps}$ with active dashed projection lines on single node touch.
  - *Verification cost*: Automated Playwright 4x CPU throttle test running continuous touch/coasting cycle with frame-time profiling.

---

## Superseded claims

- *Claim*: External Google Fonts CDN should be linked in `index.html`.
  - *Why wrong*: Violates strict Vercel edge CSP configuration and creates external latency.
  - *Replaced by*: Self-hosted `@fontsource-variable/*` npm packages.
- *Claim*: `#52525b` provides 3.2:1 contrast.
  - *Why wrong*: Mathematical calculation proves it is 2.56:1, violating WCAG 1.4.11.
  - *Replaced by*: `#71717a` (4.09:1).
- *Claim*: Project drawer should add `<h1 className="sr-only">`.
  - *Why wrong*: Duplicates page `<h1>` already present in `ControlsOverlay.tsx`.
  - *Replaced by*: Semantic `<h2>` with aria-hidden overlay.

---

## Links out

- Project Design System: [DESIGN.md](DESIGN.md)
- Core Physics Spec: [openspec/specs/graph-simulation/spec.md](openspec/specs/graph-simulation/spec.md)
- Controls Spec: [openspec/specs/portfolio-controls/spec.md](openspec/specs/portfolio-controls/spec.md)
- Drawer Spec: [openspec/specs/project-drawer/spec.md](openspec/specs/project-drawer/spec.md)
