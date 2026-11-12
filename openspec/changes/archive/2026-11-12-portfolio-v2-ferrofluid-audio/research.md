## Source material

- **User Directives (2026-11-12)**:
  - *"give the node connections weight/momentum. I'm envisioning the node connections to be more like fluids/ferrofluid, where disconnecting and reconnecting nodes would make the connections oscillate a bit like fluid, then eventually stop moving as if there was drag/friction on the fluid"*
  - *"make nodes only connect if they have common traits/or maybe make the thickness of the line coincide with how many tags/features they have in common. and since i want to make the connections more physics based, then maybe the thickness of the node connections could be inversely proportional to the distance between nodes."*
  - *"perhaps adding a sound component. what i'm thinking of now, if a slight hum/buzz that you might finfd on an idle power supply or something, then as you hover over a node, a slight increase in volume and intensity. and then maybe as you move nodes around, you change the waveform (which could be simulated through an eq) where the positions of the nodes on the page correspond to the sound being outputted"*
  - *"pulling a part nodes. i think i want to force every node to have at least one connection so they don't fly off the page (which if pulled too far, makes the node gravitate towards the center/canvas), but then let nodes detach from one another if, continuing the ferrofluid allegory, the magnetic attraction forces become too weak to sustain a connection."*
  - *"make the project inspector toolbar more smooth/fluid. right now, when the inspector window for a project 'follows' a node, it moves in discrete steps."*
  - *"right now, the two links under the link tab for each project is redundant... for projects without a live vercel demo page, we can simply link to the github repo with a 'Visit GitHub' link, and then for projects with a live vercel demo page, we can have that plus a link to the vercel demo with a 'Visit' button."*
  - *"add these two projects: https://github.com/slowbutfast/kintsugi-fracture/, with the vercel demo page here: https://kintsugi-fracture.vercel.app/; and the 2026 Ivy Film Festival website which I helped for the web design coding and design branding/idea implementation on the squarespace website, with a link here: https://www.ivyfilmfestival.org/"*
  - *"a config page where i can test the links across the whole website to make sure they go to the right places, and maybe too have an integrated area to manage/add/delete/edit projects. so like a CRUD feature lol."*
  - *"Change the tab name from 'Gregory Lazatin - Portfolio' to 'Gregory Lazatin | Portfolio'"*
  - *"and I don't care about the change scoping, so ignore that advice from that one agent."*

- **Technical Evaluator Audits (2026-11-12)**:
  - Both new projects would be isolated nodes if tagged with unshared single-use tags. Add controlled `'Graphics'` and `'Design'` tags so `deriveEdges` builds valid connections.
  - Due to the Jordan curve theorem, because `sandwave-sim` is embedded strictly inside $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$, external nodes must attach to perimeter nodes (`attention-max`, `agentic-resume-builder`, `pict-climate-risk-viz-chatbot`) to maintain 0 crossings.
  - Pure sub-bass sines (55/110Hz) produce zero harmonics for higher bandpass filters and are inaudible on laptop speakers. Synthesize with a 65Hz sawtooth oscillator and subtle pink noise into parallel lowpass and bandpass filters.
  - A fixed pixel detach threshold (`420px`) would dissolve links at initial load on mobile and desktop. Make detachment relative to rest distance ($d > 2.2 \times L_{rest}$), apply it only during active user drag, and restore links on pointer release so recruiters cannot permanently break the graph.
  - Cinching curve must normalize against rest distance ($L_{rest}$), keeping full semantic thickness at equilibrium.
  - In-browser CORS and edge CSP (`connect-src 'self'`) prevent checking external links via client-side fetch. Ship a Node script (`scripts/audit-links.ts` via `npm run test:links`) for CI testing.

### Raised but not acted on

