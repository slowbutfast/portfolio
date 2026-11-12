# Surgical Patch Handoff: OpenSpec Change 'portfolio-v2-ferrofluid-audio' [PATCH-01]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v2-ferrofluid-audio`
- **Patch ID**: PATCH-01
- **Objective**: (0) Unblock the Vercel build, which fails in `tsc` because `.vercelignore` strips `scripts/` and `e2e/` while a `src` test imports from `scripts/`; (1) make the bridge physics actually run from the simulation's real `tick` event (not a test-only wrapper); (2) make a stored "sound on" preference actually start audio; (3) harden the sag/toggle details around those fixes.
- **Context from the other agent's verification (local production build + GitHub Actions) and the Vercel logs**:
  - Local `npm run build && npm run preview` passes, and the `ci` check was green (typecheck, 128 unit tests, 82 e2e with 0 Axe violations). These numbers are the baseline you must preserve.
  - The Vercel deployment **failed**, and the other agent's note that it "appears to be an upstream Vercel service error" is **wrong**. The Vercel build log shows `Found .vercelignore` / `Removed 179 ignored files`, then `npm run build` (`tsc --noEmit && vite build`) exits 2 with `src/utils/auditLinks.test.ts(13,8): error TS2307: Cannot find module '../../scripts/audit-links.mjs'` and a follow-on `TS7006` on `url`. Local runs and CI have the full file tree, so they cannot reproduce it.
  - Consequence: because the Vercel build failed, no `vercel.deployment.success` event fired, so the `deployment-gate` workflow (`preview.yml`, triggered by `repository_dispatch`) never ran. After this patch lands and Vercel builds, that gate will run the full e2e suite plus `e2e/preview-headers.spec.ts` against the real deployment under the strict CSP. Do not add anything that needs a CSP change, a dev-server-only feature, or `window.__REACT_COMMITS__` to new tests.
  - The other agent's audio check ("0 console errors") toggled Sound by clicking, which uses `start()`. It did not cover the stored-preference reload path (fix D below). Its observed button labels ("Enable ambient sound" / "Mute ambient sound") are the dynamic labels fix G removes, so e2e selectors must move to `data-testid="audio-toggle"`.
  - Informational only (do not act): Vercel logs `Node.js Version defined in your Project Settings ("26.x") will not apply` because `engines.node` is `22.x`. The other agent left untracked `screenshot-*.png` files in the main checkout's root; do not add or commit any screenshots.
