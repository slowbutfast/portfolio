---
name: Swiss Editorial Ferrofluid
colors:
  primary: "#003399"
  secondary: "#0a0a0c"
  background: "#f6f6f4"
  surface: "#eae9e5"
  text:
    primary: "#0a0a0c"
    muted: "#525257"
  border: "#71717a"
  status:
    success: "#003399"
    warning: "#71717a"
    error: "#b91c1c"
typography:
  fontFamily:
    sans: '"Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif'
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  scale:
    h1: "1.125rem (18px), weight 700"
    h2: "0.875rem (14px), weight 700"
    body: "0.75rem (12px), weight 500"
    caption: "0.625rem (10px), weight 300"
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

- **Aesthetic Tone**: Minimalist Swiss editorial precision paired with a cohesive, viscous ferrofluid simulation—bridges pool organically at node perimeters even at rest, visited/active cobalt accents blend smoothly along bridge necks, and HUD controls remain quiet and unobstructed.
- **Target Surfaces**: 2D interactive `<canvas>` (`GraphCanvas`), peripheral `NodeHoverCard` popover, and top-right `ControlsOverlay` 3-dot dropdown menu across desktop (`1440x900`) and mobile (`393x852`).
- **Visual References**: Existing Swiss tokens (`--color-bg`, `--color-surface`, `--color-accent`, `--color-node-visited`, `--color-connection`) in `src/index.css` / `GraphCanvas.tsx`.

---

## 2. Color System & Contrast Rationale

| Token Name | Hex Value | Semantic Role | Background Pair | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` (`--color-accent`) | `#003399` | Active/visited node fill, bridge gradient endpoint | `--color-bg` (`#f6f6f4`) | `10.1:1` | **PASS (AAA)** |
| `text.primary` (`--color-text`) | `#0a0a0c` | Node labels, dropdown headings, buttons | `--color-bg` (`#f6f6f4`) | `18.3:1` | **PASS (AAA)** |
| `text.muted` (`--color-muted`) | `#525257` | Top-bar bareText controls, captions | `--color-bg` (`#f6f6f4`) | `7.1:1` | **PASS (AA/AAA)** |

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `H1` | Sans | `18px` | `700` | `1.2` | Brand home button (`candidateProfile.name`) |
| `H2` | Sans | `12px` | `600` | `1.3` | `"Filters"` section heading inside 3-dot dropdown |
| `Body` | Sans | `12px` | `500` | `1.4` | Canvas node labels, dropdown pills, `"Reset layout"` |
| `Caption` | Sans | `10px` | `300` | `1.3` | Hover card tags and `"Click to inspect ↗"` |

---

## 4. Component Anatomy & States

### Component: `ControlsOverlay` 3-Dot Overflow Menu
- **Visual Hierarchy & Placement**: Top-right header slot after `Dark`/`Light`, replacing the `"Filters ▾"` button with a 3-dot trigger (`MoreHorizontal`, `aria-label="Filters & Layout"`).
- **Dropdown Structure**:
  1. `"Filters"` heading (`text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]`)
  2. Search input + paradigm tag pills
  3. Action footer (`border-t border-[var(--color-divider)] pt-3`): `"Reset"` (filters) and `"Reset layout"` (`data-testid="reset-layout"`).
- **Component States**:
  - **Default / Idle**: `bareText` muted color (`text-[var(--color-muted)]`), `min-h-11 md:min-h-0`.
  - **Hover / Open**: `text-[var(--color-text)]`; `aria-expanded={open}`.
  - **Focus**: Browser/Tailwind focus-visible ring (`2px solid var(--color-accent)`).

### Component: `NodeHoverCard` (Peripheral Measured Placement)
- **Placement**: Uses `ResizeObserver`-measured `width`/`height` projected outward along `(nodeScreenPos - canvasCenter)` and clamped with `20px` safe-area margin so the card does not cover the central cluster.

### Component: Ferrofluid Bridges & Proximity Webbing
- **Rest Silhouette**: Concave hourglass (`REST_WAIST_RATIO = 0.58`) with $C^1$ perimeter flares; axis-aligned `createLinearGradient` between endpoint node colors.
- **Snap Recoil**: `220ms` retracting droplet tips at both endpoint circles on `1.6x` detachment.
- **Proximity Webbing**: Painted beneath permanent bridges and nodes in the same $C^1$ hourglass curve language for non-edge pairs within `96px`.

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Navigation / Sizing Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Full-bleed canvas, 3-dot dropdown width `min(22rem, calc(100vw - 2rem))` | All interactive buttons & pills $\ge 44\text{px}$ height (`min-h-11`) |
| **Desktop** | `≥ 768px` | Full-bleed canvas, peripheral hover card | Compact `md:min-h-0` header bareText, `200ms` hover dwell enabled |

---

## 6. Interaction, Motion & Sound

- **Hover Dwell**: `200ms` dwell gates both `sim.hover` and `NodeHoverCard`; cancelled synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId`, `reduceMotion`, and `coasting`.
- **Hover Drift**: Slow `0 -> 0.025` ramp outside a `110px` soft exclusion zone.
- **Reduced Motion**: `prefers-reduced-motion: reduce` bypasses dynamic oscillations, recoil, hover drift, and proximity dynamics, rendering static planar seeds.
- **Sound**: Existing `synth.onNodeHover` / `onDragVelocity` triggers respect the `200ms` hover gate so cursor sweeps do not misfire hover audio.

---

## 7. Do's and Don'ts

- **DO** use CSS custom properties (`--color-accent`, `--color-connection`, etc.) read via `cacheTokens()`.
- **DO** maintain $\ge 44 \times 44\text{px}$ touch targets on mobile for `"Reset layout"`, `"Reset"`, and the 3-dot trigger.
- **DON'T** draw proximity bridges for detached permanent-edge pairs.
- **DON'T** open `NodeHoverCard` during `drag` or `coasting` states.
