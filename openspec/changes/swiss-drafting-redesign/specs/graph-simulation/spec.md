## MODIFIED Requirements

### Requirement: Reduced motion accessibility
The system SHALL respect the user's `prefers-reduced-motion` browser setting by pausing continuous force simulation, placing nodes in a static circular layout, and immediately rendering final vector and typography geometries without playing the initial write-in or velocity coasting animations.

#### Scenario: User has reduced motion enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** continuous force simulation is paused, nodes are placed in a static legible circular layout, initial stroke write-in is bypassed, and all nodes/labels render immediately in their resting state.

## ADDED Requirements

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
