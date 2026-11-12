# Surgical Patch Handoff: OpenSpec Change 'swiss-drafting-redesign' [PATCH-03]

You are the surgical patch implementation agent.
Your directive is to execute **`PATCH-03`** on the `swiss-drafting-redesign` change, implementing the **Visual Portfolio Showcase, Floating Top Bar & Hover Media Refinement** based on the user's design direction and the 52-screenshot visual verification audit.

---

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `swiss-drafting-redesign`
- **Patch ID**: `PATCH-03`
- **Title**: Visual Portfolio Showcase, Floating Top Bar & Hover Media Refinement
- **Objective**:
  Transform the portfolio into an unmistakable, media-rich personal showcase for **Gregory Lazatin**. Add an uncluttered, floating top bar (with zero pill/background container), instant node hover media preview cards (`NodeHoverCard`), an accessible "About Me" modal (`AboutModal`), stroke-free canvas label knockout pills, a fix for the reduced-motion filter repaint stalling, cold-load deep-link tooltip anchoring, and cleansing of lingering CAD captions.
- **Diagnostic Feedback & Audit Traces**:
  ```text
  1. Identity & Framing: The website currently lacks any human branding on first load. Add a floating top bar with "Gregory Lazatin" on the top-left (clicking resets filters/view), and clean text links on the top-right: "About", "GitHub" (https://github.com/slowbutfast), "Grid" / "Graph" view toggle, and "Filters ▾".
  2. Floating Bar Styling: The top bar must float directly over the canvas with ZERO pill wrapper and ZERO background fill (bg-transparent, border-0, pure typography).
  3. Visual Discoverability: Nodes are visually opaque on first load. When hovering over any node on desktop, immediately display a floating media card adjacent to the node showing the project's video clip or screenshot, title, tags, and summary.
  4. About Me Modal: Provide an accessible modal dialog with Gregory Lazatin's bio, focus areas (LLM agent tooling, interactive physics & graphics, generative AI, audio computing), contact, and GitHub link.
  5. Title Knockout Stroke Removal: Remove the 1px border stroke around project title pills on the canvas; keep just the solid background knockout fill (`tokens.bg`) so it cleanly floats above connections without a rigid border.
  6. Reduced-Motion Filter Bug: In prefers-reduced-motion mode, toggling filter tags highlights the tag but nodes fail to dim because the animation loop is inactive and no repaint is triggered on `dimmedIds` change.
  7. Residual CAD Captions: Remove remaining "PROJECT INDEX // 06 ENTRIES", "ASYMMETRIC PUBLICATION", and "PL-01 // ..." lines in ListView.tsx, and remove figcaptions in MediaView.tsx.
  8. Cold-Load Deep-Link Anchoring: Opening #/p/:id on initial page load centers the drawer in the viewport instead of anchoring beside the deep-linked node.
  ```

---

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `DESIGN.md` | `L1–160` | Update design specification: define Gregory Lazatin header typography, hover media card tokens, About modal tokens, and borderless text pill knockout rule. Must pass `@google/design.md lint`. |
| `src/types/portfolio.ts` | `L1–85` | Add `HoverAnchor = { x: number; y: number }`, `HoverState = { project: ProjectData; position: HoverAnchor } \| null`, and update component interfaces. |
| `src/components/AboutModal.tsx` | `[NEW]` | Create accessible modal dialog featuring Gregory Lazatin's bio, focus areas, GitHub link, and accessible Escape/close controls. |
| `src/components/NodeHoverCard.tsx` | `[NEW]` | Create floating media card displaying video clip or screenshot thumbnail, project title, tags, and summary, positioned adjacent to hovered node with boundary clamping. |
| `src/components/ControlsOverlay.tsx` | `L35–150` | Redesign top bar: floating naked text header with `Gregory Lazatin` on top-left, `About`, `GitHub ↗`, `Grid` / `Graph`, `Filters ▾` on top-right, with zero background/pill wrapper. |
| `src/components/GraphCanvas.tsx` | `L265–285, L300–325, L420–460` | Remove `ctx.stroke()` from title pills (fill only with `tokens.bg`); emit `onHoverNode(project, screenXY)` on pointer move; add reactive `useEffect` on `dimmedIds` to trigger `render()` in reduced motion; compute and emit node screen anchor for deep links. |
| `src/components/ListView.tsx` | `L25–70` | Remove `PROJECT INDEX // 06 ENTRIES`, `ASYMMETRIC PUBLICATION`, and `{plate} // {project.classification}` captions. |
| `src/components/MediaView.tsx` | `L25–40` | Remove `<figcaption className="...">{preview.caption}</figcaption>` from screenshot and video figures. |
| `src/App.tsx` | `L14–175` | Manage `isAboutOpen` state, wire `NodeHoverCard` hover state, support `#/about` hash routing, and calculate deep-link anchor coordinates on cold load. |
| `e2e/portfolio.spec.ts` | `L20–240` | Add tests verifying `Gregory Lazatin` header, `About` modal opening/dismissal, GitHub external link, hover media card rendering, and full regression suite. |

