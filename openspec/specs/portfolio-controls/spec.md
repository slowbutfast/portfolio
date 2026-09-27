# portfolio-controls Specification

## Purpose

Renders top-level HUD controls including view mode toggle, tag filtering, real-time search, deep linking, and accessible keyboard navigation.

## Requirements

### Requirement: Graph and list view toggle
The system SHALL provide an instant view toggle allowing users to switch between the interactive 2D Canvas Graph View and a responsive Card List View.

#### Scenario: Switching from graph view to list view
- **WHEN** the user clicks the 'List View' toggle button
- **THEN** the canvas is replaced with a responsive grid displaying all 6 projects with titles, summaries, tags, and direct preview triggers.

#### Scenario: Switching from list view to graph view
- **WHEN** the user clicks the 'Graph View' toggle button
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
