# Verification Report: portfolio-v3-organic-ferrofluid

## Executive Summary & Environment

- **Status**: All locally runnable gates pass; no critical issues.
- **Date**: 2026-11-12
- **Change**: `portfolio-v3-organic-ferrofluid`
- **Environment**: Linux (OpenCode worktree), Node `v22.23.2`, npm `10.9.8`, Vitest `3.2.7`, Playwright `1.63.0` (Chromium Desktop Chrome + Pixel 7), Vite `7.3.6`, OpenSpec CLI `1.7.0`.
- **Commands executed**: `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, `npx openspec validate --changes`.
- **Scope note**: `e2e/preview-headers.spec.ts` requires a live `PREVIEW_URL` and is skipped locally. Mobile hover/interaction guards are expected skips because the card is intentionally fine-pointer-only.
- **Data preservation**: all `8` catalog projects and all `13` tag-derived permanent graph edges remain intact (`graphPlanarity.test.ts`, `graphSimulation.test.ts`).

## Requirement Adherence Audit Matrix

| Capability | Requirement & Scenario | Verification Method / Test File | Status |
| :--- | :--- | :--- | :--- |
| graph-simulation | `### Requirement: Decentralized equal mass node distribution`<br>`#### Scenario: Graph initialization without central clump or corner pinning` | `src/physics/graphSimulation.test.ts::maintains >= 44px clearance, bounds containment, OD centroid freedom, and stabilizes` on desktop and mobile | **PASS** |
| graph-simulation | `### Requirement: Dynamic hover gravitation wave`<br>`#### Scenario: Pointer sweeps across a node without dwelling` | `e2e/portfolio.spec.ts::hover dwell suppresses fast sweeps and opens after 200ms` (canvas sweep exits before 200ms and asserts no card) | **PASS** |
| graph-simulation | `#### Scenario: Pointer dwells on a stationary node for 200ms` | Same e2e test dwells on the centered node and asserts the card opens; `src/physics/graphSimulation.test.ts::is zero inside 110px and ramps to 0.025 outside it` verifies the drift curve; `e2e/portfolio.spec.ts::reduced-motion transition dismisses an open hover card` verifies transition cancellation | **PASS** |
| graph-simulation | `#### Scenario: Pointer leaves or clicks a hovered node` | `e2e/portfolio.spec.ts::hover card survives a 150ms pointer transfer and dismisses on drag`; `GraphCanvas.onPointerDown` / `onPointerLeave` clear `hoverDwellTimer` synchronously | **PASS** |
| graph-simulation | `### Requirement: Authoritative planar graph seed embedding and homing force`<br>`#### Scenario: Canvas graph initializes on first load` | `src/utils/graphPlanarity.test.ts::has zero segment crossings on desktop 1440x900 / mobile 393x852 / wide 1920x1080 / narrow 320x900`; `GraphCanvas` seeds initial and static layouts from `scaleSeeds(PLANAR_NODE_SEEDS, ...)` | **PASS** |
| graph-simulation | `#### Scenario: User drags and places a node` | `src/physics/graphSimulation.test.ts::keeps a non-dragged neighbor within <15px over a 160px drag`; `persists the user-placed fx/fy anchor after dragEnd`; `scales and clamps pinned coordinates proportionally on resize` | **PASS** |
| graph-simulation | `#### Scenario: User activates Reset layout` | `src/physics/graphSimulation.test.ts::clears pins, detached flags, and restores planar seeds on resetLayout`; `src/utils/graphPlanarity.test.ts::returns to zero crossings and >=44px separation after resetLayout`; `e2e/portfolio.spec.ts::3-dot controls menu contains the Filters heading and Reset layout action` | **PASS** |
| graph-simulation | `### Requirement: Bilateral tangent-continuous fluid bridge geometry`<br>`#### Scenario: Rendering bridge between adjacent nodes at rest` | `src/utils/bridgeGeometry.test.ts::produces a concave C1 waist at rest (short gap / natural long gap / degree-5 hub / degree-6 hub)`, `targets 0.58 of the perimeter spread on a natural gap`, `mirrors the upper control handles across the axis`, `leaves circle A along its perimeter tangent`, `arrives at circle B along its perimeter tangent` | **PASS** |
| graph-simulation | `### Requirement: Drag-time meniscus snapping and elastic tether recovery`<br>`#### Scenario: User drags a node beyond 1.6x snapping distance` | `src/utils/bridgeGeometry.test.ts::exposes the 0.58 rest waist ratio and 1.6x snap stretch`, `thins from the rest waist to the 2px floor at 1.6x rest distance`; `src/physics/graphSimulation.test.ts::emits a 220ms recoil and honors the 350ms post-release cooldown` | **PASS** |
| graph-simulation | `#### Scenario: Reconnection respects 350ms post-release cooldown` | `src/physics/graphSimulation.test.ts::emits a 220ms recoil and honors the 350ms post-release cooldown`; `reconnects a released, detached bridge once cooldown expires and it returns` | **PASS** |
| graph-simulation | `### Requirement: Proximity-only visual webbing for non-edge pairs`<br>`#### Scenario: Non-edge nodes approach within proximity band` | `GraphCanvas` deterministic sorted-pair pass (`PROXIMITY_MAX_DIST = 96`, `permanentEdgeKeys` exclusion); `src/physics/graphSimulation.test.ts::keeps exactly the 13 permanent links in the simulation` proves zero force links are added | **PASS** |
| graph-simulation | `#### Scenario: Detached permanent edge enters proximity band` | `GraphCanvas` skips every pair in `permanentEdgeKeys`; `src/physics/graphSimulation.test.ts::keeps a pinned far-away bridge detached until resetLayout` proves detached edges do not silently reconnect | **PASS** |
| graph-simulation | `### Requirement: Measured peripheral hover card placement`<br>`#### Scenario: Hover card opens on desktop or mobile` | `e2e/portfolio.spec.ts::hover card stays inside the desktop viewport at 1440x900` and `... narrow mobile viewport at 393x852`; `NodeHoverCard` uses `ResizeObserver` and `20px` viewport margins | **PASS** |
| portfolio-controls | `### Requirement: Top-right header navigation sequence and theme toggle`<br>`#### Scenario: Desktop visitor views top-right header options` | `e2e/portfolio.spec.ts::header controls follow the canonical top-right sequence`; `controls expose clean accessible names and fluid pills` asserts `aria-label="Filters & Layout"` | **PASS** |
| portfolio-controls | `#### Scenario: User opens the 3-dot menu and resets graph layout` | `e2e/portfolio.spec.ts::3-dot controls menu contains the Filters heading and Reset layout action`; `src/components/ControlsOverlay.tsx` renders the `Filters` `<h2>`, tag search, `Reset`, and `Reset layout` (`data-testid="reset-layout"`) | **PASS** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| `REST_WAIST_RATIO = 0.58` produces a visible concave rest silhouette rather than zero-handle straight lines | `bridgeGeometry.test.ts` asserts `handleForWaist > 0`, `handle > 0`, and `waistWidth < 2 * halfWidth` across short gaps, long gaps, and degree-5/6 hubs | Concave `C1` hourglass at rest; `2px` floor at `1.6x` | stable |
| Wider `HALF_WIDTH_RATIO = 0.85` fillets remain separated around hubs | Geometry derives `targetHalf = min(radius) * 0.85`, caps at `MAX_SPREAD_ANGLE = Math.PI / 6.2`; hub tests pass | Attachment half-width caps at `~10.65px` for `22px` nodes | stable |
| `1.6x` snap and `1.25x` reconnect hysteresis are reachable on `393x852` mobile | `graphSimulation.test.ts::can drag every permanent edge past 1.6x rest distance at 393x852` drives all 13 edges through real `dragStart`/`dragMove`; tether diagonal is `hypot(w, h) * 0.75` | All 13 edges detach; max needed stretch `533px < 704px` tether | stable |
| Zeroing `forceLink.strength` alone keeps non-dragged neighbors `<15px` | First implementation still moved the neighbor `28.5px` because charge repulsion increased as the drag approached it | Added temporary direct-neighbor `fx/fy` holds during drag; test now passes with `0px` neighbor displacement | stable |
| A wall-clock `reconnectCooldownUntil` remains deterministic for headless ticks | Vitest drives `sim.tick()` faster than wall time, so wall-clock cooldown would never expire in headless tests | Cooldown uses a monotonic simulation clock advanced by real frame deltas; browser behavior remains `350ms` | stable |
| The `220ms` recoil can be observed after release | `link.recoilProgress` starts at `1` on detach and decays by `elapsed / RECOIL_MS` every tick | `1 -> 0` over `220ms`; reset on reconnect | stable |
| Native `fx/fy` pinning survives d3-force ticks and hover transitions | `persists the user-placed fx/fy anchor after dragEnd`; hover tests confirm user pins survive hover cancellation | Pinned position remains fixed until resize/reset | stable |
| `ResizeObserver` measured bounds are required for peripheral placement | `NodeHoverCard` observes its rendered element and clamps to `20px` viewport margins | `393x852` card stays inside viewport and `>60px` from center | stable |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| Rest hourglass | `REST_WAIST_RATIO = 0.58`, `bridgeWaistWidth`, `waistWidth`, `handleForWaist` | `src/utils/bridgeGeometry.ts` | Yes |
| Perimeter attachment spread | `HALF_WIDTH_RATIO = 0.85`, `MAX_SPREAD_ANGLE = Math.PI / 6.2`, `halfWidth` | `src/utils/bridgeGeometry.ts` | Yes |
| Snap stretch | `SNAP_STRETCH_MULTIPLIER = 1.6` (geometry), `SNAP_MULTIPLIER = 1.6` (physics) | `src/utils/bridgeGeometry.ts`; `src/physics/graphSimulation.ts` | Yes |
| Recoil | `RECOIL_MS = 220`, `BridgeLinkState.recoilProgress` | `src/physics/graphSimulation.ts`; `drawRecoilTips` in `GraphCanvas.tsx` | Yes |
| Reconnect cooldown | `RECONNECT_COOLDOWN_MS = 350`, `BridgeLinkState.reconnectCooldownUntil` | `src/physics/graphSimulation.ts` | Yes |
| Persistent user pinning | `userPinnedIds`, `node.fx`/`node.fy`, `resetLayout()` | `src/physics/graphSimulation.ts` | Yes |
| Unified hover dwell | `HOVER_DWELL_MS = 200`, `hoverDwellTimerRef`, `beginHoverDwell`, `clearHoverDwell` | `src/components/GraphCanvas.tsx` | Yes |
| Hover drift | `HOVER_EXCLUSION_RADIUS = 110`, `HOVER_DRIFT_STRENGTH = 0.025`, `hoverDriftAcceleration` | `src/physics/graphSimulation.ts` | Yes |
| Proximity webbing | `PROXIMITY_MAX_DIST = 96`, `permanentEdgeKeys`, `edgeKey` | `src/components/GraphCanvas.tsx` | Yes |
| 3-dot menu | `MoreHorizontal`, `data-testid="controls-dropdown-trigger"`, `aria-label="Filters & Layout"` | `src/components/ControlsOverlay.tsx` | Yes |
| Reset layout wiring | `layoutResetVersion`, `onResetLayout`, `resetLayout()` | `src/App.tsx`, `ControlsOverlay.tsx`, `GraphCanvas.tsx`, `graphSimulation.ts` | Yes |
| Measured peripheral card | `ResizeObserver`, `canvasCenter`, `VIEWPORT_MARGIN = 20`, `NODE_GAP = 36` | `src/components/NodeHoverCard.tsx`, `src/App.tsx` | Yes |

