## Target Context Map

| File Path (relative to repo root) | Target Line Range | Description of Target Modifications |
| :--- | :--- | :--- |
| `src/types/portfolio.ts` | L1–L10, L40–L48 | Add `'Graphics'` and `'Design'` to `ParadigmTag`; make `repo?: string` optional on `ProjectData`. |
| `src/data/projects.ts` | L1–L135 | Update tags for `attention-max` and `agentic-resume-builder`; append `kintsugi-fracture` and `ivy-film-festival-2026`; ensure `sandwave-sim` has ONLY `['Vanilla JS', 'Audio']`. |
| `src/data/graphSeeds.ts` | L1–L45 | Export 8-node normalized planar coordinates (`PLANAR_NODE_SEEDS`), strictly matching catalog project IDs (`pict-climate-risk-viz-chatbot`, `kintsugi-fracture`, `ivy-film-festival-2026`). |
| `src/utils/graphTopology.ts` | L1–L35 | Ensure `deriveEdges` produces 13 deterministic undirected edges from tag overlaps. |
| `src/utils/bridgeOscillator.ts` | New File | Implement 2nd-order ODE damped harmonic oscillator ($\zeta = 0.35, \omega_n = 14$), fixed substep accumulator ($\delta t_{sub} \le 16\text{ms}$), frame clamp $32\text{ms}$, input force clamping. |
| `src/utils/bridgeGeometry.ts` | L1–L165 | Normalize waist cinching to per-edge rest length ($L_{rest}(e)$); clamp $W_{base}(n) = \min(R_A, R_B) \times 0.65$ to $6 + 4(n-1)\text{px}$; translate Bézier handles by lateral sag $\delta$. |
| `src/audio/audioConstants.ts` | New File | Centralize audio constants (`BASE_FREQ: 65`, `BASE_LOWPASS_FREQ: 600`, `BANDPASS_REST_FREQ: 750`, sweep `450–1400`, pan `[-0.75, 0.75]`, `STORAGE_KEY: 'portfolio_sound_enabled'`). |
| `src/audio/ambientSynth.ts` | New File | Web Audio API synthesizer (65Hz sawtooth, 600Hz lowpass transformer drone, 750Hz resonant bandpass, panner, singleton, armed autoplay recovery, `visibilitychange` suspend/resume). |
| `src/physics/graphSimulation.ts` | L1–L330 | Per-edge drag snap ($d > 2.0 \times L_{rest}(e)$), rubber-band drag tether on `fx`/`fy`, release reconnection ($d \le 1.4 \times L_{rest}(e)$), zero permanent edge loss, bridge oscillator stepping, idle suspend check. |
| `src/components/GraphCanvas.tsx` | L1–L560 | Wire bridge oscillators, per-edge drag snap, idle rAF suspend/resume, and hover/drag audio modulations. |
| `src/components/ControlsOverlay.tsx` | L8–L25, L100–L125 | Add `Sound` button in top-right header controls in exact sequence: `About` -> `GitHub ↗` -> `Graph`/`Grid` -> `Sound` -> `Dark`/`Light` -> `Filters ▾`. |
| `src/components/ProjectDrawer.tsx` | L100–L135, L235–L255 | Guard `Code ↗` link with `{project.repo && (...)}`; implement smooth RAF lerp tracking of anchor position during settlement and resize. |
| `src/App.tsx` | L1–L120 | Manage `soundEnabled` state and pass handlers to `ControlsOverlay` and `GraphCanvas`. |
| `src/components/ListView.tsx` | L1–L150 | Ensure all 8 projects render cleanly in grid mode, handling optional `repo` gracefully in card linkouts. |
| `scripts/audit-links.mjs` | New File | Native ESM Node CLI script for auditing all project and profile URLs with timeout, retries, GET fallback for 405/403, and 999 warning handling. |
| `src/utils/auditLinks.test.ts` | New File | Unit test for URL extraction and mocked HTTP status classification within Vitest. |
| `index.html` | L7–L25 | Update `<title>` to `Gregory Lazatin | Portfolio` and add canonical Open Graph meta tags. |
| `package.json` | Scripts block | Add `"test:links": "node scripts/audit-links.mjs"` script. |
| `src/utils/graphPlanarity.test.ts` | L1–L115 | Assert 8 nodes, 13 edges, Sandwave has no Graphics tag, seed keys match catalog IDs, `countCrossings` throws on unknown ID, 0 crossings on desktop & mobile, 300-tick mobile settle test with separation $\ge 44\text{px}$. |
| `src/utils/bridgeOscillator.test.ts` | New File | Unit tests for oscillator decay envelope $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$, $\delta t_{sub} \le 16\text{ms}$ substeps, and resting equilibrium. |
| `src/utils/bridgeGeometry.test.ts` | L1–L140 | Assert per-edge rest-normalized waist cinching ($W = W_{base}$ at $d \le L_{rest}(e)$), bilateral symmetry, and collinear tangent continuity. |
| `src/physics/graphSimulation.test.ts` | New File | Unit test asserting drag-time bridge detachment, rubber-band resistance, release reconnection ($d \le 1.4 \times L_{rest}(e)$), zero permanent edge loss, and settled planarity. |
| `src/audio/ambientSynth.test.ts` | New File | Unit tests mocking Web Audio nodes against `audioConstants.ts`, armed autoplay resume, `visibilitychange` suspend/resume, and sound toggle persistence. |
| `src/data/projects.test.ts` | L1–L60 | Assert 8 projects, `shortTitle: 'Kintsugi 3D'`, `shortTitle: 'Ivy Film Fest'`, classifications, optional `repo` handling, and valid tags. |
| `e2e/portfolio.spec.ts` | L1–L250 | E2E tests for `Sound` button toggle in header sequence, 8 project cards/nodes, Ivy drawer omitting `Code ↗`, title and OG meta, and Axe accessibility. |