- **Splitting the change into five separate PRs**: The user explicitly instructed to ignore the change-scoping split advice and deliver the unified feature set together.
- **Permanent topological detachment at rest**: Allowing links to permanently vanish after dragging would leave disconnected graphs for recruiters. Instead, detachment is purely visual during dragging, with elastic spring-back and reconnection upon release.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Ferrofluid Momentum | Second-order underdamped harmonic oscillation ($\zeta = 0.35, \omega_n = 14\text{ rad/s}$) applied to bridge sag and waist | Static Bézier curves without inertia or velocity response |
| Drag-Time Snap | Visual meniscus pinching and droplet recoil occurring only while a node is actively dragged past $2.2 \times L_{rest}$ | Deleting graph edges permanently from the data model at rest |
| Rest-Normalized Cinching | Bridge maintains full semantic thickness $W_{base}$ for $d \le L_{rest}$, necking down only when stretched during drag | Pinched, needle-thin bridges at resting equilibrium |
| Orphan Guard | Elastic spring tether resisting drags beyond $d_{snap}$ and pulling the node back toward its resting basin on release | Letting nodes drift off-canvas or become disconnected islands |
| Harmonic Richness | Audio synthesis source containing overtone multiples across 100Hz–3000Hz (sawtooth + noise) | Pure sine waves that cannot trigger bandpass filters |
| Tag-Derived Edges | Edges generated deterministically by `deriveEdges` comparing shared `ParadigmTag` values | Manually hardcoded edges disconnected from the project tag arrays |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Damped Harmonic Oscillator ODE | $\ddot{x} + 2\zeta\omega_n \dot{x} + \omega_n^2 x = F(t)$ provides stable, mass-and-friction physical response with exponential decay envelope $e^{-\zeta \omega_n t}$ | Classical mechanics | 2026-11-12 |
| Jordan Curve Theorem & Planar Subgraphs | Any continuous path from the interior of a non-self-intersecting closed curve to its exterior must intersect the curve. Thus, external nodes cannot connect to interior node `sandwave-sim` without crossing the bounding $K_4$ triangle | Topology | 2026-11-12 |
| Web Audio API Specification (W3C) | AudioContext must be initiated/resumed on user gesture; `setTargetAtTime()` provides click-free exponential parameter ramping | W3C Recommendation | 2026-11-12 |
| WCAG 2.1 Success Criterion 1.4.2 | Audio playing automatically for more than 3 seconds must have a mechanism to pause, stop, or control audio volume | W3C Standard | 2026-11-12 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Native Web Audio API | Adopted | Real-time procedural synthesis with zero audio file bundle overhead (~3KB code) | 2026-11-12 |
| Sawtooth + Noise Source | Adopted | Generates rich harmonic spectra audible on laptop and mobile speakers | 2026-11-12 |
| Pure Sine Wave Source | Rejected | Inaudible below 100Hz on mobile devices; produces zero energy for 750Hz hover bandpass | 2026-11-12 |
| Node CLI Link Checker (`scripts/audit-links.ts`) | Adopted | Bypasses browser CORS restrictions and respects edge CSP `connect-src 'self'` | 2026-11-12 |
| In-Browser Fetch Link Checker | Rejected | Violates edge CSP and blocked by browser cross-origin security (CORS) | 2026-11-12 |
| Controlled Tags (`Graphics`, `Design`) | Adopted | Integrates new projects into existing catalog with degree $\ge 1$ and 0 edge crossings | 2026-11-12 |

## Patterns adopted

- **Parallel Filter Routing**: Audio routing feeds the rich oscillator into a lowpass filter for the base 65Hz hum and a parallel resonant bandpass filter for the hover swell.
- **Drag-Only Meniscus Snapping**: Thinning and visual bridge severance occurs strictly while dragging, with instantaneous elastic recovery upon release.
- **Idle rAF Suspend**: Canvas render loop stops ticking when physics velocities and oscillator displacements fall below $10^{-3}$, saving battery.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| 8-node layout with controlled tags has zero crossings | 0 crossings | Geometric intersection check of all 13 edges derived from `deriveEdges` with Kintsugi at (0.84, 0.72) and Ivy at (0.15, 0.75) | 2026-11-12 | stable |
| Every node has degree $\ge 1$ | True | Verified minimum degree is 1 (`kintsugi-fracture`), max is 6 (`attention-max`) | 2026-11-12 | stable |
| `sandwave-sim` cannot connect externally | True | Proved by Jordan curve theorem on $\triangle(\text{open-dungeon}, \text{transcribe-plus}, \text{attention-max})$ | 2026-11-12 | stable |
| Web Audio requires user gesture to start | True | Browser autoplay policy blocks AudioContext state transitions before user click | 2026-11-12 | stable |

## Unverified assumptions

| Assumption | What checking costs |
| :--- | :--- |
| `https://www.ivyfilmfestival.org` and `https://kintsugi-fracture.vercel.app` remain online | Running `npm run test:links` |

## Superseded claims

| What was believed | Why it was wrong | What replaced it |
| :--- | :--- | :--- |
| New projects could have arbitrary tags | `deriveEdges` produced 0 edges, creating isolated orphan nodes | Controlled `Graphics` and `Design` tags connecting to `attention-max` and `agentic-resume-builder` |
| Pure 55/110Hz sines could produce 750Hz hover swell | Pure sine waves contain zero harmonic overtones | 65Hz sawtooth oscillator + pink noise generator in parallel filter topology |
| Fixed 420px cutoff would work for bridge detachment | 420px exceeds mobile screen widths and dissolves links at initial rest | Relative threshold ($d > 2.2 \times L_{rest}$) applied only during active drag |
| Links should permanently delete on drag detachment | Permanent detachment destroys relational portfolio graph for recruiters | Elastic snap-and-recoil during drag, restoring links upon pointer release |
| Browser page could fetch external URLs to check status | Blocked by browser CORS and CSP `connect-src 'self'` | Node script `scripts/audit-links.ts` run via `npm run test:links` in CI |

## Links out

- [portfolio_v2_ferrofluid_audio_plan.md](../../../../.gemini/antigravity-cli/brain/96a4b78a-fd8e-4e9e-9951-86b3fbf2835e/portfolio_v2_ferrofluid_audio_plan.md)
- [GitHub Issue #9](https://github.com/slowbutfast/portfolio/issues/9)
