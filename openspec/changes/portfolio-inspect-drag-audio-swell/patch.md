# Patch Ledger: portfolio-inspect-drag-audio-swell

## Patch Ledger

| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-13 | User review feedback | `src/components/ControlsOverlay.tsx`, `src/styles.css`, `e2e/portfolio.spec.ts`, `openspec/specs/portfolio-controls/spec.md`, `DESIGN.md` | DONE |
| `PATCH-02` | 2026-11-13 | Manual playtest / PR #14 review | `src/data/projects.ts`, `src/data/projects.test.ts`, `e2e/portfolio.spec.ts` | DONE |
| `PATCH-03` | 2026-11-14 | User review feedback | `src/audio/ambientSynth.ts`, `src/utils/audioSwell.ts`, `src/components/GraphCanvas.tsx`, `e2e/portfolio.spec.ts` | DONE |

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
- **Verification Proof**: Desktop and mobile E2E assertions check `data-sound-active`, the accent class on the 3-dot glyph, and `controls-sound-indicator` count `0` in both states. Full suite re-run and OpenSpec strict validation recorded in `verification.md`. Landed in commit `6581b8c`.
- **Status**: DONE

---

### [PATCH-02] Add Sandwave Sim and Transcribe Plus liveUrl for inspector Visit links

- **Date**: 2026-11-13
- **Feedback Source**: Manual playtest / PR #14 review
- **Reported Issue**: `sandwave-sim` and `transcribe-plus` in `ProjectDrawer` do not display `Visit ↗` links (`data-testid="drawer-visit"`) because `liveUrl` is missing on both entries.
- **Root Cause**: `src/data/projects.ts` declares `repo` for `transcribe-plus` and `sandwave-sim` but no `liveUrl`, while `ProjectDrawer` renders `drawer-visit` only when `project.liveUrl` is set.
- **Target Files**: `src/data/projects.ts`, `src/data/projects.test.ts`, `e2e/portfolio.spec.ts`, `openspec/changes/portfolio-inspect-drag-audio-swell/{patch,tasks,verification,tests}.md`
- **Expected Resolution**: `transcribe-plus` declares `liveUrl: 'https://transcribe-plus-frontend.vercel.app/'` and `sandwave-sim` declares `liveUrl: 'https://sandwave-sim.vercel.app/'`; both drawers render `drawer-visit` with the matching `href`.
- **Verification Command**:
  - `npx vitest run src/data/projects.test.ts`
  - `npx playwright test -g "Transcribe Plus and Sandwave Sim drawers expose"`
  - `npm test`
- **Verification Proof**: The unit assertion `declares live demo URLs for transcribe-plus and sandwave-sim` passes (12/12), the desktop and mobile E2E test passes (2/2), and the full suite is recorded in `verification.md`.
- **Status**: DONE

---

### [PATCH-03] Unify desktop inspector swell with mobile by re-arming on open

- **Date**: 2026-11-14
- **Feedback Source**: User review feedback
- **Reported Issue**:
  > can you actually make the hover audio persist in the inspect page (which we just did on mobile) to persist on the desktop view as well?
  >
  > more precisely, unify the desktop audio (regarding inspector audio persisting) with the mobile version
- **Root Cause**: On desktop the pointer hovers the node before clicking it, so the swell has already decayed from `1.0` to the `0.35` plateau by the time `ProjectDrawer` opens. `onNodeHover(true)` is idempotent while active, so the selection transition did not restart the envelope. A mobile tap has no prior hover, so it starts a fresh `1.0` swell at inspect open.
- **Target Files**: `src/audio/ambientSynth.ts` (`onNodeHover(isHovered, retrigger)`), `src/utils/audioSwell.ts` (`deriveSwellRetrigger`), `src/components/GraphCanvas.tsx` (`selectedActiveRef` + one-shot retrigger), `src/utils/audioSwell.test.ts`, `src/audio/ambientSynth.test.ts`, `e2e/portfolio.spec.ts`, `openspec/{specs,changes}/…/ambient-audio/spec.md`, `architecture.md`, `tests.md`
- **Expected Resolution**: A `selectedId` false→true transition calls `onNodeHover(true, true)` exactly once, re-arming the full `1.0` swell and a fresh `1.2 s` plateau window even if hover was already plateaued. Repeated hover/drag syncs remain no-ops, so desktop inspect now has the same audible onset as mobile.
- **Verification Command**:
  - `npx vitest run src/audio/ambientSynth.test.ts src/utils/audioSwell.test.ts`
  - `npx playwright test -g "canvas mirrors inspect and drag audio swell state"`
  - `npm test`
- **Verification Proof**: Unit coverage asserts the retrigger transition and the `0.35 → 1.0 → 0.35` envelope. An instrumented desktop Playwright probe recorded a fresh `1.0` ramp after inspecting a plateaued hover, followed by `0.35` at the new plateau. Full suite and OpenSpec strict validation recorded in `verification.md`.
- **Status**: DONE
