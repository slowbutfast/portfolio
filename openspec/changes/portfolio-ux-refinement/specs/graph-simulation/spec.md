## ADDED Requirements

### Requirement: Concise node labeling on physics canvas
The system SHALL label canvas simulation nodes with their human `shortTitle` (e.g. `Resume Builder`, `Climate Risk`, `Sandwave`) rather than raw kebab-case repository identifiers (`agentic-resume-builder`, `pict-climate-risk-viz-chatbot`), eliminating visual noise and horizontal clutter on desktop and mobile viewports.

#### Scenario: Canvas renders project node titles
- **WHEN** the 2D canvas draws project nodes
- **THEN** each node's knockout title pill renders the concise short human label instead of the raw kebab-case ID.

### Requirement: Viewport label boundary clamping
The system SHALL clamp canvas node title pill rendering coordinates to remain strictly within the canvas viewport boundaries (with minimum 12px margin from any canvas edge), preventing project labels from clipping offscreen during physics simulation or node flinging.

#### Scenario: Node travels near the viewport boundary
- **WHEN** a node simulation coordinate places its title pill partially outside the canvas boundary
- **THEN** the rendering loop clamps the knockout pill horizontally and vertically within the safe canvas bounds.
