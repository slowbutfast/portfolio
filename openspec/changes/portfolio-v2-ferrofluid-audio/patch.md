# Patch Ledger: portfolio-v2-ferrofluid-audio

## Status: PATCH-01 RESOLVED (2026-11-12 15:29:22 UTC); PATCH-02 RESOLVED (2026-11-12 15:47:04 UTC)

### [PATCH-01] Unblock the Vercel build, drive bridge physics from real animation ticks, start stored-preference audio, and harden sag
- **Date**: 2026-11-12 14:36:34 UTC
- **Feedback Source**: Code Review (PR #11, `openspec-review-change`)
- **Reported Issue**:
  - *Critical (deployment)*: Vercel build of `ea736b3` failed: `src/utils/auditLinks.test.ts(13,8): error TS2307: Cannot find module '../../scripts/audit-links.mjs'` after `Removed 179 ignored files defined in .vercelignore`, running `tsc --noEmit && vite build`. Local build and the GitHub Actions `ci` check passed (128 unit, 82 e2e, 0 Axe violations) because they have the full tree. The other agent's verification attributed the Vercel failure to an "upstream Vercel service error"; that was incorrect.
  - *Critical*: "`updateLinkStates` has three call sites: the wrapper `tick()` (line 344), `dragMove` (396), and `dragEnd` (432). `GraphCanvas` never calls `sim.tick()`. d3's own timer drives ticks, and the canvas handler only calls `sim.poll()` and `render()` (`GraphCanvas.tsx:375`). The unit tests drive `sim.tick()`, which is why they pass." Consequences: oscillators never ring down; a bridge detached during a drag and released past 1.4x L_rest never reconnects until the next drag; `isIdle` can stay false forever so the canvas never suspends.
  - *Critical*: "A stored 'sound on' preference produces silence. `resumeFromGesture` (`ambientSynth.ts:335`) only `resume()`s; sources are started and master gain ramped only in `start()`... The test at `ambientSynth.test.ts:316` asserts only that `resume` was called."
  - *Important*: `updateLinkStates(TICK_MS)` assumes a fixed 16.7ms step, and is also called per pointermove, so oscillator time and derived acceleration depend on tick rate and pointer polling rate.
  - *Important*: wobble is imperceptible (simulated fast fling: peak sag 0.21px, i.e. ~0.4px width change on a 6px ribbon).
  - *Important*: `sag` has no lower clamp; at base width 6px a sag of -3 pinches the bridge to zero width and more crosses the axis.
  - *Important*: `toggleSound` calls `synth.setSoundEnabled(next)` inside a `setSoundEnabled` updater (side effect in render phase; iOS Safari gesture risk; StrictMode double-invoke).
  - *Important*: the Sound button has no visible state and its accessible name changes with `aria-pressed`.
  - *Nit*: audio drag velocity is `(delta) * 60` per pointermove and normalized by `speed / 40`, so it depends on pointer polling rate and saturates at 40px/s.
- **Root Cause**: The Vercel build typechecks the whole tsconfig (tests included) on a tree where `.vercelignore` removed `scripts/` and `e2e/`; `auditLinks.test.ts` is the only `src` file importing from an ignored directory, and nothing in CI replicates Vercel's file set. Link state updates were wired to a test-only wrapper (`tick()`) instead of the d3 simulation's real `tick` event, and tests were written against the wrapper. The armed-autoplay path was written to resume the context but never reuses `start()`. Constants were tuned against numerics, not visibility.
- **Target Files**: `tsconfig.build.json` (new), `package.json` (`build` script only), `src/utils/edgeConfig.test.ts` (one assertion), `src/utils/vercelParity.test.ts` (new), `.github/workflows/ci.yml` (new `vercel-parity` job, only if `.github/` is writable), `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts`, `src/audio/ambientSynth.ts`, `src/audio/ambientSynth.test.ts`, `src/audio/audioConstants.ts`, `src/utils/bridgeGeometry.ts`, `src/utils/bridgeGeometry.test.ts`, `src/components/GraphCanvas.tsx` (drag velocity only), `src/App.tsx` (`toggleSound` only), `src/components/ControlsOverlay.tsx` (Sound button only), `e2e/portfolio.spec.ts` (Sound toggle selectors only)
- **Expected Resolution**: (0) building a copy of the repo with the `.vercelignore` paths removed passes (it fails with the same `TS2307` before the patch), the Vercel build goes green, and a guard test plus a CI parity job keep shipped code from importing ignored paths; (1) a test that exercises only the d3 `tick.links` listener proves reconnection after release, oscillator ring-down, and `isIdle === true`; (2) a stored-preference test proves sources start and master gain ramps to `MASTER_GAIN` after the first gesture; (3) simulated fling peak sag lands in 1.2-3.0px and an extreme fling stays <= 4px; (4) sag can never pinch the bridge below the 2px minimum; (5) the Sound button shows visible state with a stable accessible name and the handler has no updater side effect.
- **Deferred (needs a human decision, NOT part of this patch)**: Vercel Project Settings Node version `26.x` vs `engines.node` `22.x` (Vercel uses 22.x and warns); desktop drawer backdrop blocks node dragging (`ProjectDrawer.tsx:254-258`) so the drag-tracking requirement is unreachable; two catalog repos 404 (`transcribe-plus`, `sandwave-sim`); Kintsugi/Ivy have no media and show a CLI placeholder in the hover card; unverified Kintsugi/Ivy summary wording; "sag" is a symmetric width change driven by axial stretch, not lateral sag driven by perpendicular acceleration (spec wording vs implementation); muted audio keeps the context running; two `setTargetAtTime` calls per pointermove; per-frame `setPosition` in the drawer.
- **Status**: RESOLVED (2026-11-12 15:29:22 UTC)
- **Resolution**:
  - H: `build` now typechecks shipped code only via `tsconfig.build.json`; a `vercelParity` guard test and a CI job prune `.vercelignore` paths before building.
  - A: Link topology and oscillator stepping are split; a `tick.links` listener drives both from d3's real timer, while the test wrapper keeps its fixed 60Hz step. Derivatives are primed and clamped, and long gaps re-prime instead of injecting impulses.
  - B: Excitation retuned to `EXCITATION_SCALE = 0.04` and `MAX_EXCITATION = 2000`; moderate fling peak sag ≈1.8px, extreme ≈2.3px.
  - C: Mid-waist half-width is clamped so the bridge never pinches below 2px.
  - D/E: Stored-preference gestures now start sources and open master gain; drag pitch uses pointer-rate-independent px/s with a 1200px/s full-scale constant.
  - F/G: Sound toggling is synchronous with a current-value ref, and the button keeps the stable accessible name `Sound` with a visible underline/accent pressed state.


### [PATCH-02] Bound idle reconnection, scale bridge wobble by base width, read tsconfig in parity test, fix Sound class conflict, and assert commit-on-release
- **Date**: 2026-11-12 15:42:00 UTC
- **Feedback Source**: Code Review (PR #11 Follow-up Review by Agent 1 and Agent 2)
- **Reported Issue**:
  1. *Important*: `link.isDetached && (distance <= 1.4 * rest || state === 'idle')` in `src/physics/graphSimulation.ts` reconnects bridges at any distance when `state === 'idle'`, before coasting is finished, popping the bridge back stretched with no recoil.
  2. *Important*: Sag maps to mid-waist width at 2:1. An absolute ±1.8px sag swings a 1-tag 6px bridge by ±60% (down to 2.4px, near the 2px minimum clamp). Narrow bridges pulse excessively compared to 3-tag 14px bridges (±25%).
  3. *Important*: `src/utils/vercelParity.test.ts` hardcodes file collection logic instead of reading `tsconfig.build.json`, and `tsconfig.build.json` only excludes `*.test.ts` rather than `*.test.tsx` and `*.spec.ts`.
  4. *Nit*: In `src/components/ControlsOverlay.tsx`, `bareText` defines `text-[var(--color-muted)]` and the button appends `text-[var(--color-accent)]`, creating a conflicting Tailwind class pair where output order decides which color wins.
  5. *Nit*: `dragEnd` commits the last pinned coordinate, but no unit test asserts `node.x` and `node.y` equal the pinned coordinates immediately without waiting for a d3 tick.
  6. *Nit*: In `verification.md`, the pre-patch legacy assessment paragraph should be clarified to point to PATCH-01 and PATCH-02.
- **Root Cause**:
  1. Idle reconnect lacked a distance ceiling (`distance <= SNAP_MULTIPLIER * link.restDistance`).
  2. Bridge sag was applied as an unscaled absolute pixel delta in `bridgeGeometry.ts` rather than scaling with nominal base link width.
  3. `collectBuildTypecheckFiles` was handwritten with static regexes instead of parsing `tsconfig.build.json`.
  4. Button class string concatenated conflicting utility color classes.
  5. Missing synchronous test coverage on `dragEnd` coordinate commitment.
- **Target Files**:
  - `src/physics/graphSimulation.ts`
  - `src/physics/graphSimulation.test.ts`
  - `src/utils/bridgeGeometry.ts`
  - `src/utils/bridgeGeometry.test.ts`
  - `src/utils/vercelParity.test.ts`
  - `tsconfig.build.json`
  - `src/components/ControlsOverlay.tsx`
  - `openspec/specs/graph-simulation/spec.md`
  - `openspec/changes/portfolio-v2-ferrofluid-audio/verification.md`
- **Expected Resolution**:
  1. Idle reconnect only triggers if `distance <= SNAP_MULTIPLIER * restDistance` (or within 1.4x), and unit test verifies distance at reconnection.
  2. Sag scales proportionally with base width (`sag * clamp(baseWidth / 10, 0.5, 1.2)`), reducing 1-tag 6px bridge wobble to ±20-30% and keeping waist width cleanly above minimum clamp.
  3. `tsconfig.build.json` excludes `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`; `vercelParity.test.ts` reads the config directly.
  4. `ControlsOverlay.tsx` uses conditional selection for `text-[var(--color-accent)]` vs `text-[var(--color-muted)]`.
  5. `dragEnd` test asserts `node.x === pinnedX && node.y === pinnedY` immediately on release.
- **Status**: RESOLVED (2026-11-12 15:47:04 UTC)
- **Resolution**:
  - Idle reconnect now also requires `distance <= SNAP_MULTIPLIER * restDistance`; a dedicated test forces the coast-to-idle transition while stretched beyond 2x and verifies the bridge stays detached until the node returns inside that bound, recording the exact reconnect distance.
  - `bridgeGeometry.ts` scales sag by `clamp(baseWidth / 10, 0.5, 1.2)`; 6px/10px/14px ribbons now shift by 6px/10px/12px for a 10px sag input.
  - `vercelParity.test.ts` parses `include`/`exclude` from `tsconfig.build.json`; the config now excludes `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `src/**/*.test.*`, and `src/**/*.spec.*`.
  - The Sound button uses a color-free `bareTextBase` plus exactly one conditional text-color class, eliminating the Tailwind conflict.
  - A new synchronous test asserts `dragEnd` commits the final pinned `node.x`/`node.y` without a physics tick.