## Visual & Responsive Checks

- **Desktop rest (`1440x900`)**: permanent bridges render as wide concave hourglass fillets pooling into the `22px` circles; the previous hairline straight lines are gone.
- **Desktop hover (`1440x900`)**: hovering `OpenDungeon` opens the card peripherally, the node/edges switch to cobalt, and the bridge fill blends axis-aligned from cobalt through `--color-connection` to the black endpoint.
- **Desktop 3-dot menu (`1440x900`)**: icon-only overflow trigger; dropdown contains the `FILTERS` heading, search, tag pills, `Reset`, and `Reset layout`.
- **Mobile rest (`393x852`)**: graph remains planar and full-bleed; all header controls remain visible.
- **Mobile 3-dot menu (`393x852`)**: dropdown fits within the viewport with `≥44px` touch targets and does not overflow horizontally.
- Screenshots were captured and inspected locally during verification but are not committed (transient artifacts).

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| Updating `HALF_WIDTH_RATIO` alone would widen perimeter fillets | `bridgeBaseWidth`'s tag cap still limited `22px` nodes to `6-18px`, leaving rest bridges hairlike | Geometry now derives attachment half from `min(radiusA, radiusB) * HALF_WIDTH_RATIO` and caps by `MAX_SPREAD_ANGLE` | Satisfies "wider organic fillets" and `0.58 × 2 × averageHalf` literally |
| Zeroing link strength is sufficient for decoupled drag | Charge repulsion still displaced the neighbor `28.5px` during a 160px approach | Direct drag neighbors are held at their current `fx/fy` during the gesture and restored on `dragEnd` | Guarantees the `<15px` contract without changing global charge/collision tuning |
| The old "reconnects after release" tests remain valid | User-placed nodes now persist their `fx/fy`, so a released far-away bridge intentionally stays detached | Tests now return the pinned node home (or call `resetLayout()`) before asserting reconnection | Matches the new persistent-pinning spec |
| Wall-clock cooldown is fine for both browser and headless tests | Headless `sim.tick()` runs hundreds of iterations in milliseconds, so `performance.now()` never elapsed `350ms` | `simClock` advances by frame delta; browser remains real-time while tests are deterministic | Keeps behavior identical in production and testable without fake timers |
| The hover card's hard-coded `320x330` bounds are adequate | Actual card height varies with text/media and overflowed narrow viewports | `ResizeObserver` measures rendered bounds and clamps against `20px` viewport margins | Verified at `393x852` and `1440x900` |

