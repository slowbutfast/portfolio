## MODIFIED Requirements

### Requirement: Decentralized equal mass node distribution
The system SHALL simulate all 9 nodes with equal visual radius (22px) and equal repulsive charge ($k_{charge} = -\min(w, h) \times 0.30$) with weak planar seed homing (`seedX`/`seedY` at `0.02`), soft link springs (`0.015`), collision radius (`48px`), and distance floor (`distanceMin = 50`), without any gravitational center sink or special per-node `gravityWeight` override on `art-wip`.

#### Scenario: Graph initialization without central clump or corner pinning
- **WHEN** the canvas is initialized with the 9 project nodes
- **THEN** nodes distribute buoyantly across the entire viewport area maintaining at least 44 pixels center-to-center clearance without settling against viewport margins or collapsing onto OpenDungeon or `art-wip`.

### Requirement: Dynamic hover gravitation wave
The system SHALL gate both simulation hover physics (`sim.hover(node)`) and preview card opening behind a single `200ms` pointer dwell timer, cancelling the dwell timer and clearing hover synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, a bidirectional `prefers-reduced-motion` transition, or while `state === 'coasting'`. Once dwell completes, the hovered node is transiently pinned (`fx = x; fy = y`) without becoming a persistent user placement.

The system SHALL render a purely visual deterministic ambient drift for every node with amplitude `3.5px`, updated at roughly `30fps`, paused while `document.hidden`, while the canvas is off-screen (`IntersectionObserver`), and under reduced motion. Rendering, pointer hit testing, and hover-card anchoring SHALL consume the same drift offset so the painted circle and its interactive target remain aligned. Ambient drift SHALL NOT exert any `d3-force` attraction or repulsion.

#### Scenario: Pointer sweeps across a node without dwelling
- **WHEN** the pointer crosses a node for less than `200ms` or while `state === 'coasting'`
- **THEN** neither `sim.hover` nor `NodeHoverCard` activates.

#### Scenario: Pointer dwells on a stationary node for 200ms
- **WHEN** the pointer remains on node H for `200ms` in `idle` state
- **THEN** `sim.hover(H)` pins node H, the visual ambient drift continues within its `3.5px` bound, and `NodeHoverCard` opens peripherally away from the measured canvas center.

#### Scenario: Pointer leaves or clicks a hovered node
- **WHEN** the pointer leaves node H, presses `pointerdown`, or starts a drag
- **THEN** the dwell timer is cancelled synchronously, node H is unpinned while any soft home anchor remains, `alphaTarget` cools to `0`, and `NodeHoverCard` closes.

### Requirement: Collision-aware popup placement
The system SHALL place `NodeHoverCard` and the desktop `ProjectDrawer` by scoring eight candidate rectangles around the anchor using measured card/panel bounds (`ResizeObserver` for the card), circle-rect node overlap (`5000` target node, `1000` neighbors), Liang-Barsky segment-AABB intersections (`3x` weight for focal edges), a `72px` top-header clearance, viewport margins, and an outward-ray tie-breaker. The card SHALL use the measured canvas-container center, not the window center.

#### Scenario: Hover or inspect popup opens near a dense focal hub
- **WHEN** a popup opens for a node after the `200ms` dwell or a project click
- **THEN** the solver chooses the clamped candidate that covers the fewest nodes and connections, especially focal edges, without overflowing the viewport or header.

### Requirement: Sticky inspected focal context and draggable inspector
The system SHALL retain the inspected project's focal connections and contiguous shared-tag labels after `ProjectDrawer` closes. The sticky focus SHALL clear when the `200ms` hover dwell activates on any node (including the inspected node), when a tap/click both begins and ends on empty canvas (`downNodeId === null`, `moved < 6`, and `!hitNode(pointerUp)`), when a clean tap/click lands on the node that currently owns the sticky focus while `ProjectDrawer` is closed (`moved < 6`), on `Reset`, or when switching to Grid view. Tapping a different node while another node owns the sticky focus SHALL open the inspector for that new node immediately. While the mobile sheet is open, `drawer-backdrop` intercepts taps above the sheet to close it, so empty-canvas focal clearing applies after the sheet is dismissed. The desktop `ProjectDrawer` SHALL treat its outer `8px` border band on all four edges as a draggable surface, showing the CSS `move` cursor while the pointer is over that band and supporting pointer-captured dragging clamped to the viewport, with a user-drag lock preventing anchor updates from snapping it back. The mobile `< 768px` bottom-sheet drawer SHALL remain non-draggable on its border and SHALL NOT show the `move` cursor.

