# Patch Ledger: portfolio-mobile-polish

## Patch Ledger
| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-13 | Code Review — PR #13 (Agent 2 REQUEST CHANGES; Agent 1 follow-ups) | `src/components/GraphCanvas.tsx`, `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | RESOLVED |

---

### [PATCH-01] Gate geometryPoll wake(), restore never-placed cancel home, and tighten 15fps/cancel tests

- **Date**: 2026-11-13 23:00:00 UTC
- **Feedback Source**: Code Review (PR #13)
- **Reported Issue**:
  1. `GraphCanvas.tsx` `geometryPoll` called `wakeRef.current()` every 120ms unconditionally while `ProjectDrawer` was open, restarting the simulation (`alpha >= 0.05`) and cancelling the 15fps idle timer. Measured open-sheet render rate: **108–110 fps**.
  2. `graphSimulation.ts` `dragEnd({ cancel: true })` only restored nodes that already had a `homeAnchors` entry; a never-placed node fell back to the decaying seed force and stayed near the abandoned drag position (**228.5 px** from its pre-drag resting point after 600 ticks).
  3. The open-sheet idle E2E assertion was absent, the idle band (`8–25 fps`) was too broad to prove 15fps, and the cancel unit test still allowed a `60 px` return tolerance.
- **Root Cause**:
  1. `measure()` assigned `goal.x`/`goal.y` and invoked `wakeRef.current()` on every poll even when the measured target had not moved.
  2. The cancel path never seeded `homeAnchors` from `dragAnchor` for nodes without a prior normal release.
  3. Tests asserted loose bounds that passed despite both regressions.
- **Target Files**: `src/components/GraphCanvas.tsx`, `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`
- **Expected Resolution**:
  1. `measure()` computes `nextX`/`nextY` and only updates the goal + wakes the simulation when `Math.hypot(nextX - goal.x, nextY - goal.y) > 0.5`.
  2. `dragEnd({ cancel: true })` seeds `homeAnchors` with `dragAnchor` when `!homeAnchors.has(node.id)`.
  3. Unit coverage for the never-placed cancel with a `< 15 px` tolerance; existing placed-node cancel tightened from `< 60 px` to `< 15 px`; E2E idle band tightened to `11–19 fps` with an additional open-sheet idle sample.
- **Resolution**:
  - Added the `> 0.5 px` delta guard in `GraphCanvas.tsx` `measure()`.
  - Seeded `homeAnchors` from `dragAnchor` before releasing the pin in the cancel branch of `dragEnd`.
  - Added `returns a never-placed node to its pre-drag position on cancel`; tightened the placed-node cancel assertion.
  - Updated `coarse pointers cap DPR at 2 and idle ambient at 15fps` to assert `11–19 fps` both before and after opening the mobile sheet.
- **Verification Command**:
  ```bash
  npx vitest run src/physics/graphSimulation.test.ts
  npx playwright test --project=mobile -g "coarse pointers cap DPR"
  npm run typecheck && npm run build && npm test
  npx openspec validate portfolio-mobile-polish --strict --json
  ```
- **Verification Proof**:
  ```text
  Never-placed cancel before PATCH-01: 228.49699134504627 px > 15 px (FAIL)
  Never-placed cancel after PATCH-01:  < 15 px (PASS)

  Open-sheet render rate before PATCH-01: 110 frames / second (FAIL > 19)
  Open-sheet render rate after PATCH-01:  11–19 frames / second (PASS)

  Test Files  18 passed (18)
  Tests       188 passed (188)
  104 passed, 36 skipped
  openspec validate: valid: true, issues: []
  ```
- **Status**: RESOLVED
