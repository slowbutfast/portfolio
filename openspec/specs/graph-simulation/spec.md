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
The system SHALL respect the user's `prefers-reduced-motion` browser setting by pausing continuous force simulation, placing nodes in a static circular layout, and immediately rendering final vector and typography geometries without playing the initial write-in or velocity coasting animations.

#### Scenario: User has reduced motion enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** continuous force simulation is paused, nodes are placed in a static legible circular layout, initial stroke write-in is bypassed, and all nodes/labels render immediately in their resting state.

### Requirement: Technical drafting canvas rendering and typography font gate
The system SHALL render graph nodes and edges as an engineering technical drafting specimen, initializing physics simulation and vector geometries immediately on mount, while gating canvas typography drawing on `document.fonts.load('12px "JetBrains Mono Variable"')` with immediate repaint upon resolution.

#### Scenario: Typography rendering with font loading gate
- **WHEN** the canvas simulation initializes
- **THEN** node circles, links, and crosshairs begin rendering immediately, while textual labels and coordinate badges await `document.fonts.load('12px "JetBrains Mono Variable"')` before painting with the custom variable font.

#### Scenario: Technical drafting node anatomy
- **WHEN** nodes are painted onto the 2D canvas
- **THEN** each node renders with a center crosshair (`+`), a primary filled circle ($r = 18\text{px}$), and an outer concentric 1px hairline guide ring ($r + 6\text{px}$) decorated with 4 cardinal tick marks (0°, 90°, 180°, 270°), replacing any legacy multi-ring overlays.

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
The system SHALL preserve the interaction hit-testing radius strictly at the canonical physics radius ($r = 18\text{px}$), ensuring that outer decorative concentric rings ($r + 6\text{px}$) do not alter the pointer interaction state machine.

#### Scenario: Pointer enters outer decorative guide boundary
- **WHEN** the pointer moves within the $r + 6\text{px}$ visual ring but remains outside the $18\text{px}$ physics radius
- **THEN** the node does NOT enter the hover state until the pointer breaches the true $18\text{px}$ threshold.
