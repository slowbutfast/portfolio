# Surgical Patch Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid' [PATCH-01]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v3-organic-ferrofluid` (Target Branch: `feat/portfolio-v3-organic-ferrofluid` / PR #12)
- **Patch ID**: `PATCH-01`
- **Objective**: Replace straight-taper bridge handles, stalled tick-coupled recoil, hard `fx/fy` pinning + neighbor freezing, and incomplete live reduced-motion handling with handle-first $C^1$ hourglass curvature, render-clock teardrop recoil, soft `(homeX, homeY)` spring anchors + visual ambient drift, force-isolated viscous drag, and bidirectional `prefers-reduced-motion` transitions.
- **Feedback & Diagnostic Trace**:
  ```
  1. Visual Recording: Bridges still read as straight sharp tapers; stretched/detached bridges appeared frozen mid-air; dropped nodes feel completely static with no idle drift.
  2. Agent 1 (REQUEST CHANGES): GraphCanvas.tsx:431-447 live reduced-motion handler sets the flag and renders without populating staticPosRef or stopping sim.sim (and does not restart on return to standard motion). Recoil tips shrink/fade at fixed perimeter points instead of retracting inward.
  3. Agent 2 (APPROVE w/ follow-ups): Per-frame sorted IDs & gradient allocations in render(); App.tsx passes window.innerWidth/2 instead of measured canvas container center; resize mid-drag overwrites dragNeighborPins; missing reconnect ripple test.
  ```
- **Root Cause Analysis**:
  - `bridgeGeometry.ts` (`HANDLE_RADIUS_RATIO = 1.2`) caps handle length at ~26px on 90–150px gaps, leaving straight chords with tight endpoint hooks.
  - `graphSimulation.ts` advances `recoilProgress` and `simClock` only inside `afterTick` (freezing when `sim` cools), hard-pins dropped nodes via `fx/fy`, and freezes direct neighbors via `dragNeighborPins`.
  - `GraphCanvas.tsx` `handleMotionChange` (`L431-L448`) does not sync `staticPosRef` or stop/restart `sim.sim`.

## 2. Strict Target Context Map (on `feat/portfolio-v3-organic-ferrofluid`)
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/utils/bridgeGeometry.ts` | `L59-L73`, `L115-L125`, `L204-L234` | Remove `HANDLE_RADIUS_RATIO` cap; set `handle = k * gap` (scaled down by hub angular crowding); solve per-endpoint `theta` (`<= MAX_SPREAD_ANGLE`) via monotone bisection for `REST_WAIST_RATIO = 0.58` / smoothstep `-> 0` at `1.6x`, clamped by `handle <= R * tan(theta)` so all 4 control-point normal offsets `>= 0`. |
| `src/physics/graphSimulation.ts` | `L42-L56`, `L285-L422`, `L460-L600` | Replace `userPinnedIds` & `dragNeighborPins` with per-node `home` + alpha-independent damped spring (`p = home` immediately under reduced motion); isolate `dragNode` in `forceManyBody` (0 exerted strength) & `forceCollide` (`0.4 * R`) + viscous pointer lag (`tau ≈ 45ms`) + capped `< 12px` neighbor follow-through; switch `detachedAt` & `reconnectCooldownUntil` to `performance.now()` render timestamps. |
| `src/components/GraphCanvas.tsx` | `L140-L179`, `L281-L380`, `L431-L448` | Render-clock `drawRecoilTips` retracting teardrops anchored to live endpoints (`p = 1 - ease((now - detachedAt) / 220)`); smoothstep proximity alpha over `[R_A + R_B, R_A + R_B + 12]`; purely visual deterministic `o_i(t)` ambient drift (`A = 3.5px`, ~30fps, paused on `document.hidden`, off-screen `IntersectionObserver`, and `prefers-reduced-motion`) shared with `hitNode`/`nodeScreenPoint`; fix `handleMotionChange` in both directions; hoist sorted node IDs & measure `canvasCenter` via container `getBoundingClientRect()`. |
| `src/App.tsx` | `L300-L355` | Pass `GraphCanvas`-measured `canvasCenter` to `NodeHoverCard` instead of inline `window.innerWidth / 2`. |
| `src/utils/bridgeGeometry.test.ts` | `L1-L150` | Assert all 4 control-point normal offsets `>= 0` and true concavity across short gaps, long gaps, and degree-5/6 hubs. |
| `src/physics/graphSimulation.test.ts` | `L1-L260` | Assert `< 15px` neighbor displacement over 20 fixed ticks / 160px drag without neighbor `fx/fy`, soft `home` settling + `resetLayout()`, reconnect oscillation ripple, live reduced-motion transitions, and zero crossings at max ambient offset. |
| `openspec/changes/portfolio-v3-organic-ferrofluid/specs/graph-simulation/spec.md` & `openspec/specs/graph-simulation/spec.md` | Delta sync | Update persistence/cooldown/ambient-drift wording to match soft `home` anchors, render-clock recoil/cooldown, and visual-only ambient drift. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and areas specified in the Target Context Map (plus `tasks.md`, `patch.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT add elliptical node squash/stretch (remains deferred).
  - Do NOT modify `.env` or credential files.
  - Do NOT introduce unapproved external dependencies.
- **INVARIANTS TO PRESERVE**:
  - All 8 nodes and 13 permanent edges remain intact; zero crossings at rest and at max ambient offset; proximity webbing remains zero-force and excludes permanent-edge pairs.

## 4. Visual & UI Impact
- Bridges preserve Swiss editorial tokens (`--color-accent` `#003399`, `--color-connection` `#000000`) with smooth axis-aligned `createLinearGradient` blending, organic concave hourglass silhouettes at rest, retracting teardrop recoil on snap, and gentle ~30fps idle breathing (`3.5px`).

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Run `npm run test:unit -- src/utils/bridgeGeometry.test.ts src/physics/graphSimulation.test.ts` after scaffolding `P01.1` failing tests and confirm failure.
2. **Apply Minimal Fix**: Implement `P01.2`–`P01.4` strictly within the Target Context Map.
3. **Verify Fix**: Re-run `npm run test:unit -- src/utils/bridgeGeometry.test.ts src/physics/graphSimulation.test.ts` and confirm PASS.
4. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`.

## 6. Surgical Patch Checklist
- [ ] P01.1 Scaffold/run reproducing tests in `bridgeGeometry.test.ts` and `graphSimulation.test.ts` and confirm failure.
- [ ] P01.2 Implement `P01.2` in `src/utils/bridgeGeometry.ts`.
- [ ] P01.3 Implement `P01.3` in `src/physics/graphSimulation.ts`.
- [ ] P01.4 Implement `P01.4` in `src/components/GraphCanvas.tsx` and `src/App.tsx`.
- [ ] P01.5 Update specs, run full verification suite, populate `verification.md`, mark `PATCH-01` `RESOLVED` in `patch.md`, and check off `tasks.md`.
