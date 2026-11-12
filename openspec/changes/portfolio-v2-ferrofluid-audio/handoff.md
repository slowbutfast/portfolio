# OpenCode Orchestration Handoff: OpenSpec Change 'portfolio-v2-ferrofluid-audio'

You are the orchestration agent for OpenSpec change 'portfolio-v2-ferrofluid-audio' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: `portfolio-v2-ferrofluid-audio`
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub portfolio-v2-ferrofluid-audio`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments and avoid horizontal abstractions.

## 2. Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
| :--- | :--- | :--- |
| `src/types/portfolio.ts` | L1–L10, L40–L48 | Add `'Graphics'` and `'Design'` to `ParadigmTag`; make `repo?: string` optional on `ProjectData`. |
| `src/data/projects.ts` | L1–L135 | Update tags for `attention-max` and `agentic-resume-builder`; append `kintsugi-fracture` and `ivy-film-festival-2026`; ensure `sandwave-sim` has ONLY `['Vanilla JS', 'Audio']`. |
| `src/data/graphSeeds.ts` | L1–L45 | Export 8-node normalized planar coordinates (`PLANAR_NODE_SEEDS`), strictly matching catalog project IDs (`pict-climate-risk-viz-chatbot`, `kintsugi-fracture`, `ivy-film-festival-2026`). |
| `src/utils/graphTopology.ts` | L1–L35 | Ensure `deriveEdges` produces 13 deterministic undirected edges from tag overlaps. |
| `src/utils/bridgeOscillator.ts` | [NEW] | Implement 2nd-order ODE damped harmonic oscillator ($\zeta = 0.35, \omega_n = 14$), fixed substep accumulator ($\delta t_{sub} \le 16\text{ms}$), frame clamp $32\text{ms}$, input force clamping. |
| `src/utils/bridgeGeometry.ts` | L1–L165 | Normalize waist cinching to per-edge rest length ($L_{rest}(e)$); clamp $W_{base}(n) = \min(R_A, R_B) \times 0.65$ to $6 + 4(n-1)\text{px}$; translate Bézier handles by lateral sag $\delta$. |
| `src/audio/audioConstants.ts` | [NEW] | Centralize audio constants (`BASE_FREQ: 65`, `BASE_LOWPASS_FREQ: 600`, `BANDPASS_REST_FREQ: 750`, sweep `450–1400`, pan `[-0.75, 0.75]`, `STORAGE_KEY: 'portfolio_sound_enabled'`). |
| `src/audio/ambientSynth.ts` | [NEW] | Web Audio API synthesizer (65Hz sawtooth, 600Hz lowpass transformer drone, 750Hz resonant bandpass, panner, singleton, armed autoplay recovery, `visibilitychange` suspend/resume). |
| `src/physics/graphSimulation.ts` | L1–L330 | Per-edge drag snap ($d > 2.0 \times L_{rest}(e)$), rubber-band drag tether on `fx`/`fy`, release reconnection ($d \le 1.4 \times L_{rest}(e)$), zero permanent edge loss, bridge oscillator stepping, idle suspend check. |
| `src/components/GraphCanvas.tsx` | L1–L560 | Wire bridge oscillators, per-edge drag snap, idle rAF suspend/resume, and hover/drag audio modulations. |
| `src/components/ControlsOverlay.tsx` | L8–L25, L100–L125 | Add `Sound` button in top-right header controls in exact sequence: `About` -> `GitHub ↗` -> `Graph`/`Grid` -> `Sound` -> `Dark`/`Light` -> `Filters ▾`. |
| `src/components/ProjectDrawer.tsx` | L100–L135, L235–L255 | Guard `Code ↗` link with `{project.repo && (...)}`; implement smooth RAF lerp tracking of anchor position during settlement and resize. |
| `src/App.tsx` | L1–L120 | Manage `soundEnabled` state and pass handlers to `ControlsOverlay` and `GraphCanvas`. |
| `src/components/ListView.tsx` | L1–L150 | Ensure all 8 projects render cleanly in grid mode, handling optional `repo` gracefully in card linkouts. |
| `scripts/audit-links.mjs` | [NEW] | Native ESM Node CLI script for auditing all project and profile URLs with timeout, retries, GET fallback for 405/403, and 999 warning handling. |
| `src/utils/auditLinks.test.ts` | [NEW] | Unit test for URL extraction and mocked HTTP status classification within Vitest. |
| `index.html` | L7–L25 | Update `<title>` to `Gregory Lazatin | Portfolio` and add canonical Open Graph meta tags. |
| `package.json` | Scripts block | Add `"test:links": "node scripts/audit-links.mjs"` script. |
| `src/utils/graphPlanarity.test.ts` | L1–L115 | Assert 8 nodes, 13 edges, Sandwave has no Graphics tag, seed keys match catalog IDs, `countCrossings` throws on unknown ID, 0 crossings on desktop & mobile, 300-tick mobile settle test with separation $\ge 44\text{px}$. |
| `src/utils/bridgeOscillator.test.ts` | [NEW] | Unit tests for oscillator decay envelope $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$, $\delta t_{sub} \le 16\text{ms}$ substeps, and resting equilibrium. |
| `src/utils/bridgeGeometry.test.ts` | L1–L140 | Assert per-edge rest-normalized waist cinching ($W = W_{base}$ at $d \le L_{rest}(e)$), bilateral symmetry, and collinear tangent continuity. |
| `src/physics/graphSimulation.test.ts` | [NEW] | Unit test asserting drag-time bridge detachment, rubber-band resistance, release reconnection ($d \le 1.4 \times L_{rest}(e)$), zero permanent edge loss, and settled planarity. |
| `src/audio/ambientSynth.test.ts` | [NEW] | Unit tests mocking Web Audio nodes against `audioConstants.ts`, armed autoplay resume, `visibilitychange` suspend/resume, and sound toggle persistence. |
| `src/data/projects.test.ts` | L1–L60 | Assert 8 projects, `shortTitle: 'Kintsugi 3D'`, `shortTitle: 'Ivy Film Fest'`, classifications, optional `repo` handling, and valid tags. |
| `e2e/portfolio.spec.ts` | L1–L250 | E2E tests for `Sound` button toggle in header sequence, 8 project cards/nodes, Ivy drawer omitting `Code ↗`, title and OG meta, and Axe accessibility. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Second-order ODE underdamped harmonic oscillator ($\zeta = 0.35, \omega_n = 14\text{ rad/s}$) with fixed substep accumulation ($\delta t_{sub} \le 16\text{ms}$) and input acceleration clamping.
  - Per-edge rest distance $L_{rest}(e) = \|\text{seed}_u - \text{seed}_v\|$ scaled to container dimensions.
  - Visual bridge detachment strictly during active user drag when $d > 2.0 \times L_{rest}(e)$; elastic reconnection upon release at $d \le 1.4 \times L_{rest}(e)$. Zero permanent edge loss.
  - Rubber-band displacement damping on pinned drag coordinates $\vec{P}_{pinned} = \vec{P}_{anchor} + \frac{\vec{\Delta}}{\sqrt{1 + (\|\vec{\Delta}\| / R_{tether})^2}}$.
  - Procedural Web Audio engine: 65Hz sawtooth, 600Hz 24dB/oct lowpass filter (warm transformer buzz), parallel 750Hz resonant bandpass ($Q=2.5$, sweep 450Hz–1400Hz, +6dB hover swell), stereo pan $[-0.75, 0.75]$, singleton context with armed autoplay recovery and `visibilitychange` suspend/resume.
  - Authoritative 8-node planar seed layout strictly guaranteeing 0 segment crossings across desktop (1440×900) and mobile (393×852).
  - Standalone ESM link auditor (`scripts/audit-links.mjs`) and mocked Vitest unit test (`src/utils/auditLinks.test.ts`).
- **Hard Exclusions / No-Go**:
  - Do NOT create an in-browser project CRUD admin config page. Catalog is git-versioned static TypeScript data.
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies (e.g. Tone.js, Howler, Matter.js, tsx). Use native Web Audio, Canvas 2D, and Node 22 ESM.
  - Do NOT permanently delete or break graph edges; topological links must be 100% intact at rest.
  - Do NOT add `Graphics` to `sandwave-sim` (Sandwave must retain only `['Vanilla JS', 'Audio']` to preserve the Jordan curve boundary).
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage.

## 4. Visual & UI Design Specifications
- **Theme**: Fluid Ferrofluid Minimalist (`#f6f6f4` architectural paper background, `#ffffff` surface, `#0a0a0c` text, `#003399` primary cobalt, `#3d7fff` secondary focus outlines, `#525257` muted text, `#71717a` borders).
- **Typography**:
  - H1: `Helvetica Neue`, 28px, weight 700.
  - H2: `Helvetica Neue`, 20px, weight 600.
  - Body: `Helvetica Neue`, 15px, weight 400.
  - Secondary / Tags: `Helvetica Neue Light`, `Helvetica Light`, 11px, weight 300.
  - Code / Terminal: `Menlo`, `Monaco`, `Consolas`, monospace, 12px.
