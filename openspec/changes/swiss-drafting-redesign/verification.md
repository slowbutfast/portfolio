# Verification — Swiss Modernist Technical Drafting Specimen

Change: `swiss-drafting-redesign`
Branch: `feat/swiss-drafting-redesign`
Verified: 2026-11-11

## Outcome Summary

| Command | Result |
| :--- | :--- |
| `npm run typecheck` | **PASS** — exit 0, 0 diagnostics |
| `npm run test:unit` | **PASS** — 5 files, 27/27 tests |
| `npm run test:e2e` | **PASS** — 33 passed, 1 intentional desktop-only skip (mobile CPU throttle), 0 failed |
| `npm run build` + `grep -R "data:font" dist/` | **PASS** — 0 `data:font` occurrences |
| `npx @google/design.md lint DESIGN.md` | **PASS** — 0 errors, 0 warnings, 1 informational token-summary |
| Playwright `@axe-core/playwright` WCAG 2 A/AA | **PASS** — 0 violations in Graph, List, and open Drawer on desktop and mobile |

## Requirement Adherence Matrix

### `project-catalog`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Mandatory non-empty `classification` on every `ProjectData` | `src/types/portfolio.ts`, `src/data/projects.ts` (6/6), `src/data/projects.test.ts` | Met |
| Deterministic index/plate formatters with stable catalog order | `src/utils/drafting.ts`, `formatIndex` / `formatPlate` tests | Met |
| Build-injected `__COMMIT_HASH__` with `git` → `VERCEL_GIT_COMMIT_SHA` → `'dev'` fallback | `vite.config.ts`, `src/vite-env.d.ts`, drawer header renders `BUILD // c1a339e` | Met |

### `portfolio-controls`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Graph/List toggle with accessible names `Graph` / `List` | `aria-label`, e2e `controls expose clean accessible names…` | Met |
| Peripheral HUD, 1px hairlines, 4 DOM crop marks with `env(safe-area-inset-*)` | `ControlsOverlay.tsx`, screenshots | Met |
| Zero-re-render rAF coordinate ticker, resets in list view / leave / non-pointer | `GraphCanvas.tsx` rAF loop, e2e ticker + profiler tests | Met |
| Visual brackets via `::before`/`::after`, clean accessible DOM names | `.bracket-tag` in `styles.css`, e2e bracket child assertions | Met |

### `graph-simulation`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Reduced motion: paused physics, static ring, immediate render, tap-select | `GraphCanvas.tsx`, e2e reduced-motion drawer test | Met |
| Font gate `document.fonts.load('12px "JetBrains Mono Variable"')`, physics immediate | `GraphCanvas.tsx` mount effect | Met |
| Node anatomy: filled circle `r=18`, 4px crosshair, single `r+6` guide ring + 4 ticks | `GraphCanvas.tsx` render loop | Met |
| Focal-only dashed projection vectors + `d: Npx` badges | `GraphCanvas.tsx`, focal edge branch | Met |
| 400ms eased stroke write-in, bypassed under reduced motion | `GraphCanvas.tsx` mount timestamp + `easeOutCubic` | Met |
| Invariant hit testing at `r = 18` | `hitNode` uses `Math.hypot(...) <= n.radius` | Met |

### `project-drawer`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Accessible dialog (`role`, `aria-modal`, focus trap, Escape, backdrop), zero radius | `ProjectDrawer.tsx`, existing e2e suite | Met |
| Stepped 12fps / ≤350ms decode in `aria-hidden`, grid overlay over sr-only `<h2>` | `ProjectDrawer.tsx` title grid, scramble timers + cleanup | Met |
| Reduced-motion title bypass | e2e `reduced motion renders the resolved drawer title immediately` | Met |
| Blueprint watermark numeral, `PL-0X`, classification, build SHA | `ProjectDrawer.tsx` header + watermark | Met |
| Terminal `>_` prompt, amber non-zero exit chip, `exit code N` retained | `TerminalSimulator.tsx`, e2e terminal test | Met |
| Exactly one `<h1>` on the page; drawer uses semantic `<h2>` | e2e `drawer keeps exactly one h1…` | Met |

