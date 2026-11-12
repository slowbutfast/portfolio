# Verification Report: portfolio-v2-ferrofluid-audio

> **Patch notice:** PATCH-01 and PATCH-02 supersede the initial pre-patch audit assumptions below. See the PATCH-01 section near the end for the Vercel-parity, real-tick, and stored-audio corrections, and the PATCH-02 section for the bounded idle reconnect, width-scaled wobble, dynamic tsconfig parity guard, and Sound-button class fix.

## Executive Summary

The ferrofluid bridge, drag-snap mechanics, procedural Web Audio engine, 8-project planar catalog, optional repository links, smooth drawer tracking, header `Sound` control, metadata, and Node link auditor are implemented and verified.

- TypeScript diagnostics: **0**
- Unit suite: **128 passed, 0 skipped**, 15 files
- Playwright suite: **82 passed, 18 skipped** (desktop + mobile)
- Production build: **successful**
- Planar catalog: **8 projects, 13 edges, 0 crossings** on desktop, mobile, wide, and narrow viewports
- External link audit: **11 pass, 1 warning (LinkedIn 999), 2 fail (pre-existing 404 GitHub repositories)**
- OpenSpec validation: all **7 specs** and both active changes valid

No critical implementation issues were found. The two 404 repository links are pre-existing catalog drift, not regressions introduced by this change; the auditor correctly reports them.

## Environment

| Item | Value |
| :--- | :--- |
| Date | 2026-11-12 |
| Node | `v22.23.2` |
| npm | `10.9.8` |
| Platform | `Linux 5.15.0-1081-oracle aarch64` |
| Branch | `noble-ferrofluid` |
| Base commit | `c25b0ab` |
| Change | `openspec/changes/portfolio-v2-ferrofluid-audio` |

## Verification Scorecard

| Dimension | Status |
| :--- | :--- |
| Completeness | 8/8 task groups complete; 6 modified capabilities + 1 new capability |
| Correctness | All delta requirements mapped to implementation evidence and tests |
| Coherence | Design followed; 1 external-link warning and 1 legacy-spec suggestion |

## Requirement Adherence Audit Matrix

### ambient-audio (new capability)

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| Procedural 65Hz sawtooth, 600Hz 24dB/oct lowpass, pink noise, parallel 750Hz bandpass, panner | `src/audio/ambientSynth.ts`, `src/audio/audioConstants.ts` | `ambientSynth.test.ts` graph-construction tests |
| Starts on user gesture | `AmbientSynth.start`, `resumeFromGesture`, `armIfNeeded` | `ambientSynth.test.ts` deferred-context and armed-recovery tests; `portfolio.spec.ts` Sound toggle |
| Initial mute default | `DEFAULT_SOUND_ENABLED`, `readSoundPreference` | `ambientSynth.test.ts` preference test; E2E `aria-pressed="false"` |
| Tab visibility suspend/resume | `bindVisibility` + `visibilitychange` handler | `ambientSynth.test.ts` visibility test |
| Armed autoplay recovery | `GESTURE_EVENTS`, `armRecovery`, `resumeFromGesture` | `ambientSynth.test.ts` first-gesture resume test |
| Hover +6dB bandpass swell and decay | `onNodeHover` ramps `hoverGain` to `HOVER_SWELL_GAIN` / 0 | `ambientSynth.test.ts` hover swell test |
| Pointer pan/EQ mapping | `onPointerMove` maps X to `[-0.75, 0.75]`, Y to `[450, 1400]` | `ambientSynth.test.ts` pan/sweep test |
| Drag frequency modulation | `onDragVelocity` clips to ±5% | `ambientSynth.test.ts` drag modulation test |
| All ramps use `setTargetAtTime(..., 0.05)` | `ramp()` helper | `ambientSynth.test.ts` ramp-contract test |
| Accessible `Sound` toggle with persistence | `ControlsOverlay` `audio-toggle`, `aria-pressed`, `App.toggleSound` | E2E header sequence, accessible names, and Sound persistence tests |

