## MODIFIED Requirements

### Requirement: Top-right header navigation sequence and theme toggle
The system SHALL organize top-right header controls in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and `Filters ▾`, presenting the theme toggle as a direct one-click text button (`bareText`) styled identically to the view toggle, and the sound toggle as an accessible `aria-pressed` button reflecting real-time synthesizer state.

#### Scenario: Desktop visitor views top-right header options
- **WHEN** the header mounts on a desktop or mobile viewport
- **THEN** controls appear in the exact sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾`, with `Sound` reflecting the active sound state via `aria-pressed` and toggling audio playback on click.