#### Scenario: User closes the inspector
- **WHEN** the user closes `ProjectDrawer`
- **THEN** the inspected node's focal edges and tag labels remain highlighted until a hover dwell, empty-canvas tap, a tap on the sticky-focal node itself, Reset, or Grid view clears the sticky focus.

#### Scenario: User taps the sticky-focal node while the inspector is closed
- **WHEN** sticky focus is active, `ProjectDrawer` is closed, and the user cleanly taps/clicks the same node (`moved < 6`)
- **THEN** the drawer stays closed and `stickyFocalId` clears so focal highlights and edge-tag labels disappear; tapping that node again opens the drawer, while tapping a different node opens that project immediately.

#### Scenario: Touch user taps empty canvas to clear sticky focus
- **WHEN** sticky focus is active after the sheet is closed and the user taps empty canvas background (`downNodeId === null`, `moved < 6`, no node hit on `pointerup`)
- **THEN** `stickyFocalId` clears and all nodes/edges return to their resting visual state.

#### Scenario: User drags the desktop inspector
- **WHEN** the user drags any edge of a desktop `ProjectDrawer`
- **THEN** the panel follows the pointer, shows the `move` cursor over its border, stays inside viewport bounds and below the header, and does not snap back to its computed anchor position.

### Requirement: Authoritative planar graph seed embedding and homing force
The system SHALL initialize graph simulation nodes from the authoritative normalized planar coordinate map (`PLANAR_NODE_SEEDS`), mapped affinely into the safe canvas rectangle `[BOUNDARY_MARGIN, width - BOUNDARY_MARGIN] × [BOUNDARY_MARGIN, height - BOUNDARY_MARGIN]`, across the 17 undirected graph links derived from shared tags in `projects.ts` (including the 4 outer-face links from `art-wip` to `agentic-resume-builder`, `attention-max`, `kintsugi-fracture`, and `ivy-film-festival-2026`). The same mapped coordinates SHALL be used for initial positions, seed homing, resize, and rest-distance calculation so boundary enforcement does not move nodes away from the planar embedding:

| Project ID | Normalized $(x, y)$ | Role in Planar Embedding |
| :--- | :--- | :--- |
| `agentic-resume-builder` | `(0.18, 0.50)` | Left flank node connected to OpenDungeon, AttentionMax, Ivy, and Art (WIP) |
| `open-dungeon` | `(0.40, 0.48)` | Degree-5 hub forming the left vertex of the $K_4$ triangle |
| `pict-climate-risk-viz-chatbot` | `(0.56, 0.22)` | Top vertex connected to OpenDungeon and Transcribe+ |
| `transcribe-plus` | `(0.72, 0.42)` | Right vertex of the $K_4$ triangle |
| `sandwave-sim` | `(0.56, 0.55)` | Embedded strictly inside the interior of $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$ |
| `attention-max` | `(0.52, 0.80)` | Bottom vertex of the $K_4$ triangle; central hub |
| `kintsugi-fracture` | `(0.84, 0.72)` | Lower-right perimeter node connected to AttentionMax and Art (WIP) |
| `ivy-film-festival-2026` | `(0.15, 0.75)` | Lower-left perimeter node connected to Resume Builder, AttentionMax, and Art (WIP) |
| `art-wip` | `(0.16, 0.22)` | Top-left isolated node with 0 permanent edges; connects to `'art'`-tagged nodes by proximity after click |

The system SHALL guarantee that:
1. **Initial Mount Layout**: The affine safe-rectangle mapping preserves 0 straight-segment crossings for canvas dimensions larger than twice `BOUNDARY_MARGIN`. For smaller canvases, the implementation SHALL use a documented compact-layout policy; the margin invariant is not physically satisfiable there.
2. **Reduced-Motion Layout**: The static layout renders directly from these scaled planar seeds with 0 edge crossings.
3. **Resting Simulation State**: The dynamic physics simulation applies weak homing forces (`seedX`/`seedY` with `strength: 0.02`) toward the same mapped seed positions, ensuring the unperturbed resting equilibrium maintains 0 edge crossings on supported desktop and mobile test viewports.
4. **Soft User Placement, Resize Scaling & Layout Reset**: When a user drags and releases a node, its final position becomes a soft `(homeX, homeY)` anchor and d3's hard `fx/fy` pin is cleared. An alpha-independent damped spring settles the node toward that home without freezing the simulation. On viewport `resize(nw, nh)`, home anchors SHALL scale proportionally (`homeX * (nw / prevWidth)`, `homeY * (nh / prevHeight)`) and clamp within `[BOUNDARY_MARGIN, dim - BOUNDARY_MARGIN]`. Activating `"Reset layout"` clears all soft homes, restores all detached permanent edges, and re-heats `seedX`/`seedY` homing to return the graph to its planar equilibrium.
5. **Ambient-Offset Planarity**: Applying the maximum visual ambient offset (`3.5px` per node, deterministic phases) to the scaled planar seeds SHALL preserve zero segment crossings on desktop (`1440×900`) and mobile (`393×852`) viewports.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts with dynamic physics enabled on a supported viewport (e.g. 1440x900 desktop, 393x852 mobile, or 320x900 narrow mobile)
- **THEN** simulation nodes initialize at the scaled planar seed positions, with zero edge crossings between any of the 17 connection links.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** static node positions are rendered directly from the scaled planar seeds with zero edge crossings.

