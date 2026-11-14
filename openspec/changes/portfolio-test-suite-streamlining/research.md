## Source material

### User request (2026-11-14)

> "can you propose how we can streamline our tests to remove redundant or depreciated tests"

Then, after a first proposal and a measured Playwright run:

> "these are the suggestions from another agent. can you fast forward the artifacts for a change for refactoring the test suite"

### Reviewer notes pasted by the user (another agent, 2026-11-14)

Recorded as guidance the user chose to carry into this change. Each point below is taken as a constraint on scope.

- Keep it a **measured cleanup**, not deleting tests to lower the count. Wait for E2E wall time and slowest-test data before estimating savings.
- **Preserve explicit tests for specified physics constants** (1.6x snap, oscillator parameters). Behavioral tests use the exported constants as inputs, so a changed constant could leave them green.
- **Keep simulation-level edge integrity coverage.** The catalog's 13-edge assertion verifies topology generation; the simulation test verifies links survive drag and reset. Different contracts.
- **Consolidate without erasing checks.** Merging oscillator decay tests is fine if the envelope and settling checks survive. Merging audio topology constants into construction is fine if exact values stay asserted.
- **Treat profile data as product behavior.** Contact destinations are consequential. A protocol-only check would allow a wrong-but-valid HTTPS destination.
- **Keep browser-level rendering checks** that all catalog items appear in the list and in semantic graph navigation. Drop literal "8" pins only. Keep a desktop GitHub destination check; mobile-hidden is covered by the header-controls test.
- **Gate viewport-independent E2E to one project.** Keep mobile for the sheet, mobile header/menu, and at least one mobile accessibility scan. Report test cases, project executions, and skips separately.
- **Do not make `buildOutput` unconditional.** CI sets `REQUIRE_DIST=1`; local `npm run test:unit` intentionally works without `dist/`.
- **Do not over-merge E2E scenarios.** Reuse hover-setup helpers rather than combining unrelated interactions. Keep each theme/surface diagnosable.
- Replacing the 1500/1600 ms sleeps with a condition-based camera-settled signal is the strongest speedup, and belongs in a **separate** change because it needs an app-side hook.

### Raised but not acted on

| Item | Why it is deferred |
| :--- | :--- |
| Camera-settled signal replacing `waitForTimeout(1500/1600)` | Needs an app-side attribute on the canvas (feature work in `GraphCanvas.tsx`). Separate follow-up change. |
| Merging axe light/dark pairs or theme phases into single tests | Saves page loads, but axe is only ~11% of E2E time and merged failures are harder to diagnose. Decide from the post-gating timing, not before. |
| Making `buildOutput.test.ts` unconditional | Breaks local `npm run test:unit` without `dist/`. Rejected. |
| Deleting the `profile.test.ts` literal URL pins | Contact destinations are product behavior. Kept. |
| Deleting constant-pin tests (1.6x, 1.25x, oscillator params, audio topology) | They are the only guard when behavioral tests derive inputs from the constants. Kept (may be folded, never weakened). |
| Reshaping the `preview-headers.spec.ts` suite | Preview-only gate with its own CI job; out of scope. |
| Touch-drag unlock of `art-wip` on mobile | A coverage gap, not redundancy: the mobile project only asserts the locked state. Recorded as a known gap, deferred to its own change. |
| Replacing the 1500/1600 ms camera sleeps | Still needs the app-side camera-settled signal. Only sleeps that already have a signal (`data-art-node-pos`) move in this change. |

### Update 2026-11-14 (after PR #16): reviewer follow-up

> "can you update your e2e test suite suggestions with the new tests from PR#16"

Then: "can you propose a new plan based on the feedback from this other agent", followed by "can you begin by updating the artifacts." The reviewer's text did not add new points beyond the PR #16 findings, so the plan changes below come from reading the PR #16 diff, not from new reviewer comments.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Test case (spec) | One `test(...)` declaration, or one `it(...)` in Vitest | A project execution |
| Project execution | One test case run under one Playwright project (`desktop` or `mobile`) | A distinct test case |
| Viewport-independent spec | A spec whose assertions do not depend on layout, touch input, or viewport size (theme, metadata, deep links, Escape, About, visited set) | A spec that merely happens to pass on both projects |
| Gating | Adding `test.skip(isMobile(testInfo), ...)` (or equivalent) so a spec runs on one project only | Deleting the spec |
| Baseline | A clean full-suite run on `master` with every failure triaged as flake, environment, or real regression | The 14-failure run recorded below |
| Constant pin | An assertion on the literal value of a specified constant (e.g. `1.6`) | Using the constant to build another test's inputs |
| Change-detector test | A test that fails only when content is edited on purpose and guards no invariant | A test of a consequential destination (links, contact) |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Playwright docs, `test.skip` and project configuration | `test.skip(condition, reason)` marks the case skipped for that project; `testMatch`/`testIgnore` per project removes it from the list entirely | Apache-2.0 (docs reference only) | not re-fetched; behavior known from existing usage in `e2e/portfolio.spec.ts` |