### candidate-profile

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| Canonical title `Gregory Lazatin \| Portfolio` and OG tags | `index.html` title, `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `twitter:card` | E2E `document metadata uses the canonical candidate identity` |
| Non-empty Open Graph values | `index.html` | Same E2E test |

### graph-simulation

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| Underdamped oscillator `ζ=0.35`, `ωₙ=14`, substeps ≤16ms, frame clamp 32ms | `src/utils/bridgeOscillator.ts` | `bridgeOscillator.test.ts` constants, envelope, and stability tests |
| Decay envelope bound | `decayEnvelope`, semi-implicit Euler integration | `bridgeOscillator.test.ts` envelope test |
| Resting equilibrium | `stepBridgeOscillator` with zero force | `bridgeOscillator.test.ts` resting-equilibrium tests |
| Reduced motion bypasses oscillation | `GraphCanvas` passes `sag: 0` under reduced motion | E2E reduced-motion graph tests |
| Drag severance past `2.0 × L_rest` | `SNAP_MULTIPLIER`, `updateLinkStates` | `graphSimulation.test.ts` single-edge and 13-edge snap tests |
| Rubber-band tether | `rubberBandDisplacement`, `tetherRadius = 0.75 × min(W,H)` | `graphSimulation.test.ts` tether test |
| Release reconnection at `1.4 × L_rest`, zero edge loss | `RECONNECT_MULTIPLIER`, per-tick reconnect logic | `graphSimulation.test.ts` recovery tests |
| Idle simulation/render suspend | `GraphSimulation.isIdle`, `GraphCanvas` `wake`/`idleSuspended` | Implementation evidence; E2E drag, pointer, and CPU-throttle tests |
| Pointer wakes suspended canvas | `wakeRef` on pointer, resize, theme, filter, focus | E2E drag and pointer tests |
| 8-node planar embedding, 13 edges | `src/data/graphSeeds.ts`, `deriveEdges` | `graphPlanarity.test.ts`, `projects.test.ts` |
| Initial layout 0 crossings on any viewport | `scaleSeeds` affine embedding | `graphPlanarity.test.ts` four-viewport test |
| 300-tick resting equilibrium, 0 crossings, separation ≥44px | `createSimulation` seed homing and per-edge rest distances | `graphPlanarity.test.ts` desktop/mobile settle tests |
| Sandwave strictly inside the K4 triangle | Authoritative seed map | `graphPlanarity.test.ts` containment test |
| Semantic base width `min(R)×0.65` clamped to `6+4(n-1)` | `bridgeBaseWidth` | `bridgeGeometry.test.ts` base-width tests |
| Rest-normalized waist cinching, monotonic, min 2px | `bridgeWaistWidth`, midpoint handle solve | `bridgeGeometry.test.ts` cinching tests |
| Bilateral reflection and C1 continuity with sag | Tangent-line signed handle extension, exact reflection | `bridgeGeometry.test.ts` symmetry, sag, and tangent tests |
| Close-node guard | `distance <= R_A + R_B` returns `null` | `bridgeGeometry.test.ts` close-node tests |

### portfolio-controls

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| Header sequence `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾` | `ControlsOverlay` header markup | E2E `header controls follow the canonical top-right sequence` |
| Sound reflects live state | `aria-pressed={soundEnabled}` | E2E Sound toggle test |

### project-catalog

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| 8 typed projects with concrete previews/tags/titles | `src/data/projects.ts` `satisfies ProjectData[]` | `projects.test.ts` catalog-contract tests |
| `kintsugi-fracture` metadata and links | Catalog entry with `Graphics`, repo, Vercel live URL | `projects.test.ts` new-project test; E2E Kintsugi drawer |
| `ivy-film-festival-2026` metadata and optional repo | Catalog entry with `Design`, live URL, no `repo` | `projects.test.ts` optional-repo test; E2E Ivy drawer |
| Controlled tag vocabulary incl. `Graphics`, `Design` | `ParadigmTag` union | `projects.test.ts`, `graphPlanarity.test.ts` |
| Exact 13-edge topology | `deriveEdges` over shared tags | `projects.test.ts` pinned-edge test; `graphPlanarity.test.ts` |
| No edge when tags do not overlap | `deriveEdges` shared-tag predicate | Existing `graphTopology.test.ts` |
| Sandwave retains only `Vanilla JS`, `Audio` | Catalog entry | `projects.test.ts`, `graphPlanarity.test.ts` |
| Classifications and 01–08 indices | Catalog classifications; `drafting.ts` | `projects.test.ts`, `drafting.test.ts`; E2E grid/index rendering |

### project-drawer

| Requirement / Scenario | Implementation evidence | Verification |
| :--- | :--- | :--- |
| Frame-rate independent RAF anchor lerp, λ≈18 | `ProjectDrawer` `DRAWER_TRACK_LAMBDA`, exponential lerp loop | Implementation evidence; E2E anchored-inspector test |
| Snap to integer pixels at rest | `DRAWER_SNAP_PX`, `Math.round` at rest | Implementation evidence |
| Reduced motion anchors statically | `prefers-reduced-motion` branch in placement effect | E2E reduced-motion drawer test |
| Both `Code ↗` and `Visit ↗` when declared | Conditional header actions | E2E `drawer elevates Code/Visit...` |
| Ivy omits `Code ↗`, renders `Visit ↗` | `{project.repo && (...)}` guard | E2E `Ivy Film Fest drawer renders Visit without a Code action` |
| Tablist only `Media`/`Terminal` | Existing tab construction | E2E `preview-tab-link` count 0 |

## Resolved Assumptions and Empirical Proof

| Assumption | Resolution |
| :--- | :--- |
| Proposed 8 seeds remain planar after adding Ivy/Kintsugi | Verified 0 crossings at 1440×900, 393×852, 1920×1080, and 320×900 before and after 300 simulation ticks. |
| Sandwave stays inside the K4 triangle | Area-decomposition test passes exactly. |
| The 13-edge set matches the intended tag graph | Pinned undirected key list matches all 13 expected pairs. |
| Rubber-band tether still allows bridge detachment | `R_tether = 0.75 × min(W,H)` makes every catalog edge reachable past `2 L_rest` while keeping displacement asymptotic. |
| Sag can coexist with C1 tangency | Implemented as signed tangent-line handle extension rather than off-tangent translation; dot-product tangency tests pass with non-zero sag. |
| Audio can be unit tested without a browser | `AmbientSynth` accepts injected context/storage/document dependencies; all Web Audio nodes are mocked. |
| Link auditing can be mocked | `scripts/audit-links.mjs` exports pure extraction/classification/check functions; tests inject fetch and never hit the network. |
| Two catalog repositories are reachable | **Not resolved.** `sandwave-sim` and `transcribe-plus` GitHub URLs return 404; LinkedIn returns 999 (warning). |

## Nomenclature and Code Symbol Audit

| Symbol | Location | Status |
| :--- | :--- | :--- |
| `BridgeOscillatorState`, `DAMPING_RATIO`, `NATURAL_FREQUENCY`, `MAX_SUBSTEP_MS`, `MAX_FRAME_MS` | `src/utils/bridgeOscillator.ts` | Present and exported |
| `bridgeBaseWidth`, `bridgeWaistWidth`, `computeBridgeGeometry`, `BridgeOptions` | `src/utils/bridgeGeometry.ts` | Present and exported |
| `PLANAR_NODE_SEEDS`, `scaleSeeds` | `src/data/graphSeeds.ts` | Present; exactly 8 catalog-keyed seeds |
| `SNAP_MULTIPLIER`, `RECONNECT_MULTIPLIER`, `rubberBandDisplacement`, `BridgeLinkState`, `isIdle` | `src/physics/graphSimulation.ts` | Present and exported |
| `BASE_FREQ`, `BASE_LOWPASS_FREQ`, `BANDPASS_REST_FREQ`, `BANDPASS_Q`, `HOVER_SWELL_GAIN`, `PAN_MIN/MAX`, `RAMP_TIME_CONSTANT`, `STORAGE_KEY` | `src/audio/audioConstants.ts` | Present and centralized |
| `AmbientSynth`, `getAmbientSynth`, `readSoundPreference` | `src/audio/ambientSynth.ts` | Present; singleton + injectable test dependencies |
| `extractUrlsFromSource`, `extractUniqueUrls`, `classifyStatus`, `isValidEmail`, `checkUrl` | `scripts/audit-links.mjs` / `.d.mts` | Present, typed, importable, CLI-guarded |
| `data-testid="audio-toggle"` + `aria-pressed` | `src/components/ControlsOverlay.tsx` | Present |
| `repo?: string` | `src/types/portfolio.ts`, catalog entries | Present; Ivy omits it |

## Verbatim Execution Logs

### `npm run typecheck`

```text
> node-portfolio-graph@0.1.0 typecheck
> tsc --noEmit
```

Exit code 0; no diagnostics.

### `npm run test:unit`

```text
Test Files  15 passed (15)
Tests       128 passed (128)
```

Included suites: bridgeGeometry (23), graphSimulation (11), graphPlanarity (12), ambientSynth (11), bridgeOscillator (7), projects (11), auditLinks (9), plus existing graphTopology, drafting, profile, terminal, preview, commit, and build-output suites.

### `npm run test:e2e`

```text
82 passed (1.7m)
18 skipped
```

Desktop and Mobile Chrome passed: header sequence, Sound persistence, 8 cards, 8 semantic nodes, Ivy/Kintsugi drawers, metadata, drag recovery, reduced motion, anchored drawer, and all Axe WCAG A/AA checks. A final targeted re-run of the Sound-persistence and load tests after the audio-listener cleanup also passed on both projects (4/4).

### `npm run build`

```text
vite v7.3.6 building client environment for production...
✓ 1959 modules transformed.
dist/assets/index-DQ3Pr5At.js   317.93 kB │ gzip: 101.08 kB
✓ built in 3.31s
```

### `npm run test:links`

```text
PASS    200  https://github.com/slowbutfast/kintsugi-fracture
PASS    200  https://kintsugi-fracture.vercel.app/
PASS    200  https://www.ivyfilmfestival.org/
FAIL    404  https://github.com/slowbutfast/sandwave-sim
FAIL    404  https://github.com/slowbutfast/transcribe-plus
WARNING 999  https://www.linkedin.com/in/gregory-lazatin/

