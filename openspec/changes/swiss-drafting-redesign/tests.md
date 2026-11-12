## Automated Tests

- `npx @google/design.md lint DESIGN.md`: Verifies that the design system specification adheres strictly to the `@google/design.md` schema with zero broken token references or invalid color formats.
- `npm run test:unit`:
  - Token Contrast Assertion: Computes relative luminance and verifies that `#71717a` meets or exceeds 3.0:1 contrast against both `#0a0a0c` (canvas background) and `#111215` (card surface) per WCAG 1.4.11.
  - Drafting Utilities (`src/utils/drafting.test.ts`): Verifies `formatIndex(0)` returns `"01"`, `formatPlate(0)` returns `"PL-01"`, and stable catalog order is preserved.
  - Project Data Catalog (`src/data/projects.test.ts`): Verifies that all 6 projects declare a non-empty `classification` string.
  - Existing Unit Tests: Ensures all 19 original tests pass without regressions.
- `npm run typecheck`: Asserts full TypeScript compilation across `src/types/portfolio.ts`, `src/vite-env.d.ts` (`declare const __COMMIT_HASH__: string`), and component props.
- `npm run test:e2e`:
  - Accessibility Baseline & Regression (`@axe-core/playwright`): Pins rules with `.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])` across Graph View, List View, and open Project Drawer, verifying zero new violations compared to the pre-redesign baseline.
  - Button Accessible Names: Asserts that `getByRole('button', { name: 'Graph' })` and `getByRole('button', { name: 'List' })` resolve cleanly without bracket characters in the accessible name.
  - Dialog Heading Integrity: Asserts that opening the project drawer reveals an authentic `<h2>` matching project title with no duplicate `<h1>` elements.
  - React Commit Count & Frame-Time Audit: Mounts with React `<Profiler onRender>` and asserts zero component reconciliation commits during 200 simulated canvas pointer moves; profiles rAF delta times under 4x CPU throttling to ensure $\ge 50\text{fps}$ performance.
  - Reduced Motion Compliance: Executes with `reducedMotion: 'reduce'`, asserting canvas enters static ring mode, initial stroke write-in is skipped, and title scrambler renders immediately without timers.
  - Regression Coverage: Preserves all existing `data-testid` assertions (`graph-canvas`, `view-toggle-list`, `tag-pill-*`, `command-chip`, `drawer-close`), focus trapping, Escape key dismissal, and hash routing.
- `npm run build`: Asserts clean production build in `dist/`, verifying that no `data:font` strings appear in the bundle and all fonts are emitted as hashed `.woff2` files.

## Manual Verification

- **Subpixel Hairline & Crosshair Crispness**:
  - **WHEN** viewing the graph canvas on standard and high-DPI (Retina) displays
  - **THEN** 1px vector lines, center crosshairs (`+`), and outer cardinal tick marks render with razor-sharp geometric clarity without antialiasing blur.

- **Focal-Only Incident Projection Vectors**:
  - **WHEN** the user hovers over or tabs to a node
  - **THEN** dashed projection lines extend exclusively to its direct topological neighbors with dynamic distance badges (`d: [pixels]px`), while non-connected edges remain simple hairlines.

- **Zero-Re-Render Coordinate Ticker**:
  - **WHEN** the pointer moves continuously across the viewport
  - **THEN** the margin HUD ticker (`X: ... Y: ...`) updates smoothly in real time while list view or unmount cleanly resets to `X: --- Y: ---`.

- **Accessible Stepped Character Decoding**:
  - **WHEN** the user opens a project drawer from either graph or list view
  - **THEN** the visual title scrambles rapidly through mathematical and Unicode glyphs at 12fps for $\le 350\text{ms}$ inside its fixed grid cell before snapping into the exact title, without horizontal layout bouncing.

- **Reduced Motion OS Toggle**:
  - **WHEN** the operating system or browser activates `prefers-reduced-motion`
  - **THEN** the canvas immediately renders the accessible static circular ring, canvas write-in is bypassed, and the project drawer title displays immediately with zero flickering.