---

## 1. Test Scaffolding (TDD)

- [x] 1.1 Scaffold unit test `src/utils/graphPlanarity.test.ts` asserting:
  - `PROJECTS.length === 8` and `deriveEdges(PROJECTS).length === 13`.
  - Every node has degree $\ge 1$.
  - `sandwave-sim` has ONLY `['Vanilla JS', 'Audio']` and zero edges to `kintsugi-fracture`.
  - `Object.keys(PLANAR_NODE_SEEDS)` strictly equals catalog IDs (`pict-climate-risk-viz-chatbot` is valid), and `countCrossings` throws an error if an unknown ID is provided.
  - `countCrossings` returns 0 for `PLANAR_NODE_SEEDS` on desktop (1440×900) and mobile (393×852).
  - 300 ticks of d3-force simulation with weak seed homing yields 0 crossings at resting equilibrium on both desktop and mobile viewports, and preserves minimum node center separation $\ge 44\text{px}$.
  - `sandwave-sim` is strictly interior to $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$.
- [x] 1.2 Scaffold unit test `src/utils/bridgeOscillator.test.ts` asserting:
  - 2nd-order ODE integration with $\zeta = 0.35, \omega_n = 14\text{ rad/s}$ satisfies decay envelope $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$.
  - Substep accumulator with $\delta t_{sub} \le 16\text{ms}$ and $32\text{ms}$ frame clamp prevents numerical blowup.
  - At zero acceleration, lateral sag decays to resting equilibrium ($|\delta| < 0.001$).
- [x] 1.3 Update unit test `src/utils/bridgeGeometry.test.ts` asserting:
  - Waist width $W_{waist}(d) === W_{base}(n)$ for all $d \le L_{rest}(e)$.
  - $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n - 1)\text{px}$.
  - Waist width decreases monotonically for $d > L_{rest}(e)$.
  - Bilateral reflection symmetry and $C^1$ tangent continuity hold when sag delta $\delta \ne 0$.
  - Returns `null` when $d \le R_A + R_B$.
- [x] 1.4 Scaffold unit test `src/physics/graphSimulation.test.ts` asserting:
  - Dragging a node beyond $2.0 \times L_{rest}(e)$ sets `isDetached: true`.
  - Rubber-band tether function cushions pinned drag coordinates `fx`/`fy`.
  - Releasing drag restores bridge when $d \le 1.4 \times L_{rest}(e)$, preserving all 13 edges with zero permanent edge loss and 0 crossings at settled equilibrium.
- [x] 1.5 Scaffold unit test `src/audio/ambientSynth.test.ts` asserting:
  - Web Audio node creation matching `audioConstants.ts` (`BASE_FREQ = 65`, `BASE_LOWPASS_FREQ = 600`, `BANDPASS_REST_FREQ = 750`, $Q = 2.5$).
  - AudioContext is suspended until explicit user interaction.
  - Armed state smoothly resumes on first user touch if `portfolio_sound_enabled === 'true'`.
  - `document.visibilitychange` suspends when hidden and resumes when visible.
  - Parameter ramps use `.setTargetAtTime` with $0.05\text{s}$ time constant.
  - State synchronizes with `localStorage.portfolio_sound_enabled`.