14 URLs: 11 pass, 1 warning, 2 fail
```

The auditor behaves exactly as specified: 200/301 pass, 999/429 warning, 404 fail. The two 404s are pre-existing repository links for projects that are no longer publicly accessible.

### `openspec validate`

```text
spec/ambient-audio       ✓
spec/candidate-profile   ✓
spec/edge-deployment     ✓
spec/graph-simulation    ✓
spec/portfolio-controls  ✓
spec/project-catalog     ✓
spec/project-drawer      ✓
Totals: 7 passed, 0 failed

change/portfolio-v2-ferrofluid-audio ✓
change/vercel-preview-gating         ✓
Totals: 2 passed, 0 failed
```

## Issues by Priority

### CRITICAL

None.

### WARNING

1. **Pre-existing 404 repository links.** `sandwave-sim` and `transcribe-plus` point to GitHub repositories that return 404 to anonymous users. The auditor correctly exits non-zero. Recommendation: update the catalog URLs to public repositories or omit `repo` for those entries in a follow-up content change. Not introduced by this change.

### SUGGESTION

1. **Legacy graph-simulation requirement text.** The pre-existing main spec requirement `Decentralized equal mass node distribution` still mentions 6 nodes, 18px radius, and 60px clearance. The new authoritative planar requirement and current code use 8 nodes, 22px radius, and 44px minimum separation. This drift predates the change; consider normalizing the legacy requirement in a future spec cleanup.

## Final Assessment

**No critical issues.** The implementation is complete and verified. One external-link warning remains for pre-existing broken repository URLs, and one legacy-spec wording suggestion is noted. The change is ready for spec sync (completed), verification, and pull request.

---

## PATCH-01 Verification (2026-11-12 15:29:22 UTC)

### Correction to the prior deployment diagnosis

The earlier note that the failed Vercel deployment "appears to be an upstream Vercel service error" was **incorrect**. The Vercel log shows a real `tsc` failure after `.vercelignore` removed `scripts/`:

```text
src/utils/auditLinks.test.ts(13,8): error TS2307: Cannot find module
  '../../scripts/audit-links.mjs' or its corresponding type declarations.