## Empirical Execution Logs & Evidence

```text
$ npm run typecheck
> node-portfolio-graph@0.1.0 typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 ✓ src/utils/graphPlanarity.test.ts (13 tests)
 ✓ src/physics/graphSimulation.test.ts (28 tests)
 ✓ src/utils/bridgeGeometry.test.ts (35 tests)
 ✓ src/audio/ambientSynth.test.ts (12 tests)
 ✓ src/utils/bridgeOscillator.test.ts (7 tests)
 ✓ src/utils/vercelParity.test.ts (5 tests)
 ✓ src/data/projects.test.ts (11 tests)
 ✓ src/utils/auditLinks.test.ts (9 tests)
 ✓ src/utils/edgeConfig.test.ts (12 tests)
 ✓ src/utils/graphTopology.test.ts (4 tests)
 ✓ src/utils/terminalCommandResolver.test.ts (4 tests)
 ✓ src/utils/commitHash.test.ts (6 tests)
 ✓ src/utils/buildOutput.test.ts (3 tests)
 ✓ src/utils/drafting.test.ts (6 tests)
 ✓ src/data/profile.test.ts (4 tests)
 ✓ src/utils/previewPreflight.test.ts (5 tests)

 Test Files  16 passed (16)
      Tests  164 passed (164)
```

