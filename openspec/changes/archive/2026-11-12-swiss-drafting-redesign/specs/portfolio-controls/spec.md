## MODIFIED Requirements

### Requirement: Graph and list view toggle
The system SHALL provide an instant view toggle allowing users to switch between the interactive 2D Canvas Graph View and an asymmetric two-column Swiss editorial publication layout, exposing accessible button names `Graph` and `List` styled visually with bracket pseudo-elements.

#### Scenario: Switching from graph view to list view
- **WHEN** the user clicks the 'List' toggle button (`getByRole('button', { name: 'List' })`)
- **THEN** the canvas is replaced with a two-column Swiss editorial publication view displaying all 6 projects with monumental index numerals (`01`–`06`), summaries, tags, and direct preview triggers.

#### Scenario: Switching from list view to graph view
- **WHEN** the user clicks the 'Graph' toggle button (`getByRole('button', { name: 'Graph' })`)
- **THEN** the interface returns to the interactive physics canvas.

## ADDED Requirements

### Requirement: Peripheral margin architecture and DOM registration crop marks
The system SHALL frame the viewport with a Swiss editorial margin HUD featuring zero border radii (`rounded-none`), 1px hairline borders (`#71717a` for interactive elements; `#27272a` for decorative rules), and 4 DOM-rendered corner registration crop marks positioned with `env(safe-area-inset-*)`.

#### Scenario: Viewport rendering on desktop and mobile
- **WHEN** the controls overlay mounts
- **THEN** 4 corner crop marks render via absolute `<div>` elements with 1px borders and `env(safe-area-inset-*)` padding, marked `aria-hidden="true"` with `pointer-events: none`.

### Requirement: Zero-re-render rAF coordinate ticker
The system SHALL display real-time pointer coordinates in canvas-local pixel space (`[X, Y]`) updated via direct DOM mutation (`ref.current.textContent`) throttled to requestAnimationFrame, rendering `X: --- Y: ---` when unmounted, in list view, or on non-pointer touch devices, and keeping coordinates strictly outside assistive screen-reader announcements (`aria-hidden="true"`).

#### Scenario: Pointer moves across the canvas
- **WHEN** the pointer moves within the graph canvas
- **THEN** the margin ticker element updates its text content imperatively at animation frame rate in canvas-local coordinates while the React component tree does not re-render.

#### Scenario: User switches to list view or pointer leaves canvas
- **WHEN** the application switches to list view or the pointer leaves the canvas boundary
- **THEN** the margin ticker element clears or displays `X: --- Y: ---`.

### Requirement: Accessible button names with visual bracket pseudo-elements
The system SHALL render visual brackets (`[ GRAPH ]`, `[ LIST ]`, `[LLM]`) using CSS `::before` and `::after` pseudo-elements so that the accessible DOM text remains clean (`Graph`, `List`, `LLM`) without corrupting accessible name computation or Playwright role selectors.

#### Scenario: Accessible query for controls
- **WHEN** assistive technology or an automated test queries for `getByRole('button', { name: 'Graph' })`
- **THEN** the accessible name matches `"Graph"` exactly while visually displaying `[ GRAPH ]`.
