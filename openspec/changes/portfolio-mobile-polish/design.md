---
name: Ferrofluid Editorial Drafting (Mobile Polish)
colors:
  primary: "var(--color-accent)"
  secondary: "var(--color-muted)"
  background: "var(--color-bg)"
  surface: "var(--color-surface)"
  text:
    primary: "var(--color-text)"
    muted: "var(--color-muted)"
  border: "var(--color-outline)"
  status:
    success: "#22c55e"
    warning: "#f59e0b"
    error: "#ef4444"
typography:
  fontFamily:
    sans: "var(--font-sans)"
    mono: "var(--font-secondary)"
  scale:
    h1: "1rem–1.125rem, weight 700 (brand-home)"
    h2: "1.25rem, weight 600 (drawer title)"
    body: "0.875rem, weight 400"
    caption: "0.75rem, weight 300 (header controls)"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
---

## 1. Visual Overview & Philosophy

- **Aesthetic Tone**: Editorial drafting canvas — crisp hairline dividers, translucent blurred surfaces (`bg-[var(--color-surface)]/95 backdrop-blur-md`), zero visual clutter on small screens.
- **Target Surfaces**: Mobile portrait (`320px–430px`), mobile landscape (`667×375`, `852×393`), and desktop (`>= 768px`).
- **Visual References**: Existing `ControlsOverlay` bare-text nav, `#portfolio-controls` dropdown card, and `ProjectDrawer` rounded-t-2xl bottom sheet.

---

## 2. Color System & Contrast Rationale

All colors reuse existing CSS custom properties (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-accent`, `--color-outline`, `--color-divider`) in both `light` and `dark` themes; no new hardcoded palette colors are introduced.

| Token Name | Value | Semantic Role | Background Pair | Contrast | WCAG |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-text` | Theme token | Primary labels & headings | `--color-bg` / `--color-surface` | `>= 7:1` | **PASS (AAA)** |
| `--color-muted` | Theme token | Inactive controls & captions | `--color-bg` / `--color-surface` | `>= 4.5:1` | **PASS (AA)** |
| `--color-accent` | Theme token | Active `Sound` underline & slider accent | `--color-surface` | `>= 4.5:1` | **PASS (AA)** |

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `brand-home` | Sans | `16px` (`18px` md+) | `700` | `1.2` | Top-left candidate name |
| `header-nav` | Secondary / Mono | `12px` | `300` | `1.3` | `About`, `Dark`/`Light`, `Grid`/`Graph` |
| `drawer-title` | Sans | `20px` | `600` | `1.25` | Project title in bottom sheet |

---

## 4. Component Anatomy & States

### Component: Mobile Header (`ControlsOverlay.tsx` `< 640px`)

- **Placement**: Top edge with `safe('top', '1rem')`, single horizontal row at `>= 360px` (`Gregory Lazatin` left; `About · Dark/Light · Grid/Graph · ...` right, `gap-x-3`), wrapping gracefully at `320px` without truncating the candidate wordmark.
- **Sound Indicator Dot**: When Sound is enabled and the in-menu Sound control is active (`< sm` or `(hover: none)`), `controls-dropdown-trigger` renders a subtle `6px` (`h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]`) dot at its top-right corner so audio state stays visible without opening the menu.
- **Omitted on `< sm`**: `nav-github` (`hidden sm:inline-flex`); desktop `Sound` + `volume-popover` are hidden on `< sm` OR `(hover: none)`.

### Component: In-Menu Sound & Volume Row (`#portfolio-controls`, `< sm` or `(hover: none)`)

- **Placement**: Inside `#portfolio-controls` above the `Reset` divider, separated by a hairline `border-t border-[var(--color-divider)]`.
- **States**:
  - **Sound Toggle (`mobile-audio-toggle`)**: `fluid-pill min-h-11`, `aria-pressed={soundEnabled}`; accented (`fluid-pill-active`) when enabled, muted when off.
  - **Horizontal Volume Slider (`mobile-volume-slider`)**: `height: 2.75rem` (`44px`), `touch-action: none`, `accent-color: var(--color-accent)`.

### Component: Mobile Bottom Sheet (`ProjectDrawer.tsx`, `isSheet`)

- **Detents & Dimensions**: `fixed inset-x-0 bottom-0 w-full rounded-t-2xl overflow-hidden` with `sheetDetent` snapping between **Peek (`28dvh`)**, **Half (`56dvh`, default)**, and **Expanded (`86dvh`)** (dismiss `< 16dvh`), and `flex-1 overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` on the inner body.
- **Drag Handle & Slim Sticky Header**: Dedicated `sheet-drag-handle` bar (`touch-none`, `min-h-8`, centered `h-1 w-10 rounded-full bg-[var(--color-outline)]` pill) inside the sticky `<header>`, which keeps only `[handle] + index badge + title + Close` pinned on mobile while `summary` and `Code ↗`/`Visit ↗` scroll inside the body.
- **Cursor**: `updateBorderCursor` exits early when `isSheet` is true (`cursor` stays `default`, never `move`).

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Navigation / Sizing Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 640px` (`< sm`) | Single-row header (`About`, `Theme`, `View`, `...`) | Touch targets `>= 44px` (`min-h-11`); Sound + horizontal slider inside `...` |
| **Sheet / Tablet** | `< 768px` (`< md`) | `ProjectDrawer` 3-detent sheet (`28`/`56`/`86dvh`) + camera pan | Upper `~44%` canvas strip visible at Half detent (`56dvh`) |
| **Desktop** | `>= 768px` | Full 6-item header + `Sound` hover popover + floating `85dvh` drawer | Border-drag `move` cursor enabled; `250ms` hover dwell active |

---

## 6. Interaction, Motion & Sound

- **Camera Pan**: Smooth `0.12` exponential lerp (`targetRef.current`) brings tapped node to `(width / 2, height * 0.22)` on `< 768px`, and eases back to `(0, 0)` on close.
- **Power Budget**: `(pointer: coarse)` caps canvas DPR at `2` and schedules idle ambient drift via `15 fps` timed `setTimeout` (`66.7 ms`) rather than spinning `rAF` or freezing completely — preserving the ferrofluid's signature organic breathing while cutting 75–87% of idle JS/GPU wakeups.
- **Reduced Motion**: Existing `prefers-reduced-motion` freeze continues to take precedence.

---

## 7. Do's and Don'ts

- **DO** use CSS custom properties (`var(--color-*)`) and `min-h-11` (`44px`) for all mobile touch targets.
- **DO** apply `touch-action: none` on `.volume-slider` and `.volume-slider-horizontal`.
- **DON'T** show `nav-github` in the `< 640px` top bar (`AboutModal` already provides `about-github`).
- **DON'T** show `cursor: move` on `ProjectDrawer` when `isSheet` is true.
