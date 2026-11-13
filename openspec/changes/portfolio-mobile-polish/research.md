## Source material

- **2026-11-13 — User exploration & sign-off (`/openspec-explore` + `/plan` review)**:
  - Bottom sheet height & camera pan: *"option A looks good"* (cap mobile bottom sheet at `max-h-[62dvh]` and pan the tapped node into the visible upper strip).
  - Mobile volume control: *"yeah this looks good"* (move volume into the `...` menu as a horizontal slider on coarse pointers / mobile, keeping desktop hover popover intact).
  - Mobile header layout: *"since this is on mobile, we can move the github/remove the github from the mobile tabs entirely and keep it to the about window (since viewing github on mobile seems kinda pointless). so it would be "About * Dark * Grid * ... " where ... would have the sound, and the about window would have the github"*
- **2026-11-13 — Agent 1 & Agent 2 mobile code reviews on `master` (`f243da1`)**:
  - Agent 1: volume popover hides 500 ms after `pointerleave` (touch fires `pointerleave` on finger lift); `85dvh` sheet hides all but ~128 px on `393×852`; DPR uncapped (`3×` on mobile); always-on 30 fps ambient drift; `BOUNDARY_MARGIN = 48` leaves ~297 px height in `852×393` landscape.
  - Agent 2: `<canvas>` in `GraphCanvas.tsx` has `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`, but lacks `onPointerCancel` (OS gesture/interruption can leave `sim.state === 'drag'` or drag audio active).

### Raised but not acted on

- **Real-device iOS Safari silent-switch / dynamic `dvh` testing**: cannot be automated in Linux Playwright; deferred to manual device verification.
- **`any-hover` vs `hover: hover` for hybrid iPad + trackpad**: left as `(hover: hover) and (pointer: fine)` to avoid false positives on phones with paired peripherals.
- **`BOUNDARY_MARGIN = 48` landscape physics rewrite**: deferred pending Phase 1 Playwright landscape (`852×393`, `667×375`) screenshot/planarity check; will only be modified if overlap is observed.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| `isSheet` | `ProjectDrawer` viewport mode when `window.innerWidth < 768` (`md` breakpoint) | Touch-only pointer detection (`(pointer: coarse)`) |
| Mobile top bar | `< sm` (`< 640px`) layout of `ControlsOverlay` header | `< md` (`< 768px`) tablet/small-desktop layout |
| Coarse pointer | CSS media query `(pointer: coarse)` (touch-first input) | Small viewport width alone |
| Sticky focal | `stickyFocalId` in `App.tsx`, keeping the last-selected project's edges/tags highlighted after drawer close | `focusedId` (keyboard/semantic-nav focus) |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| MDN Pointer Events (`pointercancel`) | Touch browsers fire `pointercancel` instead of `pointerup` when an OS gesture or interruption aborts a touch sequence | CC-BY-SA 2.5 | 2026-11-13 |
| WCAG 2.5.5 / Material touch target | Minimum `44×44 px` (`min-h-11` / `2.75rem`) interactive hit target for touch controls | W3C | 2026-11-13 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Keep hover `volume-popover` on mobile with outside-tap | Rejected | Tapping `Sound` while unmuted creates a 1-tap mute vs. reopen-slider conflict | 2026-11-13 |
| Horizontal volume slider + Sound toggle inside `#portfolio-controls` (`sm:hidden`) | Adopted | Guarantees `44px` touch target, avoids hover/blur races, keeps mobile header 1 row | 2026-11-13 |
| `62dvh` sheet + camera pan on `< 768px` | Adopted | Keeps tapped node, highlighted bridges, and focal edge tags visible above the sheet | 2026-11-13 |

## Patterns adopted

- **Shared pointer-cleanup path (`endOrCancelPointer`)**: Mirrors `ProjectDrawer.tsx`'s `onPointerCancel={handlePanelPointerUp}` pattern onto `GraphCanvas.tsx`'s `<canvas>`.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| `GraphCanvas.tsx` lacks `onPointerCancel` | `<canvas>` binds `onPointerMove`, `onPointerDown`, `onPointerUp`, `onPointerLeave` | Read `src/components/GraphCanvas.tsx#L1187-L1196` | 2026-11-13 | stable |
| `beginHoverDwell` is suppressed on touch | Returns early when `!canHoverRef.current` | Read `src/components/GraphCanvas.tsx#L1043-L1081` | 2026-11-13 | stable |
| `AboutModal` already exposes GitHub link | `testId: 'about-github'`, `href: candidateProfile.github` | `grep` + `src/components/AboutModal.tsx#L18` | 2026-11-13 | stable |
| `GraphCanvas` uses raw `devicePixelRatio` | `const dpr = window.devicePixelRatio \|\| 1` | Read `src/components/GraphCanvas.tsx#L351,L781` | 2026-11-13 | stable |
| `ProjectDrawer` uses `max-h-[85dvh]` for `isSheet` | `panelClass` sets `max-h-[85dvh]` and `handlePanelPointerDown` returns early for `isSheet` | Read `src/components/ProjectDrawer.tsx#L321,L395-L398` | 2026-11-13 | stable |

## Unverified assumptions

- Whether `BOUNDARY_MARGIN = 48` in `src/physics/graphSimulation.ts#L82` causes node overlap at `852×393` or `667×375` landscape viewports (cheap to verify in Phase 1 Playwright spike).

## Superseded claims

- None yet.

## Links out

- Main specs: `openspec/specs/portfolio-controls/spec.md`, `openspec/specs/graph-simulation/spec.md`, `openspec/specs/project-drawer/spec.md`
