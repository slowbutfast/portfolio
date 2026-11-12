# OpenCode Orchestration Handoff: OpenSpec Change 'portfolio-ux-refinement'

You are the orchestration agent for OpenSpec change 'portfolio-ux-refinement' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: portfolio-ux-refinement
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub portfolio-ux-refinement`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments and avoid horizontal abstractions.

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `DESIGN.md` | L3–54, L68–110 | Update global tokens: primary Helvetica, secondary Helvetica Light, monospace Menlo, corrected contrast pairs (clarifying `#3d7fff` for non-text UI per SC 1.4.11), and bilateral bridge geometry. |
| `src/styles.css` | L3–50 | Define `--font-sans`, `--font-secondary`, `--font-mono` (Menlo); update light theme contrast tokens (`--color-muted: #525257`, `--color-outline: #71717a`). |
| `index.html` | L8–25 | Update `<title>`, social metadata, `color-scheme` to `light dark`, theme-color meta, and add `<script src="/theme-init.js">` to prevent theme flash. |
| `public/theme-init.js` | [NEW] L1–10 | Tiny synchronous blocking script applying `data-theme` from `localStorage` before initial body paint. |
| `src/main.tsx` | L1–5 | Remove `@fontsource-variable/space-grotesk` and `@fontsource-variable/jetbrains-mono` webfont imports. |
| `src/App.tsx` | L23–30, L49–75 | Default `readStoredTheme()` to `'light'`. Wire theme toggle into header; scale planar seeds to canvas viewport. |
| `src/data/profile.ts` | [NEW] L1–30 | Single source of truth for candidate profile: Brown University bio, email, social links, and canonical tagline. |
| `src/data/graphSeeds.ts` | [NEW] L1–25 | Normalized $(x, y)$ planar seeds (`PLANAR_NODE_SEEDS`) with nested Sandwave topology preventing $K_4$ edge crossings. |
| `src/utils/bridgeGeometry.ts` | [NEW] L1–85 | Pure mathematical bridge geometry module: $C^1$ tangent vectors, normal-mirrored control points, waist scaling, and close-node distance guards ($d \le R_A + R_B$). |
| `src/utils/bridgeGeometry.test.ts` | [NEW] L1–65 | Vitest unit tests verifying bilateral reflection symmetry, $C^1$ endpoint derivatives, and null return when $d \le R_A + R_B$. |
| `src/utils/graphPlanarity.test.ts` | [NEW] L1–60 | Vitest unit test asserting `countCrossings(scaledSeeds, edges) === 0` across viewport aspect ratios (1440x900 and 393x852) and after 300 ticks of unperturbed d3-force simulation. |
| `src/physics/graphSimulation.ts` | L78–125 | Accept scaled `initialPositions`, bind weak `seedX`/`seedY` forces (`strength: 0.02`), and accept `label?: string` on `SimulationNode`. |
| `src/components/ControlsOverlay.tsx` | L82–122, L170–190 | Header sequence: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, `Filters ▾`. Remove theme toggle from dropdown. |
| `src/components/AboutModal.tsx` | L85–142 | Render Brown University bio; remove "Creative Technologist"; remove focus areas; add Email, LinkedIn, GitHub, Resume to top contact bar. |
| `src/components/ProjectDrawer.tsx` | L238–275 | Segmented pill track for preview tabs (`Media`, `Terminal`) with $\ge 44\text{px}$ touch targets; retire legacy `Link` tab completely; elevated `Code ↗` and `Visit ↗` buttons in header; non-repo links in Overview. |
| `src/components/GraphCanvas.tsx` | L50–60, L85–144, L210–225 | Standardize canvas node label pills to Helvetica sans stack; call `computeBridgeGeometry` and handle close-node null returns; seed static ring in reduced-motion mode from planar seeds; eliminate mono webfont load blocking. |
| `e2e/portfolio.spec.ts` | By test name | Update tests: theme persistence, light-default assertion, header order, About modal DOM structure, drawer segmented tabs without `preview-tab-link`, and WCAG AA audits. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - **Planar Embedding**: Complete $K_4$ subgraph (`open-dungeon`, `transcribe-plus`, `sandwave-sim`, `attention-max`) embedded with `sandwave-sim` at `(0.56, 0.55)` strictly inside $\triangle(\text{OD}, \text{TP}, \text{AM})$. Scaled initial positions and reduced-motion layout guarantee 0 crossings across all 9 links. Dynamic simulation guided by weak seed-homing (`strength: 0.02`) settles at 0 crossings.
  - **Fluid Bridge Geometry**: True $C^1$ tangent-continuous curves calculated via `computeBridgeGeometry`. Upper curve handles extend along circle perimeter tangents ($\vec{T}_{A,top}$ and $-\vec{T}_{B,top}$). Lower curve is exact normal reflection across center-to-center axis $\vec{u}$. Close-node guard returns `null` when $d \le R_A + R_B$.
  - **Typography Boundary**: UI and canvas node label pills use `'Helvetica Neue', Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif`. Metadata uses Helvetica Light (`font-weight: 300`). Monospace (`Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`) is strictly scoped to `TerminalSimulator.tsx` and coordinate HUDs. Webfont packages `@fontsource-variable/*` are removed.
  - **Drawer Link Tab Retirement**: Legacy `Link` tab (`data-testid="preview-tab-link"`) is removed. `Code ↗` and `Visit ↗` are elevated to sticky header. Contextual linkouts reside in Overview.
  - **First-Paint Flash Prevention**: Synchronous `public/theme-init.js` script enforces light default or stored dark theme before initial body paint without CSP violation.
