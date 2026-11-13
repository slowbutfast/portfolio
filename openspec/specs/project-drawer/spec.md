# project-drawer Specification

## Purpose

Provides an adaptive project inspection drawer that renders discriminated preview modalities including interactive terminal emulation, media playback, and direct repository links.
## Requirements
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

### Requirement: Interactive terminal simulation
The system SHALL provide a client-side terminal simulator for projects declaring a terminal demo, dynamically resolving commands against the project's own command table (`TerminalDemo.commands`), displaying a surgical cyan `>_` prompt, and highlighting diagnostic exit codes with an amber warning chip on non-zero exit codes (e.g. exit code 127) and green/neutral on exit code 0.

#### Scenario: Running a recognized per-project command
- **WHEN** the user types or clicks a command chip defined in the active project's `terminalDemo.commands` (e.g., '--schema' for Resume Builder or 'npm test' for Transcribe Plus)
- **THEN** the terminal executes the command client-side, records it to command history, and displays the formatted output with exit code 0 in neutral/green status.

#### Scenario: Running an unrecognized command or command with non-zero exit code
- **WHEN** the user enters an unrecognized command or runs a command returning non-zero status
- **THEN** the terminal displays exit code 127 with an amber diagnostic chip (`#eab308`) without executing arbitrary external code.

### Requirement: Media preview playback
The system SHALL support video and screenshot preview playback inside the project drawer without requiring external iframe embedding.

#### Scenario: Project declares a video demo
- **WHEN** a project with a video preview (Transcribe Plus) is opened in the drawer
- **THEN** an accessible HTML5 video player renders with playback controls and plays the bundled asset (`clip.mp4`).

#### Scenario: Project declares a screenshot preview
- **WHEN** a project with a screenshot preview (OpenDungeon, PICT Viz, Sandwave Sim, or Attention Max) is opened in the drawer
- **THEN** the high-resolution screenshot renders with an accessible caption.

### Requirement: Accessible stepped character decoding title overlay
The system SHALL animate the project title upon drawer open using a rapid, non-interpolated stepped character decode effect running strictly inside an `aria-hidden="true"` visual container placed in the same CSS grid cell as the permanent semantic `<h2 className="sr-only">` to prevent layout width jitter, while clearing all timers upon component unmount or project switching.

#### Scenario: User opens drawer with animations enabled
- **WHEN** a project drawer opens under standard motion preferences
- **THEN** a visual scramble animation cycles through random glyphs at 12fps for no longer than 350ms before resolving to the exact project title, while screen readers immediately receive the static, uncorrupted title from the semantic `<h2>`.

#### Scenario: User opens drawer with reduced motion enabled
- **WHEN** the user opens a project drawer with `prefers-reduced-motion: reduce` active
- **THEN** the title immediately renders in its final resolved state without executing the stepped decoding timer.

#### Scenario: Component unmounts or project changes during scramble
- **WHEN** the drawer is dismissed or another project is selected via deep-link hash while the 350ms animation is in progress
- **THEN** the interval timer is immediately cleared without memory leaks or state updates on an unmounted component.

### Requirement: Architectural blueprint specimen layout
The system SHALL format the project drawer as an engineering blueprint featuring an oversized watermark numeral (`01`–`06`) in the background, sharp 1px hairline separators, monospaced metadata headers with portfolio build SHA, and surgical cyan accents for active tabs.

#### Scenario: Viewing the blueprint drawer
- **WHEN** the project drawer is displayed
- **THEN** it renders with zero corner radius, an oversized translucent watermark index numeral, and sharp monospaced section headers.

### Requirement: Elevated primary repository and live project actions
The system SHALL display permanent primary action links for `Code ↗` (when `repo` is declared) and `Visit ↗` (when `liveUrl` is declared) pinned in the sticky header directly below the project title, providing descriptive accessible names (e.g. `aria-label="OpenDungeon source code, opens in new tab"`) with `aria-hidden="true"` arrows. If a project does not declare a `repo` (such as `ivy-film-festival-2026`), the system SHALL cleanly omit the `Code ↗` button and render `Visit ↗` as the sole primary action link. The legacy `Link` tab (`data-testid="preview-tab-link"`) SHALL be retired and completely removed from the preview tablist (`role="tablist"`), ensuring primary repository and demo links never require a tab switch to discover. Any non-repository reference linkouts (such as external articles or documentation) SHALL be rendered contextually within the Project Overview / Details section rather than as a standalone preview tab.

#### Scenario: User inspects a project with a live URL and repository
- **WHEN** the inspector drawer opens for a project with both `repo` and `liveUrl` declared
- **THEN** both `Code ↗` and `Visit ↗` appear in the sticky header below the title, with accessible descriptions and `target="_blank"`, and no redundant `Link` tab appears in the tablist.

#### Scenario: User inspects a project without a public repository
- **WHEN** the inspector drawer opens for a project without a `repo` (e.g., `ivy-film-festival-2026`)
- **THEN** `Visit ↗` renders as the primary action button and `Code ↗` is omitted cleanly without rendering a broken or empty anchor element.

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

### Requirement: Frame-rate independent smooth anchor tracking
The system SHALL smoothly track the active project node's screen coordinates when `anchor` coordinates update (such as during physics settlement or window resize) using an exponential lerp factor ($P_{drawer}(t + \Delta t) = P_{drawer}(t) + (P_{node}(t) - P_{drawer}(t)) \times (1 - e^{-\lambda \Delta t})$ with $\lambda \approx 18$) driven directly by `requestAnimationFrame`, snapping to integer coordinates upon rest to preserve text sharpness, and anchoring statically without continuous motion when `prefers-reduced-motion: reduce` is active.

#### Scenario: Anchor coordinates update during physics settlement
- **WHEN** the canvas node anchor position updates while its inspection drawer is open
- **THEN** the drawer smoothly interpolates toward the target position without discrete interval jitter or subpixel text blurring.

#### Scenario: Anchor coordinates reach resting equilibrium
- **WHEN** the interpolation error $\|P_{drawer} - P_{node}\| < 0.5\text{px}$
- **THEN** the drawer coordinates snap to integer pixels and the animation loop suspends.

