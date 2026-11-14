# Proposal: Light-Mode Accent Contrast & DESIGN.md Sync

## Why
In light mode, `--color-accent` (`#003399`) is dark enough that the `16×16` 3-dot overflow glyph (`controls-dropdown-icon`) barely distinguishes its Sound-on state from its muted off state (`#525257`), especially on mobile where the 3-dot glyph is the primary Sound-active indicator. At the same time, root `DESIGN.md` has drifted from the shipped codebase across mobile header/sound layout, draggable bottom-sheet detents, stale coordinate-HUD references, and audio/motion behavior.

## What Changes
1. **Light-Mode Accent Contrast Fix**:
   - Update `:root` `--color-accent` and `--color-node-visited` in `src/styles.css` from `#003399` to `#2563eb`.
   - Update `DEFAULT_TOKENS.accent` and `DEFAULT_TOKENS.nodeVisited` in `src/components/GraphCanvas.tsx` to `#2563eb` so canvas node highlighting and the 3-dot Sound indicator remain unified.
2. **Unify `DESIGN.md` with Current Codebase**:
   - Update `DESIGN.md` color tokens and prose for light-mode `#2563eb` accent/visited nodes.
   - Align `DESIGN.md` with the shipped codebase as ground truth for mobile single-row header (`>= 360px`), `< 640px` / `(hover: none)` in-menu Sound + horizontal volume slider, desktop vertical volume popover, draggable 3-detent mobile bottom sheet (`28dvh` / `56dvh` / `86dvh`), coarse-pointer `15fps` ambient drift / Web Audio swell, and removal of stale `coordinate HUD` references.

## Non-Goals
- No changes to dark-mode `--color-accent` (`#3d7fff`).
- No layout, physics, or audio engine behavior changes beyond the light-mode accent hex update.