- **Node Geometry & Bridges**:
  - Invariant node radius: `NODE_RADIUS = 22px`.
  - Bridge base width: $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n-1)\text{px}$.
  - Cinching: $W_{waist}(d) = W_{base}(n) \times (1 - \frac{d - L_{rest}(e)}{d_{snap}(e) - L_{rest}(e)})^{1.25}$ for $d > L_{rest}(e)$.
- **Header Controls Sequence**:
  - Top-right sequence: `About` | `GitHub ↗` | `Graph` / `Grid` | `Sound` | `Dark` / `Light` | `Filters ▾`
  - `Sound` button styled with `bareText` class, `aria-pressed={soundEnabled}`, `data-testid="audio-toggle"`.
- **Project Drawer Sticky Actions**:
  - Always render `Visit ↗` when `liveUrl` is present.
  - Conditionally render `Code ↗` only when `project.repo` is defined (`{project.repo && (...)}`). For `ivy-film-festival-2026`, omit `Code ↗` cleanly from the DOM.
  - Smooth RAF lerp tracking for desktop HUD position during anchor updates, snapping to integer device pixels upon rest.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runners**:
  - `npm run typecheck` (tsc diagnostics)
  - `npm run test:unit` (Vitest unit test suite)
  - `npm run test:links` (node scripts/audit-links.mjs)
  - `npm run test:e2e` (Playwright suite across Desktop and Mobile Chrome)
  - `npm run build` (production Vite build)
