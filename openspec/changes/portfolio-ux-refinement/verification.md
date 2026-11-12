# Verification Report: portfolio-ux-refinement

## Executive Summary & Environment

- **Status**: All locally runnable specs verified passing; no critical issues.
- **Date**: 2026-11-12
- **Environment**: Linux (OpenCode worktree), Node `v22.23.2`, npm `10.9.8`, Vitest `3.2.7`, Playwright `1.63.0` (Chromium, Desktop Chrome + Pixel 7), Vite `7.3.6`, `@google/design.md` `0.4.0`.
- **Verification commands**: `npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npm run build`, `npx @google/design.md lint DESIGN.md`, `openspec validate portfolio-ux-refinement`, `openspec validate --specs`.
- **Scope note**: The parallel Vercel preview-gating work is intentionally excluded. `e2e/preview-headers.spec.ts` requires a live `PREVIEW_URL` and is skipped locally; `vercel.json` CSP invariants are covered by unit tests instead.

## Requirement Adherence Audit Matrix

| Capability | Requirement & Scenario | Verification Method / Test File | Status |
| :--- | :--- | :--- | :--- |
| candidate-profile | `### Requirement: Verified candidate profile dataset`<br>`#### Scenario: Application imports candidate profile` | `src/data/profile.test.ts::exposes the canonical Brown University bio verbatim`; `src/components/AboutModal.tsx` and `src/components/ControlsOverlay.tsx` import `candidateProfile` | **PASS** |
| candidate-profile | `#### Scenario: Validating profile URL protocols` | `src/data/profile.test.ts::uses a mailto: protocol for email and https: for every external link` | **PASS** |
| candidate-profile | `### Requirement: Canonical page metadata and social link previews`<br>`#### Scenario: Inspecting document metadata` | `e2e/portfolio.spec.ts::document metadata uses the canonical candidate identity` | **PASS** |
| graph-simulation | `### Requirement: Authoritative planar graph seed embedding and homing force`<br>`#### Scenario: Canvas graph initializes on first load` | `src/utils/graphPlanarity.test.ts::has zero segment crossings on desktop 1440x900 / mobile 393x852 / wide 1920x1080 / narrow 320x900`; `GraphCanvas` seeds both initial and reduced-motion layouts from `scaleSeeds(PLANAR_NODE_SEEDS, ...)` | **PASS** |
| graph-simulation | `#### Scenario: Reduced motion is enabled` | `src/utils/graphPlanarity.test.ts` scaled-seed cases; `src/components/GraphCanvas.tsx` static path uses `scaleSeeds`; `e2e/portfolio.spec.ts::reduced motion filter toggles repaint the static graph` | **PASS** |
| graph-simulation | `#### Scenario: Physics simulation settles from initial seeds` | `src/utils/graphPlanarity.test.ts::maintains zero crossings after 300 ticks on desktop 1440x900 / mobile 393x852` | **PASS** |
| graph-simulation | `### Requirement: Bilateral tangent-continuous fluid bridge geometry`<br>`#### Scenario: Rendering bridge between adjacent nodes` | `src/utils/bridgeGeometry.test.ts::mirrors the upper control handles across the axis`, `leaves circle A along its perimeter tangent`, `arrives at circle B along its perimeter tangent` | **PASS** |
| graph-simulation | `#### Scenario: Two nodes overlap during drag` | `src/utils/bridgeGeometry.test.ts::returns null when the circles touch exactly / overlap during a drag / centers coincide`; `GraphCanvas.drawFluidBridge` early-returns on `null` | **PASS** |
| portfolio-controls | `### Requirement: Default Light theme and first-paint flash prevention`<br>`#### Scenario: First-time visitor opens site` | `e2e/portfolio.spec.ts::first visit defaults to the Light color scheme`; `src/App.tsx::readStoredTheme` defaults to `'light'` | **PASS** |
| portfolio-controls | `#### Scenario: Returning visitor with dark preference` | `e2e/portfolio.spec.ts::theme-init applies a stored dark preference before the app mounts`; `public/theme-init.js` runs synchronously in `<head>` | **PASS** |
| portfolio-controls | `### Requirement: Top-right header navigation sequence and theme toggle`<br>`#### Scenario: Desktop visitor views top-right header options` | `e2e/portfolio.spec.ts::header controls follow the canonical top-right sequence` (asserts DOM order and that theme toggle is outside the Filters dropdown) | **PASS** |
| portfolio-controls | `### Requirement: Accessible About modal dialog with canonical bio`<br>`#### Scenario: User opens About dialog` | `e2e/portfolio.spec.ts::About button opens the modal and Escape/close dismiss it` (bio, no subtitle, no focus areas, contact links) | **PASS** |
| portfolio-controls | `#### Scenario: User dismisses About dialog` | Same e2e test plus `#/about deep link opens the modal and backdrop dismisses it` (Escape, close button, backdrop, hash clearing) | **PASS** |
| portfolio-controls | `### Requirement: Progressive top bar scroll scrim`<br>`#### Scenario: Scrolling content under the top bar in Grid view` | `e2e/portfolio.spec.ts::header controls follow the canonical top-right sequence` asserts `top-scrim` renders; `ControlsOverlay` applies the `from-bg via-bg/80 to-transparent` gradient | **PASS** |
| project-drawer | `### Requirement: Accessible project inspector drawer`<br>`#### Scenario: User opens the drawer on desktop` | `e2e/portfolio.spec.ts::drawer elevates Code/Visit and uses a segmented Media/Terminal track`; `canvas selection anchors the inspector beside the node` | **PASS** |
| project-drawer | `#### Scenario: User opens the drawer on mobile` | `e2e/portfolio.spec.ts::mobile drawer docks as an 85dvh bottom sheet` (class + viewport-bottom geometry) | **PASS** |
| project-drawer | `#### Scenario: User closes the drawer` | `e2e/portfolio.spec.ts::Escape closes the project drawer`, `deep link ... closing clears the hash` | **PASS** |
| project-drawer | `### Requirement: Elevated primary repository and live project actions`<br>`#### Scenario: User inspects a project with a live URL` | `e2e/portfolio.spec.ts::drawer elevates Code/Visit ...` asserts `drawer-code`, `drawer-visit`, hrefs, and no `preview-tab-link` | **PASS** |
| project-drawer | `#### Scenario: Drawer tablist contains only deep inspection modalities` | Same e2e test asserts Media/Terminal only and `preview-tab-link` count 0 | **PASS** |
| project-drawer | `### Requirement: Segmented content preview tabs track`<br>`#### Scenario: Inspecting project with multiple preview modes` | Same e2e test asserts rounded-full track with surface-container background and active tab styling | **PASS** |
| project-drawer | `### Requirement: Interactive node hover card with pointer transfer rules`<br>`#### Scenario: User moves pointer into the hover card` | `e2e/portfolio.spec.ts::hover card survives a 150ms pointer transfer and dismisses on drag` (waits 300ms after transfer) | **PASS** |
| project-drawer | `#### Scenario: User initiates a canvas node drag while hover card is open` | Same e2e test asserts the card unmounts on `pointerdown`; `App.dismissHover` + `onCanvasDragStart` clear it immediately | **PASS** |
| project-catalog | `### Requirement: Verified project metadata catalog and preview mapping`<br>`#### Scenario: Loading the project catalog` | `src/data/projects.test.ts::declares a mandatory non-empty shortTitle on all 6 projects`, `pinned catalog order`, `9-edge topology` | **PASS** |
| project-catalog | `### Requirement: Grid card visual thumbnails and terminal specimen fallback`<br>`#### Scenario: Rendering Grid card with screenshot or video` | `e2e/portfolio.spec.ts::grid cards render 16:9 thumbnails and a terminal specimen fallback` (lazy image + `aspect-video`) | **PASS** |
| project-catalog | `#### Scenario: Rendering Grid card for terminal-only project` | Same e2e test asserts `terminal-specimen-agentic-resume-builder` shows `[CLI Specimen]` and no image | **PASS** |
| edge-deployment | `### Requirement: Strict Content Security Policy and security headers`<br>`#### Scenario: Browser loads application under edge CSP` | `src/utils/edgeConfig.test.ts::serves the specified Content-Security-Policy as a directive set`, `allows only self and Google Drive frames`; `npm run build` + local e2e zero-console-error tests | **PASS** |
| edge-deployment | `#### Scenario: Browser loads click-to-load Google Drive resume preview` | `e2e/portfolio.spec.ts::About modal click-to-loads the sandboxed Google Drive resume preview`; `src/utils/edgeConfig.test.ts` asserts `frame-src 'self' https://drive.google.com` | **PASS** |
| edge-deployment | `#### Scenario: Attempting to frame the application` | `vercel.json` retains `frame-ancestors 'none'`; `src/utils/edgeConfig.test.ts::serves the other specified security headers`. Live header assertion is covered by `e2e/preview-headers.spec.ts` when `PREVIEW_URL` is supplied (skipped locally) | **PASS (local invariant) / DEFERRED (live deploy)** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| Nested K4 seeds eliminate all 9 edge crossings | `graphPlanarity.test.ts` proper-intersection counter over scaled seeds and 300 d3 ticks | 0 crossings on 1440x900, 393x852, 1920x1080, 320x900 | stable |
| Bilateral C1 bridges are mathematically exact | `bridgeGeometry.test.ts` dot products of handle/radius vectors and normal mirrors | `< 1e-6` error across 5 rotations and 3 radius pairs | stable |
| `#525257` muted text and `#71717a` outline pass light surfaces | `@google/design.md lint DESIGN.md` (`contrast-ratio`) and Axe WCAG A/AA e2e audits | 0 lint warnings; 0 Axe violations in light/dark | stable |
| `theme-init.js` satisfies `script-src 'self'` and prevents flash | `vercel.json` + `SPEC_CSP` unit test; `theme-init applies ... before app mounts` e2e | No CSP violations; dark attribute present at DOMContentLoaded | stable |
| Removing `@fontsource-variable/*` leaves no font asset or inlining | `src/utils/buildOutput.test.ts::ships no bundled webfonts after the native-font migration` | 0 `.woff2/.woff/.ttf`; no `data:` font URIs | stable |
| Google Drive resume requires public link sharing | DOM/iframe rendering verified, but actual file permission belongs to the Drive owner | **Unresolved external assumption**: requires manual owner check before public demo | decays |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| `shortTitle` | `ProjectData.shortTitle: string` | `src/types/portfolio.ts`; `src/data/projects.ts` | Yes |
| Bilateral Symmetry | `computeBridgeGeometry`, `mirrorAcrossAxis`, `cp1Bottom`/`cp2Bottom` | `src/utils/bridgeGeometry.ts` | Yes |
| C1 Tangent Continuity | `tangentATop`, `tangentBForward`, `cp1Top`, `cp2Top` | `src/utils/bridgeGeometry.ts` | Yes |
| Planar Embedding | `PLANAR_NODE_SEEDS`, `PlanarSeed`, `scaleSeeds` | `src/data/graphSeeds.ts` | Yes |
| Seed Homing Force | `seedForceX`, `seedForceY`, `SEED_STRENGTH = 0.02` | `src/physics/graphSimulation.ts` | Yes |
| Candidate Profile | `CandidateProfile`, `candidateProfile`, `profile` | `src/types/portfolio.ts`; `src/data/profile.ts` | Yes |
| Segmented track | `preview-tabs-track`, `role="tablist"` | `src/components/ProjectDrawer.tsx` | Yes |
| First-paint flash prevention | `theme-init.js` + `document.documentElement.dataset.theme` | `public/theme-init.js`; `index.html` | Yes |

