## Source material

- **2026-11-13 — User bug report & device verification**:
  - *"can you try to figure out why i'm hearing no sound on my phone, even when toggling the sound on and off?"*
  - *"also i can hear the low hum when i use airpods"*
  - *"can you draft a small patch that plays the sound that would play during a hover, to play when a node is in the inspector view and getting dragged?"*
  - Sign-offs on `inspect_and_drag_audio_swell_plan.md`: Option A (hover swell on inspect + drag only) and Option A (apply uniformly across desktop and mobile).
- **2026-11-13 — Offline audio graph analysis & review feedback**:
  - `65 Hz` sawtooth (`BASE_DRONE_GAIN = 0.063`) + two cascaded `600 Hz` lowpasses outputs ~`-29.2 dBFS` RMS mostly below `300 Hz`, which phone micro-speakers roll off.
  - With `HOVER_SWELL_GAIN = 2.0`, the `750 Hz` bandpass swell hits `-13.6 dBFS` RMS and peaks at `+1.5 dBFS` (clipping above full scale), and stays frozen at the tap `y` frequency (`450–1400 Hz`) while `ProjectDrawer` is open. Lowering `HOVER_SWELL_GAIN` to `1.0` keeps peaks under `0 dBFS`, and settling to a `35%` (`0.35`) plateau after `1.2 s` prevents a loud static buzz while reading.
  - Four `onNodeHover` call sites exist in `GraphCanvas.tsx`: `emitHover` (`L1172`, `L1176`), `focusedId` effect (`L1062`), and `handleMotionChange` (`L684`).
  - `ListView` (Grid view) unmounts `GraphCanvas`, so `App.tsx` must also sync `synth.onNodeHover(selectedId !== null)` when `view === 'list'` if `ProjectDrawer` opens from Grid view.

### Raised but not acted on

- **Resting drone upper-harmonic boost / `navigator.audioSession = 'playback'`**: Deferred per user sign-off ("yeah lets go with option a").

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Resonance swell | `AmbientSynth.onNodeHover(true)` opening `hoverGain` to `HOVER_SWELL_GAIN = 1.0` (settling to `0.35` plateau after `1.2 s`) through the `450–1400 Hz` bandpass | Changing `BASE_DRONE_GAIN` or `MASTER_GAIN` |
| Derived swell (`deriveSwellActive`) | Pure helper `hovered \|\| selected \|\| dragging` used by `GraphCanvas.syncSynthSwell()` | Calling `onNodeHover(false)` independently from each handler |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Internal codebase (`src/audio/audioConstants.ts`, `ambientSynth.ts`) | Verified `BASE_FREQ = 65`, `BASE_DRONE_GAIN = 0.063`, `HOVER_SWELL_GAIN = 2.0` -> `1.0`, `BANDPASS_REST_FREQ = 750` | Repo | 2026-11-13 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| `deriveSwellActive()` + `syncSynthSwell()` in `GraphCanvas.tsx` + `view === 'list'` sync in `App.tsx` | Adopted | Covers both Graph and Grid views without per-hover React re-renders | 2026-11-13 |
| `HOVER_SWELL_GAIN = 1.0` + `1.2 s` decay to `0.35` plateau | Adopted | Eliminates `+1.5 dBFS` clipping and prevents a loud static tone while reading `ProjectDrawer` | 2026-11-13 |

## Patterns adopted

- Pure state helper (`src/utils/audioSwell.ts`) + `data-audio-swell` DOM attribute on `<canvas>`, mirroring `stickyFocal.ts` and `data-sim-state`.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| AirPods reproduce the `65 Hz` resting hum | User confirmed audible on AirPods | User report 2026-11-13 | 2026-11-13 | stable |
| `onNodeHover` has 4 call sites in `GraphCanvas.tsx` | `L684`, `L1062`, `L1172`, `L1176` | `grep -n onNodeHover src/` | 2026-11-13 | stable |
| `selectedIdRef` already tracks `initialSelectedId` | `selectedIdRef.current = initialSelectedId ?? null` | Read `src/components/GraphCanvas.tsx#L321-L322` | 2026-11-13 | stable |

## Unverified assumptions

- Phone speaker audibility and 30-second comfort of the `1.0 -> 0.35` plateau swell during inspect and drag on user's iPhone (to be confirmed via manual verification).

## Superseded claims

- **`HOVER_SWELL_GAIN = 2.0` is non-clipping**: Superseded by offline simulation showing `+1.5 dBFS` peaks; lowered to `1.0` with a `0.35` sustained plateau.
- **Three `onNodeHover` call sites in `GraphCanvas.tsx`**: Corrected to four (`handleMotionChange` at `L684` was missed in the initial draft).

## Links out

- Main spec: `openspec/specs/ambient-audio/spec.md`