src/utils/auditLinks.test.ts(37,23): error TS7006: Parameter 'url' implicitly has an 'any' type.
```

Local builds and CI passed because they retain the full file tree. The deployment gate never ran because no `vercel.deployment.success` event fired. PATCH-01 fixes the file-set mismatch rather than changing what Vercel uploads.

### Patch result

| Check | Before patch | After patch |
| :--- | :--- | :--- |
| R5: `.vercelignore`-pruned build | Failed with `TS2307` + `TS7006` | Passed (`tsc --noEmit -p tsconfig.build.json && vite build`) |
| R6: parity guard | Negative fixture undetected until harness fix | 3/3 passed |
| R1: d3 `tick.links` path | Listener absent; 4 tests failed | 4/4 passed (reconnect, ring-down/idle, first-tick priming) |
| R2: stored-preference audio | Sources never started | 2/2 passed (start + ramp; toggled-off no-op) |
| R3: sag pinch clamp | `waist = -7px` at `sag = -10` | Passed (`waist >= 1`, `waistWidth >= 2`) |
| R4: fling amplitude | Peak sag ~0.2px | Moderate ≈1.8px, extreme ≈2.3px; both decay <0.01px |

### Full regression after patch

```text
npm run typecheck   -> clean
npm run test:unit   -> 16 files, 139 passed (128 baseline + 11 new)
npm run test:e2e    -> 82 passed, 18 skipped, 0 Axe violations
npm run build       -> successful (shipped-code typecheck + Vite)
R5 parity build     -> successful after all fixes
```

### Patch-specific implementation notes

- `tsconfig.build.json` includes `src` + `vite.config.ts` and excludes `src/**/*.test.ts`; `typecheck` remains the full-project command.
- `vercelParity.test.ts` parses `.vercelignore` directory entries and proves a non-test `src` file importing `../../scripts/audit-links.mjs` is flagged.
- The new `vercel-parity` CI job prunes `.vercelignore` paths (except `.git/`, `node_modules/`, `dist/`) before `npm run build`.
- `graphSimulation.ts` now has `updateLinkTopology()`, `stepLinkOscillators(dtMs)`, `afterTick(dtMs)`, and a `tick.links` listener driven by real `performance.now()` deltas. The wrapper `tick()` still uses a fixed `TICK_MS` for deterministic tests. On release, the last pinned coordinate is committed before unpinning, and settled recovery guarantees zero permanent edge loss.
- Excitation constants: `EXCITATION_SCALE = 0.04`, `MAX_EXCITATION = 2000`.
- Stored-preference recovery calls `startSources()` and ramps master gain after `ctx.resume()`; toggling off before a gesture leaves the context uncreated.
- Drag pitch uses `DRAG_VELOCITY_FULL_SCALE = 1200` px/s and pointer timestamps in `GraphCanvas`.
- The Sound button keeps the visible label and accessible name `Sound`, exposes `aria-pressed`, and shows an underline + accent pressed state.

### Human follow-ups

1. Confirm the Vercel build turns green on push, then watch the `deployment-gate` / `preview-e2e` run against the real deployment and strict CSP. Report CSP console errors rather than widening the policy.
2. Confirm the wobble visually at 60Hz and 120Hz and listen to audio with a stored "on" preference after reload plus first click.
3. Align the Vercel Project Settings Node version (`26.x`) with `engines.node` (`22.x`).
4. Deferred items remain unchanged: drawer backdrop drag occlusion, two 404 catalog repos, Kintsugi/Ivy media placeholders and summary wording, symmetric-vs-perpendicular sag semantics, muted-context battery, duplicate pointermove ramps, and per-frame drawer `setPosition`.

---

## PATCH-02 Verification (2026-11-12 15:47:04 UTC)

### Findings addressed

1. **Bounded idle reconnect.** The idle backstop now requires `distance <= SNAP_MULTIPLIER * restDistance` in addition to `state === 'idle'`. A dedicated test forces coasting to idle while the nodes are stretched beyond `2 × L_rest`, verifies the bridge stays detached, then records the exact distance when it reconnects and asserts that distance is within the snap bound.
2. **Width-scaled wobble.** `computeBridgeGeometry` now applies `scaledSag = sag × clamp(baseWidth / 10, 0.5, 1.2)`. For a 10px sag input, a 6px ribbon shifts 6px, a 10px ribbon shifts 10px, and a 14px ribbon shifts 12px. This reduces the 6px bridge's swing from the reported ±60% to about ±36% and keeps it away from the 2px pinch clamp.
3. **Dynamic tsconfig parity.** `vercelParity.test.ts` now reads `include` and `exclude` from `tsconfig.build.json`, expands the include roots, and filters with tsconfig-style glob matching (including `**/` semantics). The build config excludes `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `src/**/*.test.*`, and `src/**/*.spec.*`.
4. **Sound class conflict.** `bareTextBase` no longer carries a text color; the Sound button conditionally applies exactly one of `text-[var(--color-accent)]` or `text-[var(--color-muted)]`, plus the underline when pressed.
5. **Synchronous release commit.** A unit test asserts `dragEnd` copies the final pinned `fx`/`fy` into `node.x`/`node.y` before any d3 tick.

