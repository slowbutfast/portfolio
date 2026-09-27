## Source material

> "I want to try to create a portfolio website for all of my coding projects, and the way I want to do it is, well, try to make it like a node-based sort of website where like this splash screen is just a bunch of like black nodes on a white background, sort of structured similar to the obsidian node framework, except like there's no central node and all the nodes have like equal weight, so there isn't like the gravity thing, but like as you hover over one of the nodes, like the rest of the nodes kind of move and gravitate... some of them are like CLI tools or like other random things, so I'm fine just linking like the github... but ideally, like some of them I've already deployed to Vercel, but if there's any other methods that I could use to display them on the web."
> — User Request, 2026-09-26

### Raised but not acted on
- **Live iframe embedding**: Investigated across repos (`open-dungeon`, `sandwave-sim`). Rejected because production `vercel.json` configurations explicitly declare `frame-ancestors 'none'` and `X-Frame-Options: DENY`, plus `open-dungeon` has an unauthenticated OAuth gate (`gate.html`). Replaced with a typed `Preview` union (video, screenshot, interactive terminal simulator, and direct live linkouts).
- **Client-side LaTeX compilation via WASM / Pyodide**: Considered for `agentic-resume-builder`. Rejected because TeX distributions are multi-gigabyte system binaries. Replaced with pre-captured, realistic terminal outputs (`--schema`, `--list`, `--lint`).

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| **Decentralized Layout** | Graph layout where a high repulsion charge relative to a weak centering force keeps nodes buoyant and spaced across the canvas. | Zero centering forces (which causes nodes to drift into corners and press against the walls). |
| **Equal Weight / Mass** | Uniform node visual radius (18px) and uniform repulsion charge across all project nodes with soft link springs (strength 0.05). | Physical mass parameter in `d3-force` (nodes in d3 have positions and velocities, but no native mass property), or a high link strength that drags degree-5 nodes to the centroid. |
| **Tag-Derived Edge** | An undirected link generated between two projects if and only if they share a controlled paradigm tag. | Manual hardcoded edge list or K₆ fully-connected mesh from generic tags like "JavaScript". |
| **Terminal Simulator** | A deterministic client-side interactive component executing verified commands (`--help`, `--schema`, `--lint`, `--list` for CLI tools, or `npm test` outputs) with status tags. | An arbitrary in-browser bash or server-side shell sandbox. |
| **Preview Union** | A discriminated union (`terminal`, `video`, `screenshot`, `linkout`) determining what preview tabs render in the drawer. | An `<iframe>` loading arbitrary cross-origin sites. |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| `d3-force` (v3.0.0) | Standard velocity Verlet numerical integrator with `forceManyBody`, `forceLink`, `forceCollide`, `forceX`, `forceY`. Built-in `distanceMin` acts as distance floor. Runs headlessly in Node/Vitest. | ISC | 2026-09-26 |
| Sibling Repo: `open-dungeon` | `vercel.json` sets `frame-ancestors 'none'`. Live URL: `https://open-dungeon-three.vercel.app/`. Has OAuth gate on root. Has 20-tool MCP QA harness and `npm run test:unit`. | MIT | 2026-09-26 |
| Sibling Repo: `agentic-resume-builder` | Python 3.11 CLI (`build_resume.py`). Argparse flags: `--help`, `--schema`, `--list`, `--lint`, `--summary`, `--role`. Hard pdflatex dependency. | MIT | 2026-09-26 |
| Sibling Repo: `transcribe-plus` | Vite + Express 5 monorepo. Static demo fallback asset `frontend/public/clip.mp4` (355,655 bytes) exists and is playable standalone. Test runner: `npm test` (72 tests). | None (Internal / Unlicensed) | 2026-09-26 |
| Sibling Repo: `sandwave-sim` | Vanilla JS Chladni acoustic plate simulator. `vercel.json` sets `X-Frame-Options: DENY` and `frame-ancestors 'none'`. Test runner: `npm test` (Vitest, 266 unit tests). | None (Internal / Unlicensed) | 2026-09-26 |
| Sibling Repo: `attention-max` | Firefox MV3 extension. Prototype UI in `popup/`, `options/`. Test runner: `npm test` (Jest unit tests). | MIT | 2026-09-26 |
| Sibling Repo: `pict-climate-risk-viz-chatbot` | React 19 + Express geospatial raster server. Test runner: `pytest` / server health check. | MIT | 2026-09-26 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| `d3-force` | Adopted | Lightweight (15KB), pure math, flexible parameter tuning, zero DOM baggage. | 2026-09-26 |
| `react-force-graph-2d` | Rejected | Opinionated canvas rendering pipeline; overrides for monochrome styling and custom labels are awkward. | 2026-09-26 |
| `vis-network` | Rejected | Legacy DOM-heavy architecture, larger bundle, outdated aesthetic. | 2026-09-26 |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Adopted | Zero configuration files, lightning-fast compilation, modern CSS theme variables. | 2026-09-26 |
| Vite 7 + React 19 | Adopted | Matches contemporary tooling in sibling repos (`transcribe-plus`). | 2026-09-26 |
| Vitest + Playwright | Adopted | Fast headless unit testing for physics/topology/terminal logic and end-to-end browser smoke test. | 2026-09-26 |

