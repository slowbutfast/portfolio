# OpenCode Orchestration Handoff: OpenSpec Change 'unlocked-art-nav-link'

You are the orchestration agent for OpenSpec change 'unlocked-art-nav-link' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: unlocked-art-nav-link
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub unlocked-art-nav-link`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments and avoid horizontal abstractions.

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `e2e/portfolio.spec.ts` | `L1743-L1855` | TDD Task 1.1: Extend `'art-wip stays locked until dragged to connect, then unlocks color/hover/inspect persistently'` (and mobile unlock check if applicable) to assert `nav-art` is absent initially, appears to the left of `nav-about` with `href="/art/"`, no `target` attribute, static color matching `nav-about`, no `nav-about` `x` shift, and no overlap with `brand-home`, persists across single reset and `page.reload()`, and disappears on consecutive double reset. |
| `src/components/GraphCanvas.tsx` | `L58-L67`, `L308`, `L336-L345`, `L648-L661` | Task 2.1: Add `onArtUnlock?: () => void` prop, store in `onArtUnlockRef`, and invoke `onArtUnlockRef.current?.()` inside `if (!wasUnlocked)` right after `artUnlockedRef.current = true` and `saveArtDiscoveryState(...)`. |
| `src/App.tsx` | `L70`, `L320-L339`, `L405-L444` | Task 2.2: Add `const [artUnlocked, setArtUnlocked] = useState(() => loadArtDiscoveryState().unlocked);`, `const handleArtUnlock = useCallback(() => setArtUnlocked(true), []);`, call `setArtUnlocked(false)` in the consecutive double-reset branch of `resetAll()`, pass `artUnlocked={artUnlocked}` to `ControlsOverlay`, and pass `onArtUnlock={handleArtUnlock}` to `GraphCanvas`. |
| `src/components/ControlsOverlay.tsx` | `L8-L49`, `L145-L152` | Task 2.3: Add `artUnlocked: boolean` to `ControlsOverlayProps` and render `{artUnlocked && (<a href="/art/" data-testid="nav-art" className={bareText}>Art</a>)}` as the leftmost child of the `ml-auto` nav container. |
| `openspec/changes/unlocked-art-nav-link/tasks.md` | `L1-L16` | Check off completed tasks (`- [x]`) only after each genuinely runs and passes. |
| `openspec/changes/unlocked-art-nav-link/verification.md` | `[NEW]` | Task 3.2: Populate Requirement Adherence Audit Matrix, resolved assumptions, nomenclature audit, and verbatim execution logs. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Lift `artUnlocked` React state to `App.tsx` so `GraphCanvas` triggers immediate unlock updates and `resetAll()` double-reset clears it synchronously.
  - Wrap `onArtUnlock` in `onArtUnlockRef` inside `GraphCanvas.tsx` so simulation `useEffect`s never restart on callback identity changes.
  - Place `nav-art` as the leftmost child inside `ControlsOverlay`'s `ml-auto` nav container so existing links (`About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, `controls-dropdown-trigger`) never shift horizontally.
- **Hard Exclusions / No-Go**:
  - Do NOT add `target="_blank"` on `nav-art` (keep same-tab navigation to `/art/`).
  - Do NOT hide `nav-art` below `640px` (keep visible on both desktop and mobile).
  - Do NOT apply rainbow or accent color to `nav-art` (use `bareText`).
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies.

## 4. Visual & UI Design Specifications & Vision Verification
- **Visual Scope**: Reuses existing Swiss-editorial header tokens (`--color-muted` resting, `--color-text` hover, `--color-accent` `:focus-visible`). No new colors or animations.
- **Component Anatomy & States (`nav-art`)**:
  - **Placement**: Leftmost item in the `ml-auto` header nav container (`ControlsOverlay.tsx:145`).
  - **Styling**: `className={bareText}` (`inline-flex min-h-11 items-center transition-colors hover:text-[var(--color-text)] md:min-h-0 text-[var(--color-muted)]`).
  - **Hidden**: Unmounted when `artUnlocked === false`.
- **Responsive Layout**:
  - Mobile (`< 768px`, `393×852`) & Desktop (`≥ 768px`): `nav-art` stays visible without overlapping `brand-home`.
