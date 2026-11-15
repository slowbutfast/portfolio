# Design: `project-studio`

> **Scope**: Non-visual / dev-tool; uses existing fluid/drafting CSS tokens (`--color-bg`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-accent`, `--color-border`, monospace/display font stacks) from `src/index.css`.

## Layout Anatomy (`/#/studio`)
- **Top Bar (`StudioHeader`)**:
  - Title (`PROJECT STUDIO // DEV`), dirty-state indicator (`Unsaved changes` / `Synced`), `Check Links` button, `Discard` button (resets draft to last fetched state), `Save` button (disabled when clean or when `countSeedCrossings > 0` or validation errors exist, showing the blocking reason), and `← Portfolio` link (`#/`).
- **Left Rail (Project List)**:
  - Searchable/ordered list of projects with `+ New Project` action, index/ID badge, and reserved lock indicator on `art-wip`.
- **Center Pane (Project Editor)**:
  - **Identity & Behavior**: `id` (locked for `art-wip`; `/^[a-z0-9-]+$/`), `title`, `shortTitle`, `classification`, `summary`, behavior flags (`omitIndex`, `hideOverview`, `revealLabelOnInspect`, `rainbowOnInteract`).
  - **Links & Health**: `repo` and `liveUrl` (`https:` or `/...`) with inline `pass`/`warning`/`fail` badge + `latencyMs` from `POST /__studio/api/audit-links`.
  - **Tags**: Multi-select pills from `draft.tags`, showing hidden status for `draft.hiddenTags` (e.g., `'art'`).
  - **Previews & Terminal Demo**: `Previews` list with `kind` (`screenshot` | `video` | `wip`), `assetKey` dropdown populated from the narrowed asset glob, and `caption`; `terminalDemo` editor with `capturedKey` dropdown (`./captured/*.json`) and `prompt` input.
  - **Delete Project**: Disabled with tooltip for reserved `art-wip`; removes project and its `seeds[id]` entry for non-reserved projects.
- **Right Pane (`SeedMiniMap` & `TagManager`)**:
  - **Planar Seed Mini-Map**: Interactive `[0..1] × [0..1]` SVG/canvas preview rendering all draft nodes and `deriveEdges(draft.projects, new Set(draft.hiddenTags))` edges. Crossing edges highlight in red; dragging any node updates `draft.seeds[id]` live and recalculates `countSeedCrossings`.
  - **Tag Manager**: Create tag, rename tag (cascades across all `projects[].tags` and `hiddenTags`), delete tag (removes from `projects[].tags` and `hiddenTags`), and toggle `hiddenTags`—with `'art'` locked against deletion/renaming/unhiding and a live edge-diff count showing added/removed edges before saving.