### Cross-cutting design constraints

| Constraint | Evidence | Status |
| :--- | :--- | :--- |
| Self-hosted variable fonts, no Google/CDN, no `data:font` | `main.tsx` fontsource imports; build emitted nine `.woff2` assets; CSP-safe | Met |
| Zero radius everywhere except canvas nodes / status dots | `rounded-none` sweep; only `rounded-full` on status dots | Met |
| Touch targets ≥44px (`min-h-11`) on mobile | Controls, tags, search, reset, cards, tabs, links, terminal input | Met |
| `#71717a` interactive boundaries ≥3:1 (WCAG 1.4.11) | `drafting.test.ts` mathematical contrast assertions pass | Met |
| No live mouse coordinates in React state | `pointerPosRef` → rAF → `coordTickerRef.textContent`; 200-move profiler delta = 0 | Met |
| 6 projects and 9 derived edges preserved | `projects.test.ts` pinned ids/order + 9-edge assertions | Met |

## Resolved Assumptions

1. **Classification casing.** The handoff example `'AGENTIC DOCUMENT PIPELINE // LaTeX'` retains mixed-case `LaTeX`, so the unit test asserts a non-empty trimmed string rather than full uppercase.
2. **CPU throttle scope.** The 4× CDP throttle test is intentionally desktop-only (`test.skip` on mobile), matching task 1.5 / 6.4; the mobile run reports 1 skipped, 0 failed.
3. **Design lint exit.** `@google/design.md lint DESIGN.md` emits one informational `token-summary` finding only; errors and warnings are zero and the process exits 0.
4. **Drawer visual title.** The scrambling span is `aria-hidden="true"` and the authentic `<h2 class="sr-only">` is the accessible title. Axe therefore evaluates neither the transient glyphs nor a duplicate heading.
5. **List top padding.** The compacted mobile HUD measures 230px tall; `ListView` uses `pt-60` (240px) on mobile and `pt-44` (176px) desktop so the index label and cards clear the HUD.
6. **Ticker coordinate space.** Per the directive, the ticker reports canvas-local untransformed pointer pixels (`client - rect`), not force-graph world coordinates.

## Pre-redesign Accessibility Baseline

Captured before any UI changes (task 1.1) in
`openspec/changes/swiss-drafting-redesign/accessibility-baseline.txt`.
Baseline result: 4 passed, 2 failed — the legacy drawer terminal had two
`color-contrast` violations (`#79716b` at 4.12:1 and `#57534d` at 2.58:1 on
`#0c0a09`). The redesign resolves both; the final axe run is zero violations.

## Verbatim Execution Logs

### `npm run typecheck`

```text
> node-portfolio-graph@0.1.0 typecheck
> tsc --noEmit

TYPECHECK_EXIT=0
```

### `npm run test:unit`

```text
> node-portfolio-graph@0.1.0 test:unit
> vitest run


 RUN  v3.2.7 /home/node/.local/share/opencode/worktree/af7796ae2766c7d7b6e4521206d2a14998dc77de/lucid-gopher

 ✓ src/data/projects.test.ts (7 tests) 22ms
 ✓ src/physics/graphSimulation.test.ts (6 tests) 75ms
 ✓ src/utils/graphTopology.test.ts (4 tests) 8ms
 ✓ src/utils/terminalCommandResolver.test.ts (4 tests) 6ms
 ✓ src/utils/drafting.test.ts (6 tests) 6ms

 Test Files  5 passed (5)
      Tests  27 passed (27)
   Start at  17:23:19
   Duration  1.13s (transform 236ms, setup 0ms, collect 462ms, tests 117ms, environment 1ms, prepare 478ms)
```