---

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the 10 files specified in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT modify project catalog IDs, summaries, URLs, or topological edges in `src/data/projects.ts` or `src/utils/graphTopology.ts`.
  - Do NOT introduce un-themed hardcoded colors; bind all visual elements to CSS custom properties (`var(--color-...)`) or cached canvas tokens.
  - Do NOT break keyboard accessibility (Escape to dismiss modals/drawers, Tab focus trap, semantic dialog roles).
- **INVARIANTS TO PRESERVE**:
  - All unit tests (19/19) must pass.
  - All e2e tests must pass, with 0 Axe-core WCAG A/AA violations across Graph view, List view, Hover card, and About modal in both Dark and Light themes.
  - `npx @google/design.md lint DESIGN.md` must pass with 0 errors.

---

## 4. Implementation Blueprints by Component

### A. New Component: About Me Modal (`src/components/AboutModal.tsx`)
Create `src/components/AboutModal.tsx`:
- Render modal with backdrop blur when `isOpen` is true.
- Key elements:
  - Header: `"Gregory Lazatin"` in bold typography (`text-2xl font-bold tracking-tight`).
  - Subtitle: `"Creative Technologist & Software Engineer"`.
  - Bio copy:
    - `"Building systems at the intersection of autonomous agents, generative media, interactive physics, and audio computing."`
    - `"This portfolio explores organic constructivism—using structural mechanics, mathematical vector tension, and pure typography as the primary aesthetic."`
  - GitHub Link:
    - Clean pill/button pointing to `https://github.com/slowbutfast` (`target="_blank" rel="noreferrer"`).
  - Dismissal:
    - Close button (`✕`) with `aria-label="Close about modal"`.
    - `Escape` key dismiss listener and click-on-backdrop dismiss.
    - `role="dialog"`, `aria-modal="true"`, `aria-label="About Gregory Lazatin"`.

### B. New Component: Floating Node Hover Card (`src/components/NodeHoverCard.tsx`)
Create `src/components/NodeHoverCard.tsx`:
- Accepts `project: ProjectData` and `position: { x: number; y: number }`.
- Viewport boundary clamping:
  ```ts
  const cardWidth = 320;
  const cardHeight = 220;
  const margin = 20;
  const left = Math.min(Math.max(margin, position.x + 28), window.innerWidth - cardWidth - margin);
  const top = Math.min(Math.max(margin, position.y - 40), window.innerHeight - cardHeight - margin);
  ```
- Structure:
  - Container: `pointer-events-none fixed z-30 overflow-hidden rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 p-3.5 shadow-2xl backdrop-blur-md`.
  - Thumbnail:
    - Video: `<video src={video.src} autoPlay loop muted playsInline className="h-32 w-full object-cover rounded-xl" />`
    - Screenshot: `<img src={screenshot.src} alt={project.title} className="h-32 w-full object-cover rounded-xl" />`
    - Fallback: Clean stylized container for CLI/terminal tools.
  - Title & Action Prompt:
    - `<h3 className="text-sm font-bold text-[var(--color-text)]">{project.title}</h3>`
    - `<span className="font-mono text-[10px] text-[var(--color-accent)] font-semibold">Click to inspect ↗</span>`
  - Summary:
    - `<p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)] leading-relaxed">{project.summary}</p>`

