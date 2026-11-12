# graph-simulation Specification

## Purpose

Provides a decentralized 2D interactive force graph visualization with equal node mass, viewport boundary damping, pointer fling inertia, and dynamic hover gravitation waves.

## Requirements

### Requirement: Decentralized equal mass node distribution
The system SHALL simulate nodes using uniform visual radius (18px) and uniform repulsive charge ($k_{charge} = -\min(w, h) \times 0.55$) with a weak centering force (`forceX(w/2).strength(0.035)`, `forceY(h/2).strength(0.035)`), soft link springs (strength 0.05), and distance floor (`distanceMin = 50`), ensuring nodes distribute buoyantly across the viewport with minimum clearance of 60 pixels rather than clumping in the center or sticking against boundary walls.

#### Scenario: Graph initialization without central clump or corner pinning
- **WHEN** the canvas is initialized with the 6 project nodes
- **THEN** nodes distribute buoyantly across the viewport area maintaining at least 60 pixels center-to-center clearance without settling against viewport margins or collapsing onto OpenDungeon.

### Requirement: Viewport boundary damping and resize responsiveness
The system SHALL apply soft inward boundary forces to nodes only when they approach within 40 pixels of canvas edges, and rebuild centering coordinates and charge scaling whenever the canvas container resizes.

#### Scenario: Node approaches canvas boundary
- **WHEN** a node travels toward the viewport edge during simulation
- **THEN** the system dampens velocity and redirects the node smoothly inward without abrupt hard snapping.

#### Scenario: Viewport resize or device orientation change
- **WHEN** the browser window or canvas container resizes
- **THEN** centering forces and charge strength are recomputed with the new dimensions, and the simulation is reheated with alpha 0.2 to settle naturally into the new bounds.

### Requirement: Pointer interaction state machine and dynamic velocity decay
The system SHALL manage node interactions through an explicit state machine (`idle -> hover -> drag -> coasting`) where `velocityDecay` operates at 0.4 by default and drops to 0.18 only while in `coasting` state to enable visible gliding inertia.

#### Scenario: User drags and flings a node
- **WHEN** the user drags a node across the canvas and releases the pointer with velocity
- **THEN** release velocity is injected into node velocity vectors (`vx/vy`), velocityDecay drops to 0.18, the simulation alpha is reheated to 0.3, the state enters `coasting`, and hover re-pinning on all nodes is suppressed.

#### Scenario: Coasting deceleration settles
- **WHEN** a coasting node's velocity drops below 0.5 pixels per tick
- **THEN** velocityDecay restores to 0.4, the state returns to `idle`, and hover detection is re-enabled.

#### Scenario: Pointer remains over node after fling release
- **WHEN** the pointer is released over node H during a fling
- **THEN** node H continues moving with inherited momentum and is NOT immediately re-pinned by the hover detector.

### Requirement: Dynamic hover gravitation wave
The system SHALL apply a custom attractive force to directly connected neighbor nodes ($F_{pull} = \alpha \times 0.08 \times (dist - 120)$) when hovering over a node in `idle` state, pinning the hovered node in place to prevent cursor slip.

#### Scenario: Pointer hovers over a stationary node in idle state
- **WHEN** the user moves the pointer over node H while the state is `idle`
- **THEN** state enters `hover`, node H coordinates are pinned (`H.fx = H.x; H.fy = H.y`), simulation alphaTarget is set to 0.15, and connected neighbor nodes are drawn toward H along the link axis.

#### Scenario: Pointer leaves a hovered node
- **WHEN** the pointer leaves node H
- **THEN** node H is unpinned (`H.fx = null; H.fy = null`), simulation alphaTarget cools to 0, and the state returns to `idle`.

### Requirement: Reduced motion accessibility
The system SHALL respect the user's `prefers-reduced-motion` browser setting by pausing continuous force simulation and rendering the static graph directly from the authoritative planar seeds scaled to the viewport, with zero edge crossings and no coasting or write-in animations.

#### Scenario: User has reduced motion enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** continuous force simulation is paused, nodes render at their scaled planar seed positions with zero edge crossings, and all nodes and labels appear immediately in their resting state.
### Requirement: Canvas label typography and native font rendering
The system SHALL render canvas node label pills with `'500 12px "Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif'` and paint them without blocking on a webfont load, eliminating `document.fonts.load(...)` gates for the removed variable mono face.

#### Scenario: Typography rendering without a webfont gate
- **WHEN** the canvas simulation initializes
- **THEN** node circles, bridges, and label pills paint immediately with the native Helvetica sans stack, with no wait for a webfont promise.

#### Scenario: Canvas node anatomy
- **WHEN** nodes are painted onto the 2D canvas
- **THEN** each node renders as a flat circular primitive with radius 22px and a background-matched label pill in the Helvetica sans stack, without crosshairs or decorative guide rings.
### Requirement: Focal-only relational projection vectors and distance callouts
The system SHALL restrict relational projection vectors and edge distance callouts exclusively to the hovered or focused node, preventing hot-path rendering degradation across non-focal nodes.

#### Scenario: User hovers or focuses a node
- **WHEN** a node becomes active via hover or keyboard focus
- **THEN** dashed hairline projection vectors extend from the focal node center to its connected neighbors, and incident distance callouts (`d: [pixels]px`) render along those incident edges only.

#### Scenario: Graph is in idle or non-hovered coasting state
- **WHEN** no node is hovered or focused
- **THEN** edges render as simple 1px hairline links and distance measurement text is omitted to maintain 60fps throughput.

### Requirement: Canvas initial write-in animation
The system SHALL animate node guide ring strokes from 0 to $2\pi$ over 400ms using an eased rAF loop upon initial component mount under standard motion preferences, and skip the animation entirely when reduced motion is enabled.

