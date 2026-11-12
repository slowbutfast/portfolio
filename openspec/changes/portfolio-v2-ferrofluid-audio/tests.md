## Automated Tests

- `npm run typecheck`: Verifies compile-time type safety across all updated models:
  - `ProjectData` supporting optional `repo?: string` and expanded `ParadigmTag` (`'Graphics'`, `'Design'`).
  - `BridgeOscillatorState` and 2nd-order ODE substep integration models.
  - `AmbientSynth` audio engine interfaces, singleton lifecycle, and `audioConstants.ts`.
  - `SimulationNode` rubber-band tethering and per-edge drag-time snapping parameters.

- `npm run test:unit`:
  - `src/utils/graphPlanarity.test.ts`:
    - Asserts every project in `PROJECTS` (8 projects) has `degree >= 1` when evaluated with `deriveEdges(PROJECTS)`.
    - Asserts exactly 13 undirected edges are produced by `deriveEdges(PROJECTS)`.
    - Asserts `sandwave-sim` has ONLY `['Vanilla JS', 'Audio']` and does not connect to `kintsugi-fracture`.
    - Asserts `Object.keys(PLANAR_NODE_SEEDS)` matches the set of catalog project IDs exactly (`pict-climate-risk-viz-chatbot` is present and valid), and asserts `countCrossings` throws if an unknown project ID is supplied.
    - Asserts `countCrossings(scaleSeeds(PLANAR_NODE_SEEDS, width, height), edges) === 0` across desktop (1440×900) and mobile (393×852) viewports.
    - Simulates 300 ticks of unperturbed d3-force simulation with weak seed homing (`strength: 0.02`) on both desktop (1440×900) and mobile (393×852) viewports, asserting 0 edge crossings at resting equilibrium and minimum node separation $\ge 44\text{px}$.
    - Asserts `sandwave-sim` remains strictly contained inside the bounding triangle of `open-dungeon`, `transcribe-plus`, and `attention-max`.
  - `src/utils/bridgeOscillator.test.ts`:
    - Asserts underdamped 2nd-order harmonic oscillation: lateral sag delta $\delta(t)$ oscillates with decaying envelope $A(t) \le 1.10 \times \frac{A_0}{\sqrt{1 - \zeta^2}} e^{-\zeta \omega_n t}$ for $\zeta = 0.35, \omega_n = 14\text{ rad/s}$.
    - Asserts numerical stability with substep integration ($\delta t_{sub} \le 16\text{ms}$) under frame drops or throttled execution.
    - Asserts zero sag and clean resting state when endpoint acceleration ceases ($|\delta| < 0.001$).
  - `src/utils/bridgeGeometry.test.ts`:
    - Asserts per-edge rest-normalized waist cinching: $W_{waist}(d) = W_{base}(n)$ for all $d \le L_{rest}(e)$.
    - Asserts $W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n - 1)\text{px}$.
    - Asserts waist thins monotonically when $d > L_{rest}(e)$ up to the snap threshold $d_{snap}(e) = 2.0 \times L_{rest}(e)$.
    - Asserts bilateral reflection symmetry: $n(CP1_{bottom}) = -n(CP2_{top})$ and $n(CP2_{bottom}) = -n(CP1_{top})$ within $10^{-6}$ when sag delta $\delta \ne 0$.
    - Asserts $C^1$ collinear tangent derivatives at both circle boundaries.
    - Asserts `computeBridgeGeometry` returns `null` when distance $d \le R_A + R_B$.
  - `src/physics/graphSimulation.test.ts`:
    - Asserts dragging a node beyond $2.0 \times L_{rest}(e)$ marks the bridge as detached (`isDetached === true`).
    - Asserts rubber-band tether cushions pinned coordinates $\vec{P}_{pinned}$.
    - Asserts drag release triggers elastic recovery: bridge reconnects when $d \le 1.4 \times L_{rest}(e)$, 0 permanent edge loss (all 13 links intact), and 0 crossings at settled equilibrium.
  - `src/audio/ambientSynth.test.ts`:
    - Asserts Web Audio graph nodes are configured with centralized constants (`BASE_FREQ = 65`, `BASE_LOWPASS_FREQ = 600`, `BANDPASS_REST_FREQ = 750`, $Q = 2.5$).
    - Asserts AudioContext initialization is deferred until explicit user gesture.
    - Asserts armed state smoothly recovers on first user touch when `portfolio_sound_enabled` is `'true'`.
    - Asserts `visibilitychange` suspends AudioContext when hidden and resumes when visible.
    - Asserts parameter modulation calls use `setTargetAtTime(target, ctx.currentTime, 0.05)` to eliminate zipper artifacts.
    - Asserts sound preference synchronizes with `localStorage.portfolio_sound_enabled`.
  - `src/data/projects.test.ts`:
    - Asserts exactly 8 projects are exported in `projects`.
    - Asserts `kintsugi-fracture` (`shortTitle: 'Kintsugi 3D'`) and `ivy-film-festival-2026` (`shortTitle: 'Ivy Film Fest'`) exist with required fields, classifications, and summaries.
    - Asserts `repo?: string` is optional: `ivy-film-festival-2026` does not define `repo`, while other projects define valid GitHub URLs.
  - `src/utils/auditLinks.test.ts`:
    - Unit tests URL extraction from `projects.ts` and `profile.ts` using mocked HTTP responses (200/301 -> pass, 999/429 -> warning, 404 -> fail), timeout handling, and regex email validation without making real external network requests.

