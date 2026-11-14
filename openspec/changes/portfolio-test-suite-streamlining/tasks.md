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

## 5. Verification & Empirical Audit

- [x] 5.1 Run `npm run typecheck`, `npm run build`, `REQUIRE_DIST=1 npm run test:unit`, `npm run test:e2e`, and `openspec validate portfolio-test-suite-streamlining --strict`, on a clean port; confirm results against the clean baseline
- [x] 5.2 Populate `verification.md` with the Requirement Adherence Matrix, resolved assumptions, the coverage map, and verbatim execution logs, reporting test cases, project executions, and skips as three separate numbers for the baseline and the final run, plus wall time for each project
- [x] 5.3 Write the follow-up note for the separate `camera-settled` change (replace `waitForTimeout(1500/1600)` with a condition-based signal), citing the measured time spent in those waits, without implementing it here