### `npm run build` (tail) and `grep -R "data:font" dist/`

```text
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 1953 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                       1.20 kB │ gzip:  0.55 kB
dist/assets/jetbrains-mono-cyrillic-ext-wght-normal-EocZY2iu.woff2    2.03 kB
dist/assets/space-grotesk-vietnamese-wght-normal-D0rl6rjA.woff2       6.71 kB
dist/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2      7.50 kB
dist/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2           9.00 kB
dist/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2       12.11 kB
dist/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2      15.20 kB
dist/assets/space-grotesk-latin-ext-wght-normal-D9tNdqV9.woff2       18.94 kB
dist/assets/space-grotesk-latin-wght-normal-BhU9QXUp.woff2           22.29 kB
dist/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2          40.40 kB
dist/assets/sandwave-sim-DTt19YFD.png                                46.09 kB
dist/assets/pict-climate-risk-viz-chatbot-i2TSBurv.png               90.25 kB
dist/assets/attention-max-DQ7XVtCW.png                              126.24 kB
dist/assets/open-dungeon-BIe_5eRq.png                               288.52 kB
dist/assets/clip-CgA0mo6C.mp4                                       355.66 kB
dist/assets/index-qFUlZCbW.css                                       25.35 kB │ gzip:  5.85 kB
dist/assets/index-OUxbAxgd.js                                       296.56 kB │ gzip: 94.12 kB
✓ built in 3.16s
no data:font
```

### `npx @google/design.md lint DESIGN.md`

```json
{
  "findings": [
    {
      "severity": "info",
      "message": "Design system defines 35 colors, 6 typography scales, 7 rounding levels, 5 spacing tokens, 4 components.",
      "rule": "token-summary"
    }
  ],
  "summary": {
    "errors": 0,
    "warnings": 0,
    "infos": 1
  }
}
LINT_EXIT=0
```

### `npm run test:e2e`

