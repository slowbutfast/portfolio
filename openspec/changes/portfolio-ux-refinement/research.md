## Source material

- **User Directives (2026-11-12)**:
  - *"can you make the secondary font Helvetica Light"*
  - *"can you make the default color scheme Light"*
  - *"can you move the color scheme toggle to the top right options exactly like you did with Grid/Graph?"*
  - *"can you separate the media and link pills more obviously in the inspect popup"*
  - *"can you make these edits to the about screen: remove Creative Technologist & Software Engineer; remove focus areas; add email to contact field; use text: 'Gregory Lazatin is currently a Junior at Brown University studying Computer Science. He has worked on applied AI systems, geospatial data engineering, and interactive web apps, built with agentic workflows and test-driven design.'"*
  - *"can you actually use menlo for the monospace font?"*
  - *"can we go about, github, graph, dark, filters? so just the recommended header item order"*
  - *"figure out a default node layout for the nodes when the page is first opened that allows them to settle in a 'natural,' and 'aesthetically pleasing' position on first load"*
  - *"make node connections more symmetric: bilateral symmetry along the center-to-center axis (or normal-mirrored Bézier control points)"*
  - *"make sure these design changes are documented within the global DESIGN.md"*

- **Evaluator Audits 1, 2 & 3 (2026-11-12)**:
  - Authoritative planar seeds require Sandwave to be nested strictly inside the $K_4$ triangle (`open-dungeon`, `transcribe-plus`, `attention-max`) to eliminate initial line intersections.
  - Bézier bridges require true $C^1$ tangent continuity at circle perimeters (control points collinear with circle tangents), waist clamping, and close-node distance guards ($d \le R_A + R_B$) to prevent inverted geometry.
  - Retiring the drawer `Link` tab eliminates redundant navigation since `Code ↗` and `Visit ↗` are permanently elevated into the sticky header.
  - Light mode contrast tokens require hardening (`--color-muted: #525257`, `--color-outline: #71717a`) to pass WCAG AAA and AA UI boundaries on `#eae9e5` and `#f6f6f4`.
  - First-paint theme flash for returning dark users must be prevented via `public/theme-init.js`.

### Raised but not acted on

- **Complete removal of interactive physics graph on mobile**: Kept graph accessible at all times via header toggle and bottom sheet inspector.
- **Pure Helvetica for code/terminals**: Monospace font is retained as Menlo for technical accuracy in `TerminalSimulator` ASCII tables and coordinate displays.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| `shortTitle` | Mandatory concise human string on `ProjectData` used for graph canvas node rendering (e.g., `Resume Builder`) | An optional property, or altering the canonical full title in metadata or inspector |
| Bilateral Symmetry | Exact mathematical reflection of the lower bridge boundary curve across the edge centerline ($y_{bottom}(x) = -y_{top}(x)$) | Approximated or visually balanced curves with lopsided or asymmetric control handles |
| $C^1$ Tangent Continuity | Endpoint derivatives of the Bézier curve are strictly collinear with the circle's perimeter tangent vector at the anchor | Control handles placed at arbitrary normal or axial offsets |
| Planar Embedding | Graph vertex positioning where no edge segments cross or intersect each other | A rigid non-draggable static graph |
| Seed Homing Force | Subtle d3-force positioning constraint (`strength: 0.02`) guiding nodes back to planar resting seeds after user drags | Rigidly pinning nodes or disabling physical momentum |
| Candidate Profile | Dedicated data model (`src/data/profile.ts`) managing personal bio, contact endpoints, canonical tagline, and resume links | Storing personal contact data in `projects.ts` or project catalog |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Graph Embedding & Planarity for $K_4$ | A straight-line planar drawing of $K_4$ is achieved by embedding one vertex strictly in the interior of the triangle formed by the other three | Graph theory | 2026-11-12 |
| Hermite & Bézier Tangent Continuity ($C^1$) | A Bézier curve leaves a circle with $C^1$ smoothness if and only if its initial control vector is collinear with the circle tangent at the anchor point | Differential geometry | 2026-11-12 |
| Google Drive Embed & Access Documentation | Google Drive file preview can be embedded using `https://drive.google.com/file/d/<id>/preview`. File requires General Access set to "Anyone with the link can view" | Google Terms of Service | 2026-11-12 |
| MDN Content Security Policy: `frame-src` | Controls valid sources for nested browsing contexts such as `<iframe>`. Missing entry causes browser console security block when `default-src 'self'` is specified | W3C / MDN Open Doc | 2026-11-12 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Menlo for Monospace | Adopted | High legibility, native monospace font with clean fallbacks for CLI terminals and data displays | 2026-11-12 |
| Helvetica / Helvetica Light for UI | Adopted | Clean Swiss modernist typography hierarchy across headings, body, and secondary metadata | 2026-11-12 |
| Nested Planar $K_4$ Seeds | Adopted | Eliminates all edge crossings on initial render and resting states | 2026-11-12 |
| $C^1$ Tangent-Continuous Fluid Bridges | Adopted | Guarantees exact bilateral reflection symmetry with zero lopsided bulging and smooth circle fillets | 2026-11-12 |
| `public/theme-init.js` | Adopted | Synchronous blocking script prevents dark-user flash before first paint without violating CSP | 2026-11-12 |