### C. Floating Uncluttered Top Bar (`src/components/ControlsOverlay.tsx`)
- Strip all background panels, container borders, and outer pill shapes from the header area.
- Top Left:
  ```tsx
  <div className="pointer-events-auto flex items-center">
    <button
      type="button"
      data-testid="brand-home"
      onClick={onReset}
      className="text-base md:text-lg font-bold tracking-tight text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
    >
      Gregory Lazatin
    </button>
  </div>
  ```
- Top Right:
  ```tsx
  <div className="pointer-events-auto ml-auto flex items-center gap-4 md:gap-6 font-mono text-xs">
    <button
      type="button"
      data-testid="nav-about"
      onClick={onOpenAbout}
      className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
    >
      About
    </button>
    <a
      href="https://github.com/slowbutfast"
      target="_blank"
      rel="noreferrer"
      data-testid="nav-github"
      className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1"
    >
      GitHub <span aria-hidden="true">↗</span>
    </a>
    <button
      type="button"
      data-testid="view-toggle"
      onClick={() => onViewChange(view === 'graph' ? 'list' : 'graph')}
      className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
    >
      {view === 'graph' ? 'Grid' : 'Graph'}
    </button>
    <button
      type="button"
      data-testid="controls-dropdown-trigger"
      aria-expanded={isDropdownOpen}
      onClick={() => setIsDropdownOpen((prev) => !prev)}
      className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1"
    >
      Filters <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
    </button>
  </div>
  ```
- Keep the dropdown popover accessible when `isDropdownOpen` is true (containing the search input, tag pills, theme toggle, and reset filters).

### D. Canvas Refinements & Bug Fixes (`src/components/GraphCanvas.tsx`)
1. **Remove Title Pill Stroke (Lines 275–281)**:
   ```ts
   ctx.beginPath();
   ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
   ctx.fillStyle = tokens.bg;
   ctx.fill();
   // REMOVE ctx.stroke() and ctx.strokeStyle! Fill only.
   ```
2. **Hover Coordinates for Hover Card**:
   - Add prop: `onHoverNode?: (project: ProjectData | null, screenPos: { x: number; y: number } | null) => void`.
   - In `onPointerMove`: when `hitNode(p.x, p.y)` finds a node, compute screen coordinates:
     ```ts
     const t = transformRef.current;
     const screenX = (reduceMotionRef.current ? (staticPosRef.current.get(node.id)?.[0] ?? node.x) : node.x) * t.scale + t.x;
     const screenY = (reduceMotionRef.current ? (staticPosRef.current.get(node.id)?.[1] ?? node.y) : node.y) * t.scale + t.y;
     const proj = getProjectById(node.id) ?? null;
     onHoverNodeRef.current?.(proj, { x: screenX, y: screenY });
     ```
   - On pointer leave or when hovering nothing, call `onHoverNodeRef.current?.(null, null)`.
3. **Reduced-Motion Tag Filter Repaint Fix**:
   - In `GraphCanvas.tsx`, keep a ref to `render`:
     ```ts
     const renderRef = useRef<() => void>(() => {});
     renderRef.current = render;
     ```
   - Add reactive effect:
     ```ts
     useEffect(() => {
       if (reduceMotionRef.current) {
         renderRef.current?.();
       }
     }, [dimmedIds]);
     ```
4. **Cold-Load Deep-Link Anchor Resolver**:
   - Add prop: `initialSelectedId?: string | null`, `onResolveAnchor?: (id: string, anchor: CanvasAnchor) => void`.
   - On mount/resize, if `initialSelectedId` is provided and no anchor exists, compute its screen coordinates and call `onResolveAnchor(initialSelectedId, anchor)`.

