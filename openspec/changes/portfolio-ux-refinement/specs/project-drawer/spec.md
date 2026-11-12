## MODIFIED Requirements

### Requirement: Accessible project inspector drawer
The system SHALL display an accessible inspection drawer (`role="dialog"`, `aria-modal="true"`, focus trap, anchored beside the active node on desktop and presenting as an ergonomic bottom sheet docked to the bottom edge on mobile `< 768px`) with rounded corners matching the design token, preserving `aria-label={`${title} project details`}` and the semantic `<h2>` heading node without duplicating the root `<h1>`.

#### Scenario: User opens the drawer on desktop
- **WHEN** a project is activated on a desktop viewport (`>= 768px`)
- **THEN** the drawer mounts with `aria-modal="true"`, traps focus inside the container, anchors adjacent to the clicked node, and displays elevated `Code ↗` and `Visit ↗` actions in the sticky header alongside preview tabs.

#### Scenario: User opens the drawer on mobile
- **WHEN** a project is activated on a mobile viewport (`< 768px`)
- **THEN** the drawer docks to the bottom of the viewport (`fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh]`) as an ergonomic bottom sheet with smooth touch scrolling and focus trapping.

#### Scenario: User closes the drawer
- **WHEN** the user clicks the close button, clicks the backdrop, or presses the Escape key
- **THEN** the drawer unmounts, keyboard focus returns cleanly to the triggering element, and the URL hash is cleared.

## ADDED Requirements

### Requirement: Elevated primary repository and live project actions
The system SHALL display permanent primary action links for `Code ↗` (GitHub repository) and, when `liveUrl` is declared, `Visit ↗` (live deployment or web demo) pinned in the sticky header directly below the project title, guaranteeing immediate one-click discoverability without requiring users to switch preview tabs.

#### Scenario: User inspects a project with a live URL
- **WHEN** the inspector drawer opens for a project with `liveUrl` declared (e.g. OpenDungeon, Sandwave Sim, Transcribe Plus)
- **THEN** both `Code ↗` and `Visit ↗` appear prominently in the header below the title, with `Visit ↗` highlighted with accent styling.

#### Scenario: User inspects a project without a live URL
- **WHEN** the inspector drawer opens for a project without `liveUrl` declared (e.g. CLI or WebExtension)
- **THEN** the `Code ↗` button appears prominently in the header and the `Visit ↗` button is omitted without layout displacement.

### Requirement: Interactive node hover card with direct action buttons
The system SHALL render an interactive floating hover card (`NodeHoverCard`) on pointer-capable desktop devices (`pointer: fine`) when hovering over a graph node, featuring media preview, title, summary, tags, and direct one-click `Code ↗` and `Visit ↗` buttons, remaining open when the cursor transitions onto the card and opening the full project drawer when the card body is clicked.

#### Scenario: User hovers over a graph node
- **WHEN** the pointer hovers over a project node on desktop
- **THEN** the hover card appears with media preview, title, tags, and clickable `Code ↗` and `Visit ↗` buttons.

#### Scenario: User clicks Code or Visit from the hover card
- **WHEN** the user clicks the `Code ↗` or `Visit ↗` link in the hover card
- **THEN** the corresponding external URL opens in a new browser tab without opening the full inspector drawer or disrupting graph position.

#### Scenario: User clicks the hover card body
- **WHEN** the user clicks the hover card body outside the direct action links
- **THEN** the inspector drawer opens for the selected project.
