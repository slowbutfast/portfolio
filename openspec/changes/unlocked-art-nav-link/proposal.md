## Why

Once a visitor unlocks the hidden `art-wip` node by dragging it to connect, navigating back to `/art/` currently requires reopening the node's `ProjectDrawer` and clicking `Visit ↗`. Surfacing a persistent `Art` navigation link in the top header bar makes `/art/` immediately accessible from anywhere in the portfolio while keeping it hidden until discovered and removing it again if the visitor resets art discovery.

## What Changes

- Track `artUnlocked` state in `src/App.tsx` (initialized from `loadArtDiscoveryState().unlocked`, updated via `onArtUnlock` from `GraphCanvas`, and cleared to `false` on consecutive double reset in `resetAll()`).
- Conditionally render an `Art` link (`<a href="/art/" data-testid="nav-art">Art</a>`) in `ControlsOverlay` as the **leftmost** item in the right-aligned nav group (`ml-auto`) so no existing nav links shift horizontally, styled with `bareText` (same static color and hover behavior as `About`, `Grid`/`Graph`, and `Dark`/`Light`) and visible on both desktop and mobile viewports without overlapping `brand-home`.
- Extend the Playwright E2E test suite in `e2e/portfolio.spec.ts` to verify initial hidden state, unlock appearance/placement/non-overlap/static color, persistence across single reset and page reload, and disappearance on consecutive double reset.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `portfolio-controls`: Update `Top-right header navigation sequence and theme toggle` to prepend an `Art` link (`href="/art/"`, same-tab, static primary link styling) at the left edge of the top-right nav group when `art-wip` is unlocked, remaining visible on desktop and mobile until cleared by consecutive double reset.

## Impact

- `src/App.tsx` (`artUnlocked` state, `handleArtUnlock`, `resetAll`)
- `src/components/GraphCanvas.tsx` (`onArtUnlock` callback prop and ref)
- `src/components/ControlsOverlay.tsx` (`artUnlocked` prop and `nav-art` link)
- `e2e/portfolio.spec.ts` (`art-wip` unlock/persist/double-reset test)
- No new dependencies, API changes, or breaking changes.
