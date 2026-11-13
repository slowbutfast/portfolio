## ADDED Requirements

### Requirement: Touch pointer cancellation cleanup
The system SHALL bind a `pointercancel` handler on the graph `<canvas>` that ends an active drag without computing or applying release fling velocity and without committing a new `home` anchor, releases pointer capture only if the canvas currently holds capture, resets drag-velocity audio to zero, and clears `downPosRef`, `downNodeIdRef`, and `lastDragPointRef` so a canceled gesture cannot be interpreted as a tap.

#### Scenario: Touch drag interrupted by pointercancel
- **WHEN** a user drags a node on the graph canvas and the browser dispatches `pointercancel`
- **THEN** the simulation exits `drag` state with zero fling velocity and unmoved `home` anchor, drag audio resets to zero, pointer capture is released if held, and subsequent node taps continue to open the inspector.

### Requirement: Mobile sheet upper-strip camera pan
When a project is selected on a mobile sheet viewport and no semantic-nav `focusedId` overrides the camera, the graph camera SHALL pan smoothly using measured geometry (`targetY = headerBottom + (sheetTop - headerBottom) / 2`, accounting for `scale`: `goal.y = targetY - node.y * scale`) so the selected node remains centered in the visible upper strip above the sheet, recomputing on viewport resize or detent change and returning to `(0, 0)` when the sheet closes (even while `stickyFocalId` persists). If `sheetTop - headerBottom < 120px`, the sheet SHALL fall back to the Peek (`28dvh`) detent so the selected node remains unobstructed; full bridge/edge-tag visibility in the strip is best-effort.

#### Scenario: User taps a node on mobile
- **WHEN** a node is tapped on a mobile sheet viewport and `ProjectDrawer` opens
- **THEN** the camera pans the tapped node to the measured midpoint between `headerBottom` and `sheetTop`, and returns to `(0, 0)` when the sheet closes while `stickyFocalId` remains active.

#### Scenario: Viewport resizes or rotates while sheet is open
- **WHEN** the viewport resizes or rotates while a project sheet is open
- **THEN** the camera target recomputes from the updated `headerBottom`, `sheetTop`, and `scale` so the selected node stays visible above the sheet.

### Requirement: Coarse-pointer DPR cap and idle render budget
On `(pointer: coarse)` devices, the graph `<canvas>` SHALL cap its backing-store device pixel ratio at `2`, and when `idleAmbientOnly` is active it SHALL schedule idle redraws via a timed `15 fps` (`66.7 ms`) timer rather than waking `requestAnimationFrame` at the full `60–120 Hz` display rate, while active interactions continue at full frame rate.

#### Scenario: High-DPR mobile device renders idle ambient drift
- **WHEN** the graph renders on a `(pointer: coarse)` device with `devicePixelRatio >= 3` and the simulation is idle
- **THEN** the canvas backing resolution uses `dpr = 2` and JavaScript idle callbacks wake at most every `66.7 ms` instead of spinning `requestAnimationFrame` at display refresh rate.

## MODIFIED Requirements

### Requirement: Sticky inspected focal context and draggable inspector
The system SHALL retain the inspected project's focal connections and contiguous shared-tag labels after `ProjectDrawer` closes. The sticky focus SHALL clear when the `250ms` hover dwell activates on any node (including the inspected node), when a tap/click both begins and ends on empty canvas (`downNodeId === null`, `moved < 6`, and `!hitNode(pointerUp)`), on `Reset`, or when switching to Grid view. While the mobile sheet is open, `drawer-backdrop` intercepts taps above the sheet to close it, so empty-canvas focal clearing applies after the sheet is dismissed. The desktop `ProjectDrawer` SHALL treat its outer `8px` border band on all four edges as a draggable surface, showing the CSS `move` cursor while the pointer is over that band and supporting pointer-captured dragging clamped to the viewport, with a user-drag lock preventing anchor updates from snapping it back. The mobile `< 768px` bottom-sheet drawer SHALL remain non-draggable on its border and SHALL NOT show the `move` cursor.

#### Scenario: User closes the inspector
- **WHEN** the user closes `ProjectDrawer`
- **THEN** the inspected node's focal edges and tag labels remain highlighted until a hover dwell, empty-canvas tap, Reset, or Grid view clears the sticky focus.

#### Scenario: Touch user taps empty canvas to clear sticky focus
- **WHEN** sticky focus is active after the sheet is closed and the user taps empty canvas background (`downNodeId === null`, `moved < 6`, no node hit on `pointerup`)
- **THEN** `stickyFocalId` clears and all nodes/edges return to their resting visual state.

#### Scenario: User drags the desktop inspector
- **WHEN** the user drags any edge of a desktop `ProjectDrawer`
- **THEN** the panel follows the pointer, shows the `move` cursor over its border, stays inside viewport bounds and below the header, and does not snap back to its computed anchor position.
