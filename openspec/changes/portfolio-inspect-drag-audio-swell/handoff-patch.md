# Surgical Patch Handoff: OpenSpec Change 'portfolio-inspect-drag-audio-swell' [PATCH-02]

> **Branch Note**: Execute this patch on PR #14's feature branch **`feat/portfolio-inspect-drag-audio-swell`**.
>
> **Patch ID Note**: The external handoff labelled this work `PATCH-01`. This worktree's `PATCH-01` is already the accent settings-glyph patch (commit `6581b8c`), so the live-URL work is recorded as `PATCH-02` in `patch.md` and `tasks.md`.

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-inspect-drag-audio-swell`
- **Patch ID**: `PATCH-02`
- **Objective**: Add `liveUrl` for `transcribe-plus` (`https://transcribe-plus-frontend.vercel.app/`) and `sandwave-sim` (`https://sandwave-sim.vercel.app/`) so `ProjectDrawer` renders the `Visit ↗` (`data-testid="drawer-visit"`) action for both projects.
- **Root Cause Analysis**: `src/data/projects.ts` defines `repo` for `transcribe-plus` (`L88`) and `sandwave-sim` (`L104`) without `liveUrl`.

## 2. Strict Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/data/projects.ts` | `L88-89`, `L104-105` | Add `liveUrl: 'https://transcribe-plus-frontend.vercel.app/',` below `transcribe-plus` `repo` (`L88-89`) and `liveUrl: 'https://sandwave-sim.vercel.app/',` below `sandwave-sim` `repo` (`L104-105`). |
| `src/data/projects.test.ts` | Unit tests | Assert `transcribe-plus` `liveUrl` equals `'https://transcribe-plus-frontend.vercel.app/'` and `sandwave-sim` `liveUrl` equals `'https://sandwave-sim.vercel.app/'`. |
| `e2e/portfolio.spec.ts` | Inspector tests | Assert `Transcribe Plus` and `Sandwave Sim` drawers render `[data-testid="drawer-visit"]` with their respective `href` values. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY `src/data/projects.ts` (`L88-89`, `L104-105`), their unit/E2E assertions, and OpenSpec ledger files (`patch.md`, `tasks.md`, `verification.md`, `tests.md`, `handoff-patch.md`).
- **FORBIDDEN**: Do NOT alter tags, graph seeds, or any other project entries.

## 4. Visual & UI Impact
Status: Reuses the existing `drawer-visit` pill in `ProjectDrawer.tsx`; no CSS or layout changes.

## 5. Reproduction & Verification Protocol
1. Add the `liveUrl` assertions in `src/data/projects.test.ts` and run `npx vitest run src/data/projects.test.ts` to confirm failure.
2. Add both `liveUrl` entries in `src/data/projects.ts` (`L88-89`, `L104-105`).
3. Run `npm run typecheck && npm run build && npm test && npx openspec validate portfolio-inspect-drag-audio-swell --strict --json`.
4. Update `tasks.md`, `verification.md`, mark `PATCH-02` `DONE` in `patch.md`, commit, and push to `feat/portfolio-inspect-drag-audio-swell` (PR #14).

## 6. Surgical Patch Checklist
- [x] P02.1 Scaffold/run failing unit & E2E assertions for `transcribe-plus` and `sandwave-sim` `liveUrl` / `drawer-visit`.
- [x] P02.2 Add `liveUrl: 'https://transcribe-plus-frontend.vercel.app/',` (`L88-89`) and `liveUrl: 'https://sandwave-sim.vercel.app/',` (`L104-105`) in `src/data/projects.ts`.
- [x] P02.3 Run `npm run typecheck && npm run build && npm test && npx openspec validate portfolio-inspect-drag-audio-swell --strict --json`.
- [x] P02.4 Update `tasks.md`, `verification.md`, and mark `PATCH-02` `DONE` in `patch.md`, then commit and push to PR #14.

## 7. Dispatch Command
```bash
oc-run.sh --auto "$(cat openspec/changes/portfolio-inspect-drag-audio-swell/handoff-patch.md)"
```