No failed lookups.

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| `test.skip(isMobile)` inside each spec | **Adopted** | Already the repo idiom (26 skip sites); keeps specs in one file and shows a visible "skipped" reason | 2026-11-14 |
| Per-project `testIgnore` globs / splitting the spec file | Rejected | Needs a file split of a 1733-line spec; larger diff; hides which specs are gated | 2026-11-14 |
| Playwright `--shard` or `workers > 1` | Rejected for this change | Config comment documents the single worker as a fix for port-5199 handshake races; changing it is separate work | 2026-11-14 |
| Condition-based camera-settled attribute | Deferred to follow-up change | App-side hook | 2026-11-14 |

## Patterns adopted

- **One layer per behavior**: keep the unit test for a pure decision function and a single E2E for wiring. Applied to sticky focal, audio swell and catalog counts.
- **Shared setup helpers over merged scenarios** (`hoverCenteredNode`, `tapCenteredNode`, `focusNode` already exist in `e2e/portfolio.spec.ts`). No new pattern; extend existing helpers only.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Unit suite size and speed | 206 tests across 19 files, 0 failures; `graphSimulation` ~275 ms and `graphPlanarity` ~207 ms are the only slow files; test time totals well under 1 s | `npx vitest run --reporter=json` on `master` | 2026-11-14 | decays |
| E2E results on `master` (local, `workers: 1`) | 108 executed, 36 skipped, 14 unexpected failures; wall ~256 s | `npx playwright test --reporter=json` | 2026-11-14 | decays |
| E2E time split | desktop ~128 s, mobile ~107 s of executed test time | Summed `duration` per project from the JSON report | 2026-11-14 | decays |
| Spec distribution across projects | 72 spec titles: 41 run on both projects, 19 desktop-only, 7 mobile-only, 5 preview-only (skipped locally) | Grouped JSON report by title and project status | 2026-11-14 | decays |
| Axe cost | 18 executed axe runs ≈ 27 s (~11% of E2E time) | Summed `duration` of titles starting `accessibility` | 2026-11-14 | decays |
| Viewport-independent mobile executions | The 11 specs (default Light theme, theme-init, document metadata, theme persistence, deep link, unknown slug, Escape closes drawer, visited set, About button, `#/about`, GitHub links) cost ~10 s on mobile in total | Summed mobile `duration` of those titles | 2026-11-14 | decays |
| Hard waits | 47 `waitForTimeout` calls; `1500` ×8 and `1600` ×7 are the most common | `grep -c` / `grep -oE` on `e2e/portfolio.spec.ts` | 2026-11-14 | decays |
| `REQUIRE_DIST=1` is set by CI for unit tests | Set in `.github/workflows/ci.yml` at the unit-test step | `grep -rn REQUIRE_DIST` | 2026-11-14 | stable |
| `buildOutput.test.ts` skip behavior | `it.skipIf(!hasDist)` on two tests; the third fails only when `REQUIRE_DIST=1` and `dist/assets` is absent | Read `src/utils/buildOutput.test.ts` | 2026-11-14 | stable |
| Count pins in several layers | `toHaveLength(8)` in `projects.test.ts` (×3) and `graphPlanarity.test.ts`; `toHaveLength(13)` in `projects.test.ts:148`, `graphPlanarity.test.ts:62`, `graphSimulation.test.ts:322,332,545-546` | `grep` of the unit test files | 2026-11-14 | decays |
| Existing skip count in specs | 26 `test.skip` references in `e2e/portfolio.spec.ts`, 2 in `preview-headers.spec.ts` | `grep -c` | 2026-11-14 | decays |
| PR #16 merged to `master` | `a4cba9e`, "Add Art (WIP) rainbow node, /art/ endpoint, and 150ms hover dwell"; adds a 9th project `art-wip` | `gh pr view 16` (state `MERGED`, `mergedAt` 2026-11-14T09:00:30Z) | 2026-11-14 | stable |
| PR #16 test changes | 3 new E2E specs (`/art/` endpoint, art-wip unlock lifecycle, art-wip compact mobile locked), 3 changed E2E specs (list/nav pins `8`→`9`, hover dwell `250ms`→`200ms`), new `artDiscovery.test.ts` and `rainbowPulse.test.ts`, plus edits to `projects.test.ts`, `graphSimulation.test.ts`, `graphPlanarity.test.ts` | `gh pr diff 16` read in full for the test files | 2026-11-14 | stable |
| PR #16 conflicts with the streamlining branch | Conflicts in `e2e/portfolio.spec.ts`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `src/utils/graphPlanarity.test.ts` | `git merge-tree --write-tree --name-only HEAD origin/master` | 2026-11-14 | decays |
| Hover dwell on `master` | `HOVER_DWELL_MS = 200` (`src/components/GraphCanvas.tsx:107`); the PR #16 description says "150ms"; the E2E title says "200ms" | `git grep HOVER_DWELL_MS origin/master` | 2026-11-14 | stable |
| Art specs use fixed sleeps with a signal available | `waitForTimeout(800)` ×2 and `(350)` ×2 in the new specs, while the canvas exposes `data-art-node-pos`, `data-art-unlocked`, `data-rainbow-nodes`, `data-revealed-labels`, `data-art-proximity-links` | `gh pr diff 16` | 2026-11-14 | stable |
| `waitForTimeout` count on `master` after #16 | 50 (was 47) | `git show origin/master:e2e/portfolio.spec.ts \| grep -c waitForTimeout` | 2026-11-14 | decays |
| art-wip unlock spec size and shape | One desktop-only test of about 80 lines asserting locked state, unlock, drawer contents, reset, reload and double reset | Read the test in the PR #16 diff | 2026-11-14 | stable |
| PR #16 self-reported results | 20 unit files / 213 tests, E2E 111 passed / 37 skipped / 0 failed | PR description (not re-run here) | 2026-11-14 | decays |

