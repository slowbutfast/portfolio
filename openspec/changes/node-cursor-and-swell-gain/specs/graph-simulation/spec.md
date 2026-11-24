## ADDED Requirements

### Requirement: Desktop node grab and grabbing pointer cursor
The system SHALL update the graph `<canvas>` inline CSS `cursor` on desktop pointer interactions to reflect node drag affordance without triggering React re-renders:
- `default` when the pointer is over empty canvas, leaves the canvas (`pointerleave`), or cancels (`pointercancel`).
- `grab` when the pointer hovers over any interactive project node (`pointermove` hit test while not dragging) or releases (`pointerup`) while still over a project node.
- `grabbing` when the pointer presses down on a project node (`pointerdown`) and throughout an active node drag (`sim.state === 'drag'`).

#### Scenario: Pointer hovers over empty canvas and then a node
- **WHEN** the desktop pointer moves over empty canvas space
- **THEN** the computed `cursor` of `graph-canvas` is `default`.
- **WHEN** the desktop pointer moves over a project node circle (`r = 22px`)
- **THEN** the computed `cursor` of `graph-canvas` becomes `grab`.

#### Scenario: Pointer presses, drags, and releases a node
- **WHEN** the desktop user presses `pointerdown` on a project node and drags across the canvas
- **THEN** the computed `cursor` of `graph-canvas` transitions to `grabbing` on `pointerdown` and remains `grabbing` while dragging.
- **WHEN** the user releases the pointer (`pointerup`) while over the node
- **THEN** the computed `cursor` of `graph-canvas` returns to `grab` (or `default` if released over empty canvas).

#### Scenario: Pointer leaves or cancels during hover or drag
- **WHEN** `pointerleave` or `pointercancel` fires on `graph-canvas`
- **THEN** the computed `cursor` of `graph-canvas` resets to `default`.
