## MODIFIED Requirements

### Requirement: Interactive node hover card with pointer transfer rules
The system SHALL render an interactive floating hover card (`NodeHoverCard`) on pointer-capable desktop devices (`(hover: hover) and (pointer: fine)`) when hovering over a graph node, featuring media preview (including a `WIP` card for `wip` previews), title, summary, tags, conditional `Code ↗` (only when `project.repo` is defined), and `Visit ↗` (when `project.liveUrl` is defined):
- When pointer leaves the graph node, a 150ms dismissal timer starts.
- If pointer enters the hover card during this grace period, the dismissal timer is cancelled (`clearTimeout`) and the card remains open.
- When pointer leaves the hover card, the 150ms dismissal timer restarts.
- If a canvas node drag begins, the hover card is immediately dismissed.
- The `"Click to inspect ↗"` hint SHALL render only before any node has been clicked/inspected in the current session (`hasInspectedAnyNode === false`); once any node is clicked, the hint SHALL stay hidden across `"Reset layout"` and only return on a fresh page reload.

#### Scenario: User moves pointer into the hover card
- **WHEN** the pointer moves from the node into the hover card within 150ms
- **THEN** dismissal is cancelled and the hover card remains interactive.

#### Scenario: User initiates a canvas node drag while hover card is open
- **WHEN** the pointer triggers a drag event on any canvas node
- **THEN** the hover card immediately unmounts without lagging behind the gesture.

#### Scenario: Hover hint hides after first node click and stays hidden across canvas reset
- **WHEN** the user hovers a node (seeing `"Click to inspect ↗"`), clicks any node to open the inspector, closes the inspector, and triggers `"Reset layout"`
- **THEN** hovering a node afterwards does NOT show `"Click to inspect ↗"` until the page is reloaded.

## ADDED Requirements

### Requirement: Minimal inspector mode for unnumbered WIP entries
`ProjectDrawer` SHALL omit the catalog index badge (`09`) when `project.omitIndex` is `true`, and omit the bottom `Overview` section (`drawer-overview`) when `project.hideOverview` is `true`, while retaining the `Media` tab for projects that declare `video`, `screenshot`, or `wip` previews.

#### Scenario: Inspecting ART displays minimal WIP header without index, Media tab, or Overview
- **WHEN** the user inspects `art-wip` in `ProjectDrawer`
- **THEN** the drawer displays `ART`, `WIP`, tags (`Design`, `Graphics`), and `Visit ↗` pointing to `/art/`, without an index badge, `Media` tab, or `Overview` section.
