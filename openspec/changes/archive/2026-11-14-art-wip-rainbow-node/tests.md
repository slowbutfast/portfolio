## Automated Tests

- `npm run typecheck && npm run build`: Verifies TypeScript types (`Preview` union, `rainbowOnInteract`, `showInspectHint`) and confirms `dist/art/index.html` is emitted cleanly into the production build.
- `npm test`:
  - `src/utils/rainbowPulse.test.ts`: Verifies `computeRainbowRgb` returns valid `rgb(...)` strings for `'vibrant'` and contrast-adjusted `'muted'` variants, advances hue smoothly over time in lockstep, maintains 4.5:1 contrast for all sampled hues on each pill background, adapts to dark/light themes, and stays deterministic when `reducedMotion` is `true`; verifies `isRainbowNodeActive` truth table.
  - `src/data/projects.test.ts`: Verifies all 9 projects (`art-wip` included), `shortTitle` constraints, `wip` preview support, and 17 derived edges.
  - `src/utils/graphPlanarity.test.ts`: Verifies `PLANAR_NODE_SEEDS` includes `art-wip`, preserves 0 segment crossings across all 4 viewports (`1440x900`, `393x852`, `1920x1080`, `320x900`), and passes simulation equilibrium checks.
- Seed scaling and `graphSimulation` tests: Verify initial positions, homing targets, resize positions, and rest distances use the same boundary-aware affine mapping; assert the mapped layout remains crossing-free after the 48px boundary is applied, including at 320×900.
- Rainbow contrast test/manual audit: Sample the full hue cycle in both themes; ensure node labels retain theme foreground, tag-pill rainbow text maintains 4.5:1 contrast, and the stable node outline maintains at least 3:1 contrast as a non-text indicator.
- `npx playwright test`:
  - Verifies a pointer sweep shorter than 150ms does not activate hover and a stationary hover activates both card and physics at 150ms; verifies pointerdown/leave cancel the timer.
  - Verifies `/art/` returns `<title>WIP</title>` and body text `WIP`.
  - Verifies hovering or clicking `art-wip` activates `data-rainbow-nodes="art-wip"`, persists across drawer close and page reload, and clears upon clicking `Reset layout`.
  - Verifies `Click to inspect ↗` is visible on initial hover, disappears after clicking any node, stays hidden after `Reset layout`, and returns after page reload.
  - Verifies `Art (WIP)` displays `WIP` in `NodeHoverCard`, `ProjectDrawer` Media tab, and `ListView` Grid view.
  - Verifies `canvas.dataset.rainbowTagPills` includes only focal tags connected to the active rainbow node, unrelated pills remain unchanged, and reduced motion freezes the muted color while preserving contrast.

## Manual Verification

- **Rainbow Node Lifecycle**:
  - **WHEN** hovering `Art (WIP)` on the graph canvas, then clicking it, closing the drawer, reloading the page, and finally clicking `Reset layout`
  - **THEN** `Art (WIP)` pulses smooth rainbow RGB on hover and stays pulsing after click/close/reload until `Reset layout` returns it to its unvisited color.
- **Inspect Hint Lifecycle**:
  - **WHEN** hovering a node on a fresh page load, clicking any node, closing the drawer, clicking `Reset layout`, hovering again, and finally reloading the page
  - **THEN** `Click to inspect ↗` is visible initially, hidden after the click and across `Reset layout`, and visible again only after reload.
- **WIP Endpoint & Content**:
  - **WHEN** clicking `Visit ↗` on `Art (WIP)`
  - **THEN** `/art/` opens with browser tab title `WIP` and page text `WIP`.
