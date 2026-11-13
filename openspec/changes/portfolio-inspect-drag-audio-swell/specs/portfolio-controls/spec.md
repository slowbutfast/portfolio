## MODIFIED Requirements

### Requirement: Top-right header navigation sequence and theme toggle
The system SHALL organize top-right header controls on desktop (`>= 640px` with hover capability) in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and a 3-dot overflow menu button (`aria-label="Filters & Layout"`), presenting the theme toggle as a direct one-click text button (`bareText`), the sound toggle as an accessible `aria-pressed` button reflecting real-time synthesizer state, and moving the `Filters` section heading inside the 3-dot dropdown panel alongside a singular `Reset` action below the filter controls that clears filters, graph layout, and visited-node colors. On mobile (`< 640px`), the top bar SHALL omit `GitHub ↗` (which remains accessible via `AboutModal`'s `about-github` link) and present `About`, `Dark`/`Light`, `Graph`/`Grid`, and the 3-dot menu trigger on a single row at `>= 360px` (gracefully wrapping at `320px` without truncating the candidate wordmark). On `< 640px` OR `(hover: none)` devices, `Sound` SHALL move inside `#portfolio-controls`. Whenever sound is enabled, the `controls-dropdown-trigger` 3-dot glyph itself SHALL render in `--color-accent` on both desktop and mobile; no separate indicator dot SHALL be rendered.

#### Scenario: Desktop visitor views top-right header options
- **WHEN** the header mounts on a hover-capable desktop viewport (`>= 640px` and `hover: hover`)
- **THEN** controls appear in the exact sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and the 3-dot menu trigger (`data-testid="controls-dropdown-trigger"`), with `Sound` reflecting the active sound state via `aria-pressed`, the 3-dot glyph rendering in `--color-accent` whenever sound is enabled, and clicking `Sound` toggling audio playback.

#### Scenario: Mobile visitor views top-right header options
- **WHEN** the header mounts on a mobile viewport (`< 640px`)
- **THEN** the top bar omits `nav-github` and top-bar `audio-toggle`, displaying `About`, `Dark`/`Light`, `Graph`/`Grid`, and `controls-dropdown-trigger` on a single row at `>= 360px` (wrapping cleanly without clipping or wordmark truncation at `320px`), with the 3-dot glyph rendered in `--color-accent` whenever sound is enabled and no separate indicator dot.

#### Scenario: User opens the 3-dot menu and resets graph layout
- **WHEN** the user opens the 3-dot menu (`data-testid="controls-dropdown"`)
- **THEN** the panel displays a `"Filters"` heading above the search input and tag pills, constrains height to `max-h-[calc(100dvh-5rem)] overflow-y-auto`, and keeps one `"Reset"` button (`data-testid="reset-layout"`) reachable below the filter section that clears active filters/search, restores the planar layout, and clears visited-node colors.
