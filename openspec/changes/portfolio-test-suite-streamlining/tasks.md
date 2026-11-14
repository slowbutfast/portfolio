## 1. Test Scaffolding (TDD)

Here the "tests" are the safety net that proves a refactor is coverage-neutral. Nothing is removed, gated, or merged until this group is done.

- [x] 1.1 On a clean port with no other dev server running, run `npm run test:unit` and `npx playwright test --reporter=json`; record test cases, project executions, skips, failures, and wall time per layer as the **baseline** in `verification.md` (replacing the 14-failure run from `research.md`)
- [x] 1.2 Re-run each assertion failure from the earlier run (`LLM filter dims every edge…` on desktop and mobile, `hover dwell suppresses fast sweeps…`, mobile `graph view exposes all 8 project nodes…`, mobile `pointercancel ends a drag cleanly…`) with `-g "<title>" --repeat-each=3`; classify each as flake, environment fault, or real regression with evidence
- [x] 1.3 For any failure classified as a real regression, fix it or quarantine it with a recorded reason in a **separate commit** before continuing; record any `ERR_CONNECTION_REFUSED` as an environment fault and re-run
- [x] 1.4 Write the coverage map (a table in `verification.md`) listing every unit test and E2E spec proposed for removal, merge, fold, or gating, with the surviving test and the literal or behavior it still asserts; include the invariants from the spec (1.6x, 1.25x, 0.58, oscillator params, audio topology/`HOVER_SWELL_GAIN`/ramp constant, simulation 13-link preservation, profile destinations)
- [x] 1.5 Add the E2E catalog-completeness assertions first (list view and semantic nav derive expected ids from `projects`, no literal `8`), and confirm they pass on both the current 8-project catalog and a temporary ninth entry (not committed) — **partial**: catalog-derived assertions added and pass on the current catalog; the temporary ninth-entry check was not run (see `verification.md`)

## 2. Baseline-Safe E2E Gating

- [x] 2.1 Add `test.skip(isMobile(testInfo), '<reason>')` to the viewport-independent specs in `e2e/portfolio.spec.ts`: default Light theme, theme-init stored dark, document metadata, theme switch persists, deep link `#/p/open-dungeon`, unknown deep link slug, Escape closes the drawer, opening a project records it in the visited set, About button opens the modal, `#/about` deep link, and GitHub navigation/profile links
- [x] 2.2 Update the GitHub-links spec so desktop asserts `nav-github` href equals the intended profile and mobile asserts only that it is hidden (the mobile-hidden behavior stays covered by the header-controls spec)
- [x] 2.3 Gate the viewport-independent accessibility scans (graph, list, About modal, dark and light) to `desktop`; keep the open-drawer scan on both projects, or add one explicit mobile scan of the open bottom sheet if the current drawer scan is gated; keep each scan a separate test titled by surface and theme
- [x] 2.4 Reassess `tapping the sticky-focal node clears highlights before reopening the drawer` (~8.8 s per project) and `canvas mirrors inspect and drag audio swell state`; gate to one project only if its assertions are viewport-independent, otherwise leave on both and note why in `verification.md`
- [x] 2.5 Run `npx playwright test --list` and confirm no spec was lost: every locally runnable spec executes on at least one project, and the only specs executing on none are the preview-only `served edge headers` specs

## 3. Invariant-Preserving Unit Consolidation