#### Scenario: Initial canvas mount with standard motion
- **WHEN** the canvas mounts and `prefers-reduced-motion` is false
- **THEN** outer guide rings trace their circumference from 0 to $2\pi$ before settling into static hairline rings.

### Requirement: Invariant interaction hit testing boundary
The system SHALL preserve the interaction hit-testing radius at the canonical node radius (`r = 22px`), so visual label pills do not alter the pointer interaction state machine.

#### Scenario: Pointer enters the label pill but not the node circle
- **WHEN** the pointer moves within a node's label pill but remains outside the 22px physics radius
- **THEN** the node does NOT enter the hover state until the pointer breaches the circle threshold.
### Requirement: Authoritative planar graph seed embedding and homing force
The system SHALL initialize graph simulation nodes from the authoritative normalized planar coordinate map (`PLANAR_NODE_SEEDS`), scaled to container dimensions $(width, height)$ via $(x = \text{seed}.x \times width, y = \text{seed}.y \times height)$, across the 9 undirected graph links derived from shared tags in `projects.ts`:
1. `open-dungeon` &mdash; `agentic-resume-builder`
2. `open-dungeon` &mdash; `pict-climate-risk-viz-chatbot`
3. `open-dungeon` &mdash; `transcribe-plus`
4. `open-dungeon` &mdash; `sandwave-sim`
5. `open-dungeon` &mdash; `attention-max`
6. `pict-climate-risk-viz-chatbot` &mdash; `transcribe-plus`
7. `transcribe-plus` &mdash; `sandwave-sim`
8. `transcribe-plus` &mdash; `attention-max`
9. `sandwave-sim` &mdash; `attention-max`

| Project ID | Normalized $(x, y)$ | Role in Planar Embedding |
| :--- | :--- | :--- |
| `agentic-resume-builder` | `(0.18, 0.50)` | Degree-1 leaf node left of OpenDungeon; zero edge crossings |
| `open-dungeon` | `(0.40, 0.48)` | Degree-5 hub forming the left vertex of the $K_4$ triangle |
| `pict-climate-risk-viz-chatbot` | `(0.56, 0.22)` | Top vertex connected to OpenDungeon and Transcribe+ |
| `transcribe-plus` | `(0.72, 0.42)` | Right vertex of the $K_4$ triangle |
| `sandwave-sim` | `(0.56, 0.55)` | Embedded strictly inside the interior of $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$ |
| `attention-max` | `(0.52, 0.80)` | Bottom vertex of the $K_4$ triangle |

The system SHALL guarantee that:
1. **Initial Mount Layout**: Node coordinates scaled to any positive canvas dimensions ($width > 0, height > 0$) have strictly 0 segment crossings across all 9 links.
2. **Reduced-Motion Layout**: The static layout renders directly from these scaled planar seeds with 0 edge crossings.
3. **Resting Simulation State**: The dynamic physics simulation applies weak homing forces (`seedX`/`seedY` with `strength: 0.02`) toward scaled seed positions, ensuring the unperturbed resting equilibrium maintains 0 edge crossings.
4. **Interactive Boundaries**: Active user dragging is permitted to temporarily displace nodes. Once released, the seed-homing forces guide the graph back to its planar resting equilibrium.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts with dynamic physics enabled on any viewport (e.g. 1440x900 desktop or 393x852 mobile)
- **THEN** simulation nodes initialize at the scaled planar seed positions, with zero edge crossings between any of the 9 connection links.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** static node positions are rendered directly from the scaled planar seeds with zero edge crossings.

#### Scenario: Physics simulation settles from initial seeds
- **WHEN** the physics simulation runs unperturbed from initial seeds for 300 ticks
- **THEN** the resting equilibrium maintains zero edge crossings between any of the 9 connection links.

### Requirement: Bilateral tangent-continuous fluid bridge geometry
The system SHALL construct connection bridges between nodes using pure bilateral geometry across the center-to-center axis:
- Anchors $A_{top}, A_{bottom}$ on circle A and $B_{top}, B_{bottom}$ on circle B are placed at spread angles $\pm \theta$ relative to unit direction $\vec{u} = \frac{B - A}{\|B - A\|}$.
- Control points leave circle circumferences along exact circle tangent rays:
  $$CP1_{top} = A_{top} + L_A \vec{T}_{A,top}, \quad CP2_{top} = B_{top} + L_B \vec{T}_{B,top}$$
  where $\vec{T}_{A,top} = \sin\theta_A \vec{u} - \cos\theta_A \vec{n}$ and $\vec{T}_{B,top} = -\sin\theta_B \vec{u} - \cos\theta_B \vec{n}$, guaranteeing true $C^1$ tangent continuity at both circle boundaries ($(CP1_{top} - A_{top}) \cdot (A_{top} - A) = 0$ and $(B_{top} - CP2_{top}) \cdot (B_{top} - B) = 0$).
- The bottom boundary curve is an exact mathematical reflection of the top curve across $\vec{u}$ ($y_{bottom} = -y_{top}$ in edge-local coordinates).
- Close-node guard: when center distance $d \le R_A + R_B$, bridge calculation returns `null` and rendering is bypassed to prevent inverted or crossed geometry.

#### Scenario: Rendering bridge between adjacent nodes
- **WHEN** the canvas draws a connection between two nodes with $d > R_A + R_B$
- **THEN** the bridge renders with bilaterally symmetric top and bottom curves, smooth $C^1$ tangent continuity at circle circumferences, and an hourglass waist cinch.

#### Scenario: Two nodes overlap during drag
- **WHEN** a user drags node A until its center is within $R_A + R_B$ of node B
- **THEN** `computeBridgeGeometry` returns `null` and the bridge is omitted cleanly without visual artifacts or inverted curves.
