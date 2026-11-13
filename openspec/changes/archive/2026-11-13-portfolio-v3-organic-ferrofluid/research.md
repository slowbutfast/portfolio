## Source material

- **User design critique & suggestions (2026-11-12)**:
  - Rest silhouette: "At rest, the graph reads like a standard node-and-edge wireframe—rigid, straight black lines piercing directly into sharp-edged circles." Suggested: "Blend Every Connection at the Perimeter: Every permanent edge should flare smoothly into the curvature of the nodes it connects, eliminating any sharp corners where lines meet circles. Even when the graph is completely still, the connections should look like liquid menisci pooling against the nodes."
  - Stretching & snap: "As you pull two connected nodes apart, the middle of the bridge should pinch inward into a taut waist while the ends stay anchored wide on the circles. If stretched past a breaking point, the bridge should visibly snap in the middle and retract back into the two nodes with a quick, jelly-like recoil rather than abruptly disappearing."
  - Proximity & color transitions: "The soft webbing that currently appears only when two nodes collide should share the exact same visual language and organic curve radius as the permanent edges." / "Where blue nodes (OpenDungeon and Climate Risk) connect to black bridges, let the color transition smoothly along the neck of the flare rather than cutting off abruptly at the circle's boundary."
  - Hover & pop-up interruptions: Suppress hover cards during click/drag, add hover dwell delay, anchor cards outside the cluster, and replace snappy hover gravity with a slow delayed ambient drift + soft exclusion zone.
- **User plan feedback & UI decisions (2026-11-12)**:
  - "can we actually just add a 'reset layout' button under the filter dropdown? and maybe we instead change the filter button to instead be 3 dots, and then move the filter title into the three dot dropdown menu."
  - Confirmed deferring elliptical node squash/stretch to an optional later stage ("this is fine").

### Raised but not acted on

- **Node squash/stretch (elliptical surface deformation)**: Deferred to an optional Stage 4 because `computeBridgeGeometry` assumes circular endpoints; deforming nodes without ellipse-aware perimeter tangents would invalidate bridge attachment or cause bridges to slice through nodes.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| **Rest-waist ratio** | `REST_WAIST_RATIO = 0.58`: target ratio of midpoint `waistWidth` to perimeter anchor spread (`2 * averageHalf`) when `distance <= restDistance` | Does not mean `waistWidth === baseWidth` (which currently forces `handleForWaist === 0` and draws straight lines) |
| **Persistent user pinning** | Setting `node.fx = releaseX; node.fy = releaseY` (or storing per-node pinned anchor) after a user drag so the node stays where placed until "Reset layout" or resize | Does not mean nodes automatically spring back to `PLANAR_NODE_SEEDS` on release |
| **Proximity-only bridge** | A purely visual, zero-force bridge rendered between two non-permanent-edge nodes when `R_A + R_B < d < PROXIMITY_MAX_DIST` | Does not apply to detached permanent edges, and does not exert `d3-force` attraction/repulsion |
| **Unified hover dwell** | A single `200ms` timer gating both `sim.hover(node)` physics and `emitHover(node)` card opening, cancelled synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, `reduceMotion`, or `coasting` | Does not mean delaying only the DOM card while `sim.hover` fires immediately |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Internal architectural review (2026-11-12) | Identified 8 coupling & contract risks: pinning vs. seed-homing, measurable rest-waist ratio, ellipse vs. circle anchors, proximity vs. detached-edge exclusion, explicit force decoupling, reachable snap thresholds, unified hover dwell, and measured card bounds | Internal | 2026-11-12 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| `CanvasRenderingContext2D.createLinearGradient` | Adopted | Native 2D canvas API for smooth color interpolation along bridge axis between visited/active cobalt nodes and black bridges | 2026-11-12 |
| `ResizeObserver` on `NodeHoverCard` | Adopted | Measures actual card bounds instead of hardcoded `320x330` constants for peripheral clamping | 2026-11-12 |
| `lucide-react` `MoreHorizontal` / `Ellipsis` | Adopted | Existing icon library in `ControlsOverlay.tsx` for the 3-dots trigger button | 2026-11-12 |

## Patterns adopted

- **Axis-aligned bridge color gradient**: `ctx.createLinearGradient(a.x, a.y, b.x, b.y)` in `src/components/GraphCanvas.tsx` transitioning smoothly from node A's fill color through `tokens.connection` to node B's fill color.
- **Deterministic sorted-pair non-edge proximity pass**: Iterating `(i < j)` over `sim.nodes` skipping permanent edges so detached permanent edges never spawn duplicate proximity bridges.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Straight-line rest geometry cause | When `distance <= rest`, `bridgeWaistWidth` returns `baseWidth`, making `averageHalf === desiredWaistHalf` and `handleForWaist === 0` | Read `src/utils/bridgeGeometry.ts` L103-L113, L187-L197 | 2026-11-12 | stable |
| Current snap & reconnect multipliers | `SNAP_MULTIPLIER = 2`, `RECONNECT_MULTIPLIER = 1.4` | Read `src/physics/graphSimulation.ts` L90-L92 | 2026-11-12 | stable |
| Current hover attraction & pointer path | `onPointerMove` calls `emitHover(node)` and `sim.hover(node)` immediately with `pull = alpha * 0.08 * (dist - 120)` | Read `src/components/GraphCanvas.tsx` L565-L570 and `src/physics/graphSimulation.ts` L370 | 2026-11-12 | stable |
| Current `NodeHoverCard` sizing | Hardcoded `cardWidth = 320`, `cardHeight = 330`, `left = position.x + 28`, `top = position.y - 40` | Read `src/components/NodeHoverCard.tsx` L19-L29 | 2026-11-12 | stable |
| Current `ControlsOverlay` filter trigger | Renders `"Filters"` button (`data-testid="controls-dropdown-trigger"`) with `ChevronDown` and a `"Reset"` button (`data-testid="reset-filters"`) | Read `src/components/ControlsOverlay.tsx` L141-L214 | 2026-11-12 | stable |
| Spec internal inconsistencies | `openspec/specs/graph-simulation/spec.md` lists `18px` radius and `forceX/Y(w/2)` in L10 and `guide rings` in L82-L88, contradicting `22px` + `PLANAR_NODE_SEEDS` + no guide rings in L69/L97 | Read `openspec/specs/graph-simulation/spec.md` L10, L69, L82-L97 | 2026-11-12 | stable |

## Unverified assumptions

- Exact `PROXIMITY_MAX_DIST` (`96px` proposed) and `SNAP_MULTIPLIER = 1.6` reachability on `393x852` mobile viewports will be verified via unit tests with `createSimulation({ width: 393, height: 852, ... })`.

## Superseded claims

- **Auto-homing after every drag**: Superseded by user decision on 2026-11-12 to persist user-placed node positions after drag and provide a `"Reset layout"` button inside the 3-dot dropdown menu.

## Links out

- [Implementation Plan](file:///home/node/.gemini/antigravity-cli/brain/96a4b78a-fd8e-4e9e-9951-86b3fbf2835e/portfolio_v3_organic_ferrofluid_plan.md)
- [Existing graph-simulation spec](file:///home/node/global-sandbox/projects/portfolio/openspec/specs/graph-simulation/spec.md)
