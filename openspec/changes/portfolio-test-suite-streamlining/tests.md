## Automated Tests

This change refactors the tests themselves, so the verification plan is about proving **coverage-neutrality and a clean baseline**, not about new product behavior. Every command below runs from the repo root.

- `npm run typecheck`: the refactored test files and shared helpers still type-check.
- `npx vitest run`: all unit tests pass; the case count is lower or equal to the baseline (206), and every removed or merged case is mapped to a surviving assertion in `verification.md`.
- `REQUIRE_DIST=1 npx vitest run` after `npm run build`: the build-output guard still fails when `dist/assets` is absent and passes when it is present. Run it once without `dist/` and without `REQUIRE_DIST` to confirm the inspections are skipped, not failed.
- `npx playwright test --list`: lists all test cases; the spec-title count should be unchanged (no spec removed from the E2E file unless mapped).
- `npx playwright test --project=desktop --reporter=json` and `--project=mobile --reporter=json`: record, per project, cases executed, cases skipped, and wall time. Compare against the clean baseline, not the 14-failure run.
- `npx playwright test -g "<each of the 5 baseline failures>" --repeat-each=3`: classifies each failure as flake, environment fault, or real regression before any refactor lands.
- Mobile-retention check: `npx playwright test --project=mobile` still executes the sheet detent/camera spec, mobile header spec, in-menu Sound/Reset spec, `pointercancel` spec, DPR/fps spec, viewport matrix spec, and an accessibility scan of the open drawer.
- Gating check: the 11 viewport-independent specs show as skipped with a reason on `mobile` and as passed on `desktop`.
- Completeness check: temporarily adding a ninth entry to the catalog (not committed) leaves the list and semantic-nav completeness specs passing without edits; only `projects.test.ts` fails on its literal `8`.
- Constant-drift check: temporarily changing the snap multiplier (1.6), reconnect multiplier (1.25), rest waist ratio (0.58), an oscillator parameter, and `HOVER_SWELL_GAIN` (not committed, one at a time) makes the corresponding surviving test fail.
- Edge-integrity check: temporarily dropping a permanent link from the simulation makes the simulation-level 13-link preservation test fail.
- Post-rebase conflict check: `git diff origin/master -- e2e src` shows every PR #16 test case still present, except the intentional splits and consolidations listed in the coverage map.
- Re-baseline: on the rebased branch (or `master`), `npm run test:unit` and `npx playwright test --reporter=json` on a clean port give the post-#16 baseline; PR #16 reports 111 passed / 37 skipped / 0 failed, which is verified here and not trusted.
- `/art/` gating and build guard: the `/art/ endpoint…` spec is skipped on `mobile` and passes on `desktop`; `REQUIRE_DIST=1 npx vitest run` fails the new `dist/art/index.html` assertion when that file is removed from `dist/`, and plain `npx vitest run` without `dist/` skips it.
- Unlock-spec split: temporarily break each phase of `art-wip` (locked-state leak, unlock failure, reset behaviour), one at a time, and confirm only the matching test fails.
- Condition waits: `grep -n "waitForTimeout(800)\|waitForTimeout(350)" e2e/portfolio.spec.ts` finds none in the art specs; the art specs pass three times in a row (`--repeat-each=3`) on a clean port.
- Hover-dwell margin: the spec passes `--repeat-each=5` under `--workers=1` and still fails if `HOVER_DWELL_MS` is temporarily changed to 100 or 400.
- Dwell constant: temporarily changing `HOVER_DWELL_MS` makes the hover-dwell spec fail, so the spec guards the real value.
- Unit consolidation at 9: temporarily adding or removing a catalog entry (uncommitted) fails only the single catalog-contract test among the count assertions.
- `openspec validate portfolio-test-suite-streamlining --strict`: the change artifacts are valid.

## Manual Verification

- **Reading a split art-wip failure**:
  - **WHEN** one `art-wip` phase is deliberately broken
  - **THEN** the reporter marks exactly one of the three art-wip tests as failed, and its title names the phase (locked, unlock, or reset).
- **Mobile gap note**:
  - **WHEN** a reviewer reads `verification.md`
  - **THEN** it states that mobile only asserts the locked `art-wip` state and that touch-drag unlock is an untested gap.

- **Reading the reporter output**:
  - **WHEN** the final full E2E run finishes
  - **THEN** the reporter shows the gated specs as skipped with their reason strings on `mobile`, and the totals in `verification.md` list test cases, project executions, and skips as three separate numbers.
- **Failure diagnosability**:
  - **WHEN** an accessibility spec is forced to fail (for example by temporarily lowering an accent contrast)
  - **THEN** the failing title names its surface and theme, and no unrelated scenario is reported as failed alongside it.
- **Review of removed tests**:
  - **WHEN** a reviewer reads the mapping table in `verification.md`
  - **THEN** every removed or merged test case points to a surviving test and the specific literal or behavior it still asserts.