## Unverified assumptions

- **The 5 assertion failures are flakes or fallout from dev-server drops, not regressions on `master`.** The 9 `ERR_CONNECTION_REFUSED` failures show the server dropped mid-run, and the 5 assertion failures (`LLM filter dims every edge` on both projects, `hover dwell…`, mobile `graph view exposes all 8 project nodes`, mobile `pointercancel…`) may be a consequence. Checking costs one rerun: `npx playwright test -g "<title>" --repeat-each=3` per spec on a clean port. This is task 1 of the change and gates everything else.
- **Gating 11 viewport-independent specs saves ~10 s and the larger win comes from elsewhere.** Based on one noisy run; re-measure after the baseline is clean.
- **Merging near-duplicate unit constant tests loses no coverage.** True only if each folded test keeps the literal assertion. Checked per test during implementation, not in advance.

## Superseded claims

| Earlier claim (2026-11-14, after pass 1) | Why it is out of date | Replacement |
| :--- | :--- | :--- |
| "Baseline: 72 spec titles, 108 executions, 36 skipped, 213 s" | Measured on the 8-project base `548a0b6`. PR #16 changed the catalog and added specs. | Pass-1 numbers are history; re-record the baseline after the rebase (task 6.2). |
| "11 viewport-independent specs to gate" | Counted before PR #16 added `/art/ endpoint serves raw WIP HTML…`, a plain navigation that is also viewport-independent. | 12 specs plus 6 axe scans. |
| "Keep E2E scenarios as they are; do not merge unrelated ones" (applied only to merging) | PR #16 added an ~80-line scenario that already merges ten phases of one feature. | Split it by phase (group 8). |
| "Only the 1500/1600 ms camera sleeps need an app-side signal" | The new art specs sleep 800 ms and 350 ms although `data-art-node-pos` and `data-art-unlocked` already exist. | Those sleeps can use the existing signals now (task 9.1); only the camera sleeps stay deferred. |
| "Literal count pins: `8` projects" | The catalog now has 9 projects; `master` re-pins `9` in three unit tests and two E2E specs. | The catalog-derived E2E ids absorb the new count; the unit pin is consolidated to one test at `9`. |

### Earlier superseded claims (kept)

| Earlier claim | Why it was wrong | Replacement |
| :--- | :--- | :--- |
| "All 66 specs run twice" (first proposal, 2026-11-14) | Overstated: many specs are gated per project, 36 executions skipped | 41 of 72 spec titles execute on both projects; 108 executions run in total |
| "Make `buildOutput.test.ts` unconditional" (first proposal) | CI sets `REQUIRE_DIST=1`, but local `test:unit` is deliberately tolerant of a missing `dist/` | Keep the conditional |
| "Drop the literal profile URL pins, keep only the protocol check" (first proposal) | A protocol-only check allows an incorrect but valid HTTPS destination | Keep at least one assertion that the rendered links point at the intended profiles |
| "Delete the 1.6x/1.25x constant tests; behavior tests cover them" (first proposal) | Behavioral tests import the constants to build inputs, so a changed constant can leave them green | Keep the literal assertions, folded into behavioral tests only where they remain asserted |
| "Merge theme/axe pairs to save time" (first proposal) | Axe is ~11% of E2E time; merging hurts failure diagnosis | Decide after gating, from measured timings |

## Links out

- `openspec/specs/` (no existing testing capability; this change introduces one)
- `playwright.config.ts`, `e2e/portfolio.spec.ts`, `e2e/preview-headers.spec.ts`
- `src/utils/buildOutput.test.ts`, `.github/workflows/ci.yml`
- Raw E2E report: `/tmp/claude-1001/-home-node-global-sandbox-projects-portfolio/c247285f-4ebf-4429-828e-e3063504602b/scratchpad/e2e.json` (session scratch, not committed)