- **Branch / worktree**: work in the current worktree (branch `worktree-ferrofluid-patch-handoff`, based on PR #11 head `ea736b3`). Do not push, rebase, or rewrite history; the human handles git.
- **Setup**: `node_modules` is present. If a command fails on a missing module, run `npm ci` once.
- **Feedback & Diagnostic Trace** (verbatim from the PR #11 review):
  ```
  CRITICAL [DEPLOY: src/utils/auditLinks.test.ts:13, .vercelignore, package.json:8]
  Vercel build log (commit ea736b3):
    Found .vercelignore
    Removed 179 ignored files defined in .vercelignore
    > node-portfolio-graph@0.1.0 build
    > tsc --noEmit && vite build
    src/utils/auditLinks.test.ts(13,8): error TS2307: Cannot find module
      '../../scripts/audit-links.mjs' or its corresponding type declarations.
    src/utils/auditLinks.test.ts(37,23): error TS7006: Parameter 'url' implicitly has an 'any' type.
    Error: [BUILD_UTILS_SPAWN_2] Command "npm run build" exited with 2
  .vercelignore excludes scripts/ and e2e/ (and openspec/, test-results/, etc.). The build
  script typechecks the whole tsconfig (include: src, e2e, vite.config.ts,
  playwright.config.ts), including *.test.ts files. auditLinks.test.ts is the only file in
  src/ importing from an ignored directory. CI and local builds have the full tree, so they
  pass.

  CRITICAL [src/physics/graphSimulation.ts:344, 396, 432]
  The bridge link state never updates on animation frames in the app.
  updateLinkStates has three call sites: the wrapper tick() (line 344), dragMove (396),
  and dragEnd (432). GraphCanvas never calls sim.tick(). d3's own timer drives ticks, and
  the canvas handler only calls sim.poll() and render() (GraphCanvas.tsx:375). The unit
  tests drive sim.tick(), which is why they pass. What breaks:
    - Oscillators only step on pointer events, so they never ring down after release.
    - A bridge detached during a drag and released while still past 1.4x L_rest never
      reconnects until the next drag, because graphSimulation.ts:432 defers to "the tick
      loop," which doesn't exist. That violates "zero permanent edge loss."
    - isIdle can stay false forever because the frozen oscillator velocity never decays,
      so the canvas never suspends.

  CRITICAL [src/audio/ambientSynth.ts:335]
  A stored "sound on" preference produces silence. On a returning visit, armIfNeeded builds
  the graph (master gain 0, sources not started) and arms a gesture handler.
  resumeFromGesture then only calls ctx.resume(). Starting the oscillator and noise, and
  ramping the master gain, happens only in start(), which this path never calls. The
  toggle shows pressed while nothing plays. The test at ambientSynth.test.ts:316 asserts
  only that resume was called.

  IMPORTANT [graphSimulation.ts:88, 300, 344, 396, 432] Hard-coded 16.7ms step.
  updateLinkStates(TICK_MS) runs per pointermove with a fixed TICK_MS. On a high-rate mouse
  the oscillator advances far faster than real time and the derived acceleration is wrong.

  IMPORTANT [graphSimulation.ts:94] The headline wobble is imperceptible. A simulated fast
  fling (distance 300->420px in 150ms) gave peak sag 0.21px; through bridgeGeometry.ts:197,
  1px of sag changes bridge width by 2px, so that is ~0.4px on a 6px ribbon.

  IMPORTANT [bridgeGeometry.ts:197] No lower clamp on sag: at base width 6px, sag = -3
  pinches the bridge to zero width and more crosses the axis.

  IMPORTANT [App.tsx:262] Side effect in a state updater: synth.setSoundEnabled(next) runs
  inside the setSoundEnabled callback (render phase). Risks iOS Safari's user-gesture rule
  and StrictMode double invocation.

  IMPORTANT [ControlsOverlay.tsx:117] No visible Sound state; the accessible name changes
  with aria-pressed ("Mute ambient sound, pressed" reads as a double negative).

  NIT [GraphCanvas.tsx:556, ambientSynth.ts:401] onDragVelocity gets (delta)*60 per
  pointermove and normalizes by speed/40, so it depends on pointer polling rate and
  saturates at 40px/s.
  ```
- **Root Cause Analysis**:
  0. The Vercel build runs the full-project typecheck (the `typecheck`-in-`build` gate from the `vercel-preview-gating` change) on a tree from which `.vercelignore` has removed `scripts/` and `e2e/`. A `src` test file imports `../../scripts/audit-links.mjs`, so `tsc` cannot resolve it. This is the typecheck gate working as designed, exposing a CI-versus-Vercel file-set gap that nothing replicates today.
  1. `createSimulation` exposes a `tick()` wrapper that calls `sim.tick(); updateLinkStates(TICK_MS); poll()`. Tests use the wrapper. The app does not: it starts d3's timer (`sim.sim.alpha(1).restart()`), and d3 emits the `tick` event from its internal step. Nothing inside `createSimulation` subscribes to that event, so link snapping, reconnection, and oscillators only advance inside `dragMove`/`dragEnd`.
  2. d3's `simulation.tick()` (called manually) does **not** dispatch the `tick` event. Only the internal timer does. So the fix must both subscribe to the event for the app and keep the wrapper for tests, sharing one function.
  3. `previousDistance` is initialized to `0` (`graphSimulation.ts:216`), so the first real update would compute a huge velocity and inject a clamped impulse. This is currently masked because updates rarely run; the fix would expose it.
  4. `resumeFromGesture` resumes the context but never reuses the code in `start()` that starts the sources and ramps the master gain.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `tsconfig.build.json` | new file | Typecheck config for shipped code only: extends `./tsconfig.json`, `include: ["src", "vite.config.ts"]`, `exclude: ["src/**/*.test.ts"]`. |
| `package.json` | `L8` (`build` script only) | `"build": "tsc --noEmit -p tsconfig.build.json && vite build"`. Leave `typecheck` (`L10`) as the full `tsc --noEmit` so CI still typechecks tests and e2e. |
| `src/utils/edgeConfig.test.ts` | `L93` (one assertion) | Update the pinned build-script regex to accept `-p tsconfig.build.json` (see fix H). |
| `src/utils/vercelParity.test.ts` | new file | Static guard: no file typechecked by the Vercel build imports a path excluded by `.vercelignore`. |
| `.github/workflows/ci.yml` | add one job after the existing `ci` job | `vercel-parity` job that prunes `.vercelignore`d paths and runs `npm run build`. **Only if the executing environment may write `.github/`;** otherwise skip and report (the human will add it). |
| `src/physics/graphSimulation.ts` | `L94-L95`, `L207-L222`, `L285-L312`, `L342-L346`, `L389-L397`, `L399-L433`, `L488-L494` plus one new `sim.on('tick.links', …)` registration near the other `sim.force(...)` setup | Split `updateLinkStates` into `updateLinkTopology()` (snap/reconnect, no time) and `stepLinkOscillators(dtMs)`; add `afterTick(dtMs)` used by both the d3 `tick.links` listener (real elapsed time) and the wrapper `tick()` (fixed `TICK_MS` to simulate a 60Hz frame); prime `previousDistance`; make `dragMove`/`dragEnd` call topology only; unsubscribe `tick.links` in `destroy`; export `bridgeExcitation()` and retune `EXCITATION_SCALE`/`MAX_EXCITATION`. |
| `src/physics/graphSimulation.test.ts` | append new `describe` blocks | New tests that drive **only** the d3 `tick.links` listener (see section 5). Do not edit the existing tests. |
| `src/audio/ambientSynth.ts` | `L335-L345` (`resumeFromGesture`), `L401-L407` (`onDragVelocity`) | After `await ctx.resume()`, if still enabled, call `startSources()` and ramp `master.gain` to `MASTER_GAIN` before `disarmRecovery()`. Normalize drag speed by a named constant instead of `speed / 40`. |
| `src/audio/audioConstants.ts` | append one export | `export const DRAG_VELOCITY_FULL_SCALE = 1200;` (px/s at which the 5% pitch shift saturates). |
| `src/audio/ambientSynth.test.ts` | `L316-L328` and one new test | Strengthen the stored-preference test (existing assertion was incomplete); add a "toggled off before gesture does not start" test. |
| `src/utils/bridgeGeometry.ts` | `L193-L200` | Clamp `handle` so the mid waist half-width never drops below `MIN_WAIST_WIDTH / 2`. |
| `src/utils/bridgeGeometry.test.ts` | append one `it` | Pinch-clamp test. Do not edit existing tests. |
| `src/components/GraphCanvas.tsx` | `L168`, `L553-L558`, `L579`, `L592`, `L622` | `lastDragPointRef` carries a timestamp; compute drag velocity in px/s from `e.timeStamp`. Nothing else in this file. |
| `src/App.tsx` | `L262-L268` (`toggleSound`) | Move `synth.setSoundEnabled(next)` out of the state updater; use a ref for the current value. |
| `src/components/ControlsOverlay.tsx` | `L115-L124` (Sound button only) | Remove the dynamic `aria-label`; keep `aria-pressed`; add a visible pressed style. |
| `e2e/portfolio.spec.ts` | only lines that select the Sound button by the old dynamic labels | Switch those selectors to `getByTestId('audio-toggle')`. No other e2e edits. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and line ranges in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT touch `src/components/ProjectDrawer.tsx`, `src/components/NodeHoverCard.tsx`, `src/data/projects.ts`, `src/data/graphSeeds.ts`, `src/utils/bridgeOscillator.ts`, `.vercelignore`, `vercel.json`, anything under `scripts/` (including `audit-links.mjs`, `audit-links.d.mts`), `src/utils/auditLinks.test.ts`, or any `openspec/specs/**` file. The Vercel fix must not change what Vercel uploads; it changes what the Vercel build typechecks.
  - In `package.json`, change only the `build` script value.
  - Do NOT refactor surrounding working code, rename exported symbols, or add dependencies.
  - Do NOT modify `.env` or credential files.
  - Do NOT edit existing passing tests, except: (a) the stored-preference audio test at `ambientSynth.test.ts:316` whose assertion was incomplete, (b) e2e selectors that referenced the old dynamic Sound `aria-label`, and (c) the single build-script regex assertion at `edgeConfig.test.ts:93`, which pins the old script string.
  - Do NOT "fix" the items listed under **Deferred** below. They need a human decision.
- **INVARIANTS TO PRESERVE**:
  - All 128 existing unit tests keep passing (the existing tests that call the wrapper `sim.tick()` must behave exactly as before, so the wrapper must keep stepping oscillators with the fixed `TICK_MS`).
  - The planar-embedding and edge-count tests still pass.
  - Reduced-motion behaviour is unchanged (`GraphCanvas` passes `sag: 0` when reduced motion is on; do not alter that).
  - Default sound state stays off; the context is still not created before an explicit gesture or stored preference.
  - Zero new Axe violations.
  - Everything the Vercel build typechecks and bundles stays exactly the same set of shipped files; only test files leave the build-time typecheck.
  - New e2e tests (if any) must pass against a production build and under the strict CSP: no dev-server-only features, no `window.__REACT_COMMITS__`.

### Deferred (do NOT implement; recorded for the human)
0. Project Settings Node version says `26.x` while `engines.node` is `22.x` (Vercel uses 22.x and warns). Align the setting in the Vercel dashboard.
1. Desktop drawer backdrop (`ProjectDrawer.tsx:254-258`) blocks node dragging, so "drawer follows node during drag" is unreachable.
2. `transcribe-plus` and `sandwave-sim` GitHub repos return 404 (`projects.ts:88,92,104,108`).
3. Kintsugi/Ivy lack media; hover card shows a "CLI specimen" placeholder (`NodeHoverCard.tsx:68`).
4. Kintsugi/Ivy summary wording is unverified.
5. "Sag" is a symmetric width change driven by axial stretch, not lateral sag from perpendicular acceleration (spec wording vs implementation).
6. Muted audio keeps the context running; two `setTargetAtTime` calls per pointermove; per-frame `setPosition` in the drawer.

## 4. Visual & UI Impact
- **Only the Sound button changes visually.** Use existing tokens: `bareText` (defined at `ControlsOverlay.tsx:27`), `var(--color-accent)`. When pressed, append `underline underline-offset-4 text-[var(--color-accent)]`; when not pressed, append nothing. State must not be conveyed by color alone (hence the underline). The visible label stays exactly `Sound`.
- Accessible name becomes the visible text `Sound` (remove the dynamic `aria-label`); keep `aria-pressed={soundEnabled}` and `data-testid="audio-toggle"`.
- Bridge rendering: the only visible change is that the wobble amplitude becomes perceptible (sag band in section 5, test R4). No other canvas, colour, or layout changes.
- Everything else: **Status: Non-visual patch. No styling or layout modifications permitted.**

## 5. Reproduction & Verification Protocol

### Commands
- **R5** (Vercel parity build, reproduces the deployment failure): run the build on a copy of the repo with the `.vercelignore` paths removed, e.g.
  ```
  tmp="$(mktemp -d)" && rsync -a --exclude-from=.vercelignore ./ "$tmp"/ && ln -s "$PWD/node_modules" "$tmp/node_modules" && (cd "$tmp" && npm run build)
  ```
  (`.vercelignore` lists `node_modules/`, so it is excluded by rsync and re-linked; if `rsync` is unavailable, copy the repo and delete the `.vercelignore` entries by hand.) **Before the fix this must fail** with `TS2307 ... '../../scripts/audit-links.mjs'`, matching the Vercel log. After the fix it must pass. Never run the destructive prune inside the real worktree.
- **R6** (parity guard): `npx vitest run src/utils/vercelParity.test.ts`
- **R1** (link state via the d3 event path): `npx vitest run src/physics/graphSimulation.test.ts -t "d3 tick event path"`
- **R2** (stored-preference audio): `npx vitest run src/audio/ambientSynth.test.ts -t "stored preference"`
- **R3** (sag clamp): `npx vitest run src/utils/bridgeGeometry.test.ts -t "pinch"`
- **R4** (wobble amplitude band): `npx vitest run src/physics/graphSimulation.test.ts -t "fling amplitude"`
- **Full regression**: `npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`

### Required fixes (exact behaviour)

**H. Vercel build parity (do this first; it blocks deployment)**
Chosen approach: Vercel should typecheck the code it ships, not the tests, so test files can never again depend on paths `.vercelignore` removes. Rejected alternative: deleting `scripts/` from `.vercelignore` fixes this one import but leaves the same trap for `e2e/` and `openspec/`, and uploads capture tooling to every build.
1. Create `tsconfig.build.json`:
   ```json
   {
     "extends": "./tsconfig.json",
     "include": ["src", "vite.config.ts"],
     "exclude": ["src/**/*.test.ts"]
   }
   ```
2. `package.json` line 8: `"build": "tsc --noEmit -p tsconfig.build.json && vite build"`. `typecheck` stays `tsc --noEmit` (full project, includes tests and e2e), and CI keeps running it.
3. `src/utils/edgeConfig.test.ts:93`: change the regex to `/^tsc --noEmit -p tsconfig\.build\.json\s*&&\s*vite build$/` and update the `it` title to say it typechecks the shipped code before building. The behaviour being pinned (typecheck runs before `vite build`, so a type error fails the deploy) is unchanged.
4. New `src/utils/vercelParity.test.ts` (R6). It must:
   - read `.vercelignore` and collect the directory entries (lines ending in `/`), skipping blank lines and `#` comments, and ignoring `.git/`, `node_modules/`, `dist/`;
   - collect the files the Vercel build typechecks: every `.ts`/`.tsx`/`.d.ts` under `src/` that is not `*.test.ts`, plus `vite.config.ts`;
   - for each, extract relative import specifiers (`from '…'`, `import('…')`, side-effect `import '…'`), resolve them against the importing file, and assert none resolves to a path whose first repo-relative segment is an ignored directory;
   - expose the scan as a pure function taking file contents, with a negative fixture proving it flags `import x from '../../scripts/audit-links.mjs'` from a non-test `src` file.
5. If (and only if) the executing environment may write `.github/`, add a second job to `.github/workflows/ci.yml` named `vercel-parity` (same triggers, `permissions: contents: read`, Node 22, `npm ci`), whose steps are: checkout; setup-node; `npm ci`; a step that removes every directory/glob entry listed in `.vercelignore` except `.git/`, `node_modules/`, and `dist/` (for example `while IFS= read -r line || [ -n "$line" ]; do case "$line" in ''|\#*|.git/|node_modules/|dist/) continue;; esac; rm -rf -- ${line%/}; done < .vercelignore`); then `npm run build`. This replicates Vercel's file set so a divergence fails in CI instead of on the deployment. If `.github/` is not writable, do not work around it; list the job in your final report so the human can add it.
6. Do not change `vite.config.ts`, `tsconfig.json`, `.vercelignore`, or `vercel.json`.

**A. `graphSimulation.ts` — drive link state from the real tick**
1. Split the body of `updateLinkStates` (`L285-L312`):
   - `updateLinkTopology()`: only the snap/reconnect block (`isDetached` logic using `state`, `SNAP_MULTIPLIER`, `RECONNECT_MULTIPLIER`). No time dependence.
   - `stepLinkOscillators(dtMs)`: velocity/acceleration estimate and `stepBridgeOscillator`. Clamp the derivative `dt` to `[1ms, 32ms]`. If `link.previousDistance === 0` (unprimed), set `previousDistance = distance`, `previousVelocity = 0`, and **skip** excitation for that link this call. Also skip excitation (but still update `previous*`) when the real gap exceeds 100ms (e.g. after an idle suspend).
2. Add `afterTick(dtMs)` = `updateLinkTopology(); stepLinkOscillators(dtMs);`.
3. Wrapper `tick()` (`L342-L346`) becomes `sim.tick(); afterTick(TICK_MS); poll();`. It simulates one 60Hz frame for tests and **must keep that fixed step**, so existing tests behave identically.
4. Register the real-time path inside `createSimulation`, after the forces are configured: `sim.on('tick.links', () => { const now = performance.now(); const dt = lastTickAt === null ? 0 : now - lastTickAt; lastTickAt = now; if (dt > 0) afterTick(dt); else updateLinkTopology(); });` (`lastTickAt` is a `let` initialised to `null`). d3 `sim.tick()` does not dispatch events, so the wrapper and the listener never double-count.
5. `dragMove` (`L396`) and `dragEnd` (`L432`): replace `updateLinkStates(TICK_MS)` with `updateLinkTopology()` (no oscillator stepping; removes the pointer-rate coupling). Update the stale comment at `L429-L431`: reconnection now happens via the `tick.links` listener.
6. `destroy` (`L490-L494`): also call `sim.on('tick.links', null)`.
7. Export `bridgeExcitation(accelerationPxPerS2: number): number` = clamp of `acceleration * EXCITATION_SCALE` to `±MAX_EXCITATION`; use it inside `stepLinkOscillators`.

**B. Retune the wobble (test R4 is the acceptance criterion, a human then confirms visually)**
Using `stepBridgeOscillator` and `bridgeExcitation`, simulate a distance profile sampled at 60Hz (dt = 1000/60 ms, derivative computed with that same dt):
- **Moderate fling**: smoothstep from 300px to 420px over 150ms, then hold for 1.5s. Required: `1.2 <= max|sag| <= 3.0` px.
- **Extreme fling**: smoothstep from 300px to 560px over 60ms, then hold. Required: `max|sag| <= 4.0` px.
- Both: final `|sag| < 0.01` after the hold (decay). Adjust `EXCITATION_SCALE` and `MAX_EXCITATION` (`L94-L95`) until both profiles satisfy the bands. Record the final values in a comment above the constants. Do not change `bridgeOscillator.ts`.

**C. `bridgeGeometry.ts` — sag clamp**
After computing `waistDenominator`/`averageHalf`, cap the handle so the mid half-width never falls below `MIN_WAIST_WIDTH / 2`:
`maxPinchHandle = waistDenominator > 0 ? (averageHalf - MIN_WAIST_WIDTH / 2) / waistDenominator : baseHandle;`
`handle = clamp(handleForWaist + sagHandle, -baseHandle, Math.max(-baseHandle, Math.min(baseHandle, maxPinchHandle)));`
Test R3 ("never pinches below the 2px minimum"): base width 6 (R=22, one shared tag, d=300, restDistance=300) with sag = -10 must return `waist >= 1` and `waistWidth >= 2`; sag = +10 must still return a finite geometry. Existing sag tests (`bridgeGeometry.test.ts:191-L240`) must pass unchanged.

**D. `ambientSynth.ts` — stored-preference audio**
In `resumeFromGesture` (`L335`), after `await ctx.resume()` succeeds: `if (this.enabled && this.nodes) { this.startSources(); ramp(this.nodes.master.gain, MASTER_GAIN, ctx); }` and then `disarmRecovery()`. `startSources()` is already idempotent. Test R2 (strengthen `L316-L328`; name must contain "stored preference"): with a stored `'true'` preference and a suspended fake context, after `synth.armIfNeeded()`, `doc.emit('pointerdown')` and awaiting the resume, assert the fake oscillator `start` was called exactly once **and** the master gain's last `setTargetAtTime` target equals `MASTER_GAIN`. Add a second test: if `setSoundEnabled(false)` is called before the gesture, the gesture neither starts the sources nor ramps the master up.

**E. Audio drag velocity**
- `audioConstants.ts`: add `DRAG_VELOCITY_FULL_SCALE = 1200`.
- `ambientSynth.ts:401`: `modulation = clamp(speed / DRAG_VELOCITY_FULL_SCALE, 0, 1) * 0.05` (still at most 5%; the existing test at `ambientSynth.test.ts:288` must pass, update only if it hard-codes the old divisor and say so in your report).
- `GraphCanvas.tsx`: change `lastDragPointRef` to `{ x, y, t }`; in the drag branch compute `dtS = Math.max(0.004, (e.timeStamp - last.t) / 1000)` and call `onDragVelocity((p.x - last.x) / dtS, (p.y - last.y) / dtS)`; set `t: e.timeStamp` wherever the ref is assigned (`L557`, `L579`).

**F. `App.tsx` toggle**
```tsx
const soundEnabledRef = useRef(soundEnabled);
soundEnabledRef.current = soundEnabled;
const toggleSound = useCallback(() => {
  const next = !soundEnabledRef.current;
  soundEnabledRef.current = next;
  synth.setSoundEnabled(next);
  setSoundEnabled(next);
}, [synth]);
```
The audio call must run synchronously in the click handler, not inside a state updater.

**G. `ControlsOverlay.tsx` Sound button**: per section 4. Then update any e2e selectors that used `Enable ambient sound` / `Mute ambient sound` to `getByTestId('audio-toggle')`; keep the existing `aria-pressed` assertions.

### Required new tests (graphSimulation, name them so `-t` filters match)
All of these drive **only** the d3 event path, never the wrapper `sim.tick()`:
- `describe('d3 tick event path')`:
  1. `registers a tick.links listener`: `expect(sim.sim.on('tick.links')).toBeTypeOf('function')` (fails before the fix).
  2. `reconnects a released, detached bridge`: drag a hub node far (> 2x the longest rest distance of one of its links) via `dragStart`/`dragMove`, assert some link `isDetached`, `dragEnd` while still beyond 1.4x, then loop ~600 iterations of `sim.sim.tick(); listener.call(sim.sim)` with `performance.now` mocked to advance 1000/60 ms per iteration; assert every `linkStates[i].isDetached === false`.
  3. `rings down oscillators and reaches idle`: excite with a few `dragMove` calls, `dragEnd`, run the same loop to settle, assert `bridgeOscillatorAmplitude(...) < 0.01` and `isBridgeOscillatorAtRest(...)` for every link and `sim.isIdle === true`.
  4. `does not inject an impulse on the first tick`: right after `createSimulation`, run one iteration and assert every `oscillator.sag` is `0` (within 1e-9).
- `describe('fling amplitude')`: the two profiles from section B.
Mock `performance.now` with `vi.spyOn(performance, 'now')` and restore it in `afterEach`.

### Protocol
1. **Reproduce First**: run R5 and confirm it fails with the same `TS2307` as the Vercel log (this proves the parity harness reproduces the deployment failure). Then add the tests above and run R6 and R1-R4; confirm they fail for the reasons in the diagnostic trace (R6 against the negative fixture or the current tree, R1 on the missing listener, R2 on the missing source start, R3 on `waist < 1`, R4 on `max|sag| ≈ 0.2`).
2. **Apply Minimal Fix**: edits only in the mapped files and lines, fix H first.
3. **Verify Fix**: re-run R5 (now passes) and R6, R1-R4 (all pass).
4. **Full Regression Suite**: run the full regression command; typecheck clean, all unit tests pass (128 existing plus the new ones), e2e passes with the same skip count as before (82 passed, 18 skipped, 0 Axe violations), build succeeds. Then re-run R5 once more after all fixes, because later changes must not reintroduce an import into an ignored directory.

### Human follow-ups (not for the agent; mention in your final report)
- After pushing, confirm the Vercel build goes green, then watch for the `deployment-gate` run (`preview-e2e` commit status). It is the first real run of the strict-CSP header spec and full e2e against this app; report any CSP console errors rather than loosening the policy.
- Correct the earlier note that the Vercel failure was an "upstream service error": it was this `tsc` failure (record that in `verification.md`).
- Confirm the wobble is visible on a real drag (screen recording) at 60Hz and 120Hz, and adjust the constants if the bands are not enough.
- Listen to the audio with a stored "on" preference after a reload and after the first click.

## 6. Surgical Patch Checklist
- [ ] P01.1 Run R5 and confirm it reproduces the Vercel `TS2307`; add the reproducing tests and run R6 and R1-R4; confirm each fails for the stated reason.
- [ ] P01.2 Implement fixes H, then A-G, in the mapped files and line ranges only.
- [ ] P01.3 Re-run R5, R6, and R1-R4 and confirm PASS.
- [ ] P01.4 Run `npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`, then R5 again; confirm zero regressions (e2e: 82 passed, 18 skipped, 0 Axe violations).
- [ ] P01.5 Update `openspec/changes/portfolio-v2-ferrofluid-audio/tasks.md` checkboxes for P01.1-P01.4 to `- [x]`, set PATCH-01 to RESOLVED (with timestamp) in `patch.md`, and append the pass log to `verification.md`.
