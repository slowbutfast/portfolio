# Surgical Patch Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid' [PATCH-06]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v3-organic-ferrofluid` (Target Branch: `feat/portfolio-v3-organic-ferrofluid` / PR #12 at `afc0751`)
- **Patch ID**: `PATCH-06`
- **Objective**: Fix mid-drag `prefers-reduced-motion` state corruption (`GraphCanvas.tsx`), move the viscous drag follower from pointer events to the frame clock (`graphSimulation.ts`), throttle idle ambient `render()` calls to 30 fps (`GraphCanvas.tsx`), and sync `openspec/specs/` before merge.
- **Feedback & Diagnostic Trace**:
  ```
  1. Agent 1 (REQUEST CHANGES): GraphCanvas.tsx:618-643, 1121-1132 — Switching to reduced motion during an active drag stops sim.sim without ending the drag, and pointerup skips sim.dragEnd() while reduced motion is active, leaving sim.state === 'drag' with a pinned node when motion is re-enabled.
  2. Agent 2 (Important): graphSimulation.ts dragMove — lag = 1 - e^(-dt/45) runs per pointermove instead of on the frame clock, making high-polling mice converge 3-4x faster and stalling short of a stationary cursor.
  3. Agent 2 (Important): GraphCanvas.tsx loop (~L700) — render() runs at full 60-120 Hz even when sim.isIdle && !cameraMoving and only 30 fps ambient drift is active.
  4. Agent 2 (Important): openspec/specs/portfolio-controls/spec.md & graph-simulation/spec.md are out of sync with singular Reset, volume slider, stickyFocalId, collision-aware popups, draggable drawer, and initial vs. live reduced-motion behavior.
  ```
- **Root Cause Analysis**:
  - `handleMotionChange` stops `sim.sim` without calling `sim.dragEnd()`, and `onPointerUp` skips `sim.dragEnd()` when `reduceMotionRef.current` is `true`.
  - `dragMove` integrates `DRAG_LAG_MS` synchronously on `pointermove` instead of storing `dragTarget` for `afterTick(dtMs)`.
  - `loop` invokes `render()` on every rAF tick whenever `ambientRunning` is `true`.

## 2. Strict Target Context Map (on `feat/portfolio-v3-organic-ferrofluid` at `afc0751`)
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/components/GraphCanvas.tsx` | `L618-L645`, `L690-L718`, `L1121-L1132` | In `handleMotionChange` when `reduced` is true, finalize any active drag (`if (sim.state === 'drag') sim.dragEnd()`, clear `lastDragPointRef`) before freezing `staticPosRef` and stopping `sim.sim`. In `onPointerUp`, always call `sim.dragEnd()` if `sim.state === 'drag'` regardless of `reduceMotionRef.current`. In `loop`, when `!cameraMoving && sim.isIdle && ambientRunning`, throttle `render()` to `~30 fps` (`now - lastAmbientAtRef.current >= 1000 / 30`) and hoist per-frame allocations out of `render()`. |
| `src/physics/graphSimulation.ts` | `L460-L470`, `L542-L561` | Store `dragTarget` (`rubberBandDisplacement(...)`) in `dragMove(x, y)` and advance the critically damped follower (`lag = 1 - Math.exp(-clampedDt / DRAG_LAG_MS)`) inside `afterTick(dtMs)` (clearing `dragTarget` in `dragEnd`). |
| `src/physics/graphSimulation.test.ts` | Relevant suite | Add test confirming `dragMove` + stationary pointer converges smoothly toward `dragTarget` across `sim.tick()` steps at fixed `dt`. |
| `e2e/portfolio.spec.ts` | Relevant suite | Add test toggling `prefers-reduced-motion` on mid-drag -> releasing pointer -> toggling off, verifying the graph stays visible and responsive with no stuck `drag` pin. |
| `openspec/specs/portfolio-controls/spec.md` & `openspec/specs/graph-simulation/spec.md` | Spec sync | Sync singular `Reset` (filters + layout + visited colors), `500ms` volume slider, `stickyFocalId`, collision-aware popups, draggable desktop drawer, and initial reduced-motion (planar seeds) vs. live transition (frozen layout). |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files specified in the Target Context Map (plus `tasks.md`, `patch.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT alter `bridgeGeometry.ts`, `NodeHoverCard.tsx`, `ProjectDrawer.tsx`, or `ambientSynth.ts`.
  - Do NOT modify `.env` or credential files.
- **INVARIANTS TO PRESERVE**:
  - All 8 nodes and 13 permanent edges remain intact; `< 15px` neighbor displacement during drag; zero Axe accessibility violations.

## 4. Visual & UI Impact
- Eliminates 120 Hz redundant canvas redraws when idle, prevents mid-drag reduced-motion lockups, and makes viscous drag feel identical across 60 Hz and high-polling mice.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Run `npm run test:unit -- src/physics/graphSimulation.test.ts` and `npm run test:e2e` after adding `P06.1` tests and confirm failure.
2. **Apply Minimal Fix**: Implement `P06.2`–`P06.4` strictly within the Target Context Map.
3. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes && npx openspec validate --specs`.

## 6. Surgical Patch Checklist
- [ ] P06.1 Scaffold/run failing unit & E2E tests and confirm failure.
- [ ] P06.2 Implement `P06.2` in `src/components/GraphCanvas.tsx`.
- [ ] P06.3 Implement `P06.3` in `src/physics/graphSimulation.ts`.
- [ ] P06.4 Sync `openspec/specs/portfolio-controls/spec.md` and `openspec/specs/graph-simulation/spec.md`.
- [ ] P06.5 Run full verification suite, update `verification.md`, mark `PATCH-06` `RESOLVED` in `patch.md`, check off `tasks.md`, and push to PR #12.
