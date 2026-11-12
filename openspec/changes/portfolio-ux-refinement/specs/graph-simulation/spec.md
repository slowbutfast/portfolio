## ADDED Requirements

### Requirement: Concise node labeling and simulation input type
The system SHALL extend `SimulationNode` in `src/physics/graphSimulation.ts` to accept `label?: string`, mapping each project's mandatory `shortTitle` (e.g. `Resume Builder`, `Climate Risk`, `Sandwave`) to simulation nodes and rendering these concise strings inside canvas title pills, eliminating horizontal clutter and mobile node crowding.

#### Scenario: Canvas renders project node titles
- **WHEN** the 2D canvas draws project nodes
- **THEN** each node's knockout title pill renders the concise short human label instead of the raw kebab-case ID.

### Requirement: Viewport pill bounds clamping and collision offset
The system SHALL clamp the full rectangular bounds of each node's title pill (`[pillX, pillY, pillWidth, pillHeight]`) to remain strictly within canvas viewport boundaries with a minimum 12px margin, keeping the pill visually anchored to its node, and offsetting pills vertically when neighbor node coordinates settle within 70px to prevent multi-label collision.

#### Scenario: Node travels near the viewport boundary
- **WHEN** a node simulation coordinate places its title pill partially outside the canvas boundary
- **THEN** the rendering loop clamps the full pill rectangle within the safe canvas bounds while maintaining its anchor link to the node circle.

#### Scenario: Neighbor nodes settle near each other
- **WHEN** two connected or adjacent nodes settle within 70px center-to-center clearance
- **THEN** the rendering loop alternates pill vertical placement (above vs below node circle) to prevent label overlap.