- **TDD Requirement**: Task group ## 1 MUST scaffold failing unit/integration tests before touching implementation code. Verify they fail initially.

## 6. Implementation Task Checklist

### 1. Test Scaffolding (TDD)
- [ ] 1.1 Scaffold unit test `src/utils/graphPlanarity.test.ts` asserting:
  - `PROJECTS.length === 8` and `deriveEdges(PROJECTS).length === 13`.
  - Every node has degree $\ge 1$.
  - `sandwave-sim` has ONLY `['Vanilla JS', 'Audio']` and zero edges to `kintsugi-fracture`.
  - `Object.keys(PLANAR_NODE_SEEDS)` strictly equals catalog IDs (`pict-climate-risk-viz-chatbot` is valid), and `countCrossings` throws an error if an unknown ID is provided.
  - `countCrossings` returns 0 for `PLANAR_NODE_SEEDS` on desktop (1440×900) and mobile (393×852).
  - 300 ticks of d3-force simulation with weak seed homing yields 0 crossings at resting equilibrium on both desktop and mobile viewports, and preserves minimum node center separation $\ge 44\text{px}$.
  - `sandwave-sim` is strictly interior to $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$.
- [ ] 1.2 Scaffold unit test `src/utils/bridgeOscillator.test.ts` asserting:
  - 2nd-order ODE integration with $\zeta = 0.35, \omega_n = 14\text{ rad/s}$ satisfies decay envelope $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$.
  - Substep accumulator with $\delta t_{sub} \le 16\text{ms}$ and $32\text{ms}$ frame clamp prevents numerical blowup.
  - At zero acceleration, lateral sag decays to resting equilibrium ($|\delta| < 0.001$).
