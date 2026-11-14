## Why

The suite has grown through four UI/physics/audio changes and now carries duplicated count assertions across layers, 11 viewport-independent specs that also run on the mobile project, and a noisy E2E baseline (14 failures in the last full run on `master`, 9 of them dev-server drops). Unit time is negligible (206 tests, well under 1 s), so the problem is **maintenance noise and flaky signal**, not unit speed. E2E costs ~256 s wall with a single worker. Cleaning up now keeps the suite trustworthy before the next feature change adds more of the same.

The goal is a measured cleanup, not a lower test count: every invariant that is guarded today must still be guarded afterward.

## What Changes

- **Establish a clean baseline first.** Re-run the 5 assertion failures (`LLM filter dims every edge` on both projects, `hover dwell…`, mobile `graph view exposes all 8 project nodes`, mobile `pointercancel…`) with `--repeat-each=3` on a clean port, and classify each as flake, environment, or real regression. No refactor lands on a red baseline.
- **Gate viewport-independent E2E specs to the `desktop` project** with the existing `test.skip(isMobile(testInfo), reason)` idiom. Candidates (verified in `research.md`): default Light theme, theme-init, document metadata, theme persistence, deep link, unknown slug, Escape closes drawer, visited set, About button, `#/about`, GitHub links. Mobile keeps the sheet, mobile header/menu, pointercancel, DPR/fps, viewport matrix, and **at least one mobile axe scan** (the open bottom sheet).
- **Consolidate unit tests without weakening them.**
  - Merge the three `toHaveLength(8)` tests in `projects.test.ts` into one catalog-contract test.
  - Keep one catalog-level 13-edge assertion and the simulation-level "13 edges survive drag + resetLayout" test. Drop count pins from geometry-focused tests (`graphPlanarity` count assertion, the `proximity pairs` describe's duplicate counts; its `force('proximity')` check folds into the link-preservation test).
  - Keep literal constant assertions (1.6x snap, 1.25x reconnect, 0.58 waist, oscillator parameters, audio topology values). Fold only where the exact values remain asserted.
  - Merge the two oscillator decay tests only if the theoretical-envelope bound and settling check both survive.
  - Keep `profile.test.ts` destination checks; drop only the verbatim-bio pin if a content-edit guard is not wanted, and keep at least one check that rendered links point at the intended profiles.
- **Relax literal count pins in browser specs, keep completeness.** `list view renders 8 cards` and `graph view exposes all 8 nodes` assert every catalog id appears (derived from the shared catalog, not a hard-coded `8`) so adding a ninth project does not break them. Keep a desktop GitHub destination check.
- **Reduce duplicate E2E sticky-focal coverage.** Keep the unit test, the `pointercancel` + empty-canvas tap test, and `Reset clears the sticky inspected focus`; reassess `tapping the sticky-focal node clears highlights before reopening the drawer` (~8.8 s per project) for gating to one project rather than deletion.
- **Share hover setup via helpers.** Reuse `hoverCenteredNode` / `focusNode` in the hover specs instead of re-implementing setup. No merging of unrelated scenarios; theme and axe tests stay independently diagnosable.
- **Report counts honestly.** Verification reports test cases, project executions, and skips as three separate numbers.
- **Out of scope:** the condition-based camera-settled signal replacing `waitForTimeout(1500/1600)` (separate follow-up change, needs an app-side hook); making `buildOutput.test.ts` unconditional (CI sets `REQUIRE_DIST=1`, local `test:unit` stays tolerant); changing Playwright `workers`; `preview-headers.spec.ts`.

No product behavior changes and nothing is **BREAKING** for users. The only contributor-visible change is that some specs no longer execute on the mobile project.

## Capabilities

### New Capabilities
- `test-suite-hygiene`: Contract for how the unit and E2E suites are organised: what each layer must guard, which specs are viewport-gated, which assertions must never be removed, how counts are reported, and the baseline-before-refactor rule.

### Modified Capabilities
<!-- None. No product capability's requirements change. -->

## Impact

- **Test files:** `e2e/portfolio.spec.ts` (gating, helper reuse, count-pin relaxation), `src/data/projects.test.ts`, `src/utils/graphPlanarity.test.ts`, `src/physics/graphSimulation.test.ts`, `src/audio/ambientSynth.test.ts`, `src/utils/bridgeOscillator.test.ts`, `src/utils/bridgeGeometry.test.ts`, `src/data/profile.test.ts`.
- **Unchanged:** all application code under `src/` (non-test), `playwright.config.ts` (workers/projects), `src/utils/buildOutput.test.ts`, `e2e/preview-headers.spec.ts`, CI workflows.
- **Docs:** `README.md` testing section gets the gating convention and the three-number reporting format, if it describes test counts.
- **Risk:** a gated spec stops catching a mobile-only regression. Mitigated by gating only specs whose assertions are layout- and input-independent, and by keeping one mobile axe scan.
