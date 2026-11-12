# OpenCode Orchestration Handoff: OpenSpec Change 'swiss-drafting-redesign'

You are the orchestration agent for OpenSpec change 'swiss-drafting-redesign' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: `swiss-drafting-redesign`
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub swiss-drafting-redesign`)
- **Architecture Paradigm**: High-precision Swiss Modernist & technical drafting UI. Strict isolation between feature compartments, zero state re-renders during 60fps canvas simulation loops, and complete WCAG accessibility preservation.

## 2. Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `package.json` | L20–L38 | Install `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`, and `@axe-core/playwright` |
| `vite.config.ts` | L1–L15 | Set `build.assetsInlineLimit: 0` and inject `__COMMIT_HASH__` with try/catch + `VERCEL_GIT_COMMIT_SHA` fallback |
| `src/vite-env.d.ts` | [NEW] | Declare `declare const __COMMIT_HASH__: string;` |
| `index.html` | L5–L20 | Add `viewport-fit=cover` and update `<title>` to `SYS.PORTFOLIO // NODE GRAPH SPECIMEN` |
| `src/main.tsx` | L1–L10 | Import `@fontsource-variable/space-grotesk` and `@fontsource-variable/jetbrains-mono` |
| `src/styles.css` | L1–L30 | Ingest design tokens from `DESIGN.md` (using `#71717a` for interactive boundaries), 40px drafting grid, and `.bracket-tag` pseudo-elements |
| `src/utils/drafting.ts` | [NEW] | Implement `formatIndex(index: number): string` (`01`–`06`) and `formatPlate(index: number): string` (`PL-01`–`PL-06`) |
| `src/utils/drafting.test.ts` | [NEW] | Unit tests for formatters and mathematical assertion of WCAG 1.4.11 contrast ratio $\ge 3:1$ for `#71717a` against `#0a0a0c` and `#111215` |
| `src/types/portfolio.ts` | L32–L54 | Make `classification: string` mandatory on `ProjectData` |
| `src/data/projects.ts` | L12–L140 | Annotate all 6 projects with curated `classification` strings |
| `src/data/projects.test.ts` | L1–L50 | Add assertion that all 6 projects declare a valid `classification` |
| `src/components/ControlsOverlay.tsx` | L27–L115 | 4 DOM corner registration crop marks, unbracketed accessible button names (`Graph`, `List`) with `.bracket-tag`, and rAF imperative DOM ticker ref |
| `src/components/GraphCanvas.tsx` | L20–L42, L76–L143, L280–L356 | Gate typography on `document.fonts.load('12px "JetBrains Mono Variable"')`, cache CSS tokens, center crosshairs `+`, outer guide ring $r+6\text{px}$, focal relational projection vectors, invariant $r=18\text{px}$ hit bounds, and rAF direct DOM ticker updates |
| `src/components/ProjectDrawer.tsx` | L85–L195 | Accessible stepped character decoder inside grid cell with semantic `<h2>`, watermark macro numerals, deterministic plate numbers, build SHA, and `rounded-none` |
| `src/components/ListView.tsx` | L18–L80 | Asymmetric two-column Swiss publication layout with monumental numerals and `rounded-none` |
| `src/components/TerminalSimulator.tsx` | L70–L140 | Surgical cyan prompt (`>_`), amber status chip on non-zero exit codes, and `rounded-none` |
| `src/components/MediaView.tsx` | L1–L45 | Zero-radius sweep (`rounded-none`) |
| `e2e/portfolio.spec.ts` | L20–L94 | Pre-redesign baseline, tagged axe-core audit (`wcag2a`, `wcag2aa`, `wcag21aa`), clean accessible names check, reduced-motion bypass, React `<Profiler>` commit count check, and 4x CPU throttle test |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Self-host all fonts locally via npm dependencies to satisfy strict `default-src 'self'` CSP in `vercel.json`.
  - Disable Vite asset inlining (`build.assetsInlineLimit: 0`) to prevent font subsets being converted to `data:font` base64 URIs.
  - Live cursor coordinates must bypass React state completely; canvas draws in its rAF loop, and the margin HUD updates imperatively via a direct DOM ref.
  - Scrambled title decoder runs strictly once upon drawer open (12fps, $\le 350\text{ms}$, bypassed under `prefers-reduced-motion`) over an authentic semantic `<h2>` inside a shared grid cell.
  - Visual bracket ornamentation (`[ GRAPH ]`, `[LLM]`) is rendered via CSS `::before` and `::after` pseudo-elements so DOM accessible names remain clean.
  - Relational projection vectors and distance callouts are restricted exclusively to the active/hovered node's incident edges. Hit testing remains invariant at $r = 18\text{px}$.
  - Zero-radius sweep across all containers (`rounded-none`). `rounded-full` is strictly reserved for canvas node circles and status indicator dots.