```text
$ npm run build
vite v7.3.6 building client environment for production...
✓ 1959 modules transformed.
dist/index.html                    1.86 kB │ gzip:   0.71 kB
dist/assets/index-DGOoXDbq.css    28.30 kB │ gzip:   6.11 kB
dist/assets/index-CqW-WayV.js    325.27 kB │ gzip: 103.52 kB
✓ built in 3.20s
```

```text
$ npm run test:e2e
  22 skipped
  88 passed (2.2m)
```

Skipped tests are the five live-preview header tests requiring `PREVIEW_URL`, desktop-only/mobile-only interaction guards, and hover tests on coarse-pointer mobile.

```text
$ npx openspec validate --changes
- Validating...
✓ change/portfolio-v3-organic-ferrofluid
✓ change/vercel-preview-gating
Totals: 2 passed, 0 failed (2 items)
```

```text
$ npx openspec validate --specs
- Validating...
✓ spec/ambient-audio
✓ spec/candidate-profile
✓ spec/edge-deployment
✓ spec/graph-simulation
✓ spec/portfolio-controls
✓ spec/project-catalog
✓ spec/project-drawer
Totals: 7 passed, 0 failed (7 items)
```

Main specs were synced from the delta: `graph-simulation` received the rest-waist/gradient, persistent-pinning/reset, `1.6x`/`1.25x` recoil/cooldown, proximity-webbing, and measured-card requirements, and `portfolio-controls` received the 3-dot menu + `Reset layout` requirement.

### Metrics & Data Invariants

| Metric / Count | Before | After | Delta / Observation |
| :--- | :--- | :--- | :--- |
| Catalog projects | 8 | 8 | 0 records lost |
| Tag-derived permanent edges | 13 | 13 | 0 edges lost |
| Unit test files | 16 | 16 | 0 files removed |
| Unit tests | 144 passed / 2 skipped | 164 passed | +20 net assertions/tests |
| E2E tests | `75 passed / 17 skipped` (prior archived report) | `88 passed / 22 skipped` | +13 passing scenarios; new hover/menu/viewport/reduced-motion coverage |
| Snap multiplier | `2.0` | `1.6` | Snappier break point |
| Reconnect multiplier | `1.4` | `1.25` | Tighter recovery hysteresis |
| Rest waist | `baseWidth` (straight) | `0.58 × 2 × averageHalf` | Genuine concave hourglass |
| Post-release cooldown | none | `350ms` | Prevents instant pop-back |
| Recoil duration | none | `220ms` | Retracting droplet tips |
| Hover dwell | immediate | `200ms` unified | No card flashes on sweeps |
| Axe WCAG A/AA violations | 0 | 0 | No regressions in graph/list/drawer/About/hover |

## Quick Re-Verification (60-Second Audit)

```bash
npm run typecheck && npm run test:unit && npm run build && npx openspec validate --changes
```

Expected:

```text
tsc --noEmit: no diagnostics
Test Files  16 passed (16)
      Tests  164 passed (164)
✓ built in ~3s
Totals: 2 passed, 0 failed (2 items)
```

For visual/behavioral confirmation:

```bash
npm run dev -- --port 5199
# in another shell:
npx playwright test e2e/portfolio.spec.ts --project=desktop
```

Expected: `88 passed` across both projects with expected mobile/desktop skips, zero console errors, thick concave rest fillets, a peripheral hover card, and a 3-dot menu containing `Filters` + `Reset layout`.

---

