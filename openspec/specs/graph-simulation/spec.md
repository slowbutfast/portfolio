# graph-simulation Specification

## Purpose

Provides a decentralized 2D interactive force graph visualization with equal node mass, viewport boundary damping, pointer fling inertia, and dynamic hover gravitation waves.

## Requirements

### Requirement: Decentralized equal mass node distribution
The system SHALL simulate nodes using uniform visual radius (22px) and uniform repulsive charge ($k_{charge} = -\min(w, h) \times 0.30$) with weak planar seed homing (`seedX`/`seedY` at `0.02`), soft link springs (strength `0.015`), collision radius (`48px`), and distance floor (`distanceMin = 50`), ensuring nodes distribute buoyantly across the viewport with minimum clearance of 44 pixels rather than clumping in the center or sticking against boundary walls.

#### Scenario: Graph initialization without central clump or corner pinning
- **WHEN** the canvas is initialized with the 8 project nodes
- **THEN** nodes distribute buoyantly across the viewport area maintaining at least 44 pixels center-to-center clearance without settling against viewport margins or collapsing onto OpenDungeon.

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
The system SHALL gate both simulation hover physics (`sim.hover(node)`) and preview card opening behind a single `200ms` pointer dwell timer, cancelling the dwell timer and clearing hover synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, `prefers-reduced-motion` transition, or while `state === 'coasting'`. Once dwell completes, the hovered node is pinned (`fx = x; fy = y`), and connected neighbors experience a slow ambient drift (`0 -> 0.025` ramp) outside a `110px` soft radial exclusion zone around the hovered node so neighbors gently part rather than snapping inward over the card.

#### Scenario: Pointer sweeps across a node without dwelling
- **WHEN** the pointer crosses a node for less than `200ms` or while `state === 'coasting'`
- **THEN** neither `sim.hover` nor `NodeHoverCard` activates.

#### Scenario: Pointer dwells on a stationary node for 200ms
- **WHEN** the pointer remains on node H for `200ms` in `idle` state
- **THEN** `sim.hover(H)` pins node H, neighbors outside `110px` gently drift, and `NodeHoverCard` opens peripherally away from the canvas center using measured bounds.

#### Scenario: Pointer leaves or clicks a hovered node
- **WHEN** the pointer leaves node H, presses `pointerdown`, or starts a drag
- **THEN** the dwell timer is cancelled synchronously, node H is unpinned (unless user-pinned by a prior drag), `alphaTarget` cools to `0`, and `NodeHoverCard` closes.

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

### Requirement: Invariant interaction hit testing boundary
The system SHALL preserve the interaction hit-testing radius at the canonical node radius (`r = 22px`), so visual label pills do not alter the pointer interaction state machine.

#### Scenario: Pointer enters the label pill but not the node circle
- **WHEN** the pointer moves within a node's label pill but remains outside the 22px physics radius
- **THEN** the node does NOT enter the hover state until the pointer breaches the circle threshold.

### Requirement: Authoritative planar graph seed embedding and homing force
The system SHALL initialize graph simulation nodes from the authoritative normalized planar coordinate map (`PLANAR_NODE_SEEDS`), scaled to container dimensions $(width, height)$ via $(x = \text{seed}.x \times width, y = \text{seed}.y \times height)$, across the 13 undirected graph links derived from shared tags in `projects.ts`:
1. `open-dungeon` &mdash; `agentic-resume-builder` (Agent Tooling)
2. `open-dungeon` &mdash; `pict-climate-risk-viz-chatbot` (Express, LLM)
3. `open-dungeon` &mdash; `transcribe-plus` (Express, Vanilla JS)
4. `open-dungeon` &mdash; `sandwave-sim` (Vanilla JS)
5. `open-dungeon` &mdash; `attention-max` (Vanilla JS)
6. `agentic-resume-builder` &mdash; `attention-max` (Design)
7. `agentic-resume-builder` &mdash; `ivy-film-festival-2026` (Design)
8. `pict-climate-risk-viz-chatbot` &mdash; `transcribe-plus` (Express)
9. `transcribe-plus` &mdash; `sandwave-sim` (Audio, Vanilla JS)
10. `transcribe-plus` &mdash; `attention-max` (Vanilla JS)
11. `sandwave-sim` &mdash; `attention-max` (Vanilla JS)
12. `attention-max` &mdash; `kintsugi-fracture` (Graphics)
13. `attention-max` &mdash; `ivy-film-festival-2026` (Design)