## Patterns adopted

- **Bilateral Tangent Bridges**: Constructing the top curve using perimeter anchors and tangent handles, then reflecting coordinates across the centerline axis $\vec{u}$ to construct the bottom curve.
- **Weak Seed Homing**: Using d3-force `forceX`/`forceY` at 0.02 strength so nodes settle into their planar positions while remaining fully flingable and interactive.
- **Top-Right Header Sequence**: `About` &bull; `GitHub ↗` &bull; `Graph`/`Grid` &bull; `Dark`/`Light` &bull; `Filters ▾`.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| $K_4$ planar seeds have zero intersections | 0 crossings | Geometric intersection check of all 9 edge segments with Sandwave at (0.56, 0.55) | 2026-11-12 | stable |
| Hardened light contrast tokens pass AAA | 6.4:1 & 3.96:1 | WCAG contrast formula of `#525257` and `#71717a` against `#eae9e5` and `#f6f6f4` | 2026-11-12 | stable |
| Runtime environment is React 19.3 | True | Inspected `package.json` (`react: ^19.0.0`, lockfile resolved `19.3.0`) | 2026-11-12 | stable |
| CSP allows `public/theme-init.js` | True | External script from `'self'` executes under `script-src 'self'` | 2026-11-12 | stable |

## Unverified assumptions

| Assumption | What checking costs |
| :--- | :--- |
| Google Drive resume link has public link sharing enabled ("anyone with link can view") | Manual owner check in Google Drive UI before public deployment |

## Superseded claims

| What was believed | Why it was wrong | What replaced it |
| :--- | :--- | :--- |
| Naive circular seeds were planar | $K_4$ in convex position forces OpenDungeon-Sandwave and Transcribe-AttentionMax to cross at (0.57, 0.59) | Nested Sandwave interior seed layout with zero segment crossings |
| Previous bridge math was symmetric | Control points did not follow circle tangents, creating lopsided pinch angles | Normal-mirrored Bézier control points aligned to circle perimeter tangents |
| `--color-muted #6c6c70` passed AA on all light surfaces | Failed WCAG AA on `#eae9e5` (4.3:1) | Darkened to `#525257` (6.4:1, passing AAA) |
| Drawer needed a Link tab | Redundant when Code and Visit are elevated to sticky header | Retired Link tab; elevated actions permanent in header |

## Links out

- [ui_aesthetic_refinement_plan.md](../../../ui_aesthetic_refinement_plan.md)
- [DESIGN.md](../../../DESIGN.md)