# PATCH-01 Verification Addendum: Organic Curvature, Render-Clock Recoil & Soft Anchors

## Status: RESOLVED

- **Date**: 2026-11-12
- **Patch**: `PATCH-01` (`patch.md`)
- **Scope**: `src/utils/bridgeGeometry.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, both graph-simulation specs, and the reproducing test files.
- **Data preservation**: all `8` projects and `13` permanent edges remain intact; zero crossings are asserted at rest and at maximum ambient offset on desktop and mobile.

## Requirement Adherence Audit Matrix (PATCH-01)

| Reported Issue | Resolution | Verification |
| :--- | :--- | :--- |
| Bridges read as straight, sharp-edged tapers | Removed the `HANDLE_RADIUS_RATIO` cap. Handle length is now gap-proportional (`gap * 0.45`) capped by `min(R) * tan(MAX_SPREAD_ANGLE)`; per-endpoint spread is solved by monotone bisection against the 0.58 ratio target/1.6x smoothstep. `alpha >= 1` keeps all four control-point normal offsets `>= 0`. | `bridgeGeometry.test.ts::handle-first concave silhouettes` (short gap, long gap, degree-5/6 hubs, unequal crowded hub, gap-proportional handle); `rest hourglass silhouette` suite | **PASS** |
| Recoil fixed-position and frozen when d3 cools | `BridgeLinkState.detachedAt` is a `performance.now()` render timestamp. `GraphCanvas` computes `p = 1 - easeOutCubic((now - detachedAt) / 220)` each frame and draws retracting teardrops anchored to live endpoint positions. | `graphSimulation.test.ts::uses render-clock detachedAt/reconnect timestamps...`; canvas visual inspection | **PASS** |
| Hard `fx/fy` pins and frozen neighbors | Removed `userPinnedIds` and `dragNeighborPins`. `dragEnd` clears `fx/fy`, stores a soft `(homeX, homeY)` anchor, and an alpha-independent damped home spring settles the node. Drag charge strength is `0` and collide radius is `0.4 * R`; pointer motion lags by ~45ms. | `graphSimulation.test.ts::settles toward a soft home anchor...`, `scales and clamps soft home anchors...`, `keeps a non-dragged neighbor within <15px...` (asserts neighbor `fx/fy` stay `null`; measured `<12px`) | **PASS** |
| Live reduced-motion transition incomplete | `handleMotionChange` is bidirectional: reducing freezes current positions into `staticPosRef`, stops the d3 timer/rAF, and dismisses hover; returning copies the frozen frame back, clears static state, reheats alpha, and resumes the render loop. | `e2e/portfolio.spec.ts::live reduced-motion transitions freeze and resume hover capability` | **PASS** |
| Unmeasured `canvasCenter`, per-frame sorted ids, abrupt proximity edge | `GraphCanvas` reports `getBoundingClientRect()` center through `onCanvasCenterChange`; `App` forwards it to `NodeHoverCard`. Sorted node ids and permanent-edge keys are hoisted. Proximity alpha fades with smoothstep over `[R_A + R_B, R_A + R_B + 12]`. | `e2e/portfolio.spec.ts::hover card stays inside...` (desktop + 393x852); render-loop code review; unit planarity tests | **PASS** |
| Visual-only ambient drift | Deterministic `ambientDriftOffset(id, timeMs)` with `3.5px` amplitude, updated at ~30fps, paused by `document.hidden`, `IntersectionObserver`, and reduced motion; render, `hitNode`, and `nodeScreenPoint` share the offset. No force is added. | `graphSimulation.test.ts::visual ambient drift` (determinism/bound and zero crossings at maximum offset on `1440x900` and `393x852`) | **PASS** |
| Reconnect ripple | Detached bridges inject a bounded oscillator excitation when they reform; `previousDistance`/`previousVelocity` re-prime. | `graphSimulation.test.ts::uses render-clock detachedAt...` asserts oscillator amplitude after reconnect | **PASS** |

## Reproducing Tests Added

- `bridgeGeometry.test.ts`: non-negative normal offsets for all four control points across short gaps, long gaps, degree-5/6 hubs, and an unequal-radius crowded hub; gap-proportional handle; long-gap concave clamp; short-gap C1 bound; 1.6x C1-safe non-widening.
- `graphSimulation.test.ts`: force-isolated drag with neighbor `fx/fy` asserted `null`; soft home settling and reset; resized home scaling; render-clock `detachedAt`/cooldown; reconnect ripple; deterministic ambient offset bound; zero crossings at maximum ambient offset on desktop and mobile.
- `e2e/portfolio.spec.ts`: live reduced-motion transition freezes and resumes hover capability.

## Empirical Execution Logs (PATCH-01)

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 ✓ src/utils/graphPlanarity.test.ts (13 tests)
 ✓ src/physics/graphSimulation.test.ts (30 tests)
 ✓ src/utils/bridgeGeometry.test.ts (42 tests)
 ...
 Test Files  16 passed (16)
      Tests  173 passed (173)
```