- **Hard Exclusions / No-Go**:
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies.
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage.

## 4. Visual & UI Design Specifications
- **Theme**: Light theme default (`#f6f6f4`), dark mode (`#0a0a0c`).
- **Key Tokens**:
  - Primary: `#003399` | Background: `#f6f6f4` | Surface: `#ffffff` | Surface Container: `#eae9e5`
  - Text: Primary `#0a0a0c`, Muted `#525257` (AAA 6.4:1 on container)
  - Outline: `#71717a` (AA UI boundary 3.96:1)
  - Secondary: `#3d7fff` (Strictly non-text UI indicators, focus rings, and selection boundaries per WCAG 2.1 SC 1.4.11 $\ge 3:1$; NOT for normal text on white)
- **Component Anatomy & States**:
  - Controls Overlay: `About` • `GitHub ↗` • `Graph`/`Grid` • `Dark`/`Light` • `Filters ▾`.
  - AboutModal: Top contact pill row (Email, LinkedIn, GitHub, Resume). Bio copy: *"Gregory Lazatin is currently a Junior at Brown University studying Computer Science. He has worked on applied AI systems, geospatial data engineering, and interactive web apps, built with agentic workflows and test-driven design."* No subtitle or focus areas.
  - ProjectDrawer: Sticky header houses elevated `Code ↗` and `Visit ↗` buttons. Content tablist contains only `Media` and/or `Terminal` in a rounded segmented track (`bg-[var(--color-surface-container)] rounded-full p-1`).
  - NodeHoverCard: Pointer transfer zone with 150ms dismissal grace period; unmounts immediately on canvas drag.
- **Responsive Layout**: Mobile viewports (`< 768px`) dock ProjectDrawer as a bottom sheet (`max-h-[85dvh]`, touch targets $\ge 44\text{px}$).

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runners**:
  - TypeScript Compilation: `npm run typecheck`
  - Unit Tests: `npm run test:unit` (Vitest)
  - E2E Tests: `npm run test:e2e` (Playwright)
  - Design Lint: `npx @google/design.md lint DESIGN.md`
  - Production Build: `npm run build`
- **TDD Requirement**: Task group ## 1 MUST scaffold failing unit/integration tests before touching implementation code. Confirm they fail initially.

