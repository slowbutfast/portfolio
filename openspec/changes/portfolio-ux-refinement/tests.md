## Automated Tests

- `npm run typecheck`: Verifies compile-time type safety across all models (`CandidateProfile`, mandatory `shortTitle: string`, `SimulationNode` input types, `BridgeGeometry`).
- `npm run test:unit`:
  - `src/utils/bridgeGeometry.test.ts`:
    - Asserts bilateral symmetry across arbitrary rotated node positions: $n(CP1_{bottom}) = -n(CP2_{top})$ and $n(CP2_{bottom}) = -n(CP1_{top})$ within $10^{-6}$.
    - Asserts control handles align with perimeter circle tangents.
    - Asserts `computeBridgeGeometry` returns `null` when distance $d \le R_A + R_B$.
  - `src/utils/graphPlanarity.test.ts`:
    - Asserts `countCrossings(PLANAR_NODE_SEEDS, edges) === 0` across all 9 undirected graph edges.
  - `src/data/profile.test.ts`:
    - Asserts canonical Brown University bio statement matches verbatim.
    - Asserts all contact URL protocols (`mailto:`, `https:`).
  - `src/data/projects.test.ts`:
    - Asserts mandatory non-empty `shortTitle: string` for all 6 projects.
  - `src/utils/edgeConfig.test.ts`:
    - Asserts `vercel.json` CSP includes `frame-src 'self' https://drive.google.com;` and matches `SPEC_CSP`.
- `npx @google/design.md lint DESIGN.md`: Verifies design token compliance with 0 errors and 0 warnings.
- `npm run test:e2e`: Runs Playwright E2E suite across Desktop Chrome and Mobile Chrome viewports verifying:
  - Fresh localStorage visit defaults to Light color scheme with zero initial theme flash.
  - Header controls render in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, `Filters ▾`.
  - Clicking `Dark`/`Light` toggles color scheme and persists to `localStorage`.
  - `AboutModal` dialog displays the Brown University bio and top-mounted contact links without subtitle or focus area tag pills.
  - `ProjectDrawer` renders elevated `Code ↗` and `Visit ↗` buttons in the sticky header and houses preview modes in a segmented container track.
  - `NodeHoverCard` is interactive, maintaining visibility when transferring cursor within 150ms, and closing upon canvas drag.
  - `ListView` renders visual 16:9 thumbnails and provides an authentic terminal specimen fallback for `agentic-resume-builder`.
  - Mobile viewport (`393x852`) renders `ProjectDrawer` as a docked bottom sheet (`max-h-[85dvh]`).
  - Axe WCAG 2.0 A/AA audit produces 0 accessibility violations in dark and light themes.
- `npm run build`: Verifies clean production bundling with 0 errors.

## Manual Verification

- **Theme Default & Header Toggle**:
  - **WHEN** opening the site in a fresh incognito window
  - **THEN** the site loads in Light theme without flashing dark, and clicking "Dark" in the top-right header toggles theme seamlessly.

- **Bilateral Symmetrical Bridges**:
  - **WHEN** viewing graph connection bridges at 1440×900
  - **THEN** bridges display exact reflection symmetry without lopsided bowing or skewed fillets.

- **Close-Node Drag Interaction**:
  - **WHEN** dragging two connected nodes until they overlap
  - **THEN** the bridge unmounts cleanly without inverting into crossed control points.

- **Initial Load Graph Settling**:
  - **WHEN** the home page loads
  - **THEN** nodes initialize in their non-crossing planar positions and breathe naturally without link crossing.

- **About Dialog Content**:
  - **WHEN** clicking "About"
  - **THEN** the dialog displays the Brown University statement, top contact buttons (Email, LinkedIn, GitHub, Resume), with no role subtitle and no focus areas.