```text
$ npm run build
✓ 1959 modules transformed.
dist/assets/index-hNbjGYMy.css    28.33 kB │ gzip:   6.13 kB
dist/assets/index-B7x0goch.js    327.45 kB │ gzip: 104.28 kB
✓ built in 5.45s
```

```text
$ npm run test:e2e
  22 skipped
  88 passed (2.3m)
```

```text
$ npx openspec validate --changes
✓ change/portfolio-v3-organic-ferrofluid
✓ change/vercel-preview-gating
Totals: 2 passed, 0 failed (2 items)

$ npx openspec validate --specs
✓ spec/ambient-audio
✓ spec/candidate-profile
✓ spec/edge-deployment
✓ spec/graph-simulation
✓ spec/portfolio-controls
✓ spec/project-catalog
✓ spec/project-drawer
Totals: 7 passed, 0 failed (7 items)
```

## Visual Checks (PATCH-01)

- **Rest (`1440x900`)**: permanent bridges now flare into perimeters with non-negative control points and a narrower concave waist; no straight chord/hook artifacts.
- **Hover**: card anchors from the measured canvas center; ambient drift is shared with hit testing so pointer targets stay aligned.
- **Stretch/snap**: recoil teardrops retract into live endpoints on a render clock; a released bridge reforms with an oscillator ripple after the 350ms cooldown.
- **Mobile (`393x852`)**: ambient-offset planarity and measured card clamping remain valid.
- **Reduced motion**: live toggle freezes the current frame, clears hover, and resumes correctly when motion is re-enabled.

## Metrics (PATCH-01)

| Metric | Before patch | After patch |
| :--- | :--- | :--- |
| Unit tests | 164 | 173 |
| E2E scenarios | 88 passed / 22 skipped | 88 passed / 22 skipped (transition test extended bidirectionally) |
| Permanent edges | 13 | 13 |
| Max ambient offset | none | `3.5px`, 0 crossings at desktop/mobile |
| Neighbor follow-through | frozen via `fx/fy` | `< 12px` with neighbor `fx/fy === null` |
| Recoil / cooldown clock | d3 tick-coupled | `performance.now()` render clock |

---

# PATCH-02 Verification Addendum: UI Polish, Crosshair, Active-Pair Edges & Grid Hierarchy

## Status: RESOLVED

- **Date**: 2026-11-13
- **Patch**: `PATCH-02` (`patch.md`)
- **Scope**: `ControlsOverlay.tsx`, `App.tsx`, `styles.css`, `GraphCanvas.tsx`, `ListView.tsx`, `NodeHoverCard.tsx`, `DESIGN.md`, `e2e/portfolio.spec.ts`, GitHub Issue `#9`.
- **Data preservation**: 8 nodes and 13 permanent edges unchanged; reduced motion and zero Axe violations preserved.

## Requirement Adherence Audit Matrix (PATCH-02)

| Reported Issue | Resolution | Verification |
| :--- | :--- | :--- |
| Two reset buttons and visited colors not reset | One `Reset` button (`data-testid="reset-layout"`, aria-label `Reset`) replaces `reset-filters`. `App.resetAll` clears tags, search, layout version, and `visitedIds`. | `e2e/portfolio.spec.ts::3-dot menu exposes one Reset that clears filters, layout, and visited colors` | **PASS** |
| Crosshair everywhere | `.canvas-interactive` defaults to `cursor: default`; `GraphCanvas` sets `crosshair` only when `hitNode()` succeeds or `state === 'drag'`, and resets on leave/up. | `e2e/portfolio.spec.ts::canvas cursor is crosshair only while over or dragging a node` | **PASS** |
| Outgoing edges stay lit for one active endpoint | Edge dimming uses `dimmed.has(source) \|\| dimmed.has(target)`. | `e2e/portfolio.spec.ts::LLM filter dims every edge with a non-matching endpoint` (asserts mixed pair dims, both-active pair stays lit, 12/13 dimmed) | **PASS** |
| Focal edges lack shared-tag pills | Focal, non-dimmed, non-detached permanent edges draw up to three shared tags stacked vertically at the edge midpoint using `LABEL_FONT`, `tokens.bg` pill fill, and `tokens.accent` text. | Canvas visual inspection at `1440x900`; bridge loop + focal pill pass code review | **PASS** |
| Grid card hierarchy and CLI badges | Grid cards now render `01  Title` inline, then summary, then `CardPreview`, then tags. `[CLI Specimen]` badge removed from `ListView` and the hover fallback. `DESIGN.md` codifies the order. | `e2e/portfolio.spec.ts::grid cards render 16:9 thumbnails and a terminal specimen fallback` (geometry/order assertions, no badge); `terminal-only hover fallback omits the CLI specimen badge` | **PASS** |
| Issue #9 media list stale | Appended the seven updated media requirements without `[CLI Specimen]`. | https://github.com/slowbutfast/portfolio/issues/9#issuecomment-6860772045 | **PASS** |

