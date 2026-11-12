## ADDED Requirements

### Requirement: Planar graph seed embedding and seed-homing force
The system SHALL initialize graph simulation nodes from normalized planar coordinates (`PLANAR_NODE_SEEDS`) scaled to canvas dimensions—embedding `sandwave-sim` strictly within the interior of the `open-dungeon`, `transcribe-plus`, and `attention-max` $K_4$ triangle—and apply a subtle homing force (`strength: 0.02`) toward these seeds in `createSimulation`, ensuring the graph settles without crossed edges while remaining fully draggable, and using these same planar coordinates for the reduced-motion static layout.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts
- **THEN** simulation nodes initialize at scaled planar seed positions, with zero edge crossings between any of the 9 connection links.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** static node positions are rendered directly from the scaled planar seeds rather than a naive crossing circle.

### Requirement: Bilateral tangent-continuous fluid bridge geometry
The system SHALL construct connection bridges between nodes using pure bilateral geometry across the center-to-center axis:
- Anchors are positioned at spread angles $\pm \theta$ from direction $\vec{u}$.
- Cubic Bézier control points leave each circle along its exact perimeter tangent ($\sin\theta \vec{u} - \cos\theta \vec{n}$) with handle lengths proportional to bridge span.
- The bottom boundary curve is an exact mathematical reflection of the top curve across $\vec{u}$ ($y_{bottom} = -y_{top}$ in edge-local coordinates).
- When node distance $d \le R_A + R_B$, bridge rendering is cleanly bypassed to prevent inverted geometry.

#### Scenario: Rendering bridge between adjacent nodes
- **WHEN** the canvas draws a connection between two nodes
- **THEN** the bridge renders with bilaterally symmetric top and bottom curves, smooth C1 tangent continuity at both circle circumferences, and an hourglass waist cinch.

#### Scenario: Two nodes overlap during drag
- **WHEN** a user drags node A until its center is within $R_A + R_B$ of node B
- **THEN** `computeBridgeGeometry` returns null and the bridge is omitted without visual artifacts or inverted curves.