```text
> node-portfolio-graph@0.1.0 test:e2e
> playwright test


Running 34 tests using 1 worker

  ✓   1 [desktop] › e2e/portfolio.spec.ts:23:3 › portfolio graph SPA › loads on desktop and mobile with zero console errors (545ms)
  ✓   2 [desktop] › e2e/portfolio.spec.ts:32:3 › portfolio graph SPA › list view renders 6 cards and a card click opens the project drawer (695ms)
  ✓   3 [desktop] › e2e/portfolio.spec.ts:43:3 › portfolio graph SPA › terminal command chip executes and displays captured output (650ms)
  ✓   4 [desktop] › e2e/portfolio.spec.ts:51:3 › portfolio graph SPA › LLM tag pill dims non-matching projects in the semantic nav (774ms)
  ✓   5 [desktop] › e2e/portfolio.spec.ts:64:3 › portfolio graph SPA › search dims non-matching projects (571ms)
  ✓   6 [desktop] › e2e/portfolio.spec.ts:71:3 › portfolio graph SPA › deep link #/p/open-dungeon opens the drawer on load and closing clears the hash (637ms)
  ✓   7 [desktop] › e2e/portfolio.spec.ts:81:3 › portfolio graph SPA › unknown deep link slug is ignored without crashing (478ms)
  ✓   8 [desktop] › e2e/portfolio.spec.ts:89:3 › portfolio graph SPA › Escape closes the project drawer (477ms)
  ✓   9 [desktop] › e2e/portfolio.spec.ts:96:3 › portfolio graph SPA › accessibility: graph view has zero WCAG A/AA violations (1.4s)
  ✓  10 [desktop] › e2e/portfolio.spec.ts:108:3 › portfolio graph SPA › accessibility: list view has zero WCAG A/AA violations (1.4s)
  ✓  11 [desktop] › e2e/portfolio.spec.ts:121:3 › portfolio graph SPA › accessibility: open drawer has zero WCAG A/AA violations (1.4s)
  ✓  12 [desktop] › e2e/portfolio.spec.ts:133:3 › portfolio graph SPA › controls expose clean accessible names with bracket pseudo-elements (484ms)
  ✓  13 [desktop] › e2e/portfolio.spec.ts:147:3 › portfolio graph SPA › drawer keeps exactly one h1 and an accessible h2 heading (535ms)
  ✓  14 [desktop] › e2e/portfolio.spec.ts:156:3 › portfolio graph SPA › reduced motion renders the resolved drawer title immediately (472ms)
  ✓  15 [desktop] › e2e/portfolio.spec.ts:163:3 › portfolio graph SPA › pointer moves across the canvas cause zero React commits (4.2s)
  ✓  16 [desktop] › e2e/portfolio.spec.ts:181:3 › portfolio graph SPA › coordinate ticker updates via rAF and resets in list view (576ms)
  ✓  17 [desktop] › e2e/portfolio.spec.ts:193:3 › portfolio graph SPA › sustains frame rate under 4x CPU throttling (2.0s)
  ✓  18 [mobile] › e2e/portfolio.spec.ts:23:3 › portfolio graph SPA › loads on desktop and mobile with zero console errors (518ms)
  ✓  19 [mobile] › e2e/portfolio.spec.ts:32:3 › portfolio graph SPA › list view renders 6 cards and a card click opens the project drawer (685ms)
  ✓  20 [mobile] › e2e/portfolio.spec.ts:43:3 › portfolio graph SPA › terminal command chip executes and displays captured output (618ms)
  ✓  21 [mobile] › e2e/portfolio.spec.ts:51:3 › portfolio graph SPA › LLM tag pill dims non-matching projects in the semantic nav (545ms)
  ✓  22 [mobile] › e2e/portfolio.spec.ts:64:3 › portfolio graph SPA › search dims non-matching projects (494ms)
  ✓  23 [mobile] › e2e/portfolio.spec.ts:71:3 › portfolio graph SPA › deep link #/p/open-dungeon opens the drawer on load and closing clears the hash (606ms)
  ✓  24 [mobile] › e2e/portfolio.spec.ts:81:3 › portfolio graph SPA › unknown deep link slug is ignored without crashing (516ms)
  ✓  25 [mobile] › e2e/portfolio.spec.ts:89:3 › portfolio graph SPA › Escape closes the project drawer (508ms)
  ✓  26 [mobile] › e2e/portfolio.spec.ts:96:3 › portfolio graph SPA › accessibility: graph view has zero WCAG A/AA violations (1.4s)
  ✓  27 [mobile] › e2e/portfolio.spec.ts:108:3 › portfolio graph SPA › accessibility: list view has zero WCAG A/AA violations (1.4s)
  ✓  28 [mobile] › e2e/portfolio.spec.ts:121:3 › portfolio graph SPA › accessibility: open drawer has zero WCAG A/AA violations (1.4s)
  ✓  29 [mobile] › e2e/portfolio.spec.ts:133:3 › portfolio graph SPA › controls expose clean accessible names with bracket pseudo-elements (518ms)
  ✓  30 [mobile] › e2e/portfolio.spec.ts:147:3 › portfolio graph SPA › drawer keeps exactly one h1 and an accessible h2 heading (524ms)
  ✓  31 [mobile] › e2e/portfolio.spec.ts:156:3 › portfolio graph SPA › reduced motion renders the resolved drawer title immediately (509ms)
  ✓  32 [mobile] › e2e/portfolio.spec.ts:163:3 › portfolio graph SPA › pointer moves across the canvas cause zero React commits (4.3s)
  ✓  33 [mobile] › e2e/portfolio.spec.ts:181:3 › portfolio graph SPA › coordinate ticker updates via rAF and resets in list view (620ms)
  -  34 [mobile] › e2e/portfolio.spec.ts:193:3 › portfolio graph SPA › sustains frame rate under 4x CPU throttling

  1 skipped
  33 passed (35.9s)
```

