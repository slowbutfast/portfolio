# Verification — `node-portfolio-graph`

## Executive Summary & Environment

- **Status**: All specs verified passing. This revision is a repair pass addressing the PR #1 verification failures (hover release, Playwright worker flakiness, real captured terminal outputs, drawer remount/navigation, dynamic physics edges).
- **Date**: 2026-09-27
- **Environment**: Linux (arm64), Node v22.23.2, npm 10.9.8, Vite 7.3.6, Vitest 3.2.7, Playwright 1.63.0, TypeScript 5.9.3. Sibling repos under `/home/node/global-sandbox/projects` (exposed to the capture script via `PORTFOLIO_SIBLINGS`).

## Requirement Adherence Audit Matrix

| Capability | Requirement & Scenario | Verification Method / Test File | Status |
| :--- | :--- | :--- | :--- |
| `graph-simulation` | `### Requirement: Decentralized equal mass node distribution`<br>`#### Scenario: Graph initialization without central clump or corner pinning` | `src/physics/graphSimulation.test.ts` — 300 ticks at 1440x900 and 390x844 asserting pairwise clearance ≥60, bounds ∈ [20, dim−20], OD centroid freedom, alpha < 0.005 (edges now derived from the real catalog) | **PASS** |
| `graph-simulation` | `### Requirement: Viewport boundary damping and resize responsiveness`<br>`#### Scenario: Node approaches canvas boundary` | Boundary force (`graphSimulation.ts` `createBoundaryForce`, 0.1·alpha within 40px) + bounds-containment assertions in the physics test | **PASS** |
| `graph-simulation` | `#### Scenario: Viewport resize or device orientation change` | `sim.resize()` invoked from `ResizeObserver` in `GraphCanvas.tsx`; recomputes center/charge, reheats alpha 0.2 | **PASS (audit)** — code-level |
| `graph-simulation` | `### Requirement: Pointer interaction state machine and dynamic velocity decay`<br>`#### Scenario: User drags and flings a node` | `graphSimulation.test.ts` → *"does not re-pin a node while it is coasting after a fling"* (drag → dragEnd → `coasting`; hover suppressed) | **PASS** |
| `graph-simulation` | `#### Scenario: Coasting deceleration settles` | `poll()` restores decay 0.4 / state `idle` below 0.5 px/tick; covered by the same state-machine test's coasting transition | **PASS (audit)** — code-level |
| `graph-simulation` | `#### Scenario: Pointer remains over node after fling release` | `graphSimulation.test.ts` → *"does not re-pin a node while it is coasting after a fling"* asserts `sim.hovered === null` while coasting | **PASS** |
| `graph-simulation` | `### Requirement: Dynamic hover gravitation wave`<br>`#### Scenario: Pointer hovers over a stationary node in idle state` | `graphSimulation.test.ts` → *"pins the hovered node and unpins it when the pointer leaves"* (fx/fy set to x/y, state `hover`) | **PASS** |
| `graph-simulation` | `#### Scenario: Pointer leaves a hovered node` | `graphSimulation.test.ts` → same test asserts `fx/fy === null`, `hovered === null`, state `idle`; plus *"unpins the previous node before pinning a different one"* (the PR #1 regression) and *"keeps the existing pin when hover re-fires on the same node"* | **PASS** |
| `graph-simulation` | `### Requirement: Reduced motion accessibility`<br>`#### Scenario: User has reduced motion enabled` | `GraphCanvas.tsx` matches `prefers-reduced-motion`, skips simulation, renders `staticRing()` and hit-tests `staticPosRef`. Scratch browser check (chromium `reducedMotion: 'reduce'`): static ring rendered (13,542 opaque px), canvas click on a ring node opened the drawer, zero console errors | **PASS** |
| `project-catalog` | Typed catalog `satisfies ProjectData[]`, 6 projects, discriminated previews | `src/data/projects.test.ts` — unique ids, preview union, **referenced** asset disk existence, terminal command tables | **PASS** |
| `project-catalog` | Controlled `ParadigmTag` vocabulary + exact 9 derived edges + labels | `src/utils/graphTopology.test.ts` (4 cases) + `projects.test.ts` real-catalog 9-edge pin | **PASS** |
| `project-drawer` | `aria-modal` drawer, focus trap, Escape/backdrop close, focus return, mobile bottom sheet | `ProjectDrawer.tsx` (`role="dialog" aria-modal="true"`, `useLayoutEffect` trap); e2e card-click + `aria-modal`, Escape close, deep-link close clears hash. `key={selected.id}` forces a clean remount per project | **PASS** |
| `project-drawer` | Interactive terminal simulation (chips, exit codes, history, unknown → 127 + suggestions) | `terminalCommandResolver.test.ts` (4 cases) + `TerminalSimulator.tsx`; e2e command-chip test against the newly captured open-dungeon output | **PASS** |
| `project-drawer` | Media preview (video player, screenshot cards) | `MediaView.tsx`; referenced-asset existence asserted in `projects.test.ts`; e2e zero-console-errors load | **PASS** |
| `portfolio-controls` | Graph/List toggle | `ControlsOverlay.tsx` + `ListView.tsx`; e2e list-view test (6 cards, card → drawer) | **PASS** |
| `portfolio-controls` | Tag pill filter (OR-combined) dims non-matching with `data-dimmed="true"` | `App.tsx` `dimmedIds`; e2e LLM pill asserts 4 non-matching dimmed / 2 matching not | **PASS** |
| `portfolio-controls` | Live search dimming | `App.tsx` `matchesFilters`; e2e search test | **PASS** |
| `portfolio-controls` | Keyboard focus mirroring (focus ring + camera pan) | `App.tsx` hidden `<nav aria-label="Projects">` + `GraphCanvas.tsx` focus ring/camera pan | **PASS (audit)** — code-level |
| `portfolio-controls` | Deep linking `#/p/:id`, unknown slug ignored, hash cleared on close | `App.tsx` `hashchange` parse; `closeDrawer` now uses `history.replaceState(null, '', location.pathname)` (no history entry). e2e deep-link open/close + bogus-slug + Escape | **PASS** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| React 19 + Tailwind v4 works with Vite 7 in a clean checkout | `npm run typecheck` + `npm run build` | 0 TS errors; Vite build exits 0 | stable |
| 6 nodes with weak centering (0.035) and charge (−min(w,h)·0.55) settle in <1.5s | Headless physics test, 300 ticks, both viewports | alpha < 0.005, clearance ≥60px retained | stable |
| `transcribe-plus` clip is 355,655 bytes and playable standalone | `scripts/capture-demos.sh` copies it verbatim; `stat -c%s` | `public/assets/clip.mp4` = 355,655 bytes | stable |
| `build_resume.py` supports `--help/--schema/--list/--lint` | Capture script ran the real `.venv/bin/python` for all four flags | All four exit 0; verbatim stdout committed | stable |
| `open-dungeon` Vercel entry suite is runnable headlessly | Capture script ran `node --test tests/unit/vercelEntry.test.mjs` | 16/16 tests pass, exit 0 | stable |
| `transcribe-plus` / `sandwave-sim` / `attention-max` test suites pass | Capture script ran real `npm test` in each sibling | 79 pass/1 skip, 272 pass, 58 pass; all exit 0 | stable |
| Sandbox external-execution blocking (prior pass) | `PORTFOLIO_SIBLINGS=/home/node/global-sandbox/projects npm run capture` | Real outputs captured; the previous curated placeholders are gone | superseded |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| Decentralized Layout | `chargeStrength()`, `forceX/forceY` weak centering, `createBoundaryForce()` | `src/physics/graphSimulation.ts` | Yes |
| Equal Weight / Mass | `NODE_RADIUS = 18`, uniform `forceManyBody` strength | `src/physics/graphSimulation.ts` | Yes |
| Tag-Derived Edge | `deriveEdges(projects): GraphEdge[]` | `src/utils/graphTopology.ts` | Yes |
| Terminal Simulator | `TerminalSimulator`, `TerminalSession`, `resolveCommand()` | `src/components/TerminalSimulator.tsx`, `src/utils/terminalCommandResolver.ts` | Yes |
| Preview Union | discriminated `Preview` union (`terminal`/`video`/`screenshot`/`linkout`) | `src/types/portfolio.ts` | Yes |
| Pointer Interaction State Machine | `SimState = 'idle' \| 'hover' \| 'drag' \| 'coasting'`; `hover()`, `dragStart/Move/End()`, `poll()` | `src/physics/graphSimulation.ts` | Yes |

## Landed Tech Footprint & Patterns

| Adopted Pattern / Package | Implementation File(s) | Verification Command / Suite |
| :--- | :--- | :--- |
| `d3-force` v3 simulation (charge, link, collide, x/y, boundary) | `src/physics/graphSimulation.ts` | `npm run test:unit` (physics suite) |
| High-DPI 2D canvas + `ResizeObserver` + view transform | `src/components/GraphCanvas.tsx` | `npm run test:e2e` (graph-canvas visible, zero console errors) |
| Pointer state machine + dynamic decay + hover pin/unpin | `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx` | `src/physics/graphSimulation.test.ts` (6 tests) |
| Discriminated `Preview` union + typed catalog | `src/types/portfolio.ts`, `src/data/projects.ts` | `src/data/projects.test.ts` (5 tests) |
| Deterministic terminal resolver | `src/utils/terminalCommandResolver.ts` | `src/utils/terminalCommandResolver.test.ts` (4 tests) |
| URL-hash deep linking without history pollution | `src/App.tsx` (`history.replaceState`) | `e2e/portfolio.spec.ts` deep-link tests |
| Real-asset capture pipeline | `scripts/capture-demos.sh`, `scripts/capture-to-json.mjs`, `scripts/generate-screenshots.mjs` | `npm run capture` |

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| Hover only needs re-evaluation from `idle` | Moving directly from one node onto another left `state === 'hover'`, so the second node was never pinned and the first stayed frozen | `onPointerMove` now calls `sim.hover()` for both `idle` and `hover`; `hover()` early-returns for the same node and unpins the previous one first | PR #1 hover-release failure |
| Re-pinning on every `pointermove` is harmless | Repeated `hover(H)` reset `H.fx/fy` to the drifting coordinates and re-reheated the sim every frame | Early-return guard `if (hoveredNode === node) return` | PR #1 jitter/reheat |
| Reduced-motion hit-testing can use live sim coordinates | In reduced motion the sim never ticks, so live coordinates go stale; clicks missed | `hitNode()` reads `staticPosRef` and pointer hover/drag physics is skipped | PR #1 reduced-motion failure |
| Playwright can run desktop + mobile in parallel | Two workers raced the `webServer` on port 5199 (`ECONNREFUSED`) | `workers: 1` in `playwright.config.ts` | PR #1 e2e flakiness |
| Closing the drawer should assign `location.hash = ''` | Pushes a history entry, so Back reopened the drawer | `history.replaceState(null, '', location.pathname)` | PR #1 navigation |
| The physics test can hardcode `LINKS` | The hand-maintained edge list can silently drift from `deriveEdges` | Test derives `LINKS` via `deriveEdges(projects)` | PR #1 test fidelity |
| Curated/placeholder terminal templates are acceptable | Verification demands real captured stdout | `capture-demos.sh` now runs the real sibling commands and fails on any error; no fallbacks | PR #1 real-output requirement |

## Implementation-Discovered Deferrals

- **Deferred Item**: Keyboard focus-mirroring camera pan and reduced-motion static-ring pixel geometry are verified at code level and via a one-off browser probe, but there is no committed automated e2e assertion for them.
  - **Reason**: The focus-mirroring ring is a canvas raster with no DOM query hook; clicking exact canvas coordinates is brittle across device pixel ratios. The reduced-motion probe was run ad hoc rather than committed to avoid flaky coordinate-based tests.
- **Deferred Item**: `pict-climate-risk-viz-chatbot` has no terminal demo, so its previously committed `captured/*.json` was dead weight and was removed rather than captured. Re-adding a demo would require a stable headless entrypoint in that sibling repo.
  - **Reason**: The catalog only renders terminal tabs for projects with a `terminalDemo`; the JSON had no consumer.

## Empirical Execution Logs & Evidence

### `npm test` (Vitest 19 + Playwright 16, 1 worker)

```
> node-portfolio-graph@0.1.0 test
> npm run test:unit && npm run test:e2e

 ✓ src/utils/terminalCommandResolver.test.ts (4 tests) 6ms
 ✓ src/physics/graphSimulation.test.ts (6 tests) 87ms
 ✓ src/utils/graphTopology.test.ts (4 tests) 10ms
 ✓ src/data/projects.test.ts (5 tests) 11ms

 Test Files  4 passed (4)
      Tests  19 passed (19)

> playwright test
Running 16 tests using 1 worker
  ✓   1 [desktop] › loads on desktop and mobile with zero console errors (581ms)
  ✓   2 [desktop] › list view renders 6 cards and a card click opens the project drawer (727ms)
  ✓   3 [desktop] › terminal command chip executes and displays captured output (742ms)
  ✓   4 [desktop] › LLM tag pill dims non-matching projects in the semantic nav (575ms)
  ✓   5 [desktop] › search dims non-matching projects (464ms)
  ✓   6 [desktop] › deep link #/p/open-dungeon opens the project drawer on load and closing clears the hash (701ms)
  ✓   7 [desktop] › unknown deep link slug is ignored without crashing (487ms)
  ✓   8 [desktop] › Escape closes the project drawer (459ms)
  ✓   9 [mobile] › loads on desktop and mobile with zero console errors (560ms)
  ✓  10 [mobile] › list view renders 6 cards and a card click opens the project drawer (704ms)
  ✓  11 [mobile] › terminal command chip executes and displays captured output (745ms)
  ✓  12 [mobile] › LLM tag pill dims non-matching projects in the semantic nav (544ms)
  ✓  13 [mobile] › search dims non-matching projects (509ms)
  ✓  14 [mobile] › deep link #/p/open-dungeon opens the project drawer on load and closing clears the hash (576ms)
  ✓  15 [mobile] › unknown deep link slug is ignored without crashing (491ms)
  ✓  16 [mobile] › Escape closes the project drawer (535ms)
  16 passed (12.5s)
```

### `npm run typecheck`

```
> node-portfolio-graph@0.1.0 typecheck
> tsc --noEmit
(exit 0, zero errors)
```

### `npm run build` (Vite 7 production build)

```
vite v7.3.6 building client environment for production...
✓ 1945 modules transformed.
dist/index.html                   0.50 kB │ gzip:  0.30 kB
dist/assets/index-DET1yu5c.css   21.15 kB │ gzip:  4.82 kB
dist/assets/index-DKB0pT83.js   287.88 kB │ gzip: 91.63 kB
✓ built in 3.48s
```

**Bundle budget: 91.63 + 4.82 + 0.30 ≈ 96.8 kB gzipped < 120 kB target** ✅

### `PORTFOLIO_SIBLINGS=/home/node/global-sandbox/projects npm run capture`

```
repo root:      /home/node/.local/share/opencode/worktree/af7796ae2766c7d7b6e4521206d2a14998dc77de/jammy-falcon
sibling base:   /home/node/global-sandbox/projects
clip.mp4: copied 355655 bytes from transcribe-plus
capture/open-dungeon: 'node --test tests/unit/vercelEntry.test.mjs' (exit 0, 2146ms)
capture/agentic-resume-builder: 'python3 build_resume.py --help' (exit 0, 136ms)
capture/agentic-resume-builder: 'python3 build_resume.py --schema' (exit 0, 126ms)
capture/agentic-resume-builder: 'python3 build_resume.py --list' (exit 0, 144ms)
capture/agentic-resume-builder: 'python3 build_resume.py --lint' (exit 0, 135ms)
capture/transcribe-plus: 'npm test' (exit 0, 9885ms)
capture/sandwave-sim: 'npm test' (exit 0, 50490ms)
capture/attention-max: 'npm test' (exit 0, 2610ms)
screenshots: generating branded preview cards
wrote .../public/assets/screenshots/open-dungeon.png
wrote .../public/assets/screenshots/pict-climate-risk-viz-chatbot.png
wrote .../public/assets/screenshots/sandwave-sim.png
wrote .../public/assets/screenshots/attention-max.png
capture-demos complete.
```

Captured suite totals (verbatim from the committed JSON): open-dungeon 16/16 pass; transcribe-plus `# pass 79 / # fail 0 / # skipped 1`; sandwave-sim `Tests 272 passed`; attention-max `Tests: 58 passed, 58 total`; agentic-resume-builder four commands exit 0.

### Reduced-motion browser probe (chromium, `reducedMotion: 'reduce'`, 1280×720)

```
{
  "mediaReduce": true,
  "opaquePixels": 13542,
  "clickPoint": [640, 576],
  "drawerOpened": true,
  "consoleErrors": []
}
```

### Metrics & Data Invariants

| Metric / Count | Before | After | Delta / Observation |
| :--- | :--- | :--- | :--- |
| Vitest unit tests | 15 | 19 | +4 hover-pin regression tests |
| Playwright e2e tests | 16 | 16 | unchanged, now single-worker |
| Referenced captured JSON files | 5 | 5 | 0 referenced assets lost |
| Dead captured JSON files | 1 (`pict…`) | 0 | removed unreferenced file |
| Referenced screenshots | 4 | 4 | 0 referenced assets lost |
| Dead screenshots | 2 | 0 | removed unreferenced files |
| `public/assets/clip.mp4` bytes | 355,655 | 355,655 | byte-identical copy, 0 bytes lost |
| Gzipped bundle | 94.8 kB | 96.8 kB | +2 kB from real captured outputs; still < 120 kB |

## Quick Re-Verification (60-Second Audit)

```bash
npm test            # 19 vitest + 16 playwright pass, exit 0
npm run typecheck   # 0 errors
npm run build       # ~97 kB gzipped, exit 0
# optional: regenerate committed assets from sibling repos (fails loudly if a
# sibling is missing or a command exits non-zero)
PORTFOLIO_SIBLINGS=/home/node/global-sandbox/projects npm run capture
```

Expected: `Test Files 4 passed`, `Tests 19 passed`, `16 passed (…s)`, `tsc` exit 0, Vite build exit 0.
