# Tasks: Light-Mode Accent Contrast & DESIGN.md Sync

- [x] 1.1 Update `:root` `--color-accent` and `--color-node-visited` in `src/styles.css` from `#003399` to `#2563eb`.
- [x] 1.2 Update `DEFAULT_TOKENS.accent` and `DEFAULT_TOKENS.nodeVisited` in `src/components/GraphCanvas.tsx` from `'#003399'` to `'#2563eb'`.
- [x] 1.3 Unify `DESIGN.md` with the current codebase as ground truth and the `#2563eb` light-mode accent update (color system, mobile single-row header & in-menu Sound/volume, desktop volume popover, draggable 3-detent mobile bottom sheet `28dvh`/`56dvh`/`86dvh`, procedural audio swell & coarse-pointer `15fps` drift, and removal of stale `coordinate HUD` references).
- [x] 1.4 Assert Light-mode computed color `rgb(37, 99, 235)` on `controls-dropdown-icon` when Sound is enabled in `e2e/portfolio.spec.ts`.
- [x] 1.5 Run `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run test:e2e`, and `openspec validate --strict`, and record results in `verification.md`.
