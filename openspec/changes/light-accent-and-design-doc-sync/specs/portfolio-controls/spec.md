# portfolio-controls Specification (Delta)

## ADDED Requirements

### Requirement: Light-mode accent contrast for Sound-active 3-dot glyph and node highlighting
In the default Light color scheme (`:root`), `--color-accent` and `--color-node-visited` (along with `GraphCanvas` `DEFAULT_TOKENS` fallbacks) SHALL resolve to `#2563eb` so the Sound-active `controls-dropdown-icon` 3-dot glyph visually contrasts with the inactive `--color-muted` (`#525257`) state on both mobile and desktop while remaining unified with active/visited canvas node highlighting and meeting WCAG AA (`>= 4.5:1`) on `#f6f6f4` and `#ffffff`.

#### Scenario: Sound enabled in Light mode updates 3-dot glyph to #2563eb
- **WHEN** a visitor in Light mode enables Sound on mobile or desktop
- **THEN** `controls-dropdown-icon` renders with computed color `rgb(37, 99, 235)` (`#2563eb`), matching `--color-accent` used by highlighted canvas nodes.
