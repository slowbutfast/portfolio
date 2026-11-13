## MODIFIED Requirements

### Requirement: Accessible project inspector drawer
The system SHALL display an accessible inspection drawer (`role="dialog"`, `aria-modal="true"`, focus trap, anchored beside the active node on desktop and presenting as a draggable multi-detent bottom sheet docked to the bottom edge when `width < 768` or `(pointer: coarse)` with `height < 500`) with rounded corners, preserving `aria-label={`${title} project details`}` and the semantic `<h2>` heading node without duplicating the root `<h1>`. On sheet mode (`isSheet`), the sheet SHALL open at the **Half (`56dvh`)** detent with a tactile top drag handle (`data-testid="sheet-drag-handle"`) that snaps smoothly between **Peek (`28dvh`)**, **Half (`56dvh`)**, and **Expanded (`86dvh`)** detents (and dismisses when dragged below `16dvh` or flicked downward), keep only `[handle] + index badge + title + Close` in the sticky top header while scrolling `summary` and `Code ↗`/`Visit ↗` inside the body, and include `env(safe-area-inset-bottom)` clearance at the bottom of the scrollable body while keeping `drawer-backdrop` tap-to-close active across all detents.

#### Scenario: User opens the drawer on desktop
- **WHEN** a project is activated on a desktop viewport (`>= 768px`)
- **THEN** the drawer mounts with `aria-modal="true"`, traps focus inside the container, anchors adjacent to the clicked node, and displays elevated `Code ↗` and `Visit ↗` actions in the sticky header.

#### Scenario: User opens the drawer on mobile
- **WHEN** a project is activated on a mobile viewport (`< 768px`)
- **THEN** the drawer docks to the bottom of the viewport (`fixed inset-x-0 bottom-0 rounded-t-2xl`) at the default `56dvh` Half detent with a slim sticky header (`[handle] + index + title + Close`), bottom safe-area inset padding, smooth inner touch scrolling, and focus trapping, leaving the upper `~44%` of the graph viewport visible.

#### Scenario: User drags the mobile sheet handle between detents
- **WHEN** the user drags `data-testid="sheet-drag-handle"` upward, downward, or below `16dvh`
- **THEN** the sheet tracks the pointer 1:1 and snaps to `86dvh` (Expanded) or `28dvh` (Peek) on release, or dismisses cleanly when dragged below `16dvh` or flicked downward.

#### Scenario: User closes the drawer
- **WHEN** the user clicks the close button, clicks the backdrop, or presses the Escape key
- **THEN** the drawer unmounts, keyboard focus returns cleanly to the triggering element, and the URL hash is cleared.