| Project ID | Normalized $(x, y)$ | Role in Planar Embedding |
| :--- | :--- | :--- |
| `agentic-resume-builder` | `(0.18, 0.50)` | Left flank node connected to OpenDungeon, AttentionMax, and Ivy |
| `open-dungeon` | `(0.40, 0.48)` | Degree-5 hub forming the left vertex of the $K_4$ triangle |
| `pict-climate-risk-viz-chatbot` | `(0.56, 0.22)` | Top vertex connected to OpenDungeon and Transcribe+ |
| `transcribe-plus` | `(0.72, 0.42)` | Right vertex of the $K_4$ triangle |
| `sandwave-sim` | `(0.56, 0.55)` | Embedded strictly inside the interior of $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$ |
| `attention-max` | `(0.52, 0.80)` | Bottom vertex of the $K_4$ triangle; degree-6 central hub |
| `kintsugi-fracture` | `(0.84, 0.72)` | Lower-right perimeter node connected to AttentionMax |
| `ivy-film-festival-2026` | `(0.15, 0.75)` | Lower-left perimeter node connected to Resume Builder and AttentionMax |

The system SHALL guarantee that:
1. **Initial Mount Layout**: Node coordinates scaled to any positive canvas dimensions ($width > 0, height > 0$) have strictly 0 segment crossings across all 13 links.
2. **Reduced-Motion Layout**: The static layout renders directly from these scaled planar seeds with 0 edge crossings.
3. **Resting Simulation State**: The dynamic physics simulation applies weak homing forces (`seedX`/`seedY` with `strength: 0.02`) toward scaled seed positions, ensuring the unperturbed resting equilibrium maintains 0 edge crossings on both desktop (1440×900) and mobile (393×852) viewports.
4. **Persistent User Placement, Resize Scaling & Layout Reset**: When a user drags and releases a node, its final position persists as a user-pinned anchor (`fx/fy`) rather than snapping back to its initial seed. On viewport `resize(nw, nh)`, pinned `fx/fy` coordinates SHALL scale proportionally (`fx * (nw / prevWidth)`, `fy * (nh / prevHeight)`) and clamp within `[BOUNDARY_MARGIN, dim - BOUNDARY_MARGIN]`. Activating `"Reset layout"` unpins all user-placed nodes, restores all detached permanent edges, and re-heats `seedX`/`seedY` homing to return the graph to its planar equilibrium.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts with dynamic physics enabled on any viewport (e.g. 1440x900 desktop or 393x852 mobile)
- **THEN** simulation nodes initialize at the scaled planar seed positions, with zero edge crossings between any of the 13 connection links.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** static node positions are rendered directly from the scaled planar seeds with zero edge crossings.

#### Scenario: Physics simulation settles from initial seeds
- **WHEN** the physics simulation runs unperturbed from initial seeds for 300 ticks on desktop or mobile viewports
- **THEN** the resting equilibrium maintains zero edge crossings between any of the 13 connection links and preserves minimum node center separation $\ge 44\text{px}$.

#### Scenario: User drags and places a node
- **WHEN** the user drags a node to a new position and releases the pointer
- **THEN** the node remains anchored at its user-placed position while non-dragged neighbors remain within `< 15px` displacement during the drag (`link` force zeroed on `dragNode` links during active drag).

#### Scenario: User activates Reset layout
- **WHEN** the user clicks `"Reset layout"` in the 3-dot dropdown menu
- **THEN** all user-pinned `fx/fy` anchors are cleared, any detached permanent edges recover, and `seedX`/`seedY` homing restores the planar resting equilibrium.

