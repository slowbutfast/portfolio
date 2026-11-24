## Automated Tests

- `npm run typecheck`: Verifies `App.tsx`, `GraphCanvas.tsx`, and `ControlsOverlay.tsx` compile cleanly with `artUnlocked` and `onArtUnlock` prop types.
- `npm run test:unit`: Confirms all existing unit tests (including `artDiscovery.test.ts` and `projects.test.ts`) pass with zero regressions.
- `npx playwright test e2e/portfolio.spec.ts -g "art-wip stays locked" --workers=1`: Verifies across desktop and mobile projects:
  1. `nav-art` is absent before `art-wip` is unlocked.
  2. Dragging `art-wip` to connect reveals `nav-art` (`Art`, `href="/art/"`, no `target` attribute) with computed `color` matching `nav-about`.
  3. `nav-art` sits to the left of `nav-about`, `nav-about`'s `x` coordinate does not shift, and `nav-art` does not overlap `brand-home`.
  4. Single `Reset` and `page.reload()` preserve `nav-art`.
  5. Consecutive double `Reset` (with no canvas interaction) removes `nav-art`.

## Manual Verification

- **Unlock & left-side placement**:
  - **WHEN** dragging the hidden `art-wip` node to connect to an `'art'`-tagged node on desktop and mobile
  - **THEN** `Art` appears to the left of `About` in the same muted static color without shifting `About` or overlapping the brand name, and clicking it navigates to `/art/` in the same tab.
- **Reset persistence & double-reset clear**:
  - **WHEN** pressing `Reset` once or reloading the page, then pressing `Reset` twice consecutively
  - **THEN** `Art` persists on single reset/reload and disappears after the second consecutive reset.
