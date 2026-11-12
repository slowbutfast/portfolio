## 1. Test Scaffolding (TDD)

- [x] 1.1 Capture pre-redesign `@axe-core/playwright` accessibility baseline across Graph, List, and Drawer
- [x] 1.2 Write unit test in `src/utils/drafting.test.ts` asserting mathematical WCAG 1.4.11 contrast ratio $\ge 3:1$ for `#71717a` against `#0a0a0c` and `#111215`
- [x] 1.3 Write unit tests for index formatting (`formatIndex(0) === '01'`) and plate formatting (`formatPlate(0) === 'PL-01'`) in `src/utils/drafting.test.ts`
- [x] 1.4 Write unit test in `src/data/projects.test.ts` asserting all 6 projects declare a non-empty `classification` string
- [x] 1.5 Scaffold Playwright assertions for clean button accessible names (`getByRole('button', { name: 'Graph' })`), single `<h1>` dialog integrity, and reduced motion title bypass

## 2. Foundation, Typography & Build Pipeline

- [x] 2.1 Install `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`, and `@axe-core/playwright`
- [x] 2.2 Configure `vite.config.ts` with `assetsInlineLimit: 0` and `__COMMIT_HASH__` with try/catch + `VERCEL_GIT_COMMIT_SHA` fallback, and declare in `src/vite-env.d.ts`
- [x] 2.3 Update `index.html` with `viewport-fit=cover` and title `SYS.PORTFOLIO // NODE GRAPH SPECIMEN`
- [x] 2.4 Import variable fonts in `src/main.tsx` and bind tokens from `DESIGN.md` into CSS custom properties in `src/styles.css` using `#71717a` for interactive boundaries
- [x] 2.5 Create `src/utils/drafting.ts` with formatters and stable catalog order
- [x] 2.6 Update `src/types/portfolio.ts` with required `classification: string` and annotate all 6 projects in `src/data/projects.ts`

## 3. Controls HUD & Architectural Margin Architecture

- [x] 3.1 Overhaul `src/components/ControlsOverlay.tsx` with zero-radius 1px hairline framing, 4 DOM corner registration crop marks (`env(safe-area-inset-*)`), and unbracketed accessible names with CSS `.bracket-tag` pseudo-elements
- [x] 3.2 Mount imperative DOM ref for hover coordinate ticker displaying `X: --- Y: ---` in list view, on unmount, or for non-pointer devices
- [x] 3.3 Verify unbracketed accessible button names (`Graph`, `List`, tags) under keyboard and touch interaction

## 4. Canvas Engine & Deconstructed Technical Drafting

- [x] 4.1 In `src/components/GraphCanvas.tsx`, gate typography rendering on `document.fonts.load('12px "JetBrains Mono Variable"')` while starting physics immediately
- [x] 4.2 Cache token colors from CSS variables on mount via `getComputedStyle`
- [x] 4.3 Replace legacy multi-rings with center crosshairs (`+`) and single outer guide ring ($r+6\text{px}$) with 4 cardinal ticks
- [x] 4.4 Implement 400ms stroke write-in animation on initial mount, bypassed under `prefers-reduced-motion`
- [x] 4.5 Render dashed relational projection vectors and distance badges (`d: [pixels]px`) strictly on active/hovered node incident edges
- [x] 4.6 Maintain invariant physics hit testing at canonical $r = 18\text{px}$ and pipe rAF pointer coordinates directly to the HUD ticker DOM ref in canvas-local space

## 5. Blueprint Drawer, Editorial List & Terminal Hardening

- [x] 5.1 In `src/components/ProjectDrawer.tsx`, implement accessible stepped character decoder in `<span aria-hidden="true">` inside the same CSS grid cell as `<h2 className="sr-only">`, running once on open (12fps, $\le 350\text{ms}$) with unmount cleanup and reduced motion bypass
- [x] 5.2 Add monumental watermark numerals (`01`–`06`), deterministic plate numbers (`PL-01`–`PL-06`), and `__COMMIT_HASH__` to the blueprint drawer
- [x] 5.3 Reformat `src/components/ListView.tsx` into an asymmetric two-column Swiss editorial publication layout
- [x] 5.4 Update `src/components/TerminalSimulator.tsx` with surgical cyan prompt (`>_`) and amber diagnostic status chip for non-zero exit codes
- [x] 5.5 Perform zero-radius sweep (`rounded-none`) across `MediaView.tsx`, `ListView.tsx`, `TerminalSimulator.tsx`, and `ProjectDrawer.tsx`

## 6. Verification & Empirical Audit