### Requirement: Bilateral tangent-continuous fluid bridge geometry
The system SHALL construct connection bridges between nodes using pure bilateral geometry across the center-to-center axis:
- Semantic base width scales with shared tags: $W_{base}(n) = \min(R_A, R_B) \times 0.85$ clamped to $6 + 4(n - 1)\text{px}$ (where $n \ge 1$ is the number of shared tags).
- Perimeter attachment spread uses wider organic fillets (`HALF_WIDTH_RATIO = 0.85` capped by `MAX_SPREAD_ANGLE = Math.PI / 6.2`) so adjacent bridges on degree-5/6 hubs remain separated.
- Rest-waist ratio (`REST_WAIST_RATIO = 0.58`): for center distance $d \le L_{rest}(e)$, target waist width equals $0.58 \times (2 \cdot \text{averageHalf})$ (floored at `2px` and bounded on short gaps by `baseHandle` to preserve $C^1$ tangent continuity), producing a genuine concave hourglass silhouette at rest (`handleForWaist > 0`).
- Stretch cinching: for $d > L_{rest}(e)$, waist width thins smoothly from the rest waist down to `2px` at $d_{snap}(e) = 1.6 \times L_{rest}(e)$.
- Anchors $A_{top}, A_{bottom}$ on circle A and $B_{top}, B_{bottom}$ on circle B are placed at spread angles $\pm \theta$ relative to unit direction $\vec{u} = \frac{B - A}{\|B - A\|}$.
- Control points leave circle circumferences along exact circle tangent rays:
  $$CP1_{top} = A_{top} + L_A \vec{T}_{A,top}, \quad CP2_{top} = B_{top} + L_B \vec{T}_{B,top}$$
  where $\vec{T}_{A,top} = \sin\theta_A \vec{u} - \cos\theta_A \vec{n}$ and $\vec{T}_{B,top} = -\sin\theta_B \vec{u} - \cos\theta_B \vec{n}$, guaranteeing true $C^1$ tangent continuity at both circle boundaries ($(CP1_{top} - A_{top}) \cdot (A_{top} - A) = 0$ and $(B_{top} - CP2_{top}) \cdot (B_{top} - B) = 0$).
- Lateral sag $\delta$ from the bridge oscillator is injected along $\vec{n}$, translating control handles while preserving bilateral reflection symmetry.
- The bottom boundary curve is an exact mathematical reflection of the top curve across $\vec{u}$ ($y_{bottom} = -y_{top}$ in edge-local coordinates).
- Axis-aligned gradient blending: bridges between nodes of differing colors (e.g., visited/active cobalt `#003399` and unvisited black `#000000`) SHALL interpolate smoothly along the bridge axis via `createLinearGradient(a.x, a.y, b.x, b.y)`.
- Close-node guard: when center distance $d \le R_A + R_B$, bridge calculation returns `null` and rendering is bypassed to prevent inverted or crossed geometry.

#### Scenario: Rendering bridge between adjacent nodes at rest
- **WHEN** the canvas draws a connection between two nodes at equilibrium distance ($d \approx L_{rest}(e)$)
- **THEN** the bridge renders with bilaterally symmetric concave hourglass curves (`waistWidth < 2 * averageHalf`, `handleForWaist > 0`), smooth $C^1$ tangent continuity, and smooth axis-aligned color gradient blending when endpoint colors differ.

### Requirement: Ferrofluid bridge underdamped harmonic momentum
The system SHALL simulate physical mass, inertia, and viscosity across fluid connection bridges using a second-order underdamped harmonic oscillator ($\ddot{\delta} + 2\zeta\omega_n \dot{\delta} + \omega_n^2 \delta = F_{perp}$) with natural frequency $\omega_n = 14\text{ rad/s}$ and damping ratio $\zeta = 0.35$, driving lateral curve sag and waist wobble from endpoint acceleration, using fixed substep integration ($\delta t_{sub} \le 16\text{ms}$) with frame time clamped to $32\text{ms}$, satisfying the envelope bound $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$, and bypassing all dynamic oscillations when `prefers-reduced-motion: reduce` is active.

#### Scenario: Node moves rapidly during user drag
- **WHEN** a user moves a connected node across the canvas
- **THEN** the bridge sags and oscillates laterally with an underdamped wobble that decays toward zero according to the theoretical envelope within 1 second of coming to rest.

#### Scenario: Reduced motion is active
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** oscillator integration is bypassed, and bridges render with zero lateral dynamic sag or wobble.

