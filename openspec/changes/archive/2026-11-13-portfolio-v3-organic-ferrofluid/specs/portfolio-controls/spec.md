## MODIFIED Requirements

### Requirement: Top-right header navigation sequence and theme toggle
The system SHALL organize top-right header controls in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and a 3-dot overflow menu button (`aria-label="Filters & Layout"`), presenting the theme toggle as a direct one-click text button (`bareText`), the sound toggle as an accessible `aria-pressed` button reflecting real-time synthesizer state, and moving the `Filters` section heading inside the 3-dot dropdown panel alongside a `Reset layout` action below the filter controls.

#### Scenario: Desktop visitor views top-right header options
- **WHEN** the header mounts on a desktop or mobile viewport
- **THEN** controls appear in the exact sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and the 3-dot menu trigger (`data-testid="controls-dropdown-trigger"`), with `Sound` reflecting the active sound state via `aria-pressed` and toggling audio playback on click.

#### Scenario: User opens the 3-dot menu and resets graph layout
- **WHEN** the user opens the 3-dot menu (`data-testid="controls-dropdown"`)
- **THEN** the panel displays a `"Filters"` heading above the search input and tag pills, and a `"Reset layout"` button (`data-testid="reset-layout"`) below the filter section that restores all user-pinned nodes and detached bridges to the planar resting equilibrium.