- [ ] 1.3 Update unit test `src/utils/bridgeGeometry.test.ts` asserting:
  - Waist width $W_{waist}(d) === W_{base}(n)$ for all $d \le L_{rest}(e)$.
  - $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n - 1)\text{px}$.
  - Waist width decreases monotonically for $d > L_{rest}(e)$.
  - Bilateral reflection symmetry and $C^1$ tangent continuity hold when sag delta $\delta \ne 0$.
  - Returns `null` when $d \le R_A + R_B$.
- [ ] 1.4 Scaffold unit test `src/physics/graphSimulation.test.ts` asserting:
  - Dragging a node beyond $2.0 \times L_{rest}(e)$ sets `isDetached: true`.
  - Rubber-band tether function cushions pinned drag coordinates `fx`/`fy`.
  - Releasing drag restores bridge when $d \le 1.4 \times L_{rest}(e)$, preserving all 13 edges with zero permanent edge loss and 0 crossings at settled equilibrium.
- [ ] 1.5 Scaffold unit test `src/audio/ambientSynth.test.ts` asserting:
  - Web Audio node creation matching `audioConstants.ts` (`BASE_FREQ = 65`, `BASE_LOWPASS_FREQ = 600`, `BANDPASS_REST_FREQ = 750`, $Q = 2.5$).
  - AudioContext is suspended until explicit user interaction.
  - Armed state smoothly resumes on first user touch if `portfolio_sound_enabled === 'true'`.
  - `document.visibilitychange` suspends when hidden and resumes when visible.
  - Parameter ramps use `.setTargetAtTime` with $0.05\text{s}$ time constant.
  - State synchronizes with `localStorage.portfolio_sound_enabled`.
- [ ] 1.6 Update unit test `src/data/projects.test.ts` asserting:
  - 8 projects exist in `projects`.
  - `kintsugi-fracture` (`shortTitle: 'Kintsugi 3D'`, `classification: 'PROCEDURAL MESH GENERATION // WEBGL'`) and `ivy-film-festival-2026` (`shortTitle: 'Ivy Film Fest'`, `classification: 'STUDENT FILM FESTIVAL // BRAND & WEB'`) are valid entries.
  - `repo` is undefined for `ivy-film-festival-2026` and defined string for other projects.
- [ ] 1.7 Scaffold unit test `src/utils/auditLinks.test.ts` asserting:
  - URL extraction from `projects.ts` and `profile.ts`.
  - Mocked HTTP response classification (200/301 -> pass, 999/429 -> warning, 404 -> fail).
  - Timeout and regex email validation without live network calls.
