## Source material

- **2026-11-14 — User request (initial)**:
  > "i have a new idea. i want to add a node that links to a WIP art page from my website, but i want the node to be unique unlike any other node in that when you hover on it/after you click on it, it pulses a constant rainbow rgb. the content and media will just say WIP or something similar"
- **2026-11-14 — User clarifications (`ask_question` & plan review)**:
  - **Pulse trigger & persistence**: "Permanently once clicked/visited (and while hovered)" and "and it'll be permanent until the canvas is reset".
  - **WIP Art endpoint**: "can we make an endpoint on this website to a portfolio page, except the content of that page will just be text saying WIP. and it could even just be a raw HTML title saying 'WIP'".
  - **Title & tags**: "'Art (WIP)' with ['Design', 'Graphics'] tags".
  - **Hover-card hint removal**: "do you think we could also scope in a small ui/ux change removes the 'click to inspect ->' text from the pop up hover after a singular node is clicked? but this text doesn't come back even after the canvas is reset" followed by "i think page reload its fine to bring back the button, but not on canvas resets".

### Raised but not acted on

- **Persisting `"Click to inspect ↗"` dismissal in `localStorage`**: Considered during planning, explicitly rejected by the user ("i think page reload its fine to bring back the button, but not on canvas resets"). Session-only React state is used instead.
- **External art site URL**: Rejected in favor of a self-hosted `/art/` static HTML endpoint on this portfolio site.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| `rainbowOnInteract` | Opt-in `ProjectData` boolean enabling continuous rainbow RGB pulsing on hover or while the project is in `visitedIds` | A global effect applied to all nodes, or an always-on pulse before any interaction |
| `Canvas reset` | Invoking `resetAll()` via the `Reset layout` control, which clears `visitedIds`, filters, and layout positions | A browser page reload (`window.location.reload()`) |
| `hasInspectedAnyNode` | Session-only React boolean in `App.tsx` set to `true` on first `openProject(...)` call and untouched by `resetAll()` | Persisted `localStorage` state |
| `WIP` preview | Discriminated `Preview` variant (`{ kind: 'wip'; label: string }`) rendered as a minimal WIP placeholder card in `MediaView`, `NodeHoverCard`, and `ListView` | A terminal demo fallback or missing-asset error |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| — | No external packages or third-party code required; pure Canvas 2D HSL→RGB math and static HTML in Vite `public/` | — | 2026-11-14 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| `public/art/index.html` static file | Adopted | Vite copies `public/` verbatim into `dist/art/index.html`; serves `/art/` on both `vite dev`/`preview` and Vercel with zero inline script/style CSP violations | 2026-11-14 |
| React Router / SPA route for `/art/` | Rejected | Overkill for a raw HTML `WIP` page; the app has no router (`src/App.tsx` uses hash `#/p/:id` / `#/about`) | 2026-11-14 |
| Pure `computeRainbowRgb` helper (`src/utils/rainbowPulse.ts`) | Adopted | Deterministic unit testing of RGB cycling and `prefers-reduced-motion` fallback without Canvas mocking | 2026-11-14 |

## Patterns adopted

- **Observability dataset attributes on `<canvas>`**: Matches existing `canvas.dataset.audioSwell` and `canvas.dataset.focalTagPills` in `src/components/GraphCanvas.tsx` by exposing `canvas.dataset.rainbowNodes` for deterministic E2E assertions.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| `resetAll()` clears `visitedIds` | `setVisitedIds(new Set())` at `src/App.tsx:289` | `read_file` on `src/App.tsx` | 2026-11-14 | stable |
| `GraphCanvas` `render()` runs at 30fps (desktop) / 15fps (coarse) while visible | `ambientRunning` loop in `src/components/GraphCanvas.tsx:794-820` | `read_file` on `src/components/GraphCanvas.tsx` | 2026-11-14 | stable |
| `vercel.json` enforces `default-src 'self'` CSP | No inline `<script>` or `<style>` permitted | `read_file` on `vercel.json:11-12` | 2026-11-14 | stable |
| `projects.test.ts` and `graphPlanarity.test.ts` pin 8 projects and 13 edges | Hardcoded `8` and `13` assertions | `read_file` on `src/data/projects.test.ts` & `src/utils/graphPlanarity.test.ts` | 2026-11-14 | stable |
| `e2e/portfolio.spec.ts` pins 8 projects and checks `Click to inspect` on initial hover | Lines 416, 429, 1103 | `grep` on `e2e/portfolio.spec.ts` | 2026-11-14 | stable |
| `NodeHoverCard.tsx` renders `Code ↗` unconditionally | Line 143 `<a href={project.repo}>` | `read_file` on `src/components/NodeHoverCard.tsx` | 2026-11-14 | stable |

## Verified planning findings

- The tag-derived 9-node catalog has 17 edges; `art-wip` adds edges to Resume Builder, Attention Max, Ivy Film Fest, and Kintsugi Fracture.
- The proposed normalized seed positions have no proper crossings before boundary enforcement. However, at 320×900 the `art-wip` x coordinate is 32px, inside the existing 48px boundary margin; clamping it to 48px creates a proper crossing with the Attention Max–Ivy Film Fest edge. A shared affine mapping of all seeds into the safe rectangle is required, and the simulation's initial positions, homing targets, resize, and rest lengths must use that same mapped geometry.
- Existing HSL fixed-lightness claims in the initial design draft were not verified across all hues. The muted tag-text variant must calculate contrast against the actual theme-specific pill surface and be sampled across the full hue cycle before any AA claim is made.

## Superseded claims

- Initial assumption that `"Click to inspect ↗"` dismissal should persist in `localStorage` across page reloads — superseded by user feedback (`page reload its fine to bring back the button, but not on canvas resets`).

## Links out

- Existing main specs: `openspec/specs/project-catalog/spec.md`, `openspec/specs/graph-simulation/spec.md`, `openspec/specs/project-drawer/spec.md`.