### Reproduction and results

| Check | Before PATCH-02 | After PATCH-02 |
| :--- | :--- | :--- |
| Idle backstop beyond `2 × L_rest` | Reconnected immediately once idle | Stayed detached; reconnect distance ≤ `2 × L_rest` |
| Narrow/medium/wide sag shift | All shifted by 10px | 6px / 10px / 12px respectively |
| Parity config source | Hard-coded `src` minus `*.test.ts` | Parsed from `tsconfig.build.json` |
| Broadened test excludes | `*.test.ts` only | `*.test.ts`, `*.test.tsx`, `*.spec.ts`, plus `src/**/*` variants |
| Sound button color | Conflicting text-color classes | Exactly one conditional color |
| `dragEnd` synchronous commit | Untested | Passed |

### Full regression after PATCH-02

```text
npm run typecheck   -> clean
npm run test:unit   -> 16 files, 146 passed (139 PATCH-01 baseline + 7 new)
npm run test:e2e    -> 82 passed, 18 skipped, 0 Axe violations
npm run build       -> successful (shipped-code typecheck + Vite)
R5 parity build     -> successful with .vercelignore paths pruned
```

### Human follow-ups after PATCH-02

1. Push the combined PATCH-01 + PATCH-02 diff, confirm Vercel is green, then watch the strict-CSP deployment gate run.
2. Visually confirm the width-scaled wobble at 60Hz and 120Hz, especially on a 1-tag ribbon.
3. Confirm the Sound button pressed color is visibly cobalt with the underline.
4. All previously deferred items remain deferred.
