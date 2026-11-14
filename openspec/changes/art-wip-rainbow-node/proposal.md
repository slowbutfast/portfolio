## Why

The portfolio needs a dedicated node linking to a work-in-progress `/art/` page on the same site that stands out visually from every engineering project once discovered: hovering or clicking it activates a continuous rainbow RGB pulse that persists until the user resets the canvas. Additionally, once a visitor has clicked any node in the current session, the `"Click to inspect ↗"` hover-card hint has served its onboarding purpose and should stay hidden across canvas resets until a fresh page load.

## What Changes

- Add a static `/art/` HTML endpoint (`public/art/index.html`) whose raw `<title>` and body content read `WIP`.
- Add a 9th project (`art-wip`, `Art (WIP)`) to the catalog with `['Design', 'Graphics']` tags, `liveUrl: '/art/'`, `rainbowOnInteract: true`, and a `{ kind: 'wip', label: 'WIP' }` preview alongside a `/art/` linkout.
- Extend `PLANAR_NODE_SEEDS` with a crossing-free outer-face position for `art-wip` so all 9 nodes and 17 tag-derived edges remain planar. Map seeds and homing targets through the same affine safe-canvas transform so the 48px simulation boundary does not clamp nodes away from the planar embedding on narrow viewports.
- Add continuous rainbow RGB pulsing on `GraphCanvas` for nodes with `rainbowOnInteract` whenever hovered, selected, or in `visitedIds` (persisting across drawer closes and page reloads until `Reset layout` clears `visitedIds`), with a static reduced-motion fallback. Keep text labels at the theme's accessible foreground color; the animated color is decorative node/bridge fill.
- Render `WIP` placeholder media cards in `MediaView`, `NodeHoverCard`, and `ListView`, and guard `Code ↗` in `NodeHoverCard` when `repo` is omitted.
- Track session-only `hasInspectedAnyNode` in `App.tsx` so `"Click to inspect ↗"` disappears from `NodeHoverCard` after the first node click and remains hidden across `Reset layout` (returning only on a page reload).
- Lower `HOVER_DWELL_MS` in `GraphCanvas.tsx` from `250ms` to `150ms` for a more reactive hover response.

## Capabilities

### New Capabilities
- `wip-art-endpoint`: Static `/art/` HTML endpoint serving minimal `WIP` title and body content under the site's strict CSP.

### Modified Capabilities
- `project-catalog`: Expand catalog from 8 to 9 projects (`art-wip`), add optional `rainbowOnInteract` flag, and add `wip` preview kind.
- `graph-simulation`: Add planar seed for `art-wip` (9 nodes, 17 edges) and continuous rainbow RGB rendering on hover/visited state until canvas reset.
- `project-drawer`: Support `wip` media preview rendering in `MediaView` and `ProjectDrawer`, `WIP` card preview in `ListView` and `NodeHoverCard`, conditional `Code ↗` link in `NodeHoverCard`, and session-persistent dismissal of `"Click to inspect ↗"` across canvas resets.

## Impact

- **Files**: `public/art/index.html`, `src/types/portfolio.ts`, `src/data/projects.ts`, `src/data/graphSeeds.ts`, `src/physics/graphSimulation.ts`, `src/utils/rainbowPulse.ts`, `src/components/GraphCanvas.tsx`, `src/components/MediaView.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/NodeHoverCard.tsx`, `src/components/ListView.tsx`, `src/App.tsx`.
- **Tests**: Unit tests (`src/utils/rainbowPulse.test.ts`, `src/data/projects.test.ts`, `src/utils/graphPlanarity.test.ts`, and simulation seed/boundary tests) and E2E tests (`e2e/portfolio.spec.ts`).
