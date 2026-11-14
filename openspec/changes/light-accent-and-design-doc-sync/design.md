# Design: Light-Mode Accent Contrast & DESIGN.md Sync

## Color Choice
- Light mode `--color-accent` and `--color-node-visited`: `#2563eb`
  - Contrast on `#f6f6f4` (page background): `~4.9:1` (passes WCAG AA `4.5:1` for normal text and `3:1` for UI components).
  - Contrast on `#ffffff` (surface): `~5.17:1`.
  - Clearly distinct from inactive `--color-muted` (`#525257`) on `16×16` stroke icons (`MoreHorizontal`) while keeping node highlighting and the Sound-active 3-dot glyph unified.
- `--color-brand` remains `#003399` in `:root` and `[data-theme='dark']` as the static brand token, or is documented alongside `--color-accent` in `DESIGN.md`.

## `DESIGN.md` Reconciliation Rules
- Treat the current codebase (`src/styles.css`, `src/components/ControlsOverlay.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/GraphCanvas.tsx`) as ground truth for all sections outside the `#2563eb` light-mode accent update.
