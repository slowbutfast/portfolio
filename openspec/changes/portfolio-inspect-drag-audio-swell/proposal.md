## Why

On mobile devices, the `65 Hz` resting drone rolls off below phone speaker range while the audible `750 Hz` bandpass hover swell never activates because touch devices lack hover. Triggering that bandpass swell while a node is open in `ProjectDrawer` or being dragged—at a non-clipping peak (`HOVER_SWELL_GAIN = 1.0`) that settles to a gentle `35%` plateau (`0.35`)—gives both mobile and desktop users clear tactile audio feedback without a loud static buzz while reading.

## What Changes

- **Inspect & Drag Bandpass Swell**: Extract `deriveSwellActive(hovered, selected, dragging)` in `src/utils/audioSwell.ts`, wire `syncSynthSwell()` across all 4 call sites in `GraphCanvas.tsx` (including `handleMotionChange`) plus `onPointerDown`/`Up`/`Cancel`/`Leave`, `initialSelectedId` effect, and unmount cleanup, expose `data-audio-swell` on `<canvas>`, and sync `synth.onNodeHover(selectedId !== null)` in `App.tsx` when `view === 'list'`.
- **Non-clipping Gain & Plateau Envelope**: Lower `HOVER_SWELL_GAIN` in `src/audio/audioConstants.ts` from `2.0` to `1.0` (keeping peaks below `0 dBFS`) and settle `hoverGain` to `HOVER_SWELL_GAIN * 0.35` after `1.2 s` in `src/audio/ambientSynth.ts` so sustained inspection does not buzz loudly.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `ambient-audio`: Extend `Node hover harmonic resonance swell` to activate on hover, drag (starting on `pointerdown` over a node), and `ProjectDrawer` inspect across Graph and Grid views, with `HOVER_SWELL_GAIN = 1.0` (`50 ms` time constant) settling to a `35%` plateau after `1.2 s`.

## Impact

- **Audio & Utils**: `src/audio/audioConstants.ts`, `src/audio/ambientSynth.ts`, `src/utils/audioSwell.ts` (new), `src/utils/audioSwell.test.ts` (new), `src/audio/ambientSynth.test.ts`.
- **Components**: `src/components/GraphCanvas.tsx`, `src/App.tsx`.
- **Tests**: `e2e/portfolio.spec.ts` (`data-audio-swell` E2E check).
