# Surgical Patch Handoff: OpenSpec Change 'portfolio-v2-ferrofluid-audio' [PATCH-02]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v2-ferrofluid-audio`
- **Patch ID**: PATCH-02
- **Objective**: Address follow-up findings from the PR #11 review: (1) bound the idle reconnect backstop so detached bridges do not pop back stretched across the screen before nodes finish coasting home; (2) scale bridge wobble proportionally by base link width so 1-tag 6px ribbons do not swing by ±60%; (3) parse `tsconfig.build.json` directly in `vercelParity.test.ts` and broaden test excludes; (4) fix the conflicting Tailwind color class pair on the Sound toggle button; (5) assert commit-on-release coordinates synchronously in simulation tests.
- **Branch / Worktree Context**: Work directly in the current worktree (branch `worktree-ferrofluid-patch-handoff`, containing the uncommitted PATCH-01 diff on top of `ea736b3`).
- **Feedback & Diagnostic Trace**:
  ```
  IMPORTANT [src/physics/graphSimulation.ts ~L305-L315]
  The idle backstop reconnects at any distance:
    link.isDetached && (distance <= RECONNECT_MULTIPLIER * link.restDistance || state === 'idle')
  means once poll() flips to idle, a bridge reappears even if the nodes are still far apart.
  Because homing is weak and coast speed drops below 0.5 px/tick early, this can fire while
  a node is still returning, so the bridge pops back stretched (2px minimum width) with no recoil.
  It also deviates from the spec's "reconnects once d <= 1.4 * L_rest."
  Keep the guarantee but bound it: reconnect on idle only when distance <= SNAP_MULTIPLIER * restDistance.
  The reconnect test passes through the backstop, so it no longer proves the 1.4x return.
  Assert the node's distance at the moment of reconnect.

  IMPORTANT [src/utils/bridgeGeometry.ts ~L197, graphSimulation.ts]
  Wobble is now large for narrow bridges:
  The retune hits the 1.8–2.3px peak bands, but sag maps to width at 2:1. On a 1-tag, 6px
  bridge, +1.8px sag widens it to about 9.6px and −1.8px narrows it to about 2.4px (near the
  2px clamp). That's a ±60% swing, while a 3-tag 14px bridge swings about ±25%.
  Scale sag by base width so narrow bridges don't feel like they're pulsing off.

  IMPORTANT [src/utils/vercelParity.test.ts ~L40-L53, tsconfig.build.json:4]
  The guard hard-codes what Vercel typechecks: collectBuildTypecheckFiles assumes
  "src minus *.test.ts, plus vite.config.ts" instead of reading tsconfig.build.json.
  Read the config (or assert the two agree). Also expand tsconfig.build.json exclude to
  cover *.test.tsx and *.spec.ts.

  NIT [src/components/ControlsOverlay.tsx L115-L125]
  The pressed style appends text-[var(--color-accent)] to a class string that already has
  text-[var(--color-muted)]. Tailwind's output order, not class order, decides which wins.
  Choose the color conditionally instead of appending.

  NIT [src/physics/graphSimulation.test.ts]
  dragEnd now commits the last pinned coordinate, but nothing asserts that node.x/y equals
  the pinned point without an intervening tick. Add one.
  ```

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
| :--- | :--- | :--- |
| `src/physics/graphSimulation.ts` | L307–L316 | Bound idle reconnect: `link.isDetached && (distance <= RECONNECT_MULTIPLIER * link.restDistance \|\| (state === 'idle' && distance <= SNAP_MULTIPLIER * link.restDistance))`. |
| `src/physics/graphSimulation.test.ts` | ~L150–L185 | Assert distance at the exact tick of reconnection; add test asserting `dragEnd` commits pinned `[dragX, dragY]` to `node.x, node.y` synchronously without waiting for a tick. |
| `src/utils/bridgeGeometry.ts` | L138–L142, L195–L205 | Scale sag by nominal base width: `const widthScale = Math.min(1.2, Math.max(0.5, baseWidth / 10)); const scaledSag = sag * widthScale;`, using `scaledSag` in `sagHandle`. |
| `src/utils/bridgeGeometry.test.ts` | ~L120–L145 | Update/add tests asserting scaled sag for narrow (6px) and wide (10px, 14px) bridges. |
| `tsconfig.build.json` | L4 | Update exclude to `["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "src/**/*.test.*", "src/**/*.spec.*"]`. |
| `src/utils/vercelParity.test.ts` | L28–L47 | Read `tsconfig.build.json` using `readFileSync` and parse `include`/`exclude` to determine typechecked files dynamically. |
| `src/components/ControlsOverlay.tsx` | L25–L27, L120–L125 | Separate `bareTextBase` from text color, conditionally rendering `text-[var(--color-accent)]` vs `text-[var(--color-muted)]` to eliminate the Tailwind conflict. |
| `openspec/changes/portfolio-v2-ferrofluid-audio/verification.md` | Top of file | Add a concise header pointer clarifying that PATCH-01 and PATCH-02 supersede initial pre-patch audit assumptions. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the lines and files specified in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT edit other parts of `ControlsOverlay.tsx`, `ambientSynth.ts`, or `GraphCanvas.tsx`.
  - Do NOT modify `.env`, package scripts other than those already updated, or credential files.
  - Do NOT commit screenshots or temporary files.
- **INVARIANTS TO PRESERVE**:
  - All 139 existing unit tests and 82 E2E tests must continue to pass cleanly.
  - Vercel build parity check (`npm run build`) must continue to succeed.
  - Zero permanent edge loss in simulation topology.

## 4. Visual & UI Impact
- **Bridge Wobble**: Single-tag 6px bridges now oscillate with a refined, organic $\pm 20\text{–}30\%$ width breath rather than swinging $\pm 60\%$ or hitting the 2px minimum clamp.
- **Sound Button Styling**: Active pressed state reliably displays `text-[var(--color-accent)]` with underline, without being overridden by Tailwind's `text-[var(--color-muted)]`.

## 5. Reproduction & Verification Protocol
1. **Targeted Unit Tests**:
   ```bash
   npm run test:unit -- src/physics/graphSimulation.test.ts src/utils/bridgeGeometry.test.ts src/utils/vercelParity.test.ts
   ```
2. **Vercel Parity Build**:
   ```bash
   npm run build
   ```
3. **Full Regression Suite**:
   ```bash
   npm run typecheck && npm run test:unit && npm run test:e2e
   ```

## 6. Surgical Patch Checklist
- [ ] P02.1 Scaffold/update reproducing test cases in `src/physics/graphSimulation.test.ts` (distance assertion on reconnect; synchronous commit on `dragEnd`).
- [ ] P02.2 In `src/physics/graphSimulation.ts`, bound idle reconnect to `distance <= SNAP_MULTIPLIER * link.restDistance`.
- [ ] P02.3 In `src/utils/bridgeGeometry.ts`, scale sag by `clamp(baseWidth / 10, 0.5, 1.2)` and verify in `bridgeGeometry.test.ts`.
- [ ] P02.4 In `tsconfig.build.json` and `src/utils/vercelParity.test.ts`, broaden test excludes and parse `tsconfig.build.json` dynamically.
- [ ] P02.5 In `src/components/ControlsOverlay.tsx`, resolve the Tailwind class conflict on the Sound button.
- [ ] P02.6 Run targeted tests, parity build, and full regression suite (`npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`).
- [ ] P02.7 Update `verification.md` and mark PATCH-02 resolved in `patch.md` and `tasks.md`.
