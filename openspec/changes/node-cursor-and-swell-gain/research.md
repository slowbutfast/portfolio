## Source material

> **2026-11-24 — User request (turn 1):**
> "/plan can you propose a very brief change how we can change the default sound to be off, and then when you hover over a node on desktop, the cursor value becomes `grab`, then when you drag the node, it turns into `grabbing`?"

> **2026-11-24 — User follow-up on plan (turn 2):**
> "in that case, could we just make the volume of the audio cue when you click/drag/hover a node to be 50% less?"

### Raised but not acted on

- **Disable `localStorage` sound preference persistence**: Considered as an alternative after discovering `DEFAULT_SOUND_ENABLED` is already `false` for fresh visits. Not acted on because the user opted to keep existing persistence and instead reduce the node interaction audio cue (`HOVER_SWELL_GAIN`) by 50%.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Node audio cue / hover swell | The parallel resonant bandpass filter gain (`hoverGain.gain`) ramped to `HOVER_SWELL_GAIN` on node hover, click/inspect, or drag, and settled to `HOVER_SWELL_GAIN * HOVER_SWELL_PLATEAU` after `1200ms`. | The master volume slider (`MASTER_GAIN` / `DEFAULT_SOUND_VOLUME`), the ambient 65Hz drone (`BASE_DRONE_GAIN`), or the pink noise floor (`NOISE_FLOOR_GAIN`). |
| Desktop node cursor | The inline `canvas.style.cursor` managed by `setCanvasCursor` in `src/components/GraphCanvas.tsx` during pointer hover, press/drag, release, leave, and cancel. | The `ProjectDrawer` border drag cursor (`move`) or the Studio `SeedMiniMap` SVG node cursor (`cursor-grab`). |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| CSS Basic User Interface Module Level 4 (`cursor: grab` / `grabbing`) | Standard CSS cursor keywords for draggable affordance (`grab`) and active dragging (`grabbing`), supported across modern desktop browsers; ignored on touch-only pointers. | W3C | 2026-11-24 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Inline `canvas.style.cursor` via `setCanvasCursor` | Adopted (existing pattern) | Already updates synchronously on pointer hit-test without triggering React re-renders. | 2026-11-24 |
| Halving `HOVER_SWELL_GAIN` (`1.0 -> 0.5`) in `src/audio/audioConstants.ts` | Adopted | Single source of truth consumed by `AmbientSynth.onNodeHover()` for both initial swell (`HOVER_SWELL_GAIN`) and sustained plateau (`HOVER_SWELL_GAIN * HOVER_SWELL_PLATEAU`). | 2026-11-24 |

## Patterns adopted

- Single-source audio constant tuning in `src/audio/audioConstants.ts` (keeps `AmbientSynth` and `ambientSynth.test.ts` aligned).
- Direct DOM cursor mutation in `GraphCanvas.tsx` (`setCanvasCursor`) to avoid React state churn on `pointermove`.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Default sound enabled state | `DEFAULT_SOUND_ENABLED = false` | Read `src/audio/audioConstants.ts:27` and `readSoundPreference` in `src/audio/ambientSynth.ts:114-121` | 2026-11-24 | stable |
| Current node swell gain | `HOVER_SWELL_GAIN = 1.0`, `HOVER_SWELL_PLATEAU = 0.35`, `HOVER_SWELL_PLATEAU_DELAY_MS = 1200` | Read `src/audio/audioConstants.ts:14-17` and `src/audio/ambientSynth.ts:462-469` | 2026-11-24 | stable |
| Current unit test assertion on `HOVER_SWELL_GAIN` | `expect(HOVER_SWELL_GAIN).toBe(1.0)` at `src/audio/ambientSynth.test.ts:184`; all behavioral swell assertions reference `HOVER_SWELL_GAIN` dynamically | Read `src/audio/ambientSynth.test.ts:184,347-416` | 2026-11-24 | stable |
| Current canvas cursor transitions | `setCanvasCursor('default' \| 'crosshair')` used at `GraphCanvas.tsx:1530,1549,1562,1581,1620,1641,1647` | Read `src/components/GraphCanvas.tsx:1530-1665` | 2026-11-24 | stable |
| Existing desktop cursor E2E test | `e2e/portfolio.spec.ts:1197-1227` asserts `'default'` on empty canvas, `'crosshair'` on hover, and `'crosshair'` on `mouse.down()` | Read `e2e/portfolio.spec.ts:1197-1227` | 2026-11-24 | stable |

## Unverified assumptions

- None; all touched constants, handlers, and tests were directly read from source.

## Superseded claims

- **Initial assumption**: Sound defaulted to on for new visits. **Why wrong**: `DEFAULT_SOUND_ENABLED` is already `false` in `src/audio/audioConstants.ts:27`; sound only auto-arms when `localStorage.getItem('portfolio_sound_enabled') === 'true'`. **Replaced with**: Keep default-off + persistence as-is and halve `HOVER_SWELL_GAIN` (`1.0 -> 0.5`).

## Links out

- `openspec/specs/ambient-audio/spec.md` — authoritative audio specification.
- `openspec/specs/graph-simulation/spec.md` — authoritative graph interaction specification.