- `npm run test:e2e`:
  - Verifies top-right header controls render in canonical sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾`.
  - Verifies clicking `Sound` toggles `aria-pressed="true"` / `aria-pressed="false"` and persists to `localStorage.portfolio_sound_enabled`.
  - Verifies 8 projects render in the Graph canvas and all 8 cards display in Grid view.
  - Verifies `ProjectDrawer` renders elevated `Code ↗` and `Visit ↗` buttons for projects with repositories.
  - Verifies `ProjectDrawer` renders `Visit ↗` but completely omits `Code ↗` for `ivy-film-festival-2026`.
  - Verifies smooth continuous canvas rendering during drag and proper rAF suspension when idle.
  - Verifies document title is `Gregory Lazatin | Portfolio` and Open Graph meta tags exist.
  - Verifies Axe WCAG 2.0 A/AA audit produces 0 accessibility violations across themes.

- `npm run build`: Verifies clean production bundling with 0 warnings/errors.

---

## Manual Verification

- **Analog Ambient Drone & Micro-Interactions**:
  - **WHEN** clicking the `Sound` toggle button in the header
  - **THEN** a warm, grounded 65Hz analog transformer hum begins playing at comfortable conversational volume (-24dBFS, lowpass 600Hz), clearly audible on laptop and mobile speakers.
  - **WHEN** hovering over any graph node
  - **THEN** the resonant 750Hz bandpass filter swells +6dB, providing clear focus feedback.
  - **WHEN** moving the cursor across the canvas
  - **THEN** the audio subtly pans left/right ($\pm 0.75$) and the filter cutoff sweeps between 450Hz and 1400Hz without audible clicking or zipper noise.

- **Ferrofluid Bridge Wobble & Inertia**:
  - **WHEN** clicking and dragging a node rapidly across the canvas
  - **THEN** connection bridges sag and oscillate laterally with fluid momentum, settling smoothly with viscous damping upon stopping.

- **Per-Edge Relative Drag-Time Snapping & Reconnection**:
  - **WHEN** dragging a connected node far away from its neighbors ($d > 2.0 \times L_{rest}(e)$)
  - **THEN** the visual bridge necks down to a thin meniscus, snaps cleanly, and recoils into a droplet curve while rubber-band resistance cushions further outward drag.
  - **WHEN** releasing the dragged node
  - **THEN** the node springs back toward the cluster, and all bridges reconnect smoothly once $d \le 1.4 \times L_{rest}(e)$ with a damped ripple. At rest, all 13 connections are 100% restored.

- **Smooth Project Drawer Follow Tracking**:
  - **WHEN** opening a project drawer and observing anchor position settlement
  - **THEN** the drawer anchor smoothly follows using a fluid lerp without stepping or stutter, snapping to crisp integer pixels when stopped.

- **Repository Button Omission on Closed-Source Work**:
  - **WHEN** clicking on the `Ivy Film Festival 2026` node
  - **THEN** the drawer displays the `Visit ↗` button pointing to the festival site, and does NOT render a broken or disabled `Code ↗` button.
