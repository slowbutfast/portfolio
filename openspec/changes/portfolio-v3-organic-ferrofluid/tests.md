## Automated Tests

- `npm run test:unit`:
  - **Bridge geometry (`bridgeGeometry.test.ts`)**: Verifies $C^1$ circle-tangent collinearity, bilateral symmetry, concave rest-waist ratio (`waistWidth < 2 * averageHalf` and `handleForWaist > 0` at `distance <= restDistance` across short/long gaps and degree-5/6 hubs), short-gap `baseHandle` clamping without $C^1$ violation, and smooth thinning down to `2px` at `1.6x` snap.
  - **Simulation physics (`graphSimulation.test.ts`)**: Verifies `1.6x` snap detachment, `1.25x` reconnect hysteresis, `350ms` post-release cooldown preventing premature reconnection, `220ms` recoil decay, deterministic decoupled drag (`20` fixed `sim.tick()` steps over a `160px` `dragMove` displacement yielding `< 15px` non-dragged neighbor displacement via explicit `forceLink.strength` refresh on `dragStart`/`dragEnd`), persistent user-pinned `fx/fy` coordinates after `dragEnd` + proportional clamped scaling on `resize()`, `resetLayout()` clearing pins/detached flags and homing back to `PLANAR_NODE_SEEDS`, zero force from proximity pairs, and `1.6x` reachability on `393x852` mobile viewports.
  - **Planarity (`graphPlanarity.test.ts`)**: Verifies 0 edge crossings at initial scaled seeds and after `resetLayout()` settles.
- `npm run typecheck`: Verifies zero TypeScript errors across modified simulation, canvas, and UI components.
- `npm run build`: Verifies clean production bundle with no build regressions.
- `npm run test:e2e`:
  - Verifies 3-dot dropdown trigger (`data-testid="controls-dropdown-trigger"`), `"Filters"` heading inside dropdown, `"Reset"` (`data-testid="reset-layout"`) clearing filters, visited colors, and node positions after drag, hover dwell suppression during cursor sweeps / drag / coasting, peripheral `NodeHoverCard` positioning without viewport overflow on desktop (`1440x900`) and mobile (`393x852`), and zero Axe accessibility violations.

## Manual Verification

- **Rest Silhouette & Gradient Blending**:
  - **WHEN** the graph loads at rest on desktop (`1440x900`) and after visiting a node (e.g., `open-dungeon`)
  - **THEN** every permanent edge displays a concave hourglass fillet pooling smoothly into node circles with smooth cobalt-to-black gradient transitions along the neck.
- **Decoupled Drag, Snap Recoil & Proximity Webbing**:
  - **WHEN** dragging a node past `1.6x` rest distance and releasing, or bringing two non-linked nodes within `96px`
  - **THEN** neighboring nodes stay settled in place, the stretched bridge snaps with a quick retracting droplet recoil, the dragged node remains pinned where placed, and non-linked nodes form subtle matching hourglass webbing without exerting force.
- **Hover Dwell & 3-Dot Reset Layout**:
  - **WHEN** sweeping the pointer quickly across nodes, dwelling for `250ms` on a node, and then opening the 3-dot menu to click `"Reset"`
  - **THEN** fast sweeps do not flash hover cards, `250ms` dwell opens the card peripherally outside the cluster while neighbors gently part, and `"Reset"` clears filters, visited colors, and glides all nodes back to the planar layout.