## Landed Tech Footprint & Patterns

| Adopted Pattern / Package | Implementation File(s) | Verification Command / Suite |
| :--- | :--- | :--- |
| Native Helvetica / Helvetica Light / Menlo stacks | `src/styles.css`, `src/components/GraphCanvas.tsx`, `src/components/*` | typecheck, build, design lint |
| Nested planar K4 seeds + weak homing | `src/data/graphSeeds.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx` | `graphPlanarity.test.ts`, `graphSimulation.test.ts` |
| Bilateral tangent bridge math | `src/utils/bridgeGeometry.ts`, `src/components/GraphCanvas.tsx` | `bridgeGeometry.test.ts` |
| Light-default theme + pre-paint bootstrap | `src/App.tsx`, `src/styles.css`, `public/theme-init.js`, `index.html` | e2e theme tests |
| Header theme toggle and canonical sequence | `src/components/ControlsOverlay.tsx` | `header controls follow...` e2e |
| Recruiter contacts / resume iframe | `src/components/AboutModal.tsx`, `src/data/profile.ts` | About e2e tests |
| Elevated Code/Visit + segmented tabs | `src/components/ProjectDrawer.tsx` | drawer e2e tests |
| Interactive hover card transfer | `src/components/NodeHoverCard.tsx`, `src/App.tsx` | hover e2e tests |
| 16:9 grid media + CLI fallback | `src/components/ListView.tsx` | grid e2e test |
| CSP Drive frame allowance | `vercel.json`, `src/utils/csp.ts` | `edgeConfig.test.ts` |

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| d3 `forceX(accessor).strength(0.02)` would read a mutable seed-target map | In this setup the force initialized zero strengths and never applied velocity; `sim.tick()` left nodes stationary | Replaced with explicit `seedForceX`/`seedForceY` force callbacks reading the target map | Verified by `re-scaled seed targets when the viewport resizes` test |
| `max-h-[85vh]` was sufficient for mobile | Mobile needs dynamic viewport units; inline desktop coordinates also override bottom-sheet classes | Conditional `isSheet` layout with `max-h-[85dvh]`, `bottom-0`, `rounded-t-2xl`, and no inline left/top | Mobile e2e geometry test |
| Architecture's base handle length (0.45 gap / 1.2 radius) is always safe | Long handles can push the cubic waist through the centerline | Added `MIN_WAIST` clamp that shortens handles until the midpoint normal offset stays positive | `waist > 0` assertions in bridge tests |
| Removing webfonts has no test impact | `buildOutput.test.ts` asserted at least one `.woff2`, and `e2e/preview-headers.spec.ts` required a `.woff2` request against a live preview | Updated both guards: unit asserts zero bundled webfonts; the preview header test now asserts no webfont requests after `document.fonts.ready` | Keeps deployed and local gates aligned with the native-font migration |
| Theme toggle could remain duplicated in Filters | Header one-click toggle is canonical; duplicate confusing | Removed dropdown theme button; header e2e asserts absence inside dropdown | `portfolio-controls` spec |