- [x] 3.1 In `src/data/projects.test.ts`, merge the three `toHaveLength(8)` tests into one catalog-contract test; keep the 13-edge assertion at line ~148 as the single catalog edge pin
- [x] 3.2 In `src/utils/graphPlanarity.test.ts`, drop the literal count assertions in `has exactly 8 projects and 13 tag-derived edges`, keeping the id-set equality and the geometric assertions
- [x] 3.3 In `src/physics/graphSimulation.test.ts`, fold the `proximity pairs never create force links` describe into the existing link-preservation test (keep `expect(sim.sim.force('proximity')).toBeUndefined()` and the permanent-link count), keeping the 13-link preservation after detach + `resetLayout()`
- [x] 3.4 Keep the explicit constant assertions for the 1.6x snap and 1.25x reconnect multipliers in `graphSimulation.test.ts` and the 0.58 waist ratio in `bridgeGeometry.test.ts`; fold them into a behavioral test only if the literal `expect(...).toBe(...)` remains
- [x] 3.5 In `src/audio/ambientSynth.test.ts`, fold `exposes the specified synthesizer topology` into the construction test only if every exact constant value (including `HOVER_SWELL_GAIN`, plateau, and `RAMP_TIME_CONSTANT`) remains asserted — **no merge made**: kept as-is per the guard condition
- [x] 3.6 In `src/utils/bridgeOscillator.test.ts`, merge the two decay tests only if the combined test still asserts both the theoretical underdamped envelope bound and the settled-after-one-second behavior; keep the underdamped parameter pin — **no merge made**: kept as-is per the guard condition
- [x] 3.7 In `src/data/profile.test.ts`, keep the exact LinkedIn, GitHub, resume-embed, and `mailto:` destination assertions; at most drop the verbatim-bio pin, and never replace destination checks with a protocol-only check
- [x] 3.8 Leave `src/utils/buildOutput.test.ts` unchanged and confirm the conditional `REQUIRE_DIST` behavior still holds (skip without `dist/`, fail with `REQUIRE_DIST=1`)
- [x] 3.9 Run the constant-drift and edge-integrity mutation checks from `tests.md` (temporary, uncommitted, one at a time) and confirm each makes a surviving test fail — **partial**: six constant mutations run and caught; the edge-drop mutation was not run (see `verification.md`)

## 4. E2E Helper Reuse

- [x] 4.1 Route the hover-card, hover-dwell, 150 ms pointer-transfer, terminal-fallback, and focal-edge-pill specs through the shared `hoverCenteredNode` / `focusNode` helper, extending the helper if needed; do not merge unrelated scenarios into one test
- [x] 4.2 Confirm theme tests and each axe scan remain separate, independently titled tests (no merged light/dark pairs)

## 5. Pass 1 Audit (pre-PR #16 base)

> Groups 1–5 were completed and verified against the 8-project base `548a0b6`. PR #16 (`a4cba9e`, 9th project `art-wip`) landed on `master` afterward and conflicts with this branch in four test files, so groups 6–10 rebase onto it and extend the plan. Pass 1 numbers in `verification.md` are the pre-#16 baseline, not the final result.

- [x] 5.1 Run `npm run typecheck`, `npm run build`, `REQUIRE_DIST=1 npm run test:unit`, `npm run test:e2e`, and `openspec validate portfolio-test-suite-streamlining --strict`, on a clean port; confirm results against the clean baseline
- [x] 5.2 Populate `verification.md` with the Requirement Adherence Matrix, resolved assumptions, the coverage map, and verbatim execution logs, reporting test cases, project executions, and skips as three separate numbers for the baseline and the final run, plus wall time for each project
- [x] 5.3 Write the follow-up note for the separate `camera-settled` change (replace `waitForTimeout(1500/1600)` with a condition-based signal), citing the measured time spent in those waits, without implementing it here

## 6. Rebase onto PR #16 and Re-Baseline

- [ ] 6.1 Rebase `feat/portfolio-test-suite-streamlining` onto `origin/master` (`a4cba9e` or later); resolve the conflicts in `e2e/portfolio.spec.ts`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, and `src/utils/graphPlanarity.test.ts`, keeping the catalog-derived E2E ids and dropping every literal `8`/`9` pin from browser specs
- [ ] 6.2 On a clean port, run `npm run test:unit` and `npx playwright test --reporter=json` on the rebased branch **with the pass-1 gating temporarily disabled** (or on `master` itself) and record the post-#16 baseline: test cases, project executions, skips, failures, wall time (PR #16 reports 111 passed / 37 skipped / 0 failed; verify, do not trust)
- [ ] 6.3 Classify any failure as flake, environment fault, or real regression; confirm the E2E nav and list completeness checks hold with `art-wip`, which stays hidden until unlocked, and fix them if the derived count is wrong
- [ ] 6.4 Reconcile the hover dwell value across the PR #16 description ("150ms"), the code (`HOVER_DWELL_MS = 200` in `src/components/GraphCanvas.tsx`), and the spec/test titles; record the authoritative value in `research.md` "Verified facts"

