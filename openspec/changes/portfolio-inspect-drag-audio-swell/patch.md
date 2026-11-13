# Patch Ledger: portfolio-inspect-drag-audio-swell

## Patch Ledger

| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-13 | User review feedback | `src/components/ControlsOverlay.tsx`, `src/styles.css`, `e2e/portfolio.spec.ts`, `openspec/specs/portfolio-controls/spec.md`, `DESIGN.md` | DONE |

---

### [PATCH-01] Replace the sound indicator dot with an accent 3-dot settings glyph

- **Date**: 2026-11-13
- **Feedback Source**: User review feedback
- **Reported Issue**:
  > instead of adding a blue dot to show that the sound controls are active, could you actually just make the three dots that represent the settings panel themselves blue? and then document this of course
- **Root Cause**: The original implementation rendered a separate `controls-sound-indicator` `<span>` dot anchored to the top-right corner of the settings trigger, and CSS hid it on hover-capable desktop. The indicator was visually detached from the three-dot `MoreHorizontal` glyph it annotated.
- **Target Files**: `src/components/ControlsOverlay.tsx`, `src/styles.css`, `e2e/portfolio.spec.ts`, `openspec/specs/portfolio-controls/spec.md`, `openspec/changes/portfolio-inspect-drag-audio-swell/specs/portfolio-controls/spec.md`, `DESIGN.md`, `openspec/changes/portfolio-inspect-drag-audio-swell/{proposal,design,tests,tasks,verification}.md`
- **Expected Resolution**: When `soundEnabled` is true, the three-dot `controls-dropdown-icon` itself uses `--color-accent` on desktop and mobile; no `controls-sound-indicator` dot exists. When sound is disabled, the glyph returns to the muted text color.
- **Verification Command**: `npx playwright test -g "Sound toggle persists|mobile 3-dot menu hosts Sound"`
- **Verification Proof**: Desktop and mobile E2E assertions check `data-sound-active`, the accent class on the 3-dot glyph, and `controls-sound-indicator` count `0` in both states. Full suite re-run and OpenSpec strict validation recorded in `verification.md`.
- **Status**: DONE