## Implementation-Discovered Deferrals

- **Live Vercel header assertion (`e2e/preview-headers.spec.ts`)**:
  - **Reason**: Requires a deployed `PREVIEW_URL` and the parallel preview-gating bypass fix. Local verification covers `vercel.json`/`SPEC_CSP` invariants; live CSP/frame-ancestors behavior will be checked by CI after deployment.
- **Google Drive file sharing permission**:
  - **Reason**: The iframe DOM and CSP are verified, but the file's public sharing state is owner-controlled and cannot be asserted from this repository.
- **Coarse-pointer hover card**:
  - **Reason**: The hover card is intentionally desktop-only (`(hover: hover) and (pointer: fine)`); mobile e2e correctly skips those tests.

## Empirical Execution Logs & Evidence

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 ✓ src/utils/buildOutput.test.ts (3 tests)
 ✓ src/physics/graphSimulation.test.ts (8 tests)
 ✓ src/utils/graphPlanarity.test.ts (7 tests)
 ✓ src/data/projects.test.ts (8 tests)
 ✓ src/utils/bridgeGeometry.test.ts (16 tests)
 ✓ src/utils/edgeConfig.test.ts (12 tests)
 ✓ src/data/profile.test.ts (4 tests)
 ... (12 files total)
 Test Files  12 passed (12)
      Tests  83 passed (83)
