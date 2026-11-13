## MODIFIED Requirements

### Requirement: Top-right header navigation sequence and theme toggle
The system SHALL organize top-right header controls on desktop (`>= 640px` with hover capability) in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and a 3-dot overflow menu button (`aria-label="Filters & Layout"`), presenting the theme toggle as a direct one-click text button (`bareText`), the sound toggle as an accessible `aria-pressed` button reflecting real-time synthesizer state, and moving the `Filters` section heading inside the 3-dot dropdown panel alongside a singular `Reset` action below the filter controls that clears filters, graph layout, and visited-node colors. On mobile (`< 640px`), the top bar SHALL omit `GitHub ↗` (which remains accessible via `AboutModal`'s `about-github` link) and present `About`, `Dark`/`Light`, `Graph`/`Grid`, and the 3-dot menu trigger on a single row at `>= 360px` (gracefully wrapping at `320px` without truncating the candidate wordmark). On `< 640px` OR `(hover: none)` devices, `Sound` SHALL move inside `#portfolio-controls`, and `controls-dropdown-trigger` SHALL display a subtle `--color-accent` indicator dot when sound is enabled.

#### Scenario: Desktop visitor views top-right header options
- **WHEN** the header mounts on a hover-capable desktop viewport (`>= 640px` and `hover: hover`)
- **THEN** controls appear in the exact sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and the 3-dot menu trigger (`data-testid="controls-dropdown-trigger"`), with `Sound` reflecting the active sound state via `aria-pressed` and toggling audio playback on click.

#### Scenario: Mobile visitor views top-right header options
- **WHEN** the header mounts on a mobile viewport (`< 640px`)
- **THEN** the top bar omits `nav-github` and top-bar `audio-toggle`, displaying `About`, `Dark`/`Light`, `Graph`/`Grid`, and `controls-dropdown-trigger` on a single row at `>= 360px` (wrapping cleanly without clipping or wordmark truncation at `320px`), with an accent dot on `controls-dropdown-trigger` whenever sound is enabled.

#### Scenario: User opens the 3-dot menu and resets graph layout
- **WHEN** the user opens the 3-dot menu (`data-testid="controls-dropdown"`)
- **THEN** the panel displays a `"Filters"` heading above the search input and tag pills, constrains height to `max-h-[calc(100dvh-5rem)] overflow-y-auto`, and keeps one `"Reset"` button (`data-testid="reset-layout"`) reachable below the filter section that clears active filters/search, restores the planar layout, and clears visited-node colors.

### Requirement: Sound volume popover and persisted gain
On hover-capable desktop (`>= 640px` and `hover: hover`), the system SHALL render a vertical volume slider popover anchored beneath the `Sound` toggle when sound is enabled and the toggle is hovered, focused, or switched on, hiding `500ms` after the pointer leaves the toggle/popover or immediately when sound is disabled. On `< 640px` OR `(hover: none)` devices (including tablets and landscape phones), the 3-dot dropdown panel (`#portfolio-controls`) SHALL include a `44px`-tall Sound toggle (`data-testid="mobile-audio-toggle"`) and a horizontal touch-friendly (`touch-action: none`) volume slider (`data-testid="mobile-volume-slider"`). Both sliders SHALL persist a clamped `[0, 1]` value under `portfolio_sound_volume` and scale master gain by `volume * MASTER_GAIN`, with `0` leaving Sound enabled (`aria-pressed="true"`) at zero gain.

#### Scenario: User adjusts sound volume
- **WHEN** sound is enabled on `>= 640px` with `hover: hover` and the user hovers/focuses `Sound` or turns it on
- **THEN** the vertical volume popover appears, the slider reflects the persisted volume, and changing it updates audio gain immediately without disabling Sound at `0`.

#### Scenario: User adjusts sound and volume on mobile or coarse-hover tablet
- **WHEN** the user opens the 3-dot menu on `< 640px` or `(hover: none)`
- **THEN** `mobile-audio-toggle` and the horizontal `mobile-volume-slider` are immediately interactive with `>= 44px` touch target height and persist volume under `portfolio_sound_volume`.

#### Scenario: User leaves the volume control
- **WHEN** the pointer leaves both the desktop `Sound` toggle and its popover
- **THEN** the popover auto-hides after `500ms`; turning Sound off hides it immediately.