## Patterns adopted

- **Pointer Interaction State Machine**: `idle -> hover -> drag -> coasting`. Hover detection is suppressed during drag and coasting to prevent hover pinning from killing drag momentum.
- **Fling Momentum Injection & Dynamic Decay**: Track pointer positions over the last 3 move events ($\Delta x / \Delta t$); on pointerup, convert px/ms to px/tick, clamp to max velocity, set `node.vx/vy`, temporarily reduce `velocityDecay` to `0.18`, and call `sim.alpha(0.3).restart()`. When speed drops below 0.5 px/tick, restore `velocityDecay` to `0.4` and return to `idle`.
- **Soft Link Spring Attenuation**: To prevent OpenDungeon (which shares tags with 5 projects) from acting as an unintended centroid gravity hub, set link spring strength to a very soft `0.05` (with distance 180px) so repulsion dominates and nodes float on equal footing.
- **Compile-Time Data Contract**: Using `src/data/projects.ts` with `satisfies ProjectData[]` eliminates runtime Zod overhead while guaranteeing 100% build-time type verification.
- **Visible Focus Mirroring & Semantic DOM**: Tabbing through the hidden `<nav aria-label="Projects">` draws a high-contrast focus ring on the canvas node, smoothly pans the view, and sets `data-dimmed="true"` on non-matching nodes for accessible Playwright assertions.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| `transcribe-plus` has `clip.mp4` | 355,655 bytes at `../transcribe-plus/frontend/public/clip.mp4` | Inspected sibling repository file system | 2026-09-26 | stable |
| `open-dungeon` blocks framing | `frame-ancestors 'none'` in `../open-dungeon/vercel.json:52` | Read `vercel.json` in sibling repo | 2026-09-26 | stable |
| `sandwave-sim` blocks framing | `frame-ancestors 'none'` & `X-Frame-Options: DENY` | Read `vercel.json` in sibling repo | 2026-09-26 | stable |
| `build_resume.py` supports `--schema`, `--list`, `--lint` | Valid argparse flags in `build_resume.py` | Inspected script source code | 2026-09-26 | stable |
| `transcribe-plus` and `sandwave-sim` have no license file | No `LICENSE*` matches in their root directories | Shell glob inspection | 2026-09-26 | stable |
| `sandwave-sim` runs Vitest, `attention-max` runs Jest | `package.json` scripts verified | Node script inspection of sibling `package.json` | 2026-09-26 | stable |

## Unverified assumptions

| Assumption | Confidence | Verification Cost |
| :--- | :--- | :--- |
| React 19 + Tailwind v4 works with Vite 7 in clean checkout | High | Run `npm install && npm run build` during scaffolding task 1.1 |
| 6 nodes with weak centering force (0.035) and charge (-min(w,h)*0.55) settle in <1.5s (300 ticks) | High | Automated in headless Vitest test (`src/physics/graphSimulation.test.ts`) |

## Superseded claims

| Prior Belief | Why Wrong | Replacement |
| :--- | :--- | :--- |
| Omit all centering forces (`forceCenter`, `forceX`, `forceY`) | 6 nodes with strong repulsion drift into canvas corners and stick against the boundary walls | Weak centering force (`forceX(w/2).strength(0.035)`, `forceY(h/2).strength(0.035)`) keeps nodes floating buoyantly in view |
| Pinning node on hover preserves drag fling | Re-pinning on pointerup immediately halts release momentum | Pointer interaction state machine (`idle -> hover -> drag -> coasting`) suppresses hover re-pinning during and immediately after fling |
| Embed OpenDungeon in live `<iframe>` | Production Vercel headers enforce `frame-ancestors 'none'` and OAuth gate | Discriminated `Preview` union with screenshot/video, terminal demo, and direct live linkout |
| Global `velocityDecay(0.18)` across simulation | Makes normal layout underdamped and continuously oscillating during hover | Dynamic decay: `0.4` default, drops to `0.18` only while in `coasting`, reverts when velocity < 0.5 px/tick |
| OpenDungeon connects without special tuning | Degree-5 hub pulls OD directly to centroid, violating "no central node" rule | Attenuate link spring strength to soft 0.05 so repulsive charge dominates and OD floats decentralized |
| Sandwave Sim and Attention Max have CLI demos | Neither repository has a CLI entry point (only test runners) | Honest terminal previews capturing real test suite runs (`npm test` / Vitest / Jest) |

## Links out

- OpenDungeon Repository: https://github.com/slowbutfast/open-dungeon
- Agentic Resume Builder: https://github.com/slowbutfast/agentic-resume-builder
- PICT Climate Risk Viz: https://github.com/BrownEarthLab/pict-climate-risk-viz-chatbot
- Transcribe Plus: https://github.com/slowbutfast/transcribe-plus
- Sandwave Sim: https://github.com/slowbutfast/sandwave-sim
- Attention Max: https://github.com/slowbutfast/attention-max-public
