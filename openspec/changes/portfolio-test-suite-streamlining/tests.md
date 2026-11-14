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
- `openspec validate portfolio-test-suite-streamlining --strict`: the change artifacts are valid.

## Manual Verification

- **Reading the reporter output**:
  - **WHEN** the final full E2E run finishes
  - **THEN** the reporter shows the gated specs as skipped with their reason strings on `mobile`, and the totals in `verification.md` list test cases, project executions, and skips as three separate numbers.
- **Failure diagnosability**:
  - **WHEN** an accessibility spec is forced to fail (for example by temporarily lowering an accent contrast)
  - **THEN** the failing title names its surface and theme, and no unrelated scenario is reported as failed alongside it.
- **Review of removed tests**:
  - **WHEN** a reviewer reads the mapping table in `verification.md`
  - **THEN** every removed or merged test case points to a surviving test and the specific literal or behavior it still asserts.
