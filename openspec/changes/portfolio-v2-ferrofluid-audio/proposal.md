## Why

The portfolio's current relational graph renders static Bézier bridges that lack tactile physical weight, ambient multi-sensory feedback, and dynamic interactivity. Expanding the project catalog to 8 projects while upgrading connection bridges to living ferrofluid mechanics with harmonic momentum, elastic drag-time snapping, and an audible analog synthesizer transforms the portfolio into an engaging, memorable hiring artifact that demonstrates deep systems engineering and creative mechanics.

## What Changes

- **Ferrofluid Bridge Momentum & Viscosity**: Connection bridges gain inertia, mass, and damping via second-order underdamped harmonic oscillators ($\zeta = 0.35, \omega_n = 14\text{ rad/s}$), creating a fluid wobble upon displacement, release, or snapping with fixed substep integration ($\le 16\text{ms}$).
- **Per-Edge Rest Length & Drag Snapping**: Each edge defines its rest distance $L_{rest}(e)$ from normalized seed distance. Pulling a node past $2.0 \times L_{rest}(e)$ during an active drag visually thins the meniscus and snaps the bridge; rubber-band displacement damping on drag coordinates resists pulling nodes off-screen; releasing the pointer springs the node back into its resting basin, reconnecting when $d \le 1.4 \times L_{rest}(e)$. At rest, all 13 connections are 100% intact.
- **Rest-Normalized Waist Cinching**: Bridges maintain full semantic base thickness ($W_{base} = 6 + 4(n-1)\text{px}$ for $n$ shared tags) at equilibrium and only neck down during active drag beyond $L_{rest}(e)$.
- **Web Audio Ambient Synthesizer**: 100% client-synthesized procedural audio combining a 65Hz sawtooth fundamental, subtle thermal pink noise, a 600Hz 24dB/oct lowpass filter (audible transformer hum on laptop and mobile speakers), a parallel 450Hz–1400Hz resonant bandpass filter ($Q=2.5$, center 750Hz, +6dB hover swell), and spatial $(x, y)$ panning/EQ, controlled via a top-right `Sound` toggle button.
- **8-Project Planar Catalog Expansion**: Add `kintsugi-fracture` and `ivy-film-festival-2026`, introducing controlled `Graphics` and `Design` tags to guarantee all 8 nodes connect with degree $\ge 1$ and strictly 0 edge crossings across desktop and mobile aspect ratios.
- **Optional Repository Link**: Update `ProjectData.repo?: string` so projects without public source code (e.g. `ivy-film-festival-2026`) display `Visit ↗` as the sole primary action without empty spacing or broken buttons.
- **Frame-Rate Independent Smooth Drawer Tracking**: Project drawer smoothly lerps its anchor position during physics settlement and window resize using a damped `requestAnimationFrame` interpolation loop, snapping to integer pixels at rest.
- **Browser Tab Title & Meta**: Update document `<title>` in `index.html` to `Gregory Lazatin | Portfolio`, accompanied by canonical Open Graph metadata.
- **Native ESM Node Link Auditor**: Standalone Node script (`scripts/audit-links.mjs` run via `npm run test:links`) to audit all URLs without browser CORS restrictions, using retries, timeout guards, and GET fallbacks.
- **Idle Render Suspend**: Stop continuous canvas rAF loops when physics velocities and bridge oscillators settle to rest.

## Non-Goals & Scope Decisions

- **In-Browser Project CRUD Admin Page**: Explicitly out of scope. The portfolio is an edge-deployed, static React/Vite single-page application where catalog projects are git-versioned TypeScript data. External URL verification is fulfilled via the standalone Node audit script (`scripts/audit-links.mjs`).
- **Permanent Graph Modification**: Snapping is strictly visual during active drag. Topological links are invariant and permanently preserved at rest.
- **Third-Party Physics/Audio Libraries**: Heavy runtime libraries (Matter.js, Tone.js, Howler) are prohibited; implementation uses native Canvas 2D and Web Audio APIs.

## Capabilities

### New Capabilities
- `ambient-audio`: Web Audio API analog circuit synthesizer with 65Hz sawtooth drone, 600Hz lowpass filter, parallel resonant hover bandpass swell, canvas spatial panning/EQ, and accessible `Sound` toggle.

### Modified Capabilities
- `graph-simulation`: Underdamped harmonic oscillator bridge momentum, per-edge relative drag snapping ($d > 2.0 \times L_{rest}(e)$), rubber-band drag tethering, rest-normalized waist cinching, and authoritative 8-node planar seed embedding.
- `project-catalog`: 8-project catalog with `kintsugi-fracture` and `ivy-film-festival-2026`, controlled `Graphics` and `Design` tags, and optional `repo?: string`.
- `project-drawer`: Smooth RAF position tracking during settlement/resize, and clean handling of optional `repo` (omitting `Code ↗` and rendering `Visit ↗`).
- `portfolio-controls`: Top-right header sequence organizes: `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `Filters ▾`.
- `candidate-profile`: Document `<title>` formatting set to `Gregory Lazatin | Portfolio` with Open Graph metadata.

## Impact

- **Types & Data**: `src/types/portfolio.ts` (`ParadigmTag`, `ProjectData.repo?: string`), `src/data/projects.ts`, `src/data/graphSeeds.ts`.
- **Physics & Math**: `src/utils/bridgeGeometry.ts`, `src/utils/bridgeOscillator.ts`, `src/physics/graphSimulation.ts`.
- **Audio Engine**: `src/audio/ambientSynth.ts`, `src/audio/audioConstants.ts`.
- **Components**: `src/components/GraphCanvas.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ControlsOverlay.tsx`.
- **Tooling & HTML**: `scripts/audit-links.mjs`, `index.html`, package scripts (`test:links`).
