# Research: Light-Mode Accent Contrast & DESIGN.md Sync

## Findings

1. **Shared Accent Token**:
   - `src/components/ControlsOverlay.tsx` (`L251-L257`) applies `text-[var(--color-accent)]` to `controls-dropdown-icon` (`MoreHorizontal`) when `soundEnabled` is `true`; otherwise it inherits `--color-muted` (`#525257` in light mode) from `bareText` (`L31`).
   - `src/components/GraphCanvas.tsx` (`L663-L667`, `L682`) uses `tokens.accent` (read from `--color-accent`, with fallback `DEFAULT_TOKENS.accent` on `L81`) and `tokens.nodeVisited` (read from `--color-node-visited`, fallback `L83`) for active, hovered, focused, and visited nodes and labels.
   - `src/styles.css` (`L20-L32`) defines `:root` `--color-bg: #f6f6f4`, `--color-muted: #525257`, `--color-accent: #003399`, `--color-node-visited: #003399`. Because `#003399` has very low luminance (`~0.04`), it is visually close to `#525257` (`~0.08`) on a `16×16` stroke icon in light mode.
   - Switching light-mode `--color-accent` and `--color-node-visited` (plus `DEFAULT_TOKENS`) to `#2563eb` raises visual distinction against `#525257` while maintaining WCAG AA (`~4.9:1` on `#f6f6f4` and `~5.17:1` on `#ffffff`).

2. **`DESIGN.md` Drift Against Current Codebase**:
   - **Color System & Frontmatter** (`DESIGN.md` `L12-L15`, `L150`, `L183`, `L267`): Still documents `#003399` for light-mode accent/visited nodes; needs to reflect `#2563eb` (while noting `--color-brand: #003399` if kept or unified).
   - **Mobile Header & Sound Placement** (`DESIGN.md` `L166`, `L209`, `L259`): Describes a "Wrapped naked top bar" and desktop-only control sequence without documenting that `< 640px` omits `GitHub ↗` (present in `AboutModal`), keeps `About`, `Dark`/`Light`, `Graph`/`Grid`, `...` on a single row at `>= 360px` (wrapping only at `320px`), moves `Sound` + horizontal `44px` volume slider inside `#portfolio-controls` on `< 640px` or `(hover: none)`, and exposes a vertical volume popover on hover-capable desktop (`>= 640px` and `hover: hover`).
   - **Mobile Inspector Bottom Sheet** (`DESIGN.md` `L232`, `L259`): Still says `max-h-[85dvh]` instead of the draggable 3-detent sheet (`peek: 28dvh`, `half: 56dvh`, `full: 86dvh` with `16dvh` dismiss threshold and `120px` minimum visible graph strip in `src/components/ProjectDrawer.tsx` `L23-L32`).
   - **Internal Contradiction & Motion** (`DESIGN.md` `L202`, `L244-L251`, `L274`): Mentions `coordinate HUD` in `L202` and `L274` despite `L154` stating there is no coordinate ticker, and omits the `15fps` coarse-pointer ambient drift and procedural Web Audio bandpass swell on hover/inspect/drag.