- **Multi-Modal Vision Verification**:
  - Automated Playwright checks verify bounding-box ordering (`nav-art` left of `nav-about`), zero `nav-about` `x` shift, non-overlap with `brand-home`, and computed `color` parity with `nav-about`.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runners**:
  - Typecheck: `npm run typecheck`
  - Unit tests: `npm run test:unit`
  - Narrow E2E (TDD & verification): `npx playwright test e2e/portfolio.spec.ts -g "art-wip stays locked" --workers=1`
- **TDD Requirement**: Task `1.1` MUST extend the E2E test in `e2e/portfolio.spec.ts` and confirm it fails before modifying `GraphCanvas.tsx`, `App.tsx`, or `ControlsOverlay.tsx`.
- **Resource & Concurrency Rules**:
  - During task implementation, run ONLY the narrowest test matching the modified code. Use `--workers=1` for Playwright runs.

## 6. Implementation Task Checklist
- [ ] 1.1 Extend `'art-wip stays locked until dragged to connect, then unlocks color/hover/inspect persistently'` in `e2e/portfolio.spec.ts` (lines 1743–1841) to assert `nav-art` is hidden initially, appears to the left of `nav-about` with `href="/art/"`, no `target` attribute, static color matching `nav-about`, no horizontal shift on `nav-about`, and no overlap with `brand-home` on desktop and mobile when unlocked, persists across single reset and `page.reload()`, and disappears on consecutive double reset. Run `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "art-wip stays locked" --workers=1` to confirm it fails before implementation.
- [ ] 2.1 Add optional `onArtUnlock?: () => void` prop (and `onArtUnlockRef`) to `src/components/GraphCanvas.tsx` (lines 58–67, 308, 336–345) and invoke `onArtUnlockRef.current?.()` when `artUnlockedRef.current` transitions from `false` to `true` (lines 649–661).
- [ ] 2.2 Track `artUnlocked` state initialized from `loadArtDiscoveryState().unlocked` in `src/App.tsx` (line 70), pass `onArtUnlock={handleArtUnlock}` to `GraphCanvas` (line 439), clear `setArtUnlocked(false)` in the double-reset branch of `resetAll()` (lines 324–330), and pass `artUnlocked={artUnlocked}` to `ControlsOverlay` (line 415).
- [ ] 2.3 Add `artUnlocked: boolean` to `ControlsOverlayProps` in `src/components/ControlsOverlay.tsx` (lines 8–49) and render `<a href="/art/" data-testid="nav-art" className={bareText}>Art</a>` as the leftmost child of the `ml-auto` header nav container (line 145).
- [ ] 3.1 Run `npm run typecheck`, `npm run test:unit`, and `npx playwright test e2e/portfolio.spec.ts -g "art-wip stays locked" --workers=1` and confirm all checks pass cleanly.
- [ ] 3.2 Populate `verification.md` with the Requirement Adherence Audit Matrix, resolved assumptions, and verbatim execution logs.

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `openspec/changes/unlocked-art-nav-link/tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Ensure `openspec/changes/unlocked-art-nav-link/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
3. Automatically run verification via `openspec-verify-change`.

## 8. Verification Review & Single-Pass Automated Repair (Max Retries = 1)
- **If verification succeeds with zero critical issues**:
  1. Sync specs: `openspec specs apply --change "unlocked-art-nav-link"`.
  2. **Open a Pull Request**:
     - Ensure your work is on a dedicated feature branch (create/switch to `feat/unlocked-art-nav-link` if currently on `main`/`master`).
     - Stage and commit all implementation code and every artifact within the change directory (`git add openspec/changes/unlocked-art-nav-link openspec/specs src/App.tsx src/components/GraphCanvas.tsx src/components/ControlsOverlay.tsx e2e/portfolio.spec.ts`), then push the branch (`git push -u origin HEAD`).
     - Open a Pull Request using `gh pr create --fill` (or with a concise title and a body summarizing `openspec/changes/unlocked-art-nav-link/proposal.md` and `openspec/changes/unlocked-art-nav-link/verification.md`) and report the PR URL.
- **If CRITICAL issues or failed test verification errors are detected on initial pass**:
  1. Announce: "Verification failed on initial pass. Attempting a single bounded repair pass via subagent..."
  2. Delegate a single-pass repair task to `spec-coder-sub` with the verification failure context.
  3. Re-run verification via `openspec-verify-change`.
  4. **If verification passes after repair**: sync specs, stage, commit, push branch, and open PR via `gh pr create --fill`.
  5. **If verification STILL fails after the single repair pass**: **HALT** and present the Verification Report and remaining blockers to the user.
