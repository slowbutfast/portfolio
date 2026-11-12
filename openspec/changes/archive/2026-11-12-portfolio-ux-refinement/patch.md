# Patch Ledger: portfolio-ux-refinement

## Patch Ledger

| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-12 | Unit Test Failure | `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts` | RESOLVED |
| `PATCH-02` | 2026-11-12 | Verification Audit | `src/utils/buildOutput.test.ts` | RESOLVED |

---

### [PATCH-01] Seed homing forces never applied velocity

- **Date**: 2026-11-12
- **Feedback Source**: Unit Test Failure (`graphSimulation seed homing > re-scales seed targets when the viewport resizes`)
- **Reported Issue**:
  ```text
  AssertionError: expected 400 to be greater than 450
  ```
- **Root Cause**: `forceX(accessor).strength(0.02)` initialized zero internal strengths in this setup; `sim.tick()` left the node stationary even though the accessor returned the rescaled target.
- **Target Files**: `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts`
- **Expected Resolution**: Explicit `seedForceX`/`seedForceY` callbacks apply `(target - position) * 0.02 * alpha`, and resize tests observe movement toward rescaled seeds.
- **Verification Command**: `npm run test:unit -- src/physics/graphSimulation.test.ts`
- **Status**: RESOLVED — `graphSimulation.test.ts` passes 8/8; `graphPlanarity.test.ts` still passes 7/7.

---

### [PATCH-02] Weblog font build guard contradicted native-font migration

- **Date**: 2026-11-12
- **Feedback Source**: Verification Audit (full `npm run test:unit`)
- **Reported Issue**:
  ```text
  AssertionError: expected 0 to be greater than 0
  src/utils/buildOutput.test.ts:22: emits at least one .woff2 font as a separate asset
  ```
- **Root Cause**: The change intentionally removes `@fontsource-variable/*`, but the pre-existing build-output guard still required at least one `.woff2` asset.
- **Target Files**: `src/utils/buildOutput.test.ts`
- **Expected Resolution**: The guard asserts zero bundled webfont files and continues to assert no inlined `data:` font URIs.
- **Verification Command**: `npm run test:unit -- src/utils/buildOutput.test.ts`
- **Status**: RESOLVED — 3/3 build-output tests pass after `npm run build`.

---

## Status: No outstanding patches

Implementation verified clean with zero critical defects after PATCH-01 and PATCH-02.
