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
4. **Interactive Boundaries**: Active user dragging is permitted to temporarily displace nodes. Once released, the seed-homing forces guide the graph back to its planar resting equilibrium with zero crossing.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts with dynamic physics enabled on any viewport (e.g. 1440x900 desktop or 393x852 mobile)
- **THEN** simulation nodes initialize at the scaled planar seed positions, with zero edge crossings between any of the 13 connection links.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** static node positions are rendered directly from the scaled planar seeds with zero edge crossings.

#### Scenario: Physics simulation settles from initial seeds
- **WHEN** the physics simulation runs unperturbed from initial seeds for 300 ticks on desktop or mobile viewports
- **THEN** the resting equilibrium maintains zero edge crossings between any of the 13 connection links and preserves minimum node center separation $\ge 44\text{px}$.

### Requirement: Bilateral tangent-continuous fluid bridge geometry
The system SHALL construct connection bridges between nodes using pure bilateral geometry across the center-to-center axis:
- Base thickness scales with shared tags: $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n - 1)\text{px}$ (where $n \ge 1$ is the number of shared tags).
- Rest-normalized waist cinching: for center distance $d \le L_{rest}(e)$, waist width equals $W_{base}(n)$; for $d > L_{rest}(e)$, waist width thins smoothly according to $W_{waist}(d) = W_{base}(n) \times (1 - \frac{d - L_{rest}(e)}{d_{snap}(e) - L_{rest}(e)})^{1.25}$, clamped at minimum $2\text{px}$.
- Anchors $A_{top}, A_{bottom}$ on circle A and $B_{top}, B_{bottom}$ on circle B are placed at spread angles $\pm \theta$ relative to unit direction $\vec{u} = \frac{B - A}{\|B - A\|}$.
- Control points leave circle circumferences along exact circle tangent rays:
  $$CP1_{top} = A_{top} + L_A \vec{T}_{A,top}, \quad CP2_{top} = B_{top} + L_B \vec{T}_{B,top}$$
  where $\vec{T}_{A,top} = \sin\theta_A \vec{u} - \cos\theta_A \vec{n}$ and $\vec{T}_{B,top} = -\sin\theta_B \vec{u} - \cos\theta_B \vec{n}$, guaranteeing true $C^1$ tangent continuity at both circle boundaries ($(CP1_{top} - A_{top}) \cdot (A_{top} - A) = 0$ and $(B_{top} - CP2_{top}) \cdot (B_{top} - B) = 0$).
- Lateral sag $\delta$ from the bridge oscillator is injected along $\vec{n}$, translating control handles while preserving bilateral reflection symmetry.
- The bottom boundary curve is an exact mathematical reflection of the top curve across $\vec{u}$ ($y_{bottom} = -y_{top}$ in edge-local coordinates).
- Close-node guard: when center distance $d \le R_A + R_B$, bridge calculation returns `null` and rendering is bypassed to prevent inverted or crossed geometry.

#### Scenario: Rendering bridge between adjacent nodes at rest
- **WHEN** the canvas draws a connection between two nodes at equilibrium distance ($d \approx L_{rest}(e)$)
- **THEN** the bridge renders with bilaterally symmetric top and bottom curves, smooth $C^1$ tangent continuity, and full semantic base thickness.

### Requirement: Ferrofluid bridge underdamped harmonic momentum
The system SHALL simulate physical mass, inertia, and viscosity across fluid connection bridges using a second-order underdamped harmonic oscillator ($\ddot{\delta} + 2\zeta\omega_n \dot{\delta} + \omega_n^2 \delta = F_{perp}$) with natural frequency $\omega_n = 14\text{ rad/s}$ and damping ratio $\zeta = 0.35$, driving lateral curve sag and waist wobble from endpoint acceleration, using fixed substep integration ($\delta t_{sub} \le 16\text{ms}$) with frame time clamped to $32\text{ms}$, satisfying the envelope bound $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$, and bypassing all dynamic oscillations when `prefers-reduced-motion: reduce` is active.

#### Scenario: Node moves rapidly during user drag
- **WHEN** a user moves a connected node across the canvas
- **THEN** the bridge sags and oscillates laterally with an underdamped wobble that decays toward zero according to the theoretical envelope within 1 second of coming to rest.

#### Scenario: Reduced motion is active
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** oscillator integration is bypassed, and bridges render with zero lateral dynamic sag or wobble.

### Requirement: Drag-time meniscus snapping and elastic tether recovery
The system SHALL apply dynamic bridge severance strictly during active node dragging (`isDragging === true`):
- Each edge $e$ defines an authoritative rest distance $L_{rest}(e)$ equal to the Euclidean distance between its scaled planar seeds.
- When the distance between two connected nodes exceeds $2.0 \times L_{rest}(e)$, the visual bridge thins into a meniscus and unmounts with a fluid droplet recoil animation.
- A rubber-band displacement function applies elastic drag resistance to pinned coordinates ($\vec{P}_{pinned} = \vec{P}_{anchor} + \frac{\vec{\Delta}}{\sqrt{1 + (\|\vec{\Delta}\| / R_{tether})^2}}$), preventing any node from being pulled infinitely off-canvas.
- Upon pointer release (`pointerup`), the dragged node is unpinned, seed-homing forces guide it back toward its resting basin, and the fluid bridge smoothly re-engages once distance drops below $1.4 \times L_{rest}(e)$ with a damped oscillation ripple.
- At rest or during unperturbed simulation, all topological links SHALL remain permanently connected (zero permanent edge loss).

#### Scenario: User drags a node beyond snapping distance
- **WHEN** a user drags a node until the center distance to its neighbor exceeds $2.0 \times L_{rest}(e)$
- **THEN** the fluid bridge visually disconnects with a droplet snap animation while rubber-band resistance cushions further outward movement.

#### Scenario: User releases pointer after dragging beyond snapping distance
- **WHEN** the user releases the pointer after stretching a link past its snapping threshold
- **THEN** the node springs back into its planar resting basin, the connection bridge reforms once $d \le 1.4 \times L_{rest}(e)$, and the graph's topological edge structure remains 100% intact with 0 crossings at resting equilibrium.

### Requirement: Idle simulation suspend and continuous rAF throttling
The system SHALL throttle or suspend the continuous `requestAnimationFrame` canvas render loop when all node velocities $\|\vec{v}\| < 0.01\text{ px/tick}$, all bridge oscillator amplitudes $|\delta| < 0.1\text{ px}$, and camera transform lerps have converged, instantly resuming the loop upon any pointer event, window resize, theme change, filter selection, or hover update.

#### Scenario: Simulation and oscillators settle to equilibrium
- **WHEN** all 8 nodes settle, bridge oscillations damp out, and transforms converge
- **THEN** the canvas pauses its rAF render loop, dropping idle CPU utilization to near-zero.

#### Scenario: User moves cursor over resting canvas
- **WHEN** a pointermove or pointerdown event occurs over the suspended canvas
- **THEN** the render loop immediately wakes up without visual stutter or dropped frames.