- [ ] 1.8 Scaffold E2E tests in `e2e/portfolio.spec.ts` asserting:
  - Header controls order: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾`.
  - Clicking `Sound` updates `aria-pressed` from `false` to `true` and saves preference in `localStorage.portfolio_sound_enabled`.
  - 8 nodes appear in Graph view and 8 cards in Grid view.
  - Opening `ivy-film-festival-2026` drawer shows `Visit ↗` but no `Code ↗` button.
  - Document title is `Gregory Lazatin | Portfolio` and Open Graph meta tags exist.

### 2. Core Models & 8-Project Planar Catalog
- [ ] 2.1 Update `src/types/portfolio.ts`:
  - Add `'Graphics'` and `'Design'` to `ParadigmTag`.
  - Make `repo?: string` optional on `ProjectData`.
- [ ] 2.2 Update `src/data/projects.ts`:
  - Ensure `sandwave-sim` retains ONLY `['Vanilla JS', 'Audio']` (do not add Graphics).
  - Tag `attention-max` with `['Vanilla JS', 'WebExtension', 'Design', 'Graphics']`.
  - Tag `agentic-resume-builder` with `['Agent Tooling', 'LaTeX', 'Design']`.
  - Add `kintsugi-fracture`: shortTitle `'Kintsugi 3D'`, classification `'PROCEDURAL MESH GENERATION // WEBGL'`, tags `['Graphics']`, repo defined, liveUrl defined.
  - Add `ivy-film-festival-2026`: shortTitle `'Ivy Film Fest'`, classification `'STUDENT FILM FESTIVAL // BRAND & WEB'`, summary `'Web design, visual identity, and interactive screening program for the student-run Ivy Film Festival.'`, tags `['Design']`, `repo` omitted, liveUrl defined.
- [ ] 2.3 Update `src/data/graphSeeds.ts`:
  - Define 8 normalized planar seeds strictly matching catalog project IDs (`pict-climate-risk-viz-chatbot`, `kintsugi-fracture`, `ivy-film-festival-2026`):
    - `agentic-resume-builder`: `(0.18, 0.50)`
    - `open-dungeon`: `(0.40, 0.48)`
    - `pict-climate-risk-viz-chatbot`: `(0.56, 0.22)`
    - `transcribe-plus`: `(0.72, 0.42)`
    - `attention-max`: `(0.52, 0.80)`
    - `sandwave-sim`: `(0.56, 0.55)`
    - `kintsugi-fracture`: `(0.84, 0.72)`
    - `ivy-film-festival-2026`: `(0.15, 0.75)`
- [ ] 2.4 Run `npm run test:unit src/utils/graphPlanarity.test.ts src/data/projects.test.ts` to confirm 0 crossings and valid catalog.

### 3. Bridge Oscillator & Fluid Cinching
- [ ] 3.1 Implement `src/utils/bridgeOscillator.ts`:
  - Export `BridgeOscillatorState` (`sag`, `sagVelocity`, `waistOffset`, `waistVelocity`).
  - Implement 2nd-order ODE integration using Semi-Implicit Euler with substep accumulator ($\delta t_{sub} \le 16\text{ms}$), frame clamping ($32\text{ms}$), $\zeta = 0.35, \omega_n = 14\text{ rad/s}$, and input acceleration clamping.
- [ ] 3.2 Update `src/utils/bridgeGeometry.ts`:
  - Accept `restDistance: number` derived per edge ($L_{rest}(e) = \|\text{seed}_u - \text{seed}_v\|$).
  - Implement rest-normalized waist cinching: $W_{waist}(d) = W_{base}(n)$ for $d \le L_{rest}(e)$, and $W_{waist}(d) = W_{base}(n) \times (1 - \frac{d - L_{rest}(e)}{d_{snap}(e) - L_{rest}(e)})^{1.25}$ for $d > L_{rest}(e)$.
  - Calculate base width $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n-1)\text{px}$.
  - Apply lateral sag displacement $\delta$ along the bridge normal vector to Bézier control points while preserving bilateral reflection symmetry and tangent angles.
- [ ] 3.3 Run `npm run test:unit src/utils/bridgeOscillator.test.ts src/utils/bridgeGeometry.test.ts`.

### 4. Procedural Web Audio Engine
- [ ] 4.1 Implement `src/audio/audioConstants.ts`:
  - Export centralized constants: `BASE_FREQ = 65`, `BASE_LOWPASS_FREQ = 600`, `BASE_DRONE_GAIN = 0.063`, `NOISE_FLOOR_GAIN = 0.016`, `BANDPASS_REST_FREQ = 750`, `BANDPASS_SWEEP_MIN = 450`, `BANDPASS_SWEEP_MAX = 1400`, `HOVER_SWELL_GAIN = 2.0`, `PAN_MIN = -0.75`, `PAN_MAX = 0.75`, `RAMP_TIME_CONSTANT = 0.05`, `STORAGE_KEY = 'portfolio_sound_enabled'`.
- [ ] 4.2 Implement `src/audio/ambientSynth.ts`:
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
- [ ] 4.3 Run `npm run test:unit src/audio/ambientSynth.test.ts`.

### 5. Physics Simulation & Dynamic Drag Snap
- [ ] 5.1 Update `src/physics/graphSimulation.ts`:
  - Derive per-edge rest length $L_{rest}(e)$ from scaled planar seeds.
  - Add link distance guard: during active node drag (`isDragging === true`), if distance $d > 2.0 \times L_{rest}(e)$, mark bridge as snapped (`isDetached: true`).
  - Implement rubber-band displacement damping on pinned drag coordinates `fx`/`fy` to prevent dragging infinitely off-canvas.
  - On pointer release (`dragEnded`), restore all connections and let nodes settle back toward planar equilibrium; bridge reconnects at $d \le 1.4 \times L_{rest}(e)$. Zero permanent edge loss.
  - Maintain map of per-link `BridgeOscillatorState`, stepping each active oscillator and checking whether simulation, camera transforms, and oscillators have converged to sleep.
  - Expose `isIdle: boolean` to pause outer rAF loops.
- [ ] 5.2 Run `npm run test:unit src/physics/graphSimulation.test.ts` to verify simulation stability and zero permanent link deletion.

### 6. Presentation Components & UI Integration
- [ ] 6.1 Update `src/components/GraphCanvas.tsx`:
  - Instantiate and wire `BridgeOscillator` states for each active edge.
  - Render dynamic bridges using updated `computeBridgeGeometry` with sag, per-edge $L_{rest}(e), and rest-normalized waist.
  - Suppress rendering of snapped bridges during active drag ($d > 2.0 \times L_{rest}(e)$).
  - Connect audio engine: call `synth.onNodeHover` on hover, `synth.onPointerMove` on canvas move, `synth.onDragVelocity` during drag.
  - Suspend continuous `requestAnimationFrame` loop when simulation, camera lerps, and all bridge oscillators are at rest; awaken on pointer down/move, resize, theme change, filter selection.
- [ ] 6.2 Update `src/components/ControlsOverlay.tsx`:
  - Add `Sound` button in top-right header controls in exact sequence:
    `About` -> `GitHub ↗` -> `Graph`/`Grid` -> `Sound` -> `Dark`/`Light` -> `Filters ▾`.
  - Style with `bareText` class, `aria-pressed={soundEnabled}`, and `data-testid="audio-toggle"`.
- [ ] 6.3 Update `src/components/ProjectDrawer.tsx`:
  - Conditionally render `Code ↗` button only when `project.repo` is defined (`{project.repo && (...)}`).
  - Implement smooth RAF lerp tracking for desktop HUD position when anchor updates, snapping to integer device pixels upon rest.
- [ ] 6.4 Update `src/App.tsx`:
  - Manage audio engine instance and sound preference, providing `soundEnabled` and `onToggleSound` to `ControlsOverlay` and `GraphCanvas`.
- [ ] 6.5 Update `src/components/ListView.tsx`:
  - Ensure all 8 projects render cleanly in grid mode, handling optional `repo` gracefully in card linkouts.

### 7. Tooling, Link Auditor & HTML Meta
- [ ] 7.1 Implement `scripts/audit-links.mjs`:
  - Native ESM Node script using `fetch` with User-Agent, timeout (5000ms), retries, GET fallback for 405/403, and handling 999 (LinkedIn) as non-blocking warning.
  - Add `"test:links": "node scripts/audit-links.mjs"` to `package.json`.
- [ ] 7.2 Implement `src/utils/auditLinks.test.ts`:
  - Vitest unit test for URL extraction and mocked HTTP status classification.
- [ ] 7.3 Update `index.html`:
  - Set `<title>` to `Gregory Lazatin | Portfolio`.
  - Add canonical Open Graph meta tags (`og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`).
- [ ] 7.4 Run `npm run test:links` to verify external links audit cleanly.

### 8. Verification & Empirical Audit
- [ ] 8.1 Run `npm run typecheck` and verify 0 TypeScript compiler diagnostics.
- [ ] 8.2 Run `npm run test:unit` and verify all unit test suites pass cleanly.
- [ ] 8.3 Run `npm run test:e2e` across Desktop and Mobile viewports verifying:
  - Header controls order and sound toggle state persistence.
  - 8 projects render in canvas and grid views.
  - Closed-source project (Ivy) renders without `Code ↗` button.
  - Smooth node drag and link snapping recovery.
  - 0 accessibility violations across themes via Axe.
- [ ] 8.4 Run `npm run build` and verify clean production bundle output.
- [ ] 8.5 Populate `verification.md` with execution traces and Requirement Adherence Matrix.

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm 8 projects and 13 edges exist before and after.
3. Ensure `<changeDir>/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.
5. If clean with no critical issues, sync specs: `npx openspec specs apply --change "portfolio-v2-ferrofluid-audio"`.
6. **Open a Pull Request**: Once implementation is complete and `<changeDir>/verification.md` is written and verified with zero critical issues:
   - Ensure work is on a dedicated feature branch (create/switch to `feat/portfolio-v2-ferrofluid-audio`).
   - Stage and commit implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push the branch (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` and report the PR URL.
