## 1. Test Scaffolding (TDD)

- [x] 1.1 Write unit tests in `src/utils/rainbowPulse.test.ts` covering `isRainbowNodeActive` truth table, `computeRainbowRgb` HSL-to-RGB cycling over time, dark/light theme lightness, and `prefers-reduced-motion: reduce` determinism.
- [x] 1.2 Update `src/data/projects.test.ts` and `src/utils/graphPlanarity.test.ts` for the 9-project (`art-wip`), 17-edge planar catalog, and `wip` preview support.
- [x] 1.3 Update `e2e/portfolio.spec.ts` (9-project count, `150ms` hover dwell timing, `/art/` endpoint `WIP` check, `art-wip` rainbow state activation/persistence/`Reset layout` clearing, and `"Click to inspect ↗"` dismissal across `Reset layout` + restoration on reload).
- [x] 1.4 Add regression tests for the 320×900 boundary-clamped crossing and shared safe-canvas affine mapping, plus sampled contrast checks for the node outline and muted tag-pill text in both themes.

## 2. Static `/art/` Endpoint & Catalog Data

- [x] 2.1 Create `public/art/index.html` with `<title>WIP</title>`, body text `WIP`, and zero inline scripts/styles.
- [x] 2.2 Extend `Preview` (`{ kind: 'wip'; label: string }`) and `ProjectData` (`rainbowOnInteract?: boolean`) in `src/types/portfolio.ts`.
- [x] 2.3 Add `art-wip` (`Art (WIP)`, `tags: ['Design', 'Graphics']`, `liveUrl: '/art/'`, `rainbowOnInteract: true`, `wip` + `linkout` previews) to `src/data/projects.ts`.
- [x] 2.4 Add `'art-wip': { x: 0.05, y: 0.97 }` to `PLANAR_NODE_SEEDS` in `src/data/graphSeeds.ts`.
- [x] 2.5 Apply the same safe-canvas affine seed transform to initial positions, simulation homing, resize, and link rest-distance calculations in `graphSeeds.ts`, `graphSimulation.ts`, and `GraphCanvas.tsx`.

## 3. Rainbow RGB Pulse Engine & Canvas Integration

- [x] 3.1 Implement `isRainbowNodeActive` and `computeRainbowRgb(nowMs, reducedMotion, theme, variant)` in `src/utils/rainbowPulse.ts`; the `'muted'` variant must adjust lightness to maintain 4.5:1 contrast against both actual pill surfaces.
- [x] 3.2 Integrate the helper into `GraphCanvas.tsx`: animate the Art node/bridge endpoint fill, keep the node label at theme foreground, apply synchronized contrast-safe muted rainbow text to focal connected tag pills, add a stable contrasting node outline, and expose `canvas.dataset.rainbowNodes` plus `canvas.dataset.rainbowTagPills` for observability.
- [x] 3.3 Lower `HOVER_DWELL_MS` from `250` to `150` in `src/components/GraphCanvas.tsx`.

## 4. WIP Previews & Session Inspect Hint Dismissal

- [x] 4.1 Add `{ kind: 'wip' }` rendering in `src/components/MediaView.tsx`, `src/components/ProjectDrawer.tsx` (`Media` tab + `mediaPreviews`), `src/components/NodeHoverCard.tsx`, and `src/components/ListView.tsx`.
- [x] 4.2 Guard `Code ↗` in `src/components/NodeHoverCard.tsx` with `{project.repo && ...}` and add `showInspectHint?: boolean` prop to conditionally hide `"Click to inspect ↗"`.
- [x] 4.3 Add session-only `hasInspectedAnyNode` state in `src/App.tsx` (set to `true` in `openProject`, preserved across `resetAll()`, reset on reload) and pass `showInspectHint={!hasInspectedAnyNode}` to `<NodeHoverCard />`.

## 5. Verification & Empirical Audit

- [x] 5.1 Run `npm run typecheck`, `npm run build`, `npm test`, and `npx playwright test`, verifying clean passes and `dist/art/index.html` emission.
- [x] 5.2 Populate `verification.md` with the Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs, and run `npx openspec validate "art-wip-rainbow-node" --strict`.

## 6. PR #16 Review Patch (`PATCH-01`)

- [x] 6.1 Update `ProjectData` (`omitIndex`, `hideOverview`, `revealLabelOnInspect`, `gravityWeight`) in `src/types/portfolio.ts` and update `art-wip` & `ivy-film-festival-2026` in `src/data/projects.ts`.
- [x] 6.2 Speed up rainbow cycle 20% (`0.144 deg/ms`) in `src/utils/rainbowPulse.ts`.
- [x] 6.3 Add weighted gravitational attraction (`gravityWeight`) in `src/physics/graphSimulation.ts` and `GraphCanvas.tsx`, and verify 0-crossing planarity & neighbor pull in unit tests.
- [x] 6.4 Update `GraphCanvas.tsx`: `#ffffff` node stroke, `HOVER_DWELL_MS = 200`, hide `ART` label pill until clicked (`revealedIds` from `App.tsx`), and render `\n` multi-line labels (`"Ivy Film\nFestival"`) at `1.0` line spacing.
- [x] 6.5 Update `ProjectDrawer.tsx` (`omitIndex`, `hideOverview`) and `ListView.tsx` (`omitIndex`, minimal `WIP` card when `previews` is empty).
- [x] 6.6 Update `projects.test.ts`, `graphSimulation.test.ts`, and `e2e/portfolio.spec.ts`, re-run all checks, and update `verification.md`.


## 7. PR #16 Review Patch (`PATCH-02`)

- [x] 7.1 Remove `gravityWeight`, `gravityPullForce`, `linkStrengthFor`, and `sim.on('end')` / `.alphaDecay(0.03)` overrides in `src/types/portfolio.ts`, `src/physics/graphSimulation.ts`, and `src/components/GraphCanvas.tsx` to restore decentralized equal-mass node physics.
- [x] 7.2 Update `art-wip` `title` and `shortTitle` to `'art'` in `src/data/projects.ts` and update `specs/graph-simulation/spec.md`, `specs/project-catalog/spec.md`, and `patch.md`.
- [x] 7.3 Update `projects.test.ts`, `graphSimulation.test.ts`, and `e2e/portfolio.spec.ts`, re-run all checks, and update `verification.md`.


## 8. PR #16 Review Patch (`PATCH-03`)

- [x] 8.1 Add `'art'` to `ParadigmTag`, set `art-wip` `tags: []`, add `'art'` to `open-dungeon`, `transcribe-plus`, `sandwave-sim`, `kintsugi-fracture`, and exclude `'art'` from `deriveEdges`.
- [x] 8.2 Place `art-wip` in the top-left empty space (`{ x: 0.16, y: 0.22 }`) and draw proximity bridges (`ART_PROXIMITY_MAX_DIST = 180`, `data-art-proximity-links`) to `'art'`-tagged nodes only after `art-wip` is clicked (`revealedRef`).
- [x] 8.3 Update unit & E2E tests and OpenSpec docs (`patch.md`, `specs/`, `verification.md`).