## E2E Tests Updated/Added

- Singular Reset clears filters, layout, and visited colors.
- Node-hover-only crosshair cursor.
- Active-pair (`||`) edge dimming via deterministic canvas dataset.
- Grid card order and inline `01  Title` geometry.
- Terminal-only hover fallback omits `CLI specimen`.
- Existing grid card test updated to assert the badge is absent.

## Empirical Execution Logs (PATCH-02)

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 Test Files  16 passed (16)
      Tests  173 passed (173)
```

```text
$ npm run build
✓ 1959 modules transformed.
dist/assets/index-B7YC0Tpw.css    28.32 kB │ gzip:   6.13 kB
dist/assets/index-B6PcxO_O.js    327.74 kB │ gzip: 104.45 kB
✓ built in 3.28s
```

```text
$ npm run test:e2e
  24 skipped
  92 passed (2.2m)
```

```text
$ npx openspec validate --changes
✓ change/portfolio-v3-organic-ferrofluid
✓ change/vercel-preview-gating
Totals: 2 passed, 0 failed (2 items)
```

## Visual Checks (PATCH-02)

- **Hover (`1440x900`)**: focal edges show stacked shared-tag pills (`Express`/`LLM`, `Express`/`Vanilla JS`, `Agent Tooling`) centered between nodes and above the bridge fill.
- **Grid**: `01  OpenDungeon` inline row, summary subtitle directly below, 16:9 media, then tag pills.
- **Dropdown**: one `Reset` action with undo icon; no duplicate `Reset layout`.
- **Cursor**: default over empty canvas, crosshair over nodes and during drag.

---

# PATCH-03 Verification Addendum: Contiguous Edge Tags, Inspector Persistence, Kintsugi Cleanup & 250ms Dwell

## Status: RESOLVED

- **Date**: 2026-11-13
- **Patch**: `PATCH-03` (`patch.md`)
- **Changes**: `src/components/GraphCanvas.tsx`, `src/components/NodeHoverCard.tsx`, `e2e/portfolio.spec.ts`, graph-simulation specs, `design.md`, `tests.md`, `DESIGN.md`.

## Requirement Adherence Audit Matrix (PATCH-03)

| Request | Resolution | Verification |
| :--- | :--- | :--- |
| No spacing between connection tags; multiple shared tags form one rounded rectangle | `drawEdgeTagPills` now paints one `roundRect` with height `visible.length * 20px` and zero inter-row gap; text rows share the same max-width container. | Visual inspection at `1440x900` (Express/LLM and Express/Vanilla JS render as single flush blocks) | **PASS** |
| Connection tags persist while inspector is open | `GraphCanvas` focal id is now `focused ?? hovered ?? selectedIdRef.current`; drawer selection remains the focal node until close. | `e2e/portfolio.spec.ts::focal edge tag pills persist while the inspector is open` (hover >0, drawer open >0, close ->0) | **PASS** |
| Remove terminal from Kintsugi hover popup | `NodeHoverCard` renders the terminal specimen only when `project.terminalDemo` exists; linkout-only Kintsugi/Ivy omit the media block. | `e2e/portfolio.spec.ts::terminal-only hover fallback omits the CLI specimen badge` (also asserts no `>_` prompt) | **PASS** |
| Hover initiation timer `0.25s` | `HOVER_DWELL_MS` changed from `200` to `250`; graph-simulation specs and design docs now state `250ms`. | `e2e/portfolio.spec.ts::hover dwell suppresses fast sweeps and opens after 250ms` (no card at ~180ms, visible after timer) | **PASS** |

## Empirical Execution Logs (PATCH-03)

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 Test Files  16 passed (16)
      Tests  173 passed (173)
```

```text
$ npm run build
dist/assets/index-B7YC0Tpw.css    28.32 kB │ gzip:   6.13 kB
dist/assets/index-BkH_dDLp.js    327.97 kB │ gzip: 104.53 kB
✓ built in 4.57s
```

```text
$ npm run test:e2e
  25 skipped
  93 passed (2.3m)
```

```text
$ npx openspec validate --changes
✓ change/portfolio-v3-organic-ferrofluid
✓ change/vercel-preview-gating
Totals: 2 passed, 0 failed (2 items)
```

## Visual Checks (PATCH-03)