### Requirement: Drag-time meniscus snapping and elastic tether recovery
The system SHALL manage bridge severance and recovery as follows:
- Each edge $e$ defines an authoritative rest distance $L_{rest}(e)$ equal to the Euclidean distance between its scaled planar seeds.
- When center distance exceeds `SNAP_MULTIPLIER` (`1.6`) $\times L_{rest}(e)$ during drag, the bridge detaches (`isDetached = true`) and emits a `220ms` visual `recoilProgress` (`1 -> 0`) drawing retracting fluid tips into both endpoint circles, while topological edges remain intact in the model.
- A rubber-band displacement function applies elastic drag resistance to pinned coordinates ($\vec{P}_{pinned} = \vec{P}_{anchor} + \frac{\vec{\Delta}}{\sqrt{1 + (\|\vec{\Delta}\| / R_{tether})^2}}$), preventing any node from being pulled infinitely off-canvas.
- Upon pointer release (`dragEnd`), a `350ms` `reconnectCooldownUntil` prevents immediate visual pop-back; once the cooldown expires and distance drops to or below `RECONNECT_MULTIPLIER` (`1.25`) $\times L_{rest}(e)$ (or when `"Reset layout"` is invoked), the bridge smoothly reforms with a damped oscillation ripple.

#### Scenario: User drags a node beyond 1.6x snapping distance
- **WHEN** a user drags a node until center distance exceeds $1.6 \times L_{rest}(e)$
- **THEN** the bridge detaches visually with a `220ms` retracting droplet recoil animation while rubber-band resistance cushions outward movement and non-dragged neighbors displace `< 15px`.

#### Scenario: Reconnection respects 350ms post-release cooldown
- **WHEN** a detached bridge returns within $1.25 \times L_{rest}(e)$ before `350ms` has elapsed since `dragEnd`
- **THEN** reconnection waits until the `350ms` cooldown expires before reforming the visual bridge.

### Requirement: Proximity-only visual webbing for non-edge pairs
The system SHALL render transient proximity-only bridges exclusively between node pairs that do NOT share a permanent edge, using `computeBridgeGeometry` when $R_A + R_B < d < \text{PROXIMITY\_MAX\_DIST}$ (`96px`), tapering smoothly to zero waist/alpha at `PROXIMITY_MAX_DIST`, exerting zero `d3-force` attraction or repulsion, and drawing underneath permanent bridges and nodes in deterministic sorted-pair order.

#### Scenario: Non-edge nodes approach within proximity band
- **WHEN** two non-linked nodes move within `96px` (and $> R_A + R_B$) center-to-center
- **THEN** a zero-force proximity bridge renders beneath permanent bridges and nodes using the same $C^1$ hourglass curve language.

#### Scenario: Detached permanent edge enters proximity band
- **WHEN** a detached permanent edge pair moves within `96px` during cooldown or above `1.25x` reconnect distance
- **THEN** no proximity bridge is drawn for that pair, preserving the snap cue until permanent-edge reconnection occurs.

### Requirement: Measured peripheral hover card placement
The system SHALL position `NodeHoverCard` using measured card bounds (`ResizeObserver`) projected outward from the canvas center along `(nodeScreenPos - canvasCenter)` and clamped to viewport + safe-area margins (`20px`), with an inward fallback only when the outward quadrant clips on narrow viewports (`393x852`).

#### Scenario: Hover card opens on desktop or mobile
- **WHEN** `NodeHoverCard` opens for a node after the `200ms` dwell
- **THEN** the card anchors peripherally outside the central graph cluster without overflowing viewport bounds.

### Requirement: Idle simulation suspend and continuous rAF throttling
The system SHALL throttle or suspend the continuous `requestAnimationFrame` canvas render loop when all node velocities $\|\vec{v}\| < 0.01\text{ px/tick}$, all bridge oscillator amplitudes $|\delta| < 0.1\text{ px}$, and camera transform lerps have converged, instantly resuming the loop upon any pointer event, window resize, theme change, filter selection, or hover update.

#### Scenario: Simulation and oscillators settle to equilibrium
- **WHEN** all 8 nodes settle, bridge oscillations damp out, and transforms converge
- **THEN** the canvas pauses its rAF render loop, dropping idle CPU utilization to near-zero.

#### Scenario: User moves cursor over resting canvas
- **WHEN** a pointermove or pointerdown event occurs over the suspended canvas
- **THEN** the render loop immediately wakes up without visual stutter or dropped frames.
