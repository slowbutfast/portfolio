# Visual & Interaction Design: Unlocked Art Nav Link

## 1. Visual Aesthetic & Palette

Reuses the existing Swiss-editorial header tokens (`--color-muted` resting text, `--color-text` hover text, `--color-accent` `:focus-visible` outline) with no new color tokens or animations. Specifically, the unlocked `Art` link uses a **static** color matching `About`, `Grid`/`Graph`, and `Dark`/`Light` (not the rainbow cycle of the `art-wip` canvas node).

---

## 2. Component Anatomy & States

### Component: `nav-art` inside `ControlsOverlay`

- **Visual Hierarchy & Placement**:
  - Rendered as the **first (leftmost)** child inside `<div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-secondary text-xs font-light sm:gap-x-4 md:gap-x-6">` in `ControlsOverlay.tsx`.
  - Placing it at the left edge of the `ml-auto` group ensures `About`, `GitHub ↗`, `Graph`/`Grid`, `Sound`, `Dark`/`Light`, and `controls-dropdown-trigger` stay in their exact horizontal positions when `Art` appears or disappears.
  - Same-tab navigation (`<a href="/art/" data-testid="nav-art" className={bareText}>Art</a>`).
- **Component States** (via `bareText`):
  - **Default / Idle**: `text-[var(--color-muted)]`, `inline-flex min-h-11 items-center md:min-h-0`
  - **Hover**: `hover:text-[var(--color-text)]` (`transition-colors`)
  - **Focus**: Global `:focus-visible` (`2px solid var(--color-accent)`, `outline-offset: 2px`)
  - **Hidden (Locked / Double-Reset)**: Unmounted from DOM (`artUnlocked === false`).

---

## 3. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Behavior |
| :--- | :--- | :--- |
| **Mobile** | `< 768px` (including `393×852`) | `Art` remains visible (no responsive hide rule) with `min-h-11` (`44px`) touch target, sitting to the left of `About` without overlapping `brand-home`. |
| **Desktop** | `≥ 768px` | `Art` sits immediately to the left of `About` on the same baseline with `md:min-h-0`. |

---

## 4. Do's and Don'ts

- **DO** use `bareText` so `Art` has the exact same static color, font, size, and touch target as `About`.
- **DO** place `Art` as the leftmost child of the `ml-auto` nav container so existing links do not shift.
- **DON'T** add `target="_blank"` (keep same-tab navigation to `/art/`).
- **DON'T** hide `Art` below `640px`.
- **DON'T** apply rainbow/accent coloring to `nav-art`.
