## Why

Hovering, clicking/inspecting, or dragging a project node currently triggers a full-gain (`1.0`) bandpass swell that is louder than desired relative to the ambient drone, and the desktop graph canvas displays a `crosshair` cursor instead of the standard `grab` / `grabbing` affordance for draggable nodes. Default sound is already disabled for new visits (`DEFAULT_SOUND_ENABLED = false`), so lowering the node audio cue by 50% and switching to `grab`/`grabbing` cursors directly improves desktop tactile feedback without changing sound persistence.

## What Changes

- Halve `HOVER_SWELL_GAIN` from `1.0` to `0.5` so the node hover/click/drag resonance swell (and its 35% sustained plateau `HOVER_SWELL_GAIN * HOVER_SWELL_PLATEAU`) is 50% quieter while leaving the ambient drone and noise floor unchanged.
- Replace the desktop graph canvas `'crosshair'` node cursor with `'grab'` when hovering or releasing over a node and `'grabbing'` when pressing or dragging a node, keeping `'default'` on empty canvas, pointer cancel, and pointer leave.
- Update the unit constant assertion in `src/audio/ambientSynth.test.ts` and the desktop cursor E2E test in `e2e/portfolio.spec.ts` to cover the new gain and `grab` → `grabbing` → `grab` cursor lifecycle.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `ambient-audio`: Update `Node hover harmonic resonance swell` so `HOVER_SWELL_GAIN` is `0.5` (50% reduction in peak and sustained plateau swell gain).
- `graph-simulation`: Add desktop node pointer cursor requirement (`default` on empty canvas, `grab` on node hover/release over node, `grabbing` while pressing/dragging a node).

## Impact

- `src/audio/audioConstants.ts` (`HOVER_SWELL_GAIN`)
- `src/audio/ambientSynth.test.ts` (constant assertion)
- `src/components/GraphCanvas.tsx` (`setCanvasCursor` and pointer handlers)
- `e2e/portfolio.spec.ts` (desktop canvas cursor test)
- No new dependencies, API changes, or breaking changes.
