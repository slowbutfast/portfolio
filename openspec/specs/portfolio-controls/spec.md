# portfolio-controls Specification

## Purpose

Renders top-level HUD controls including view mode toggle, tag filtering, real-time search, deep linking, and accessible keyboard navigation.
## Requirements
### Requirement: Graph and list view toggle
The system SHALL provide an instant view toggle allowing users to switch between the interactive 2D Canvas Graph View and an asymmetric two-column Swiss editorial publication layout, exposing accessible button names `Graph` and `Grid` as bare header text.

#### Scenario: Switching from graph view to list view
- **WHEN** the user clicks the 'Grid' toggle button (`getByRole('button', { name: 'Grid' })`)
- **THEN** the canvas is replaced with a two-column Swiss editorial publication view displaying all 6 projects with monumental index numerals (`01`–`06`), summaries, tags, and direct preview triggers.

#### Scenario: Switching from list view to graph view
- **WHEN** the user clicks the 'Graph' toggle button (`getByRole('button', { name: 'Graph' })`)
- **THEN** the interface returns to the interactive physics canvas.

### Requirement: Tag filter and node dimming
The system SHALL support selecting paradigm tag pills (combining via OR) to dim non-matching projects to 20% opacity and assign `data-dimmed="true"` on their semantic DOM elements, while keeping matching nodes and connecting links fully illuminated.

#### Scenario: User clicks a tag pill
- **WHEN** the user selects a paradigm tag pill (e.g., 'LLM' or 'Express')
- **THEN** matching nodes and connecting links remain fully visible and non-matching nodes dim to reduced opacity with `data-dimmed="true"` set on their corresponding DOM button.

### Requirement: Search filter
The system SHALL filter visible nodes in real-time as search text is entered (matching title, summary, or tags), dimming non-matching nodes with `data-dimmed="true"`.

#### Scenario: User searches for a term
- **WHEN** the user types into the search input
- **THEN** projects matching the search query remain illuminated while non-matching projects dim to reduced opacity with `data-dimmed="true"` set on their DOM buttons.

### Requirement: Keyboard accessibility and focus mirroring
The system SHALL provide a semantic DOM navigation tree (`<nav aria-label="Projects">`) where keyboard focus (`Tab`) mirrors a high-contrast focus indicator onto the corresponding canvas node and pans the camera into view.

#### Scenario: Tabbing through projects in graph view
- **WHEN** a user navigates projects using the Tab key
- **THEN** keyboard focus moves through project elements in the DOM, a high-contrast focus ring renders around the active canvas node, and pressing Enter opens the selected project drawer.

### Requirement: Deep linking and history navigation
The system SHALL support deep linking via URL hash (`#/p/:id`) to open a specific project directly on page load and handle browser back/forward navigation via `hashchange` listeners, safely ignoring unknown project identifiers.

#### Scenario: User visits URL with valid project hash
- **WHEN** a user loads the page with hash `#/p/open-dungeon`
- **THEN** the application opens the OpenDungeon project drawer immediately on mount.

#### Scenario: User visits URL with unknown project hash
- **WHEN** a user loads the page with hash `#/p/non-existent-tool`
- **THEN** the application safely ignores the unknown slug and presents the default graph view without errors.

#### Scenario: User closes the drawer
- **WHEN** the user closes an active project drawer
- **THEN** the URL hash is cleared without causing page scroll jump.

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

### Requirement: Default Light theme and first-paint flash prevention
The system SHALL default new visitors to the Light color scheme on first visit while preserving explicit user theme choices in `localStorage`, and enforce immediate theme application before initial body paint via a synchronous blocking script (`/theme-init.js`) to prevent dark-to-light theme flashes.

#### Scenario: First-time visitor opens site
- **WHEN** a visitor loads the application without prior `localStorage` state
- **THEN** the application renders in the Light color scheme by default.

#### Scenario: Returning visitor with dark preference
- **WHEN** a visitor with `localStorage.getItem('portfolio_theme') === 'dark'` loads the application
- **THEN** the `/theme-init.js` script immediately sets `data-theme="dark"` on `document.documentElement` before body paint with zero visual flashing.

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

### Requirement: Accessible About modal dialog with canonical bio
The system SHALL provide an accessible About dialog (`role="dialog"`, `aria-modal="true"`, `aria-label="About Gregory Lazatin"`, with focus trap, backdrop dismissal, Escape key handler, and `#/about` deep-link routing) presenting candidate name, the canonical Brown University bio statement, and top-mounted contact buttons (Email, LinkedIn, GitHub, Resume), with all role subtitles and focus area tags omitted.

#### Scenario: User opens About dialog
- **WHEN** the user activates the About dialog
- **THEN** the dialog renders the candidate name, the exact Brown University bio copy, and top-mounted contact channels without subtitle headers or focus area tag pills.

#### Scenario: User dismisses About dialog
- **WHEN** the user presses Escape, clicks the close button, or clicks the backdrop
- **THEN** the dialog unmounts, focus returns to the triggering "About" button, and the URL hash is cleared.

### Requirement: Progressive top bar scroll scrim
The system SHALL render a progressive gradient backdrop scrim (`from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent`) and subtle backdrop blur behind the top bar controls to preserve high contrast and 100% text legibility when project cards or background elements scroll beneath the top bar in Grid view.

#### Scenario: Scrolling content under the top bar in Grid view
- **WHEN** the user switches to Grid view and scrolls project cards down the page
- **THEN** cards pass smoothly underneath the progressive gradient scrim without colliding illegibly with top bar text or buttons.