## Independent Orchestrator Re-verification

The orchestration agent re-ran the full verification suite after the implementation pass on 2026-11-11:

| Command | Independent Result |
| :--- | :--- |
| `npm run typecheck` | PASS — exit 0, 0 diagnostics |
| `npm run test:unit` | PASS — 5 files, 27/27 tests |
| `npm run build` + `grep -R "data:font" dist/` | PASS — 9 `.woff2` files emitted, 0 `data:font` occurrences |
| `npx @google/design.md lint DESIGN.md` | PASS — 0 errors, 0 warnings, 1 info |
| `npm run test:e2e` | PASS — 33 passed, 1 intentional desktop-only skip, 0 failed |
| `openspec validate --specs` | PASS — 5/5 specs valid |
| `openspec validate swiss-drafting-redesign` | PASS — change is valid |
| Data preservation | PASS — 6 projects, pinned order, 9 derived edges |

The pre-redesign axe baseline is preserved at `openspec/changes/swiss-drafting-redesign/accessibility-baseline.txt` (renamed from `.log` so it is not excluded by the repository's `*.log` ignore rule).

## PATCH-01 — Ferrofluid Minimalist Refinement (2026-11-11)

PATCH-01 supersedes the ornamental rows of the matrix above: background drafting grid, center crosshairs, concentric tick rings, corner registration crop marks, bracket pseudo-elements, and mechanical distance callouts are intentionally removed. The nodes now render as pure flat circular primitives with organic meniscus bridges between connected nodes within 160px proximity.

| Check | Result |
| :--- | :--- |
| `npm run typecheck` | PASS — exit 0, 0 diagnostics |
| `npm run test:unit` | PASS — 27/27 |
| `npx @google/design.md lint DESIGN.md` | PASS — 0 errors, 0 warnings |
| `npm run build` | PASS — 0 `data:font` occurrences |
| `npm run test:e2e` (rebuilt `dist`, preview server) | PASS — 33 passed, 1 intentional desktop-only skip |
| Axe WCAG 2.0 A/AA | 0 violations in Graph, List, Drawer |
| Clean accessible names | `Graph`, `List`, `LLM` resolve without bracket glyphs |
| Visual capture | Confirmed pure void, no grid/crosshairs/crop marks, cyan focal node with ferrofluid bridges |

Patch tasks `P01.1`–`P01.6` are marked complete in `tasks.md`; `patch.md` status is `RESOLVED`.

## PATCH-02 — Fluid Minimalist & Organic Constructivist Refinement (2026-11-12)

PATCH-02 supersedes the remaining PATCH-01 ornamental rows: the top banner, visible `SYS.PORTFOLIO` title, coordinate ticker, and cyan accent are gone. The interface now uses Helvetica, a floating `Filters ▾` popover, pure binary connections, larger ferrofluid nodes, a node-anchored HUD inspector, and persistent dark/light themes.

| Check | Result |
| :--- | :--- |
| `npm run typecheck` | PASS — exit 0, 0 diagnostics |
| `npm run test:unit` | PASS — 27/27 |
| `npx @google/design.md lint DESIGN.md` | PASS — 0 errors, 0 warnings |
| `npm run build` | PASS — 0 `data:font` occurrences |
| `npm run test:e2e` | PASS — 44 passed, 2 intentional mobile skips |
| Axe WCAG 2.0 A/AA — dark | 0 violations in Graph, List, Drawer |
| Axe WCAG 2.0 A/AA — light | 0 violations in Graph, List, Drawer |
| Anchored inspector | Canvas selection positions the card beside the clicked node and clamps it to the viewport |
| Visited persistence | Opening a project writes its id to `localStorage.portfolio_visited` |
| Theme persistence | Theme survives reload via `localStorage.portfolio_theme` |
| Data preservation | 6 projects, pinned order, 9 derived edges, previews and terminal commands untouched |

### Resolved design assumptions

1. **Light interactive boundary.** The PATCH-02 brief listed `#c7c7cc`, but that fails WCAG 1.4.11 (≈1.6:1 on `#f6f6f4`). Interactive outlines use `#8e8e93` (≈3:1); `#c7c7cc` is retained as the decorative divider token.
2. **Connection width.** Bridges are drawn for every connected pair with a minimum half-width so the topology stays legible; width tapers toward a pinched waist with distance tension.
3. **Anchored tooltip regression.** The initial implementation lost the anchor when `openProject` wrote the hash and the `hashchange` handler reset it. The handler now preserves the anchor for the same project id; an e2e regression test covers the anchored offset.
4. **Terminal scope.** Only `agentic-resume-builder` exposes the Terminal tab; all other projects render Media/Link only.
5. **Font imports.** `main.tsx` still imports the PATCH-01 Space Grotesk font package (outside the PATCH-02 target map); the active UI font is Helvetica, and removing the unused import can be a follow-up cleanup.

## PATCH-03 — Visual Portfolio Showcase & Hover Media Refinement (2026-11-12)

PATCH-03 adds the personal showcase layer on top of the fluid minimal shell: a naked floating top bar for Gregory Lazatin, instant node-hover media previews, an accessible About modal, stroke-free canvas title knockouts, cold-load deep-link anchoring, reduced-motion filter repainting, and residual caption removal.

| Check | Result |
| :--- | :--- |
| `npm run typecheck` | PASS — exit 0, 0 diagnostics |
| `npm run test:unit` | PASS — 27/27 |
| `npx @google/design.md lint DESIGN.md` | PASS — 0 errors, 0 warnings |
| `npm run build` | PASS — 0 `data:font` occurrences |
| `npm run test:e2e` | PASS — 59 passed, 5 intentional skips |
| Axe WCAG 2.0 A/AA — dark | 0 violations: Graph, List, Drawer, About modal, Hover card |
| Axe WCAG 2.0 A/AA — light | 0 violations: Graph, List, Drawer, About modal, Hover card |
| Top bar | `Gregory Lazatin`, `About`, `GitHub ↗`, `Grid`/`Graph`, `Filters ▾` render without a background, border, or pill wrapper |
| Hover media card | Node hover shows the project screenshot/video, title, `Click to inspect ↗`, summary, and tags; clears on leave |
| About modal | Button and `#/about` deep link open it; Escape, close button, and backdrop dismiss it with the hash cleared |
| Deep-link anchoring | Cold load `#/p/open-dungeon` positions the inspector beside the node (observed `left: 906.65px`, not the 510px centered fallback) |
| Reduced-motion filtering | Tag toggles repaint the static ring through the `dimmedIds` effect; semantic dimming and canvas pixels verified |
| Caption cleansing | ListView index/classification/plate stamps removed; MediaView figcaptions removed while alt/aria labels remain |

### Resolved implementation assumptions

1. **Target map.** The PATCH-03 handoff's strict map lists 10 files and omits `ProjectDrawer`; `patch.md` lists ProjectDrawer but the patch requires no drawer changes. The 10-file handoff map was followed.
2. **Hover card state.** App owns the hover state as specified. GraphCanvas emits only on hover enter/leave, so plain pointer movement remains commit-free; the Profiler e2e now samples the node-free bottom edge of the canvas.
3. **Hover capability.** The preview card is emitted only when `(hover: hover) and (pointer: fine)` matches; touch/mobile interactions continue to open the inspector directly.
4. **Deep-link settling.** Anchors are emitted on mount and refreshed every 300ms for 3 seconds while physics settles, then stop. Updates are ignored unless the same project remains selected.
5. **Title knockout.** Canvas title pills are fill-only (`tokens.bg`); no stroke, outline, or border is drawn.
6. **Media captions.** Figcaptions are removed visually; captions remain as `alt`/`aria-label` so media stays accessible.
