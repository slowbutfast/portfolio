## 1. Test Scaffolding (TDD)

- [x] 1.1 Update the `HOVER_SWELL_GAIN` assertion in `src/audio/ambientSynth.test.ts` (line 184) from `1.0` to `0.5` and run `npx vitest run src/audio/ambientSynth.test.ts` to confirm it fails before the constant change.
- [x] 1.2 Update the desktop cursor E2E test in `e2e/portfolio.spec.ts` (lines 1197–1227) to assert `default` on empty canvas, `grab` on node hover, `grabbing` on `pointerdown` and during drag, and `grab` after `pointerup` over the node, and run `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor"` to confirm it fails before the cursor change.

## 2. Core Implementation

- [x] 2.1 Change `HOVER_SWELL_GAIN` from `1.0` to `0.5` in `src/audio/audioConstants.ts` (line 14), leaving `DEFAULT_SOUND_ENABLED = false`, `HOVER_SWELL_PLATEAU = 0.35`, `BASE_DRONE_GAIN`, and `NOISE_FLOOR_GAIN` unchanged.
- [x] 2.2 Widen `setCanvasCursor` in `src/components/GraphCanvas.tsx` (lines 1530–1533) to `'default' | 'grab' | 'grabbing'` and update cursor transitions: `'grabbing'` while dragging (`onPointerMove`, line 1549) and on node `onPointerDown` (line 1581), `'grab'` on idle node hover (`onPointerMove`, line 1562) and node `onPointerUp` (line 1620), keeping `'default'` on empty canvas, `onPointerCancel` (line 1641), and `onPointerLeave` (line 1647).

## 3. Verification & Empirical Audit

- [x] 3.1 Run `npm run typecheck`, `npx vitest run`, and `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor"` and confirm all checks pass cleanly.
- [x] 3.2 Populate `verification.md` with the Requirement Adherence Audit Matrix, resolved assumptions, and verbatim execution logs.