### E. Caption Cleansing (`src/components/ListView.tsx` & `src/components/MediaView.tsx`)
1. **In `src/components/ListView.tsx`**:
   - Delete lines 27–30: Remove `<div className="... PROJECT INDEX // 06 ENTRIES ...">`.
   - Delete line 64: Remove `<p className="mt-4 font-mono text-[10px] ...">{plate} // {project.classification}</p>`.
2. **In `src/components/MediaView.tsx`**:
   - Delete lines 25–27 and 37–39: Remove `<figcaption className="...">{preview.caption}</figcaption>`.

### F. Application Orchestration (`src/App.tsx`)
- State:
  - `const [isAboutOpen, setIsAboutOpen] = useState(false);`
  - `const [hoverState, setHoverState] = useState<{ project: ProjectData; position: { x: number; y: number } } | null>(null);`
- Hash Routing:
  - Add support for `#/about`:
    ```ts
    if (window.location.hash === '#/about') {
      setIsAboutOpen(true);
    }
    ```
- Render `AboutModal`:
  ```tsx
  <AboutModal isOpen={isAboutOpen} onClose={() => {
    setIsAboutOpen(false);
    if (window.location.hash === '#/about') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }} />
  ```
- Render `NodeHoverCard`:
  ```tsx
  {hoverState && !selectedId && (
    <NodeHoverCard project={hoverState.project} position={hoverState.position} />
  )}
  ```

---

## 5. Verification Protocol

### Step 1: Design System Lint
```bash
npx @google/design.md lint DESIGN.md
```
*Expected: 0 errors, 0 warnings.*

### Step 2: TypeScript Typecheck
```bash
npm run typecheck
```
*Expected: 0 diagnostics.*

### Step 3: Unit Tests
```bash
npm run test:unit
```
*Expected: All 19 unit tests pass.*

### Step 4: Playwright E2E & Accessibility Tests
```bash
npm run test:e2e
```
*Expected: All tests pass, including Axe WCAG A/AA audits in Dark and Light themes, testing brand header, about modal, and clean title pills.*

### Step 5: Production Build
```bash
npm run build
```
*Expected: Clean build with zero `data:font` inlining violations.*

---

## 6. Surgical Patch Checklist
- [ ] P03.1 Update `DESIGN.md` to define visual portfolio identity: Gregory Lazatin floating header typography, hover media card specs, About modal dialog tokens, and borderless text pill knockout, ensuring 0 linter errors.
- [ ] P03.2 Implement `src/components/AboutModal.tsx` dialog featuring Gregory Lazatin's bio, focus areas (agent tooling, audio physics, generative systems), GitHub link, and accessible Escape/close controls.
- [ ] P03.3 Implement `src/components/NodeHoverCard.tsx` displaying rich media previews (video clip/screenshot), title, tags, and summary, positioned adjacent to hovered nodes with viewport collision clamping.
- [ ] P03.4 Redesign `src/components/ControlsOverlay.tsx` into an uncluttered floating top bar with no pill/background container: "Gregory Lazatin" on the top left, and "About", "GitHub ↗", "Grid" / "Graph", "Filters ▾" on the top right.
- [ ] P03.5 Refactor `src/components/GraphCanvas.tsx`: remove 1px stroke outline from project title pills (fill only with `tokens.bg`), emit hover coordinates for `NodeHoverCard`, fix reduced-motion filter repaint bug via reactive `dimmedIds` effect, and expose node screen anchor resolver for deep links.
- [ ] P03.6 Update `src/App.tsx`: manage `AboutModal` state, wire `NodeHoverCard` hover state, support `#/about` hash routing, and calculate deep-link anchor coordinates on cold load.
- [ ] P03.7 Cleanse residual captions: strip index headers and classification stamps from `src/components/ListView.tsx`, and remove figcaptions from `src/components/MediaView.tsx`.
- [ ] P03.8 Update `e2e/portfolio.spec.ts` to verify Gregory Lazatin title, About modal interactions, hover card rendering, and full regression suite (`typecheck`, `unit`, `e2e`, axe WCAG A/AA in dark & light, `build`).
