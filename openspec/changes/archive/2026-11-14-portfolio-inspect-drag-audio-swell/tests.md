## Automated Tests

- `npm run typecheck`: Verifies TypeScript types across `audioConstants`, `ambientSynth`, `audioSwell`, `GraphCanvas`, and `App`.
- `npm run build`: Verifies production bundle builds cleanly.
- `npm run test:unit`: Runs Vitest unit suites:
  - `src/utils/audioSwell.test.ts`: Verifies `deriveSwellActive(hovered, selected, dragging)` truth table across all 8 combinations, plus the `deriveSwellRetrigger(selected, wasSelected)` transition table.
  - `src/audio/ambientSynth.test.ts`: Verifies `onNodeHover(true)` ramps to `HOVER_SWELL_GAIN` (`1.0`), settles to `0.35` after `1.2 s`, ignores duplicate `onNodeHover(true)` while active, re-arms the full swell once when the inspector opens (`onNodeHover(true, true)`) even after the hover plateau, and ramps to `0` on `onNodeHover(false)`.
- `npm run test:e2e`: Runs Playwright desktop and mobile E2E suites, verifying `data-audio-swell="true"` on `graph-canvas` while `ProjectDrawer` is open or during node drag, and `data-audio-swell="false"` after closing/releasing. The same suites verify the `controls-dropdown-trigger` 3-dot glyph becomes `--color-accent` when sound is enabled and reverts when disabled, with no `controls-sound-indicator` dot anywhere. They also verify the `transcribe-plus` and `sandwave-sim` drawers render `drawer-visit` with their live demo URLs, and that desktop inspect keeps `data-audio-swell="true"` after the pointer leaves the canvas for the drawer.

## Manual Verification

- **Phone speaker check (without AirPods, ringer switch on)**:
  - **WHEN** enabling Sound on mobile, tapping a node to open `ProjectDrawer`, and **listening for 30 s with the sheet open** (as well as dragging a node)
  - **THEN** the `750 Hz` bandpass swell is clearly audible from the phone speaker on open/drag without clipping, settles to a comfortable `35%` plateau after `~1.2 s` without sounding like a harsh stuck buzz, and fades back to silence when closed/released.