#### Scenario: Physics simulation settles from initial seeds
- **WHEN** the physics simulation runs unperturbed from mapped initial seeds for 300 ticks on supported desktop or mobile viewports
- **THEN** the resting equilibrium maintains zero edge crossings between any of the 17 connection links and preserves minimum node center separation $\ge 44\text{px}$.

#### Scenario: User drags and places a node
- **WHEN** the user drags a node to a new position and releases the pointer
- **THEN** the node settles softly toward its user-placed home while d3's `fx/fy` remains `null`, and non-dragged neighbors remain within `< 15px` displacement during the drag without neighbor `fx/fy` pins.

#### Scenario: User activates Reset layout
- **WHEN** the user clicks `"Reset layout"` in the 3-dot dropdown menu
- **THEN** all soft home anchors are cleared, any detached permanent edges recover, and `seedX`/`seedY` homing restores the planar resting equilibrium.

#### Scenario: Boundary-safe seed mapping remains planar
- **WHEN** seed coordinates are mapped into the safe canvas rectangle and boundary forces run at 320×900
- **THEN** the initial mapped positions and 300-tick resting graph have zero proper crossings and every node remains within the boundary margin.

#### Scenario: Maximum ambient drift remains planar
- **WHEN** every node is displaced by its maximum deterministic ambient drift offset on desktop or mobile
- **THEN** the 17 permanent edges still have zero proper crossings.

## ADDED Requirements

### Requirement: Rainbow RGB node pulsing until canvas reset
For any project declaring `rainbowOnInteract: true` (`art-wip`), `GraphCanvas` SHALL render the node and its ferrofluid bridge endpoint color using a continuously cycling rainbow RGB color (`0.144 deg/ms`) whenever the node is hovered, focused/selected, or present in `visitedIds`, persisting across drawer closes and page reloads until `"Reset layout"` clears `visitedIds`. The node label SHALL retain the theme's standard foreground color, and the node SHALL retain a `#ffffff` `1.5px` outline. For projects declaring `revealLabelOnInspect: true` (`art-wip`), `GraphCanvas` SHALL hide the node's canvas label pill until the node is clicked/inspected in the current session, keeping it visible across drawer closes and `"Reset layout"` until page refresh. Multi-line `\n` node labels (such as `"Ivy Film\nFestival"`) SHALL render with `1.0` line spacing. Any visible focal shared-tag pill on an edge connected to the active rainbow node SHALL render its tag text in a synchronized lower-saturation rainbow color; for each rendered hue, the text color SHALL maintain at least 4.5:1 contrast against the actual pill background. The muted color helper SHALL adjust lightness for the current theme/background rather than relying on a fixed HSL lightness. Under `prefers-reduced-motion: reduce`, `GraphCanvas` SHALL render a static deterministic rainbow-spectrum hue instead of animating, and the static shared-tag color SHALL meet the same text contrast threshold.

#### Scenario: Hovering the WIP art node activates rainbow pulsing
- **WHEN** the pointer hovers over `art-wip` before it has been clicked
- **THEN** `art-wip` renders with continuous rainbow RGB pulsing, its label remains legible in the theme foreground, and any visible focal shared-tag pills render synchronized muted rainbow text that meets 4.5:1 contrast against their background; `canvas.dataset.rainbowNodes` includes `art-wip`.

#### Scenario: Clicking the WIP art node keeps rainbow pulsing active until canvas reset
- **WHEN** the user clicks `art-wip`, closes the drawer, and reloads the page
- **THEN** `art-wip` remains in `visitedIds` and continues pulsing rainbow RGB until `"Reset layout"` is triggered, after which it returns to its unvisited node color.
