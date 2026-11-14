# Verification: portfolio-test-suite-streamlining

## Executive Summary & Environment

- **Status**: Clean baseline established, refactor applied, final run green. Typecheck, production build, `REQUIRE_DIST=1` unit suite, and the full desktop + mobile Playwright suite pass with 0 failures and 0 flaky. `openspec validate --strict` is valid.
- **Date**: 2026-11-14
- **Branch**: `feat/portfolio-test-suite-streamlining` (from `548a0b6`)
- **Environment**: Linux `aarch64`, Vitest `3.2.7`, Playwright `1.63.0`, Chromium `desktop` (Desktop Chrome) and `mobile` (Pixel 7).
- **Honest-accounting note**: no test case was deleted from the E2E file. The saving is in project executions, not cases.

## Baseline triage (Task group 1)

The earlier 14-failure run on `master` was **not** a clean baseline. 9 of the 14 were `net::ERR_CONNECTION_REFUSED` (dev server unreachable). A clean run in this worktree on a free port 5199 produced **0 failures**.

| Earlier failure | Re-run (`--repeat-each=3`, clean port) | Classification |
| :--- | :--- | :--- |
| `LLM filter dims every edge…` (desktop + mobile) | pass ×3 on both | environment fault (server contention) |
| `hover dwell suppresses fast sweeps…` (desktop) | pass ×3 | environment fault |
| `graph view exposes all 8 project nodes…` (mobile) | pass ×3 | environment fault |
| `pointercancel ends a drag cleanly…` (mobile) | pass ×3 | environment fault |

The re-run executed 18 executions (6 skipped by project gating), 0 failed, 0 flaky. No real regression exists on `master`, so no quarantine or separate fix commit was needed (task 1.3).

The `ERR_CONNECTION_REFUSED` pattern **recurred** during this change's first final run (18 failures, all environment, including the two new catalog specs, which then passed in isolation). Another Claude session shares port 5199 on this machine, and Playwright's `webServer` reuses whatever is on it. A second identical run passed. Treat intermittent `ERR_CONNECTION_REFUSED` as an environment fault and re-run before debugging.

## Suite accounting (cases / project executions / skips)

| Layer | Metric | Clean baseline | Final |
| :--- | :--- | :--- | :--- |
| Unit (Vitest) | test cases | 206 (204 pass, 2 skipped) | 205 (`REQUIRE_DIST=1`: 205 pass, 0 skipped) |
| Unit | test time | 0.6 s | 0.9 s (still < 1 s) |
| E2E (Playwright) | spec titles (cases) | 72 | 72 |
| E2E | project executions | 108 | **91** |
| E2E | skipped executions | 36 | **53** |
| E2E | failures / flaky | 0 / 0 | 0 / 0 |
| E2E | wall time | 213 s | **201 s** |
| E2E | executed test time, desktop | 119.0 s | 122.5 s |
| E2E | executed test time, mobile | 86.7 s | **71.1 s** |

E2E executions drop by 17 (10 viewport-independent specs, the GitHub spec, and 6 DOM-driven axe scans). Mobile test time falls about 15.6 s. Desktop time is within run-to-run noise. As predicted in `research.md`, gating alone saves little wall time; the large win belongs to the separate camera-settled change.

The unit case count fell by one (the folded `proximity pairs…` describe). Every other unit test was kept.

## Requirement Adherence Audit Matrix

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Clean baseline before refactor | Triage table above; baseline recorded before any edit | **PASS** |
| Invariant-preserving consolidation: constants pinned | Mutation checks below: all six constants caught by a surviving test | **PASS** |
| Invariant-preserving consolidation: simulation edge integrity | `graphSimulation.test.ts` `preserves all 13 topological edges…` retained, and now also asserts `sim.links` length and `force('proximity')` undefined | **PASS** |
| Contact destinations stay asserted | `profile.test.ts` unchanged | **PASS** |
| Browser completeness without literal count pins | E2E ids parsed from `src/data/projects.ts`; list asserts a card per id and the `card-*` count equals the id count; nav asserts its count equals the id count; `projects.test.ts` is the one literal-`8` pin | **PASS** (see Not run) |
| Viewport-independent E2E on one project | 10 specs + the GitHub spec skip on mobile with a reason; 6 axe scans skip on mobile | **PASS** |
| Mobile layout coverage retained | Mobile still executes sheet/camera, header, in-menu Sound/Reset, `pointercancel`, DPR/fps, viewport matrix, and both open-drawer axe scans | **PASS** |
| No spec left unexecuted | Only the 5 preview-only `served edge headers` specs execute on neither project locally | **PASS** |
| Diagnosable E2E scenarios | No scenarios merged; theme and axe tests stay separate and titled by surface + theme; 4 inline setups now use `centerNode`, 1 uses `focusNode` | **PASS** |
| Build-output guard stays conditional | `buildOutput.test.ts` untouched; `REQUIRE_DIST=1` unit run passes with `dist/` present | **PASS** |
| Honest suite accounting | Table above | **PASS** |