- **Hard Exclusions / No-Go**:
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT load external fonts from Google Fonts CDN (`fonts.googleapis.com` / `fonts.gstatic.com`).
  - Do NOT put live mouse coordinates into React state.
  - Do NOT duplicate `<h1>` headings inside modal dialogs.
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage.

## 4. Visual & UI Design Specifications
- **Theme**: Swiss Modernist Technical Drafting Specimen (Dark Room)
- **Key Tokens**:
  - Background: `#0a0a0c` | Surface: `#111215` | Surface Container: `#18191e`
  - Text Primary: `#f4f4f5` (18.0:1 AAA) | Text Muted: `#a1a1aa` (7.7:1 AAA)
  - Interactive Border: `#71717a` (4.09:1 AA - WCAG 1.4.11 compliant)
  - Decorative Border / Grid: `#27272a` (1.33:1 - decorative exempt)
  - Surgical Cyan: `#00f0ff` (active selection & focus highlight only)
  - Surgical Amber: `#eab308` (terminal anomaly / warning status only)
- **Typography**:
  - Sans / Display: `'Space Grotesk Variable', ui-sans-serif, sans-serif`
  - Mono / Computational: `'JetBrains Mono Variable', monospace`
- **Responsive Layout**:
  - Touch targets $\ge 44\text{px}$ on mobile viewports.
  - Mobile corner crop marks inset with `env(safe-area-inset-*)` enabled by `viewport-fit=cover`.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runners**:
  - Unit Tests: `npm run test:unit` (Vitest)
  - Typecheck: `npm run typecheck` (`tsc --noEmit`)
  - End-to-End Tests: `npm run test:e2e` (Playwright)
  - Production Build: `npm run build`
  - Design Spec Linter: `npx @google/design.md lint DESIGN.md`
- **TDD Requirement**: Task group ## 1 MUST scaffold failing unit/integration tests before touching implementation code. Verify they fail initially.

## 6. Implementation Task Checklist

### 1. Test Scaffolding (TDD)
- [ ] 1.1 Capture pre-redesign `@axe-core/playwright` accessibility baseline across Graph, List, and Drawer
- [ ] 1.2 Write unit test in `src/utils/drafting.test.ts` asserting mathematical WCAG 1.4.11 contrast ratio $\ge 3:1$ for `#71717a` against `#0a0a0c` and `#111215`
- [ ] 1.3 Write unit tests for index formatting (`formatIndex(0) === '01'`) and plate formatting (`formatPlate(0) === 'PL-01'`) in `src/utils/drafting.test.ts`
- [ ] 1.4 Write unit test in `src/data/projects.test.ts` asserting all 6 projects declare a non-empty `classification` string
- [ ] 1.5 Scaffold Playwright assertions for clean button accessible names (`getByRole('button', { name: 'Graph' })`), single `<h1>` dialog integrity, and reduced motion title bypass