- [x] 1.6 Update unit test `src/data/projects.test.ts` asserting:
  - 8 projects exist in `projects`.
  - `kintsugi-fracture` (`shortTitle: 'Kintsugi 3D'`, `classification: 'PROCEDURAL MESH GENERATION // WEBGL'`) and `ivy-film-festival-2026` (`shortTitle: 'Ivy Film Fest'`, `classification: 'STUDENT FILM FESTIVAL // BRAND & WEB'`) are valid entries.
  - `repo` is undefined for `ivy-film-festival-2026` and defined string for other projects.
- [x] 1.7 Scaffold unit test `src/utils/auditLinks.test.ts` asserting:
  - URL extraction from `projects.ts` and `profile.ts`.
  - Mocked HTTP response classification (200/301 -> pass, 999/429 -> warning, 404 -> fail).
  - Timeout and regex email validation without live network calls.
- [x] 1.8 Scaffold E2E tests in `e2e/portfolio.spec.ts` asserting:
  - Header controls order: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾`.
  - Clicking `Sound` updates `aria-pressed` from `false` to `true` and saves preference in `localStorage.portfolio_sound_enabled`.
  - 8 nodes appear in Graph view and 8 cards in Grid view.
  - Opening `ivy-film-festival-2026` drawer shows `Visit ↗` but no `Code ↗` button.
  - Document title is `Gregory Lazatin | Portfolio` and Open Graph meta tags exist.

---

## 2. Core Models & 8-Project Planar Catalog

- [x] 2.1 Update `src/types/portfolio.ts`:
  - Add `'Graphics'` and `'Design'` to `ParadigmTag`.
  - Make `repo?: string` optional on `ProjectData`.
- [x] 2.2 Update `src/data/projects.ts`:
  - Ensure `sandwave-sim` retains ONLY `['Vanilla JS', 'Audio']` (do not add Graphics).
  - Tag `attention-max` with `['Vanilla JS', 'WebExtension', 'Design', 'Graphics']`.
  - Tag `agentic-resume-builder` with `['Agent Tooling', 'LaTeX', 'Design']`.
  - Add `kintsugi-fracture`: shortTitle `'Kintsugi 3D'`, classification `'PROCEDURAL MESH GENERATION // WEBGL'`, tags `['Graphics']`, repo defined, liveUrl defined.
  - Add `ivy-film-festival-2026`: shortTitle `'Ivy Film Fest'`, classification `'STUDENT FILM FESTIVAL // BRAND & WEB'`, summary `'Web design, visual identity, and interactive screening program for the student-run Ivy Film Festival.'`, tags `['Design']`, `repo` omitted, liveUrl defined.
- [x] 2.3 Update `src/data/graphSeeds.ts`:
  - Define 8 normalized planar seeds strictly matching catalog project IDs (`pict-climate-risk-viz-chatbot`, `kintsugi-fracture`, `ivy-film-festival-2026`):
    - `agentic-resume-builder`: `(0.18, 0.50)`
    - `open-dungeon`: `(0.40, 0.48)`
    - `pict-climate-risk-viz-chatbot`: `(0.56, 0.22)`
    - `transcribe-plus`: `(0.72, 0.42)`
    - `attention-max`: `(0.52, 0.80)`
    - `sandwave-sim`: `(0.56, 0.55)`
    - `kintsugi-fracture`: `(0.84, 0.72)`
    - `ivy-film-festival-2026`: `(0.15, 0.75)`
- [x] 2.4 Run `npm run test:unit src/utils/graphPlanarity.test.ts src/data/projects.test.ts` to confirm 0 crossings and valid catalog.

---

## 3. Bridge Oscillator & Fluid Cinching

- [x] 3.1 Implement `src/utils/bridgeOscillator.ts`:
  - Export `BridgeOscillatorState` (`sag`, `sagVelocity`, `waistOffset`, `waistVelocity`).
  - Implement 2nd-order ODE integration using Semi-Implicit Euler with substep accumulator ($\delta t_{sub} \le 16\text{ms}$), frame clamping ($32\text{ms}$), $\zeta = 0.35, \omega_n = 14\text{ rad/s}$, and input acceleration clamping.
- [x] 3.2 Update `src/utils/bridgeGeometry.ts`:
  - Accept `restDistance: number` derived per edge ($L_{rest}(e) = \|\text{seed}_u - \text{seed}_v\|$).
  - Implement rest-normalized waist cinching: $W_{waist}(d) = W_{base}(n)$ for $d \le L_{rest}(e)$, and $W_{waist}(d) = W_{base}(n) \times (1 - \frac{d - L_{rest}(e)}{d_{snap}(e) - L_{rest}(e)})^{1.25}$ for $d > L_{rest}(e)$.
  - Calculate base width $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n-1)\text{px}$.
  - Apply lateral sag displacement $\delta$ along the bridge normal vector to Bézier control points while preserving bilateral reflection symmetry and tangent angles.
- [x] 3.3 Run `npm run test:unit src/utils/bridgeOscillator.test.ts src/utils/bridgeGeometry.test.ts`.

---

## 4. Procedural Web Audio Engine

- [x] 4.1 Implement `src/audio/audioConstants.ts`:
  - Export centralized constants: `BASE_FREQ = 65`, `BASE_LOWPASS_FREQ = 600`, `BASE_DRONE_GAIN = 0.063`, `NOISE_FLOOR_GAIN = 0.016`, `BANDPASS_REST_FREQ = 750`, `BANDPASS_SWEEP_MIN = 450`, `BANDPASS_SWEEP_MAX = 1400`, `HOVER_SWELL_GAIN = 2.0`, `PAN_MIN = -0.75`, `PAN_MAX = 0.75`, `RAMP_TIME_CONSTANT = 0.05`, `STORAGE_KEY = 'portfolio_sound_enabled'`.
- [x] 4.2 Implement `src/audio/ambientSynth.ts`:
  - Procedural sound generator using Web Audio API:
    - 65Hz sawtooth oscillator.
    - 600Hz 24dB/oct lowpass filter producing warm audible transformer buzz (-24dBFS).
    - Subtle pink noise buffer generator (-36dBFS).
    - Parallel resonant bandpass filter ($Q = 2.5$) tuned to 750Hz with +6dB swell gain.
    - Stereo panner node for canvas pointer position tracking.
  - Implement `start()`, `stop()`, `setSoundEnabled(enabled: boolean)`, `onPointerMove(xNorm: number, yNorm: number)`, `onNodeHover(isHovered: boolean)`, `onDragVelocity(vx: number, vy: number)`.
  - Use `setTargetAtTime(val, ctx.currentTime, 0.05)` for all parameter ramps.
  - Singleton AudioContext with armed autoplay state and `visibilitychange` suspend/resume.
  - Read/write `localStorage.getItem('portfolio_sound_enabled')`.
- [x] 4.3 Run `npm run test:unit src/audio/ambientSynth.test.ts`.

---

## 5. Physics Simulation & Dynamic Drag Snap

- [x] 5.1 Update `src/physics/graphSimulation.ts`:
  - Derive per-edge rest length $L_{rest}(e)$ from scaled planar seeds.
  - Add link distance guard: during active node drag (`isDragging === true`), if distance $d > 2.0 \times L_{rest}(e)$, mark bridge as snapped (`isDetached: true`).
  - Implement rubber-band displacement damping on pinned drag coordinates `fx`/`fy` to prevent dragging infinitely off-canvas.
  - On pointer release (`dragEnded`), restore all connections and let nodes settle back toward planar equilibrium; bridge reconnects at $d \le 1.4 \times L_{rest}(e)$. Zero permanent edge loss.
  - Maintain map of per-link `BridgeOscillatorState`, stepping each active oscillator and checking whether simulation, camera transforms, and oscillators have converged to sleep.
  - Expose `isIdle: boolean` to pause outer rAF loops.
- [x] 5.2 Run `npm run test:unit src/physics/graphSimulation.test.ts` to verify simulation stability and zero permanent link deletion.

---

## 6. Presentation Components & UI Integration

- [x] 6.1 Update `src/components/GraphCanvas.tsx`:
  - Instantiate and wire `BridgeOscillator` states for each active edge.
  - Render dynamic bridges using updated `computeBridgeGeometry` with sag, per-edge $L_{rest}(e)$, and rest-normalized waist.
  - Suppress rendering of snapped bridges during active drag ($d > 2.0 \times L_{rest}(e)$).
  - Connect audio engine: call `synth.onNodeHover` on hover, `synth.onPointerMove` on canvas move, `synth.onDragVelocity` during drag.
  - Suspend continuous `requestAnimationFrame` loop when simulation, camera lerps, and all bridge oscillators are at rest; awaken on pointer down/move, resize, theme change, filter selection.
- [x] 6.2 Update `src/components/ControlsOverlay.tsx`:
  - Add `Sound` button in top-right header controls in exact sequence:
    `About` -> `GitHub ↗` -> `Graph`/`Grid` -> `Sound` -> `Dark`/`Light` -> `Filters ▾`.
  - Style with `bareText` class, `aria-pressed={soundEnabled}`, and `data-testid="audio-toggle"`.
- [x] 6.3 Update `src/components/ProjectDrawer.tsx`:
  - Conditionally render `Code ↗` button only when `project.repo` is defined (`{project.repo && (...)}`).
  - Implement smooth RAF lerp tracking for desktop HUD position when anchor updates, snapping to integer device pixels upon rest.
- [x] 6.4 Update `src/App.tsx`:
  - Manage audio engine instance and sound preference, providing `soundEnabled` and `onToggleSound` to `ControlsOverlay` and `GraphCanvas`.
- [x] 6.5 Update `src/components/ListView.tsx`:
  - Ensure all 8 projects render cleanly in grid mode, handling optional `repo` gracefully in card linkouts.

---

## 7. Tooling, Link Auditor & HTML Meta

- [x] 7.1 Implement `scripts/audit-links.mjs`:
  - Native ESM Node script using `fetch` with User-Agent, timeout (5000ms), retries, GET fallback for 405/403, and handling 999 (LinkedIn) as non-blocking warning.
  - Add `"test:links": "node scripts/audit-links.mjs"` to `package.json`.
- [x] 7.2 Implement `src/utils/auditLinks.test.ts`:
  - Vitest unit test for URL extraction and mocked HTTP status classification.
- [x] 7.3 Update `index.html`:
  - Set `<title>` to `Gregory Lazatin | Portfolio`.
  - Add canonical Open Graph meta tags (`og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`).
- [x] 7.4 Run `npm run test:links` to verify external links audit cleanly.

---

## 8. Verification & Empirical Audit

- [x] 8.1 Run `npm run typecheck` and verify 0 TypeScript compiler diagnostics.
- [x] 8.2 Run `npm run test:unit` and verify all unit test suites pass cleanly.
- [x] 8.3 Run `npm run test:e2e` across Desktop and Mobile viewports verifying:
  - Header controls order and sound toggle state persistence.
  - 8 projects render in canvas and grid views.
  - Closed-source project (Ivy) renders without `Code ↗` button.
  - Smooth node drag and link snapping recovery.
  - 0 accessibility violations across themes via Axe.
- [x] 8.4 Run `npm run build` and verify clean production bundle output.
- [x] 8.5 Populate `verification.md` with execution traces and Requirement Adherence Matrix.

---

## Patch 01: Unblock Vercel build, drive bridge physics from real ticks, start stored-preference audio, harden sag

- [x] P01.1 Run the Vercel-parity build (R5) to reproduce the `TS2307` failure; scaffold/run reproducing tests: parity guard, d3 `tick.links` path (reconnect, ring-down, idle), stored-preference audio start, sag pinch clamp, fling-amplitude band
- [x] P01.2 Apply minimal targeted fixes: `tsconfig.build.json`, `package.json` build script, `src/utils/edgeConfig.test.ts`, `src/utils/vercelParity.test.ts`, optional `.github/workflows/ci.yml` parity job, then `src/physics/graphSimulation.ts`, `src/audio/ambientSynth.ts`, `src/utils/bridgeGeometry.ts`, `src/App.tsx`, `src/components/ControlsOverlay.tsx`, `src/components/GraphCanvas.tsx`
- [x] P01.3 Verify the parity build and reproduction tests pass, then run the full regression suite and the parity build again
- [x] P01.4 Update verification.md and mark PATCH-01 resolved in patch.md


---

## Patch 02: Bound idle reconnection, scale bridge wobble by width, make build guard read tsconfig, fix Sound class conflict, and assert commit-on-release

- [x] P02.1 Scaffold reproducing test in `src/physics/graphSimulation.test.ts` for idle reconnection distance assertion and commit-on-release coordinate synchronization
- [x] P02.2 Bound idle reconnect in `src/physics/graphSimulation.ts` to `distance <= SNAP_MULTIPLIER * link.restDistance` and scale sag in `src/utils/bridgeGeometry.ts` by base width
- [x] P02.3 Update `tsconfig.build.json` to exclude broader test patterns and update `src/utils/vercelParity.test.ts` to read `tsconfig.build.json` directly
- [x] P02.4 Fix Tailwind class conflict in `src/components/ControlsOverlay.tsx` on Sound button
- [x] P02.5 Verify reproduction tests pass, run full test suite (`npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`), and mark PATCH-02 resolved in patch.md