## Coverage map (removed / merged / gated)

| Change | Surviving coverage |
| :--- | :--- |
| `projects.test.ts`: two `toHaveLength(8)` pins removed | First catalog test still pins `8`; the other tests still loop every project |
| `graphPlanarity.test.ts`: `8` and `13` literals removed | `projects.test.ts` pins `8` and the 13-edge derivation (`derives exactly the pinned 13 edges…`); planarity keeps id-set equality and uniqueness |
| `graphSimulation.test.ts`: `proximity pairs…` describe removed | Its assertions (`sim.links` = 13, `force('proximity')` undefined) moved into `preserves all 13 topological edges…` |
| 11 E2E specs gated off mobile | Same assertions still run on desktop; mobile-hidden `nav-github` is still asserted in the header-sequence and mobile-header specs |
| 6 axe scans (graph/list/About × dark/light) gated off mobile | Same scans run on desktop; open-drawer dark and light scans run on both projects |
| E2E `8` pins replaced by catalog-derived ids | `projects.test.ts` pins `8` |

Deliberately **not** changed (kept per the spec and review guidance): the `ambientSynth` topology test, both oscillator decay tests, the `bridgeGeometry` and `graphSimulation` constant pins, `profile.test.ts`, `buildOutput.test.ts`, and `preview-headers.spec.ts`. The sticky-focal and audio-swell E2E specs were reassessed and left on both projects: the sticky-focal spec drives touch taps and the swell spec mirrors state in both input modes, so neither is viewport-independent.

## Constant-drift mutation checks (uncommitted, one at a time, reverted)

| Mutation | Caught by |
| :--- | :--- |
| `SNAP_MULTIPLIER` 1.6 → 1.7 | `graph planarity after unperturbed d3-force ticks` (and the `1.6x snap` pin) |
| `RECONNECT_MULTIPLIER` 1.25 → 1.3 | `uses the 1.6x snap and 1.25x reconnect multipliers` |
| `REST_WAIST_RATIO` 0.58 → 0.6 | `exposes the 0.58 rest waist ratio and 1.6x snap stretch` |
| `SNAP_STRETCH_MULTIPLIER` 1.6 → 1.7 | `exposes the 0.58 rest waist ratio and 1.6x snap stretch` |
| `DAMPING_RATIO` 0.35 → 0.4 | `uses the specified underdamped physical parameters` |
| `HOVER_SWELL_GAIN` 1.0 → 1.2 | `exposes the specified synthesizer topology` |

## Not run / deferred

- **Edge-drop mutation** (dropping a permanent link from the simulation): not run.
- **Temporary ninth catalog entry**: not run. A new entry needs bundler assets, which was disproportionate for a check; the derivation was verified instead by both completeness specs passing against the parsed catalog.
- **Mobile `nav-github` hidden** is no longer asserted by the GitHub spec; it remains asserted by the header-sequence and mobile-header specs.
- **`openspec validate --strict`** is re-run in the PR step.

## Follow-up note (task 5.3): camera-settled change

The suite still contains 47 `waitForTimeout` calls, with `1500` and `1600` ms the most common (`centerNode`, `focusNode`, `hoverCenteredNode`). Every hover, sticky-focal, and tap spec spends about 3.1 s in those sleeps before it does anything. A condition-based signal (for example a `data-camera-settled` attribute on the canvas, set when the pan reaches its target) would remove that dead time and the timing sensitivity behind the earlier flake suspicion. It needs an app-side hook in `GraphCanvas.tsx`, so it is a separate OpenSpec change.