### 2. Foundation, Typography & Build Pipeline
- [ ] 2.1 Install `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`, and `@axe-core/playwright`
- [ ] 2.2 Configure `vite.config.ts` with `assetsInlineLimit: 0` and `__COMMIT_HASH__` with try/catch + `VERCEL_GIT_COMMIT_SHA` fallback, and declare in `src/vite-env.d.ts`
- [ ] 2.3 Update `index.html` with `viewport-fit=cover` and title `SYS.PORTFOLIO // NODE GRAPH SPECIMEN`
- [ ] 2.4 Import variable fonts in `src/main.tsx` and bind tokens from `DESIGN.md` into CSS custom properties in `src/styles.css` using `#71717a` for interactive boundaries
- [ ] 2.5 Create `src/utils/drafting.ts` with formatters and stable catalog order
- [ ] 2.6 Update `src/types/portfolio.ts` with required `classification: string` and annotate all 6 projects in `src/data/projects.ts`

### 3. Controls HUD & Architectural Margin Architecture
- [ ] 3.1 Overhaul `src/components/ControlsOverlay.tsx` with zero-radius 1px hairline framing, 4 DOM corner registration crop marks (`env(safe-area-inset-*)`), and unbracketed accessible names with CSS `.bracket-tag` pseudo-elements
- [ ] 3.2 Mount imperative DOM ref for hover coordinate ticker displaying `X: --- Y: ---` in list view, on unmount, or for non-pointer devices
- [ ] 3.3 Verify unbracketed accessible button names (`Graph`, `List`, tags) under keyboard and touch interaction

### 4. Canvas Engine & Deconstructed Technical Drafting
- [ ] 4.1 In `src/components/GraphCanvas.tsx`, gate typography rendering on `document.fonts.load('12px "JetBrains Mono Variable"')` while starting physics immediately
- [ ] 4.2 Cache token colors from CSS variables on mount via `getComputedStyle`
- [ ] 4.3 Replace legacy multi-rings with center crosshairs (`+`) and single outer guide ring ($r+6\text{px}$) with 4 cardinal ticks
- [ ] 4.4 Implement 400ms stroke write-in animation on initial mount, bypassed under `prefers-reduced-motion`
- [ ] 4.5 Render dashed relational projection vectors and distance badges (`d: [pixels]px`) strictly on active/hovered node incident edges
- [ ] 4.6 Maintain invariant physics hit testing at canonical $r = 18\text{px}$ and pipe rAF pointer coordinates directly to the HUD ticker DOM ref in canvas-local space

### 5. Blueprint Drawer, Editorial List & Terminal Hardening
- [ ] 5.1 In `src/components/ProjectDrawer.tsx`, implement accessible stepped character decoder in `<span aria-hidden="true">` inside the same CSS grid cell as `<h2 className="sr-only">`, running once on open (12fps, $\le 350\text{ms}$) with unmount cleanup and reduced motion bypass
- [ ] 5.2 Add monumental watermark numerals (`01`–`06`), deterministic plate numbers (`PL-01`–`PL-06`), and `__COMMIT_HASH__` to the blueprint drawer
- [ ] 5.3 Reformat `src/components/ListView.tsx` into an asymmetric two-column Swiss editorial publication layout
- [ ] 5.4 Update `src/components/TerminalSimulator.tsx` with surgical cyan prompt (`>_`) and amber diagnostic status chip for non-zero exit codes
- [ ] 5.5 Perform zero-radius sweep (`rounded-none`) across `MediaView.tsx`, `ListView.tsx`, `TerminalSimulator.tsx`, and `ProjectDrawer.tsx`

### 6. Verification & Empirical Audit
- [ ] 6.1 Run `npx @google/design.md lint DESIGN.md` and verify 0 errors
- [ ] 6.2 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`)
- [ ] 6.3 Run `npm run build` and assert 0 `data:font` occurrences in `dist/`
- [ ] 6.4 Execute Playwright 4x CPU throttle test and React `<Profiler>` commit count assertion
- [ ] 6.5 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm all 6 project entries and their relational links remain fully intact.
3. Ensure `<changeDir>/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.
5. If clean with no critical issues, sync specs: `openspec specs apply --change "swiss-drafting-redesign"`.
6. **Open a Pull Request**: Once implementation is complete and `<changeDir>/verification.md` is written and verified with zero critical issues:
   - Ensure your work is on a dedicated feature branch (`feat/swiss-drafting-redesign`).
   - Stage and commit the implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push the branch (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` and report the PR URL.
