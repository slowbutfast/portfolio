## Source material

> **2026-11-24 — User request:**
> "/plan can you propose another small change where once the art node is activated, a new link in the nav bar appears that links to the same \"/art\" endpoint, with a static color same as the other primary links? and then once its reset (if the reset button is pressed twice), then it disappears again? this is mainly a QOL fix to make it easier to navigate to that page once you've \"unlocked\" the art page."

> **2026-11-24 — User refinement on plan:**
> "L12: put it ot the left so it doesn't shift any of the other links. and we can relax that hide rule as long as the links don't overlap with my name/title. and i think because \"art\" is only 3 letters it should be fine
> L13: same-tab navigation is good"

### Raised but not acted on

- **Hiding `Art` on narrow mobile viewports (`< 640px`)**: Considered mirroring `.nav-github-link` (`display: none` below `640px`), but relaxed per user feedback because `"Art"` is only 3 letters and fits without overlapping `brand-home`.
- **Opening `/art/` in a new tab (`target="_blank" rel="noreferrer"`)**: Considered matching `ProjectDrawer`'s `drawer-visit`, but user confirmed same-tab navigation (`href="/art/"`).

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| Art nav link | The `<a>` element (`data-testid="nav-art"`, `href="/art/"`, text `Art`) rendered in `ControlsOverlay` as the leftmost item in the right-aligned nav group (`ml-auto`) once `artUnlocked` is `true`. | The `art-wip` canvas node, `nav-art-wip` hidden DOM button, or `ProjectDrawer`'s `drawer-visit` link. |
| Art unlocked / activated | `loadArtDiscoveryState().unlocked === true` (`portfolio_art_state` in `localStorage`), triggered when `art-wip` connects to an `'art'`-tagged node in `GraphCanvas.tsx`. | Simply hovering or clicking `art-wip` before dragging it to connect. |
| Double reset | Pressing `Reset` (`data-testid="reset-layout"` or `brand-home`) twice consecutively with no intervening canvas interaction (`lastActionWasResetRef.current === true` in `App.tsx:324-330`), which calls `clearArtDiscoveryState()`. | A single `Reset` click (which preserves `art-wip` unlocked state and connections). |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| N/A | Pure internal React/Tailwind/localStorage UI integration using existing `artDiscovery` and `ControlsOverlay` primitives. | — | 2026-11-24 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| React state `artUnlocked` in `App.tsx` synced via `onArtUnlock` callback from `GraphCanvas` | Adopted | `ControlsOverlay` is already a child of `App.tsx`, and `App.tsx` already owns `resetAll()` and `artResetVersion`. | 2026-11-24 |
| CSS `bareText` class on `<a href="/art/">` as first item inside `ml-auto` nav div | Adopted | Reuses exact static muted/hover color tokens (`--color-muted`, `--color-text`) and placing it leftmost avoids shifting existing links. | 2026-11-24 |

## Patterns adopted

- Ref-wrapped callback (`onArtUnlockRef`) in `GraphCanvas.tsx` to invoke parent React state updates from the `requestAnimationFrame` render loop without restarting simulation effects.
- Single-class `bareText` styling in `ControlsOverlay.tsx` for uniform primary header controls.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Art unlock persistence helper | `loadArtDiscoveryState()` returns `{ unlocked, connectedIds, maxConnections }`; `clearArtDiscoveryState()` removes `portfolio_art_state` | Read `src/utils/artDiscovery.ts:16-52` | 2026-11-24 | stable |
| Art unlock transition site | `GraphCanvas.tsx:648-661` sets `artUnlockedRef.current = true` and calls `saveArtDiscoveryState(...)` when `sim.connectLink('art-wip', otherId)` succeeds | Read `src/components/GraphCanvas.tsx:648-663` | 2026-11-24 | stable |
| Consecutive double-reset handler | `App.tsx:324-330` runs `if (lastActionWasResetRef.current)` -> `clearArtDiscoveryState()`, increments `artResetVersion` | Read `src/App.tsx:320-339` | 2026-11-24 | stable |
| Header nav container & primary link style | `ControlsOverlay.tsx:29-31,145-158` uses `bareText` (`text-[var(--color-muted)] hover:text-[var(--color-text)]`) inside `ml-auto flex flex-wrap items-center ...` | Read `src/components/ControlsOverlay.tsx:29-31,145-158` | 2026-11-24 | stable |
| Static `/art/` endpoint | `public/art/index.html` served at `/art/` | Read `openspec/specs/wip-art-endpoint/spec.md:6-11` and `e2e/portfolio.spec.ts:1735-1740` | 2026-11-24 | stable |

## Unverified assumptions

- None; all relevant files and specs were read directly.

## Superseded claims

- **Initial placement/visibility**: Placed `Art` after `About` and considered hiding it below `640px`. **Replaced with**: Leftmost item in the `ml-auto` nav group (so existing links never shift) and visible on both desktop and mobile viewports.

## Links out

- `openspec/specs/portfolio-controls/spec.md` — Header navigation sequence and controls spec.
- `openspec/specs/wip-art-endpoint/spec.md` — `/art/` static endpoint spec.