## 7. Gate the `/art/` Endpoint and Guard the Build Output

- [ ] 7.1 Add `test.skip(isMobile(testInfo), '<reason>')` to `/art/ endpoint serves raw WIP HTML title and body`, so it runs on desktop only
- [ ] 7.2 Add a conditional `dist/art/index.html` existence assertion to `src/utils/buildOutput.test.ts` using the existing `skipIf(!hasDist)` pattern: skipped without `dist/`, failing under `REQUIRE_DIST=1` when absent; do not make the file unconditional
- [ ] 7.3 Keep `art-wip stays locked on compact mobile viewport until explicitly dragged` on mobile only and record in `verification.md` that touch-drag unlock on mobile is an untested coverage gap (deferred, not a duplicate)

## 8. Split the art-wip Unlock Spec

- [ ] 8.1 Extract a shared helper (for example `dragArtToCenter(page)`) from the unlock spec that reads `data-art-node-pos`, drags the node to the canvas centre, and returns once `data-art-unlocked` is `true`
- [ ] 8.2 Split `art-wip stays locked until dragged to connect, then unlocks…` into three desktop-only tests, each independently titled: (a) locked before any drag (no colour, no label, no hover card, no drawer, nav click ignored); (b) drag unlocks colour, label, hover card, and inspector, with the drawer contents (`/art/` Visit link, hidden `art` tag, no Overview/`09`) and persistence across reset layout and reload; (c) reset behaviour: one Reset keeps the unlock, a second consecutive Reset relocks
- [ ] 8.3 Keep exactly one E2E reload-persistence assertion (the wiring check); `src/utils/artDiscovery.test.ts` remains the owner of the storage round-trip and malformed-JSON recovery
- [ ] 8.4 Confirm each of the three new tests fails for its own phase by temporarily breaking that phase (uncommitted) and observing that only the matching test fails

## 9. Condition Waits Where a Signal Already Exists, and Unit Re-Consolidation at 9 Projects

- [ ] 9.1 Replace the `waitForTimeout(800)` and `waitForTimeout(350)` sleeps in the art specs with condition waits on the existing `data-art-node-pos` (and `data-art-unlocked`) attributes; leave the 1500/1600 ms camera sleeps for the separate camera-settled change
- [ ] 9.2 Make the hover-dwell spec robust to the current dwell value: derive the intermediate wait from the constant's value or assert with a margin of at least half the dwell, so it does not rely on a 100 ms window before a 200 ms timer; keep the dwell-suppression and open-after-dwell assertions
- [ ] 9.3 In `src/data/projects.test.ts`, merge the three `toHaveLength(9)` tests into one catalog-contract test; keep the single catalog edge pin and the `art-wip` configuration and `getVisibleTags` tests
- [ ] 9.4 In `src/utils/graphPlanarity.test.ts`, drop the literal `9` and `13` counts from `has exactly 9 projects and 13 permanent tag-derived edges`, keeping id-set equality and the `art-wip` connection assertions
- [ ] 9.5 Keep `src/utils/artDiscovery.test.ts`, `src/utils/rainbowPulse.test.ts` (including the 4.5:1 and 3:1 contrast tests), and the `connectLink` spring test in `graphSimulation.test.ts` unchanged; re-run the six constant-drift mutations plus `HOVER_DWELL_MS` and confirm each is caught

## 10. Final Verification & Empirical Audit

- [ ] 10.1 Run `npm run typecheck`, `npm run build`, `REQUIRE_DIST=1 npm run test:unit`, `npm run test:e2e`, and `openspec validate portfolio-test-suite-streamlining --strict`, on a clean port, against the post-#16 baseline from 6.2
- [ ] 10.2 Update `verification.md`: keep the pass-1 section as history, add the post-#16 baseline and final columns (test cases, project executions, skips, wall time per project), the extended coverage map (including the split unlock spec and the `/art/` gating), and verbatim logs
- [ ] 10.3 Update the follow-up note for the camera-settled change with the post-#16 `waitForTimeout` count and the art-spec sleeps already removed, still without implementing the hook
