## ADDED Requirements

### Requirement: Default Light theme and first-paint flash prevention
The system SHALL default new visitors to the Light color scheme on first visit while preserving explicit user theme choices in `localStorage`, and enforce immediate theme application before initial body paint via a synchronous blocking script (`/theme-init.js`) to prevent dark-to-light theme flashes.

#### Scenario: First-time visitor opens site
- **WHEN** a visitor loads the application without prior `localStorage` state
- **THEN** the application renders in the Light color scheme by default.

#### Scenario: Returning visitor with dark preference
- **WHEN** a visitor with `localStorage.getItem('portfolio_theme') === 'dark'` loads the application
- **THEN** the `/theme-init.js` script immediately sets `data-theme="dark"` on `document.documentElement` before body paint with zero visual flashing.

### Requirement: Top-right header navigation sequence and theme toggle
The system SHALL organize top-right header controls in the canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, and `Filters ▾`, presenting the theme toggle as a direct one-click text button (`bareText`) styled identically to the view toggle, removing it from the Filters dropdown.

#### Scenario: Desktop visitor views top-right header options
- **WHEN** the header mounts on a desktop or mobile viewport
- **THEN** controls appear in the sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, `Filters ▾`, with `Dark`/`Light` reflecting the active theme and toggling theme on click.

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
