## 1. Test Scaffolding (TDD)

- [x] 1.1 Extend `'art-wip stays locked until dragged to connect, then unlocks color/hover/inspect persistently'` in `e2e/portfolio.spec.ts` (lines 1743–1841) to assert `nav-art` is hidden initially, appears to the left of `nav-about` with `href="/art/"`, no `target` attribute, static color matching `nav-about`, no horizontal shift on `nav-about`, and no overlap with `brand-home` on desktop and mobile when unlocked, persists across single reset and `page.reload()`, and disappears on consecutive double reset. Run `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "art-wip stays locked" --workers=1` to confirm it fails before implementation.

## 2. Core Implementation

- [x] 2.1 Add optional `onArtUnlock?: () => void` prop (and `onArtUnlockRef`) to `src/components/GraphCanvas.tsx` (lines 58–67, 308, 336–345) and invoke `onArtUnlockRef.current?.()` when `artUnlockedRef.current` transitions from `false` to `true` (lines 649–661).
- [x] 2.2 Track `artUnlocked` state initialized from `loadArtDiscoveryState().unlocked` in `src/App.tsx` (line 70), pass `onArtUnlock={handleArtUnlock}` to `GraphCanvas` (line 439), clear `setArtUnlocked(false)` in the double-reset branch of `resetAll()` (lines 324–330), and pass `artUnlocked={artUnlocked}` to `ControlsOverlay` (line 415).
- [x] 2.3 Add `artUnlocked: boolean` to `ControlsOverlayProps` in `src/components/ControlsOverlay.tsx` (lines 8–49) and render `<a href="/art/" data-testid="nav-art" className={bareText}>Art</a>` as the leftmost child of the `ml-auto` header nav container (line 145).

## 3. Verification & Empirical Audit

- [x] 3.1 Run `npm run typecheck`, `npm run test:unit`, and `npx playwright test e2e/portfolio.spec.ts -g "art-wip stays locked" --workers=1` and confirm all checks pass cleanly.
- [x] 3.2 Populate `verification.md` with the Requirement Adherence Audit Matrix, resolved assumptions, and verbatim execution logs.
