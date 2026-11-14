## ADDED Requirements

### Requirement: Clean baseline before refactor
The test suite SHALL be run to a classified baseline on `master` before any test is moved, merged, gated, or deleted, and every failure in that baseline SHALL be recorded as a flake, an environment fault, or a real regression with the evidence that settled it.

#### Scenario: Baseline contains unexplained failures
- **WHEN** a full `npm run test:unit` and `npm run test:e2e` run on `master` reports any failing test
- **THEN** each failure is re-run in isolation with `--repeat-each=3` on a free port and classified in `verification.md`, and no refactoring task is started until every failure is either fixed, quarantined with a recorded reason, or shown to be an environment fault.

#### Scenario: Dev server drops mid-run
- **WHEN** a failure message is `net::ERR_CONNECTION_REFUSED` against the local dev server
- **THEN** it is classified as an environment fault and the affected specs are re-run, rather than treated as a test or application defect.

### Requirement: Invariant-preserving consolidation
Unit and E2E consolidation SHALL NOT remove the last assertion that guards any specified invariant. A test MAY be merged, folded into another, or deleted only if each literal value and behavior it asserted remains asserted by a surviving test.

#### Scenario: Specified physics and audio constants stay pinned
- **WHEN** tests are merged or folded
- **THEN** the literal values `1.6` (snap), `1.25` (reconnect), `0.58` (rest waist ratio), the underdamped oscillator parameters, and the audio constants (topology, `HOVER_SWELL_GAIN`, ramp time constant) are each still asserted by at least one surviving test.

#### Scenario: Simulation edge integrity survives
- **WHEN** duplicate count assertions are removed from geometry- or planarity-focused tests
- **THEN** one catalog-level test still asserts the derived edge set, and one simulation-level test still asserts that all permanent links are preserved after a detaching drag followed by `resetLayout()`.

#### Scenario: Oscillator decay merge
- **WHEN** the two oscillator decay tests are merged
- **THEN** the merged test asserts both the theoretical underdamped envelope bound over the full response and that the response is essentially still after one second.

#### Scenario: Contact destinations stay asserted
- **WHEN** `profile.test.ts` is consolidated
- **THEN** at least one test asserts the exact intended LinkedIn, GitHub, resume-embed, and `mailto:` destinations, and a protocol-only check does not replace them.

### Requirement: Browser-level completeness without literal count pins
Browser tests SHALL verify that every catalog project appears in the list view and in the semantic graph navigation by deriving the expected set from the shared project catalog, and SHALL NOT hard-code the number of projects.

#### Scenario: List and semantic nav render the full catalog
- **WHEN** the list view and the graph view's semantic navigation are rendered
- **THEN** each project id from the catalog has exactly one card and one navigation entry, and the test passes unchanged if a project is added to or removed from the catalog.

#### Scenario: Desktop GitHub destination
- **WHEN** the desktop header is rendered
- **THEN** a test asserts `nav-github` links to the intended GitHub profile, and the mobile project asserts only that `nav-github` is hidden.

### Requirement: Viewport-independent E2E specs run on one project
E2E specs whose assertions do not depend on layout, touch input, or viewport size SHALL run on the `desktop` project only and SHALL be skipped on `mobile` with a stated reason using `test.skip(...)`. Layout-, touch-, and sheet-dependent specs SHALL continue to run on `mobile`.

#### Scenario: Viewport-independent spec on mobile
- **WHEN** Playwright runs the default Light theme, theme-init, document metadata, theme persistence, deep link, unknown slug, Escape-closes-drawer, visited-set, About, `#/about`, and GitHub-link specs on the `mobile` project
- **THEN** each is reported as skipped with a reason, and each still executes on `desktop`.

#### Scenario: Mobile layout coverage is retained
- **WHEN** Playwright runs the `mobile` project
- **THEN** the bottom-sheet detent and camera-pan spec, the mobile header spec, the in-menu Sound and Reset spec, the `pointercancel` spec, the DPR/fps spec, the viewport matrix spec, and at least one accessibility scan of the open project drawer all still execute.

#### Scenario: No spec is left unexecuted on every project
- **WHEN** the full local suite finishes
- **THEN** every locally runnable spec executed on at least one project, and the only specs executed on none are the preview-only `served edge headers` specs.

### Requirement: Diagnosable, independently reported E2E scenarios
E2E refactoring SHALL reuse shared setup helpers instead of merging unrelated interactions into one test, and theme and accessibility checks SHALL remain separately reported per theme and per surface.

#### Scenario: Hover specs share setup
- **WHEN** the hover-card, hover-dwell, pointer-transfer, and terminal-fallback specs need a hovered node
- **THEN** they call the shared `hoverCenteredNode` (or `focusNode`) helper rather than re-implementing the setup, and each remains its own test.

#### Scenario: Theme and axe failures name their surface
- **WHEN** an accessibility scan fails
- **THEN** the failing test title identifies the surface (graph, list, drawer, About modal, hover card) and the theme (dark or light).

### Requirement: Build-output guard stays conditional
`src/utils/buildOutput.test.ts` SHALL continue to skip its `dist/` inspections when `dist/assets` is absent unless `REQUIRE_DIST=1`, in which case it SHALL fail when `dist/assets` is absent.

#### Scenario: Local unit run without a build
- **WHEN** `npm run test:unit` runs without `dist/` and without `REQUIRE_DIST`
- **THEN** the build-output inspections are skipped and the run does not fail.

#### Scenario: CI unit run without a build
- **WHEN** `npm run test:unit` runs with `REQUIRE_DIST=1` and no `dist/assets`
- **THEN** the build-output guard fails with a message to run `npm run build`.

### Requirement: Honest suite accounting
Verification SHALL report test cases, project executions, and skips as three separate numbers, before and after the change, and SHALL NOT present a reduced test-case count as an improvement on its own.

#### Scenario: Before and after report
- **WHEN** `verification.md` records suite results
- **THEN** it lists, for unit and for E2E, the number of test cases, the number of project executions, the number skipped, and the wall time, each for the clean baseline and for the final run.

#### Scenario: Coverage-neutral claim
- **WHEN** a test case is removed or merged
- **THEN** `verification.md` maps it to the surviving test that still asserts each of its invariants.
