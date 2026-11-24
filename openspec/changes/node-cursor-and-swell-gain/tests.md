## Automated Tests

- `npx vitest run src/audio/ambientSynth.test.ts`: Verifies `HOVER_SWELL_GAIN` equals `0.5`, that node hover/inspect/drag ramps `hoverGain.gain` to `0.5`, settles to the 35% plateau (`0.175`) after `1200ms`, re-arms once on inspector open, and returns to `0` when all triggers clear, while `DEFAULT_SOUND_ENABLED` remains `false`.
- `npx vitest run`: Confirms no regressions across the full unit test suite.
- `npm run typecheck`: Confirms strict TypeScript compilation passes with the widened `setCanvasCursor` union (`'default' | 'grab' | 'grabbing'`).
- `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor"`: Verifies on desktop that `graph-canvas` computed `cursor` is `default` over empty canvas, `grab` when hovering a node, `grabbing` on `pointerdown` and during drag, and `grab` after releasing over the node.

## Manual Verification

- **Desktop node cursor affordance**:
  - **WHEN** moving the pointer across empty canvas, onto a project node, pressing and dragging the node, and releasing over the node (and then moving off the canvas)
  - **THEN** the cursor transitions `default` → `grab` → `grabbing` → `grab` → `default` without flicker or stuck `grabbing` state.
- **Node interaction audio swell level (-50%)**:
  - **WHEN** enabling Sound in the top header and hovering, clicking/inspecting, or dragging a project node
  - **THEN** the resonant bandpass cue is noticeably softer (50% lower gain peak and sustained plateau) while the ambient drone and pink noise floor remain unchanged.
- **Default sound off on fresh session**:
  - **WHEN** opening the portfolio in a fresh incognito window (empty `localStorage`)
  - **THEN** Sound starts disabled (`aria-pressed="false"`) with zero audio output until toggled on.
