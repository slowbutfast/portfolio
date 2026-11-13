# Surgical Patch Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid' [PATCH-04]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v3-organic-ferrofluid` (Target Branch: `feat/portfolio-v3-organic-ferrofluid` / PR #12)
- **Patch ID**: `PATCH-04`
- **Objective**: Add a vertical sound volume slider popover on the `Sound` toggle that appears when `soundEnabled` is `true` and the user hovers (or toggles on / focuses) `Sound`, and disappears `500ms` after the pointer leaves, backed by persisted `[0, 1]` volume scaling in `AmbientSynth`.
- **Feedback & Diagnostic Trace**:
  ```
  User Request:
  - Vertical volume slider visible when sound is enabled and user hovers over the Sound toggle, disappearing ~0.5s after pointer leaves.
  - Dragging volume to 0% keeps Sound enabled (aria-pressed="true") at 0 master gain so dragging back up immediately restores audio.
  - Execute as PATCH-04 on PR #12 (feat/portfolio-v3-organic-ferrofluid).
  ```
- **Root Cause Analysis**:
  - `AmbientSynth` (`src/audio/ambientSynth.ts`) ramps `master.gain` directly to `MASTER_GAIN = 1` on `start()` and `resumeFromGesture()`, with no `volume` field or UI slider.

## 2. Strict Target Context Map (on `feat/portfolio-v3-organic-ferrofluid`)
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/audio/audioConstants.ts` | `L18-L23` | Add `VOLUME_STORAGE_KEY = 'portfolio_sound_volume'` and `DEFAULT_SOUND_VOLUME = 1`. |
| `src/audio/ambientSynth.ts` | `L110-L130`, `L344-L382` | Add `readVolumePreference` / `writeVolumePreference` helpers, `private volume: number` initialized from `storage`, `getVolume(): number`, and `setVolume(volume: number): void` (clamped `[0, 1]`, persisted, ramping `master.gain` to `this.volume * MASTER_GAIN` when enabled). Update `start()` and `resumeFromGesture()` to ramp to `this.volume * MASTER_GAIN`. |
| `src/components/ControlsOverlay.tsx` | `L8-L22`, `L116-L129` | Add `soundVolume: number` and `onVolumeChange: (volume: number) => void` props. Wrap `Sound` (`data-testid="audio-toggle"`) in a `relative` container with `onPointerEnter` / `onPointerLeave` / `onFocus` / `onBlur`: show `data-testid="volume-popover"` when `soundEnabled` is `true` on hover/focus/toggle-on; cancel hide timer while pointer is over `Sound` or popover (or dragging slider); start a `500ms` hide timer on leave; hide immediately when `soundEnabled` becomes `false`. Render `<input type="range" min={0} max={1} step={0.01} value={soundVolume} aria-label="Sound volume" data-testid="volume-slider" />`. |
| `src/App.tsx` | `L55-L58`, `L264-L289` | Track `soundVolume` state initialized from `synth.getVolume()`, wire `handleVolumeChange` (`synth.setVolume(v); setSoundVolume(v)`), and pass `soundVolume` + `onVolumeChange` to `ControlsOverlay`. |
| `src/styles.css` | End of file | Add vertical range slider CSS (`writing-mode: vertical-lr; direction: rtl`, accent thumb/track using `--color-accent`). |
| `src/audio/ambientSynth.test.ts` | Relevant suite | Unit tests for `getVolume`/`setVolume`, `[0, 1]` clamping, `localStorage` persistence, `master.gain` scaling, and `volume = 0` keeping `isEnabled() === true`. |
| `e2e/portfolio.spec.ts` | Relevant suite | E2E test verifying `volume-popover` is hidden when sound is off, opens on hover when sound is enabled, updates slider value, and auto-hides ~`500ms` after `pointerleave`. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files specified in the Target Context Map (plus `tasks.md`, `patch.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT auto-disable `Sound` (`aria-pressed="false"`) when volume is dragged to `0`.
  - Do NOT modify graph physics, bridge geometry, or Grid card layout.
  - Do NOT modify `.env` or credential files.
- **INVARIANTS TO PRESERVE**:
  - `localStorage.getItem('portfolio_sound_enabled')` remains `'false'` by default; zero network audio requests; zero Axe accessibility violations.

## 4. Visual & UI Impact
- `volume-popover` uses Swiss editorial floating surface tokens (`rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 px-2.5 py-3 shadow-2xl backdrop-blur-md`) anchored beneath `Sound` (`absolute left-1/2 top-full mt-2 -translate-x-1/2`), with `--color-accent` slider accent.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Run `npm run test:unit -- src/audio/ambientSynth.test.ts` and `npm run test:e2e` after adding `P04.1` tests and confirm failure.
2. **Apply Minimal Fix**: Implement `P04.2`–`P04.3` strictly within the Target Context Map.
3. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes` and confirm 100% pass.

## 6. Surgical Patch Checklist
- [ ] P04.1 Scaffold/run failing unit & E2E tests and confirm failure.
- [ ] P04.2 Implement `P04.2` in `src/audio/audioConstants.ts` and `src/audio/ambientSynth.ts`.
- [ ] P04.3 Implement `P04.3` in `src/components/ControlsOverlay.tsx`, `src/App.tsx`, and `src/styles.css`.
- [ ] P04.4 Run full verification suite, update `verification.md`, mark `PATCH-04` `RESOLVED` in `patch.md`, check off `tasks.md`, and push to PR #12.
