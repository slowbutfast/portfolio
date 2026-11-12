## ADDED Requirements

### Requirement: Frame-rate independent smooth anchor tracking
The system SHALL smoothly track the active project node's screen coordinates when `anchor` coordinates update (such as during physics settlement or window resize) using an exponential lerp factor ($P_{drawer}(t + \Delta t) = P_{drawer}(t) + (P_{node}(t) - P_{drawer}(t)) \times (1 - e^{-\lambda \Delta t})$ with $\lambda \approx 18$) driven directly by `requestAnimationFrame`, snapping to integer coordinates upon rest to preserve text sharpness, and anchoring statically without continuous motion when `prefers-reduced-motion: reduce` is active.

#### Scenario: Anchor coordinates update during physics settlement
- **WHEN** the canvas node anchor position updates while its inspection drawer is open
- **THEN** the drawer smoothly interpolates toward the target position without discrete interval jitter or subpixel text blurring.

#### Scenario: Anchor coordinates reach resting equilibrium
- **WHEN** the interpolation error $\|P_{drawer} - P_{node}\| < 0.5\text{px}$
- **THEN** the drawer coordinates snap to integer pixels and the animation loop suspends.

## MODIFIED Requirements

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