- Multiple shared-tag labels render as one contiguous rounded rectangle with no vertical seams.
- The labels remain visible for the selected node while the inspector drawer is open and disappear when it closes.
- The Kintsugi Fracture hover card now starts directly with the title/summary instead of a terminal placeholder.
- The hover card appears after the `250ms` dwell.

---

# PATCH-04 Verification Addendum: Vertical Sound Volume Slider Popover

## Status: RESOLVED

- **Date**: 2026-11-13
- **Patch**: `PATCH-04` (`patch.md`)
- **Scope**: `src/audio/audioConstants.ts`, `src/audio/ambientSynth.ts`, `src/audio/ambientSynth.test.ts`, `src/components/ControlsOverlay.tsx`, `src/App.tsx`, `src/styles.css`, `e2e/portfolio.spec.ts`.

## Requirement Adherence Audit Matrix (PATCH-04)

| Request | Resolution | Verification |
| :--- | :--- | :--- |
| Vertical volume slider on Sound | `ControlsOverlay` wraps `Sound` in a relative hover/focus container and renders a vertical range input in a floating surface popover beneath it. | `e2e/portfolio.spec.ts::volume popover appears only while Sound is enabled and hides after 500ms`; visual inspection at `1440x900` | **PASS** |
| Popover only while enabled | The popover renders only when `soundEnabled && volumeOpen`; the effect hides immediately when Sound turns off. | Same E2E test (hidden before enabling, shown on enable, hidden immediately on disable) | **PASS** |
| Auto-hide ~500ms after pointer leave | `scheduleVolumeHide` starts a `500ms` timer; entering Sound/popover or dragging the slider cancels it. | Same E2E test (move away -> hidden after 650ms) | **PASS** |
| Volume `[0, 1]` persisted and applied | `VOLUME_STORAGE_KEY = portfolio_sound_volume`, `DEFAULT_SOUND_VOLUME = 1`; `setVolume` clamps/persists and ramps master gain to `volume * MASTER_GAIN` when enabled. | `ambientSynth.test.ts::reads, clamps, and persists volume in [0, 1]`; `scales master gain...`; `restores stored volume...`; E2E localStorage poll | **PASS** |
| 0% volume keeps Sound enabled | `setVolume(0)` leaves `enabled` unchanged; Sound stays `aria-pressed="true"` and master gain ramps to `0`. | `ambientSynth.test.ts::scales master gain and keeps Sound enabled at zero volume`; E2E asserts `aria-pressed="true"` at slider `0` | **PASS** |

## Empirical Execution Logs (PATCH-04)

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 Test Files  16 passed (16)
      Tests  176 passed (176)
```

```text
$ npm run build
dist/assets/index-BwChWWOr.css    28.91 kB │ gzip:   6.26 kB
dist/assets/index-BbLoH3Ul.js    329.93 kB │ gzip: 105.13 kB
✓ built in 4.45s
```

```text
$ npm run test:e2e
  26 skipped
  94 passed (2.4m)
```

```text
$ npx openspec validate --changes
✓ change/portfolio-v3-organic-ferrofluid
✓ change/vercel-preview-gating
Totals: 2 passed, 0 failed (2 items)
```

```text
$ npx openspec validate --specs
Totals: 7 passed, 0 failed (7 items)
```

## Visual Checks (PATCH-04)

- Sound is underlined/accented while enabled; the popover floats beneath it with a bordered surface, backdrop blur, and a vertical accent-colored range control.
- 100% places the thumb at the top; 40% lowers it; dragging to 0 leaves the Sound label enabled without disabling audio state.
- The popover does not appear while Sound is off.

---

# PATCH-05 Verification Addendum: Edge Tag Line Spacing 1.0

## Status: RESOLVED

- **Date**: 2026-11-13
- **Patch**: `PATCH-05` (`patch.md`)
- **Changes**: `src/components/GraphCanvas.tsx`, `DESIGN.md`.

| Request | Resolution | Verification |
| :--- | :--- | :--- |
| Set connection-tag line spacing to `1.0` | `EDGE_TAG_LINE_SPACING = 1`; row pitch is now `LABEL_FONT_SIZE (12px) * 1.0`, with `4px` vertical padding inside the same contiguous rounded rectangle and no inter-row gap. | Typecheck, visual inspection of focal edges, full E2E suite |

## Empirical Execution Logs (PATCH-05)

```text
$ npm run typecheck
> tsc --noEmit
(exit 0, no diagnostics)
```

```text
$ npm run test:unit
 Test Files  16 passed (16)
      Tests  176 passed (176)
```

```text
$ npm run build
dist/assets/index-wE7EyTyN.js    329.96 kB │ gzip: 105.16 kB
✓ built in 3.29s
```

```text
$ npm run test:e2e
  26 skipped
  94 passed (2.3m)
```

```text
$ npx openspec validate --changes
Totals: 2 passed, 0 failed (2 items)
```
