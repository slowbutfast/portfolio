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
