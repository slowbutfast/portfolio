## ADDED Requirements

### Requirement: Unlocked Art navigation link
The system SHALL render a primary navigation link (`Art`, `href="/art/"`, same-tab navigation without `target="_blank"`, `data-testid="nav-art"`) as the leftmost item inside the top-right header navigation group (`ml-auto`) whenever `art-wip` discovery is unlocked (`loadArtDiscoveryState().unlocked === true`), styled with the same static primary link appearance (`bareText`) as `About`, `Graph`/`Grid`, and `Dark`/`Light`. Because it is prepended on the left edge of the right-aligned nav group, unlocking `Art` SHALL NOT shift the horizontal position of `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, or `controls-dropdown-trigger`. The `Art` link SHALL remain visible on both desktop and mobile viewports without overlapping `brand-home`, SHALL persist across single `Reset` actions and page reloads, and SHALL disappear immediately when art discovery is cleared via two consecutive `Reset` actions with no intervening canvas interaction.

#### Scenario: Art link is hidden before art-wip is unlocked
- **WHEN** the visitor loads the portfolio with `portfolio_art_state` unset or locked
- **THEN** `nav-art` is not rendered in the header navigation bar.

#### Scenario: Art link appears on the left without shifting existing nav links when unlocked
- **WHEN** the visitor drags `art-wip` to connect to an `'art'`-tagged project node
- **THEN** `nav-art` (`Art`, `href="/art/"`, same-tab, static `bareText` color matching `nav-about`) appears immediately to the left of `nav-about` in the header nav group without shifting `nav-about` or overlapping `brand-home` on desktop or mobile viewports.

#### Scenario: Art link persists across single Reset and reload, and disappears on consecutive double Reset
- **WHEN** `nav-art` is visible and the user clicks `Reset` once or reloads the page
- **THEN** `nav-art` remains visible.
- **WHEN** the user clicks `Reset` twice consecutively with no intervening canvas interaction
- **THEN** `nav-art` disappears from the header navigation bar.
