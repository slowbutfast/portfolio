# Architecture: Light-Mode Accent Contrast & DESIGN.md Sync

## Component & Token Flow
- `src/styles.css` (`:root`) defines `--color-accent: #2563eb` and `--color-node-visited: #2563eb` for light mode.
- `src/components/ControlsOverlay.tsx` continues to apply `text-[var(--color-accent)]` to `controls-dropdown-icon` when `soundEnabled` is `true`, automatically inheriting `#2563eb` in light mode and `#3d7fff` in dark mode.
- `src/components/GraphCanvas.tsx` reads `--color-accent` and `--color-node-visited` via `readToken(...)`, with `DEFAULT_TOKENS` updated to `#2563eb` to match `:root`.
- `DESIGN.md` serves as the single authoritative design document aligned with the shipped implementation.