- [x] 6.1 Run `npx @google/design.md lint DESIGN.md` and verify 0 errors
- [x] 6.2 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`)
- [x] 6.3 Run `npm run build` and assert 0 `data:font` occurrences in `dist/`
- [x] 6.4 Execute Playwright 4x CPU throttle test and React `<Profiler>` commit count assertion
- [x] 6.5 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs


## Patch 01: Ferrofluid Minimalist Design Refinement

- [x] P01.1 Update `DESIGN.md` and `design.md` removing background grid, brackets, and crosshairs in favor of pure primitives and fluid magnetic tension
- [x] P01.2 Purge `.drafting-grid` lines and `.bracket-tag` pseudo-element brackets in `src/styles.css`
- [x] P01.3 Streamline `src/components/ControlsOverlay.tsx` removing subtitle, corner crop marks, and redundant graph icon
- [x] P01.4 Refactor `src/components/GraphCanvas.tsx` to strip crosshairs/outer tick rings, render pure solid circular primitives, and implement organic ferrofluid meniscus bridges between connected nodes in proximity
- [x] P01.5 Strip `.drafting-grid` from `src/components/ListView.tsx`
- [x] P01.6 Update `e2e/portfolio.spec.ts` for clean tag rendering and run full regression suite (`typecheck`, `unit`, `e2e`, `@google/design.md lint`)

## Patch 02: Fluid Minimalist & Organic Constructivist UI Refinement

- [x] P02.1 Update `DESIGN.md` to define Fluid Minimalist system (Helvetica, Klein Blue `#003399`, fluid pills, dual light/dark themes, metaball physics), ensuring 0 linter errors
- [x] P02.2 Update `src/styles.css` with Helvetica typography, dual light/dark color tokens, `cursor: crosshair`, and fluid pill styling
- [x] P02.3 Update `src/physics/graphSimulation.ts` to scale node radius ~20% (`r = 22px`), collision radius (36px), and link rest distance (210px)
- [x] P02.4 Redesign `src/components/ControlsOverlay.tsx` replacing top banner and coordinate ticker with a floating carat dropdown (`Filters ▾`) containing view toggle, search bar, stack filter pills, reset, and theme toggle
- [x] P02.5 Refactor `src/components/GraphCanvas.tsx` to implement tangent-continuous Bézier fillets with dynamic tension, pure white/black connections (no grayscale), background knockout pills for project titles, and visited node styling
- [x] P02.6 Redesign `src/components/ProjectDrawer.tsx` into a floating canvas HUD tooltip adjacent to the selected node (Option A), removing caption/classification clutter, restricting terminal to `agentic-resume-builder` only, and adopting circular/pill geometry
- [x] P02.7 Update `src/App.tsx` and `src/components/ListView.tsx` with theme state, visited tracking, sr-only h1, and fluid pill padding
- [x] P02.8 Update `e2e/portfolio.spec.ts` and verify full regression suite passes (`typecheck`, `unit`, `e2e`, axe WCAG A/AA, and `design.md lint`)


## Patch 03: Visual Portfolio Showcase & Hover Media Refinement

- [x] P03.1 Update `DESIGN.md` to define visual portfolio identity: Gregory Lazatin floating header typography, hover media card specs, About modal dialog tokens, and borderless text pill knockout, ensuring 0 linter errors
- [x] P03.2 Implement `src/components/AboutModal.tsx` dialog featuring Gregory Lazatin's bio, focus areas (agent tooling, audio physics, generative systems), GitHub link, and accessible Escape/close controls
- [x] P03.3 Implement `src/components/NodeHoverCard.tsx` displaying rich media previews (video clip/screenshot), title, tags, and summary, positioned adjacent to hovered nodes with viewport collision clamping
- [x] P03.4 Redesign `src/components/ControlsOverlay.tsx` into an uncluttered floating top bar with no pill/background container: "Gregory Lazatin" on the top left, and "About", "GitHub ↗", "Grid" / "Graph", "Filters ▾" on the top right
- [x] P03.5 Refactor `src/components/GraphCanvas.tsx`: remove 1px stroke outline from project title pills (fill only with `tokens.bg`), emit hover coordinates for `NodeHoverCard`, fix reduced-motion filter repaint bug via reactive `dimmedIds` effect, and expose node screen anchor resolver for deep links
- [x] P03.6 Update `src/App.tsx`: manage `AboutModal` state, wire `NodeHoverCard` hover state, support `#/about` hash routing, and calculate deep-link anchor coordinates on cold load
- [x] P03.7 Cleanse residual captions: strip index headers and classification stamps from `src/components/ListView.tsx`, and remove figcaptions from `src/components/MediaView.tsx`
- [x] P03.8 Update `e2e/portfolio.spec.ts` to verify Gregory Lazatin title, About modal interactions, hover card rendering, and full regression suite (`typecheck`, `unit`, `e2e`, axe WCAG A/AA in dark & light, `build`)
