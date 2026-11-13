# Patch Log: `portfolio-v3-organic-ferrofluid`

### [PATCH-01] Organic Bridge Curvature, Render-Clock Recoil, Soft Home Anchors, Force-Isolated Drag & Live Reduced-Motion
- **Date**: 2026-11-12 23:06:33 UTC
- **Feedback Source**: Manual Playtest (Screen Recording) + Code Review (Agent 1 `REQUEST CHANGES`, Agent 2 `APPROVE` w/ follow-ups) on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**:
  1. Bridges at rest and under stretch still read as straight, sharp-edged tapers rather than curved concave hourglass fillets.
  2. Recoil tips draw as fixed-position perimeter ellipses and `recoilProgress` / `reconnectCooldownUntil` freeze when `d3` ticks stop; stretched bridges appeared to stall/dangle mid-air.
  3. Hard `fx/fy` pinning and `alphaTarget = 0` make idle nodes completely static; `dragNeighborPins` freezes neighbors and causes pops on `dragEnd`.
  4. `GraphCanvas.tsx:431-448` live `prefers-reduced-motion` transition fails to populate `staticPosRef` and stop `sim` when switching to reduced motion (and fails to restart when switching back).
  5. `App.tsx` passes `window.innerWidth / 2, window.innerHeight / 2` instead of measured canvas container center; `render()` sorts node IDs every frame.
- **Root Cause**:
  - `bridgeGeometry.ts` caps `baseHandle` by `HANDLE_RADIUS_RATIO = 1.2` (~26px max on 90–150px gaps), forcing straight chords with tight endpoint hooks.
  - `graphSimulation.ts` advances `simClock` and `recoilProgress` only inside `afterTick` (which stops when `sim` cools), and uses hard `fx/fy` locks instead of soft `home` springs + force isolation.
  - `GraphCanvas.tsx` `handleMotionChange` does not sync `staticPosRef` or `sim.sim.stop()`/`wake()`.
- **Target Files**: `src/utils/bridgeGeometry.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/utils/bridgeGeometry.test.ts`, `src/physics/graphSimulation.test.ts`, `openspec/changes/portfolio-v3-organic-ferrofluid/specs/graph-simulation/spec.md`, `openspec/specs/graph-simulation/spec.md`
- **Expected Resolution**: True $C^1$ concave hourglass curves with `cp` normal offsets `>= 0`; render-clock teardrop recoil anchored to live endpoints; soft `(homeX, homeY)` springs + purely visual ~30fps ambient drift (`3.5px`, paused when hidden/off-screen/reduced-motion) shared with `hitNode`; force-isolated viscous drag (`< 15px` neighbor displacement without neighbor `fx/fy`); live reduced-motion transition handling; measured `canvasCenter`.
- **Status**: RESOLVED (2026-11-12 23:32:00 UTC)
- **Resolution**:
  - `bridgeGeometry.ts` now uses a gap-proportional handle capped by `min(R) * tan(MAX_SPREAD_ANGLE)`, solves per-endpoint spread with monotone bisection for the 0.58 rest target (clamped by `alpha >= 1` so all four control-point normal offsets stay non-negative), and smoothsteps the target toward the 2px floor at 1.6x before sag extension.
  - `graphSimulation.ts` replaces `userPinnedIds`/`dragNeighborPins` with alpha-independent damped `home` springs, isolates the dragged node (charge strength 0, collide radius `0.4 * R`), applies 45ms viscous pointer lag, and stores `detachedAt`/`reconnectCooldownUntil` as `performance.now()` timestamps with a reconnect ripple.
  - `GraphCanvas.tsx` draws render-clock teardrop recoil from live endpoints, smoothsteps proximity alpha over `[R_A + R_B, R_A + R_B + 12]`, runs deterministic 3.5px visual drift at ~30fps shared with `hitNode`, handles reduced-motion transitions in both directions, hoists sorted ids/edge keys, and measures `canvasCenter`; `App.tsx` forwards that measured center.
  - Reproducing tests failed first, then passed: 173 unit tests, 88 e2e tests, typecheck/build clean, OpenSpec validation clean.

### [PATCH-02] UI Polish, Node-Hover Crosshair, Active-Pair Edge Filtering, Focal Edge Tag Pills & Grid Layout
- **Date**: 2026-11-13 17:48:07 UTC
- **Feedback Source**: Manual Playtest & Design Review on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**:
  1. 3-dot dropdown has two reset buttons (`"Reset"` w/ undo icon and `"Reset layout"`), and visited node colors don't reset.
  2. Canvas cursor stays crosshair everywhere instead of only when hovering/dragging a node.
  3. Filtering highlights all outgoing edges from an active node (`&&`) instead of only edges where both endpoints are active (`||`).
  4. Focal/hovered connections don't show 1–3 stacked shared-tag pills between nodes.
  5. Grid cards place `title` below preview instead of inline next to `01` with `summary` directly below (`DESIGN.md` needs update), and `[CLI Specimen]` badge still renders on terminal fallbacks.
  6. GitHub Issue `#9` needs updated media requirements appended (without `[CLI Specimen]`).
- **Root Cause**:
  - `ControlsOverlay.tsx` renders both `reset-filters` and `reset-layout`, and `App.tsx` doesn't clear `visitedIds` on reset.
  - `src/styles.css` `.canvas-interactive` sets `cursor: crosshair` globally; `GraphCanvas.tsx` uses `&&` for `isDim` and doesn't draw focal edge tag pills.
  - `ListView.tsx` orders `index` -> `CardPreview` -> `title` -> `summary`, and `ListView.tsx`/`NodeHoverCard.tsx` render `[CLI Specimen]`.
- **Target Files**: `src/components/ControlsOverlay.tsx`, `src/App.tsx`, `src/styles.css`, `src/components/GraphCanvas.tsx`, `src/components/ListView.tsx`, `src/components/NodeHoverCard.tsx`, `DESIGN.md`, `e2e/portfolio.spec.ts`, GitHub Issue `#9`
- **Expected Resolution**: Singular `"Reset"` button resets filters + layout + visited node colors; crosshair cursor appears only on node hover/drag; edges illuminate only when both endpoints are active; 1–3 stacked shared-tag pills render on focal non-detached edges; `[CLI Specimen]` removed; Grid cards show `01  Title` -> `Subtitle` -> `CardPreview` -> `Tags` (codified in `DESIGN.md`); Issue `#9` updated.
- **Status**: RESOLVED (2026-11-13 18:05:00 UTC)
- **Resolution**:
  - `ControlsOverlay` now renders one `data-testid="reset-layout"` button labelled/accessible-named `"Reset"`; `App.resetAll` clears active tags, search, layout version, and `visitedIds`.
  - `styles.css` defaults the canvas to `cursor: default`; `GraphCanvas` switches to `crosshair` only when `hitNode` succeeds or `state === 'drag'`.
  - Edge dimming now uses `dimmed.has(source) || dimmed.has(target)`; focal non-detached edges draw up to three stacked shared-tag pills at their midpoint. A `data-dimmed-edges` canvas attribute exposes the deterministic active-pair state for the E2E guard.
  - `ListView` removes the `[CLI Specimen]` badge and reorders every Grid card to `01  Title` row -> summary -> 16:9 preview -> tags; `NodeHoverCard` removes the fallback `CLI specimen` subtitle; `DESIGN.md` codifies the hierarchy, singular Reset, node-hover crosshair, and active-pair filtering.
  - GitHub Issue `#9` received the updated media list without `[CLI Specimen]`.
  - Verification: typecheck clean, 173 unit tests, 92 e2e passed / 24 expected skips, build clean, OpenSpec changes/specs valid.
