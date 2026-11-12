## MODIFIED Requirements

### Requirement: Accessible project inspector drawer
The system SHALL display an accessible inspection drawer (`role="dialog"`, `aria-modal="true"`, focus trap, anchored beside the active node on desktop and presenting as an ergonomic bottom sheet docked to the bottom edge on mobile `< 768px`) with rounded corners, using `max-h-[85dvh]` to avoid mobile address bar clipping, preserving `aria-label={`${title} project details`}` and the semantic `<h2>` heading node without duplicating the root `<h1>`.

#### Scenario: User opens the drawer on desktop
- **WHEN** a project is activated on a desktop viewport (`>= 768px`)
- **THEN** the drawer mounts with `aria-modal="true"`, traps focus inside the container, anchors adjacent to the clicked node, and displays elevated `Code ↗` and `Visit ↗` actions in the sticky header.

#### Scenario: User opens the drawer on mobile
- **WHEN** a project is activated on a mobile viewport (`< 768px`)
- **THEN** the drawer docks to the bottom of the viewport (`fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85dvh]`) as an ergonomic bottom sheet with smooth touch scrolling and focus trapping.

#### Scenario: User closes the drawer
- **WHEN** the user clicks the close button, clicks the backdrop, or presses the Escape key
- **THEN** the drawer unmounts, keyboard focus returns cleanly to the triggering element, and the URL hash is cleared.

## ADDED Requirements

### Requirement: Elevated primary repository and live project actions
The system SHALL display permanent primary action links for `Code ↗` (GitHub repository) and, when `liveUrl` is declared, `Visit ↗` (live deployment or web demo) pinned in the sticky header directly below the project title, providing descriptive accessible names (e.g. `aria-label="OpenDungeon source code, opens in new tab"`) with `aria-hidden="true"` arrows. The legacy `Link` tab (`data-testid="preview-tab-link"`) SHALL be retired and completely removed from the preview tablist (`role="tablist"`), ensuring primary repository and demo links never require a tab switch to discover. Any non-repository reference linkouts (such as external articles or documentation) SHALL be rendered contextually within the Project Overview / Details section rather than as a standalone preview tab.

#### Scenario: User inspects a project with a live URL
- **WHEN** the inspector drawer opens for a project with `liveUrl` declared
- **THEN** both `Code ↗` and `Visit ↗` appear in the sticky header below the title, with accessible descriptions and `target="_blank"`, and no redundant `Link` tab appears in the tablist.

#### Scenario: Drawer tablist contains only deep inspection modalities
- **WHEN** the drawer renders preview tabs
- **THEN** the tablist contains only `Media` and/or `Terminal` tabs, and does not render a redundant `Link` tab.

### Requirement: Segmented content preview tabs track
The system SHALL format content preview tabs (`Media`, `Terminal`) within a distinct segmented container track (`bg-[var(--color-surface-container)] rounded-full p-1`), visually separating navigation modalities from metadata tags, with the active tab elevated via solid surface background and text contrast, and button targets providing $\ge 44\text{px}$ touch targets on mobile.

#### Scenario: Inspecting project with multiple preview modes
- **WHEN** the drawer opens for a project declaring both terminal and media previews
- **THEN** tabs render in a rounded segmented container clearly distinct from project tags, with active tab styled with high-contrast background.

### Requirement: Interactive node hover card with pointer transfer rules
The system SHALL render an interactive floating hover card (`NodeHoverCard`) on pointer-capable desktop devices (`(hover: hover) and (pointer: fine)`) when hovering over a graph node, featuring media preview, title, summary, tags, and direct `Code ↗` and `Visit ↗` buttons:
- When pointer leaves the graph node, a 150ms dismissal timer starts.
- If pointer enters the hover card during this grace period, the dismissal timer is cancelled (`clearTimeout`) and the card remains open.
- When pointer leaves the hover card, the 150ms dismissal timer restarts.
- If a canvas node drag begins, the hover card is immediately dismissed.

#### Scenario: User moves pointer into the hover card
- **WHEN** the pointer moves from the node into the hover card within 150ms
- **THEN** dismissal is cancelled and the hover card remains interactive.

#### Scenario: User initiates a canvas node drag while hover card is open
- **WHEN** the pointer triggers a drag event on any canvas node
- **THEN** the hover card immediately unmounts without lagging behind the gesture.