```

```text
$ npm run test:e2e
Running 92 tests using 1 worker
 ...
 17 skipped
 75 passed (1.5m)
```
Skipped tests are mobile-only/desktop-only guards plus the five live-preview header tests that require `PREVIEW_URL`.

```text
$ npm run build
✓ 1956 modules transformed.
dist/index.html                    1.93 kB │ gzip: 0.71 kB
dist/assets/index-*.css           28.23 kB │ gzip: 6.09 kB
dist/assets/index-*.js           306.95 kB │ gzip: 97.14 kB
✓ built in 3.15s
```

```text
$ npx @google/design.md lint DESIGN.md
{
  "findings": [
    { "severity": "info", "message": "Design system defines 16 colors, 8 typography scales, 6 rounding levels, 5 spacing tokens, 9 components." }
  ],
  "summary": { "errors": 0, "warnings": 0, "infos": 1 }
}
```

```text
$ openspec validate portfolio-ux-refinement
Change 'portfolio-ux-refinement' is valid

$ openspec validate --specs
✓ spec/candidate-profile
✓ spec/edge-deployment
✓ spec/graph-simulation
✓ spec/portfolio-controls
✓ spec/project-catalog
✓ spec/project-drawer
Totals: 6 passed, 0 failed (6 items)
```

### Metrics & Data Invariants

| Metric / Count | Before | After | Delta / Observation |
| :--- | :--- | :--- | :--- |
| Catalog projects | 6 | 6 | 0 records lost |
| Tag-derived graph edges | 9 | 9 | 0 edges lost |
| Preview entries | 15 | 15 | 0 previews lost |
| Terminal demos | 5 | 5 | 0 demos lost |
| Mandatory `shortTitle` entries | 0 | 6 | 6 added, none empty |
| Seed edge crossings (initial + 300 ticks) | not asserted | 0 | 0 across 4 viewport aspect ratios |
| Axe WCAG A/AA violations (graph/list/drawer/About/hover × light/dark) | 0 known | 0 | no regressions |
| Bundled webfont assets | 0 `.woff2` after prior state | 0 | native stack; no font loading gate |

## Quick Re-Verification (60-Second Audit)

```bash
npm run typecheck && npm run test:unit && npx @google/design.md lint DESIGN.md && openspec validate portfolio-ux-refinement
```

Expected output:

```text
tsc --noEmit: no diagnostics
Test Files  12 passed (12)
      Tests  83 passed (83)
design.md lint: errors 0, warnings 0
Change 'portfolio-ux-refinement' is valid
```

For a visual/behavioral pass:

```bash
npm run dev -- --port 5199
# then, in another shell:
npx playwright test e2e/portfolio.spec.ts --project=desktop
```

Expected: `75 passed` (plus expected mobile/desktop skips) with zero console errors, the header order `About · GitHub ↗ · Graph/Grid · Dark/Light · Filters ▾`, light default, and the segmented drawer tabs.
