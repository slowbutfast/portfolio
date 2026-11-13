# Surgical Patch Handoff: OpenSpec Change 'portfolio-mobile-polish' [PATCH-01]

> **Branch Note**: Execute this patch on PR #13's feature branch **`feat/portfolio-mobile-polish`** (checkout `feat/portfolio-mobile-polish` before editing).

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-mobile-polish`
- **Patch ID**: `PATCH-01`
- **Objective**: Stop `GraphCanvas.tsx`'s 120 ms `geometryPoll` from unconditionally waking the simulation while a sheet is open, ensure `dragEnd({ cancel: true })` returns never-placed nodes to their pre-drag position via `homeAnchors`, and tighten the 15 fps / cancel regression assertions.
- **Feedback & Diagnostic Trace**:
  ```
  Agent 2 (REQUEST CHANGES):
  [GraphCanvas.tsx:1008, 1034] The 120ms camera geometry poll calls wakeRef.current() every time, even when the measured camera target hasn't changed. When the idle loop is suspended, wake() restarts the simulation at alpha >= 0.05. With the drawer open, this can repeatedly wake physics and cancel the 15fps idle timer, undermining the mobile battery optimization. The render-rate test's 8-25 fps range is also too broad to verify a 15fps target.

  Agent 1 (Important follow-ups):
  - [GraphCanvas.tsx geometryPoll] Compare the new goal to the old one and only call wake() when it moved by more than about 0.5 px.
  - [graphSimulation.ts dragEnd, cancel path] A node that has never been placed has no home... Record the pre-drag position in dragStart. On cancel, set home to that position, or to the seed target, for the dragged node. Add a test for the never-placed case, and tighten the 60 px tolerance.
  ```
- **Root Cause Analysis**:
  1. `measure()` in `GraphCanvas.tsx:1006-1008` assigns `goal.x`/`goal.y` and calls `wakeRef.current()` unconditionally on every 120 ms `geometryPoll` tick even when the sheet has not moved.
  2. `dragEnd({ cancel: true })` in `graphSimulation.ts:565-584` drops `fx/fy` without setting `homeAnchors` to `dragAnchor` when `!homeAnchors.has(node.id)`, leaving never-placed nodes dependent on the decaying seed force.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/components/GraphCanvas.tsx` | `L1004-1009` | Compute `nextX` / `nextY` and only update `goal.x`, `goal.y`, and call `wakeRef.current()` when `Math.hypot(nextX - goal.x, nextY - goal.y) > 0.5`. |
| `src/physics/graphSimulation.ts` | `L565-584` | Inside `if (options?.cancel)`: if `!homeAnchors.has(node.id)` and `dragAnchor` is non-null, call `homeAnchors.set(node.id, { x: dragAnchor.x, y: dragAnchor.y })` so the alpha-independent home spring returns never-placed nodes to their pre-drag resting point. |
| `src/physics/graphSimulation.test.ts` | Cancel unit test | Add a test for `dragEnd({ cancel: true })` on a **never-placed** node (no prior normal release) and tighten return tolerance (e.g. `< 15 px`). |
| `e2e/portfolio.spec.ts` | `L552-575` | Tighten `coarse pointers cap DPR at 2 and idle ambient at 15fps` assertion from `8–25 fps` to `11–19 fps`, and assert that opening the mobile sheet settles without continuously waking/rendering above `~19 fps`. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the lines and files specified in the Target Context Map (plus `patch.md`, `tasks.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT refactor surrounding working code or `BOUNDARY_MARGIN`.
  - Do NOT modify `.env` or credential files.
  - Do NOT modify existing passing tests except tightening the `15 fps` band and adding the never-placed cancel / open-sheet idle assertions.
- **INVARIANTS TO PRESERVE**: All existing passing unit and E2E tests MUST continue to pass.

## 4. Visual & UI Impact
Status: Non-visual patch (physics/render-loop wakeup and test assertions only). No styling or layout modifications permitted.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**:
   - Run `npm run test:unit -- src/physics/graphSimulation.test.ts` and `npm run test:e2e -- -g "coarse pointers cap DPR at 2"` after scaffolding the never-placed cancel test and open-sheet idle assertion; confirm they fail on `d85cce4`.
2. **Apply Minimal Fix**: Make targeted edits in `src/components/GraphCanvas.tsx` (`L1004-1009`) and `src/physics/graphSimulation.ts` (`L565-584`).
3. **Verify Fix**: Re-run the reproduction commands and confirm PASS.
4. **Full Regression Suite**: Run `npm run typecheck && npm run build && npm test && npx openspec validate portfolio-mobile-polish`. Confirm zero regressions, commit to `feat/portfolio-mobile-polish`, and push to update PR #13.

## 6. Surgical Patch Checklist
- [ ] P01.1 Scaffold/run reproducing unit test for never-placed `dragEnd({ cancel: true })` and open-sheet idle / tightened `15 fps` E2E test; confirm failure.
- [ ] P01.2 Implement `> 0.5 px` delta guard on `wakeRef.current()` in `src/components/GraphCanvas.tsx` (`L1004-1009`).
- [ ] P01.3 Seed `homeAnchors` from `dragAnchor` for never-placed nodes on `dragEnd({ cancel: true })` in `src/physics/graphSimulation.ts` (`L565-584`).
- [ ] P01.4 Run full regression suite (`npm run typecheck && npm run build && npm test && npx openspec validate portfolio-mobile-polish`) and confirm zero regressions.
- [ ] P01.5 Update `tasks.md`, `verification.md`, and mark `PATCH-01` `RESOLVED` in `patch.md`, then commit and push to PR #13 (`feat/portfolio-mobile-polish`).
