# Surgical Patch Handoff: OpenSpec Change 'project-studio' [PATCH-03]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `project-studio`
- **Patch ID**: `PATCH-03`
- **Objective**: Make the dev-only Project Studio (`/#/studio`) responsive and touch-friendly on mobile viewports (`< 1024px`) while keeping `vite-studio-plugin.ts` strictly localhost-only.
- **Feedback & Diagnostic Trace**:
  ```
  - StudioApp.tsx:413 hardcodes `grid-cols-[minmax(180px,220px)_minmax(0,1fr)_minmax(240px,340px)]`, crushing the editor on narrow viewports.
  - StudioApp.tsx:458, 510, 633, 776 use fixed multi-column grids that overflow on phones.
  - Inputs use `text-sm` (14px, causing iOS Safari auto-zoom) and buttons/pills are < 44px tall.
  - SeedMiniMap.tsx:109-122 uses small circles (r=2.4-3.2) without an enlarged touch hit target or numeric x/y fallback.
  - e2e/playwright.studio.config.ts only tests `desktop`; no mobile viewport coverage exists.
  ```
- **Root Cause Analysis**: The initial Studio UI was styled solely for wide desktop viewports; `vite-studio-plugin.ts` intentionally restricts API access to localhost (`Host`/`Origin` guard) and must NOT be weakened for remote LAN/tunnel writes in this patch.

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/studio/StudioApp.tsx` | L42–L45, L349–L414, L458, L510, L633, L776, L834 | Add `< lg` segmented tab bar (`Projects \| Edit \| Map & Tags`, crossing badge, auto-switch to `Edit` on project select, draft state preserved across tabs); stack inner grids (`grid-cols-1 sm:grid-cols-2`, `grid-cols-1 sm:grid-cols-[110px_1fr_1fr_auto]`); add sticky mobile bottom action bar (`Check Links`, `Discard`, `Save`); use `text-base sm:text-sm` on inputs and `min-h-11` (`>= 44px`) on mobile touch targets |
| `src/studio/SeedMiniMap.tsx` | L70–L144 | Constrain mobile map (`max-w-[360px] mx-auto`), add transparent `r=7` touch hit circles around nodes, and add toggleable numeric `x`/`y` inputs + `±0.02` nudge buttons for the selected seed |
| `src/studio/TagManager.tsx` | L68–L155 | Use `min-h-11` (`>= 44px`) mobile touch targets for tag controls and `text-base sm:text-sm` for tag inputs |
| `e2e/playwright.studio.config.ts` | L33 | Add `{ name: 'mobile', use: { ...devices['Pixel 7'] } }` alongside `desktop` |
| `e2e/studio.spec.ts` | Add mobile test | Verify `Projects \| Edit \| Map & Tags` tab switching, `document.documentElement.scrollWidth <= window.innerWidth`, `>= 44px` button heights, and numeric seed coordinate update on `mobile` |
| `openspec/changes/project-studio/verification.md` | Append PATCH-03 run | Record updated unit, build, `dist/` grep, and `desktop` + `mobile` Studio E2E results |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the Studio UI (`src/studio/*`), Studio E2E (`e2e/playwright.studio.config.ts`, `e2e/studio.spec.ts`), and `openspec/changes/project-studio/*`.
- **FORBIDDEN**:
  - Do NOT modify `vite-studio-plugin.ts`, `src/utils/linkAudit.mjs`, `src/data/projects.catalog.json`, or any production portfolio components (`src/components/*`).
  - Do NOT relax `Host`/`Origin`/`X-Studio-Token` security checks or add LAN/tunnel write endpoints.
  - Do NOT disable Save on narrow desktop/emulator viewports; keep `Save` and `Discard` functional in the sticky mobile bottom bar (same-origin localhost/emulator writes work, while remote `Origin` remains blocked by `hostGuard`).
- **INVARIANTS TO PRESERVE**: Desktop (`>= 1024px`) 3-column Studio layout remains visually identical, `dist/` contains zero Studio symbols, and `npm run test:unit` (240 tests) continues to pass.

## 4. Visual & UI Impact
- Uses existing portfolio CSS variables (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-accent`, `--color-divider`).
- Mobile `< lg`: single-column active tab (`Projects | Edit | Map & Tags`), sticky bottom action bar with `pb-[env(safe-area-inset-bottom)]`, `>= 44px` touch targets, `16px` (`text-base`) inputs.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Add `mobile` (`Pixel 7`) to `e2e/playwright.studio.config.ts` and the mobile tab/overflow test to `e2e/studio.spec.ts`; run `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts --project=mobile` and confirm failure.
2. **Apply Minimal Fix**: Implement responsive layout, touch targets, and `SeedMiniMap` hit-area/coordinate controls in `StudioApp.tsx`, `SeedMiniMap.tsx`, and `TagManager.tsx`.
3. **Verify Fix**: Re-run `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` (`desktop` + `mobile`).
4. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && grep -rnE "StudioApp|__studio/api|#/studio" dist/ || true`.

## 6. Surgical Patch Checklist
- [ ] P03.1 Add `mobile` (`Pixel 7`) project + failing mobile E2E test in `e2e/playwright.studio.config.ts` & `e2e/studio.spec.ts`.
- [ ] P03.2 Implement `< lg` tab bar, stacked grids, sticky mobile action bar, `text-base sm:text-sm` inputs, and `>= 44px` touch targets in `src/studio/StudioApp.tsx`.
- [ ] P03.3 Add `r=7` touch hit circles, mobile sizing, and numeric `x`/`y` + nudge controls in `src/studio/SeedMiniMap.tsx` and mobile touch sizing in `src/studio/TagManager.tsx`.
- [ ] P03.4 Run `npm run typecheck && npm run test:unit && npm run build` and `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`, update `verification.md`, mark `tasks.md` `- [x]`, and mark `PATCH-03` `RESOLVED` in `patch.md`.