## 6. Implementation Task Checklist
- [ ] 1.1 Scaffold unit test `src/utils/bridgeGeometry.test.ts` verifying bilateral reflection symmetry, collinear tangent derivatives ($(CP1_{top} - A_{top}) \cdot (A_{top} - A) = 0$ and $(B_{top} - CP2_{top}) \cdot (B_{top} - B) = 0$), and close-node distance guards ($d \le R_A + R_B$)
- [ ] 1.2 Scaffold unit test `src/utils/graphPlanarity.test.ts` verifying 0 segment crossings across all 9 edges for `PLANAR_NODE_SEEDS` scaled to desktop and mobile viewports, and after 300 ticks of unperturbed d3-force simulation
- [ ] 1.3 Scaffold unit test `src/data/profile.test.ts` verifying Brown University bio copy and URL protocols (`mailto:`, `https:`)
- [ ] 1.4 Scaffold unit test `src/data/projects.test.ts` verifying mandatory non-empty `shortTitle: string` for all 6 projects
- [ ] 1.5 Scaffold unit test in `src/utils/edgeConfig.test.ts` and update `src/utils/csp.ts` (`SPEC_CSP`) to include `frame-src 'self' https://drive.google.com;`
- [ ] 1.6 Scaffold E2E tests in `e2e/portfolio.spec.ts` for default Light theme, header item sequence (`About`, `GitHub`, `Graph`/`Grid`, `Dark`/`Light`, `Filters`), and theme persistence
- [ ] 1.7 Scaffold E2E tests for About modal DOM structure (Brown University bio, top contact links, no subtitle, no focus areas)
- [ ] 1.8 Scaffold E2E tests for `ProjectDrawer` segmented tabs track, elevated `Code ↗` and `Visit ↗` buttons, absence of legacy `preview-tab-link`, and contextual reference links in Overview
- [ ] 2.1 Implement `src/utils/bridgeGeometry.ts` with tangent-continuous Bézier curves, bilateral reflection symmetry, and close-node distance guards ($d \le R_A + R_B$)
- [ ] 2.2 Implement `src/data/graphSeeds.ts` exporting authoritative `PLANAR_NODE_SEEDS` with Sandwave nested inside the $K_4$ triangle
- [ ] 2.3 Wire `computeBridgeGeometry` into `src/components/GraphCanvas.tsx` replacing previous heuristic bridge drawing, handling null for close nodes cleanly
- [ ] 3.1 Implement `src/data/profile.ts` exporting `CandidateProfile` with Brown University bio, email, social links, and canonical tagline
- [ ] 3.2 Create `public/theme-init.js` to block dark-user theme flash before initial body paint
- [ ] 3.3 Update `vercel.json` CSP to include `frame-src 'self' https://drive.google.com;` and sync `SPEC_CSP`
- [ ] 3.4 Update `index.html` with canonical title, description, social Open Graph tags, and `/theme-init.js` reference
- [ ] 4.1 Update `src/types/portfolio.ts` with mandatory `shortTitle: string` on `ProjectData` and `CandidateProfile` interface
- [ ] 4.2 Add mandatory `shortTitle` to all 6 projects in `src/data/projects.ts`
- [ ] 4.3 Extend `SimulationNode` in `src/physics/graphSimulation.ts` to accept `label?: string` and bind weak `seedX`/`seedY` homing forces (`strength: 0.02`)
- [ ] 4.4 Update `GraphCanvas.tsx` to initialize simulation and static reduced-motion layout from scaled `PLANAR_NODE_SEEDS`, and standardize label pills to the Helvetica sans font stack
- [ ] 5.1 Update `src/styles.css` with Helvetica, Helvetica Light, and Menlo font stacks, plus hardened Light theme contrast tokens (`#525257`, `#71717a`)
- [ ] 5.2 Update `readStoredTheme()` in `src/App.tsx` to default to `'light'`
- [ ] 5.3 Implement top-right header controls in `src/components/ControlsOverlay.tsx`: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, `Filters ▾`
- [ ] 5.4 Remove redundant theme toggle from inside the Filters dropdown in `src/components/ControlsOverlay.tsx`
- [ ] 6.1 Update `src/components/AboutModal.tsx` to render the canonical Brown University bio statement
- [ ] 6.2 Remove "Creative Technologist & Software Engineer" subtitle and delete focus areas section in `src/components/AboutModal.tsx`
- [ ] 6.3 Mount Email (`mailto:gregory.lazatin2006@gmail.com`), LinkedIn, GitHub, and Resume directly at the top of `src/components/AboutModal.tsx`
- [ ] 6.4 Implement click-to-load sandboxed Google Drive preview iframe in `src/components/AboutModal.tsx`
- [ ] 7.1 Elevate `Code ↗` and `Visit ↗` buttons into sticky header of `src/components/ProjectDrawer.tsx`
- [ ] 7.2 Implement distinct segmented container track for `Media` and `Terminal` tabs with $\ge 44\text{px}$ touch targets, retire the legacy `Link` tab completely, and route reference linkouts into the Project Details overview in `src/components/ProjectDrawer.tsx`
- [ ] 7.3 Enable `pointer-events-auto` on `src/components/NodeHoverCard.tsx` with 150ms transfer zone and direct action buttons
- [ ] 7.4 Embed 16:9 thumbnails and terminal specimen fallback in `src/components/ListView.tsx`
- [ ] 8.1 Run `npx @google/design.md lint DESIGN.md` and verify 0 errors, 0 warnings
- [ ] 8.2 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npm run build`), verify clean passes
- [ ] 8.3 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm record/feature counts before and after if touching data models.
3. Ensure `<changeDir>/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.
5. If clean with no critical issues, sync specs: `openspec specs apply --change "portfolio-ux-refinement"`.
6. **Open a Pull Request**: Once implementation is complete and `<changeDir>/verification.md` is written and verified with zero critical issues:
   - Ensure your work is on a dedicated feature branch (create/switch to `feat/portfolio-ux-refinement` if currently on `main`/`master`).
   - Stage and commit the implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push the branch (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` (or with a concise title and a body summarizing `<changeDir>/proposal.md` and `<changeDir>/verification.md`) and report the PR URL.
