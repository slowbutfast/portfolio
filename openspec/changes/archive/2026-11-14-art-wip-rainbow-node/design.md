---
name: Portfolio Rainbow WIP Node
colors:
  primary: "#2563eb"
  secondary: "#003399"
  background: "#f6f6f4"
  surface: "#ffffff"
  text:
    primary: "#0a0a0c"
    muted: "#525257"
  border: "#71717a"
  status:
    success: "#15803d"
    warning: "#a16207"
    error: "#b91c1c"
typography:
  fontFamily:
    sans: "Helvetica Neue, Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
    mono: "Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
  scale:
    h1: "1.5rem (24px), weight 700"
    h2: "1.125rem (18px), weight 600"
    body: "0.875rem (14px), weight 400"
    caption: "0.6875rem (11px), weight 300"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
  full: "9999px"
---

## 1. Visual Overview & Philosophy

- **Aesthetic Tone**: Technical ferrofluid drafting studio with a singular iridescent anomaly: `Art (WIP)` sits quietly as an unvisited node until discovered, then awakens into a continuous rainbow RGB pulse while keeping all WIP cards clean and minimal.
- **Target Surfaces**: `GraphCanvas` 2D canvas, `NodeHoverCard`, `ProjectDrawer` / `MediaView`, `ListView`, and `/art/` raw HTML page.
- **Visual References**: Existing `fluid-pill`, `MediaView` rounded-xl media frames, and `GraphCanvas` circular nodes.

---

## 2. Color System & Contrast Rationale

| Theme token | Value | Semantic role |
| :--- | :--- | :--- |
| Light background | `#f6f6f4` | Default page and canvas background |
| Light foreground | `#0a0a0c` | Text and high-contrast node outline |
| Light accent | `#2563eb` | Existing interaction accent |
| Dark background | `#0a0a0c` | Dark page and canvas background |
| Dark foreground | `#ffffff` | Text and high-contrast node outline |
| Dark accent | `#3d7fff` | Existing interaction accent |

The node's vibrant rainbow fill is decorative; its label text stays in the theme foreground color and a theme-foreground outline preserves a stable 3:1 non-text boundary. Shared-tag pill text uses a lower-saturation synchronized rainbow, but its lightness must be contrast-adjusted per hue and theme to maintain at least 4.5:1 against the actual pill background. Do not rely on unverified blanket contrast claims for a fixed HSL lightness.

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `WIP Stamp` | Mono | `14px`–`18px` | `500` | `1.2` | Centered `WIP` label inside `MediaView`, `NodeHoverCard`, and `ListView` |
| `Node Label` | Canvas `LABEL_FONT` | `12px` | `500` | `1.0` | `Art (WIP)` pill text below the node |

---

## 4. Component Anatomy & States

### Component: `Art (WIP)` Graph Node (`GraphCanvas`)
- **Idle (Unvisited)**: Uses `tokens.nodeUnvisited` circle fill and `tokens.text` label fill, matching every other unvisited node.
- **Hover / Selected / Visited**: Cycles smoothly through full-spectrum RGB (`computeRainbowRgb`) on the node circle and its ferrofluid bridge endpoints. The node label remains the theme foreground color. Visible connected shared-tag pills receive a lower-saturation rainbow text color synchronized to the node hue; lightness is adjusted to keep at least 4.5:1 contrast against the pill background. Visited state persists after drawer close and page reload until `Reset layout` clears `visitedIds`.
- **Reduced Motion**: Renders a static deterministic prism hue (`285deg`) with zero animation.

### Component: `WIP` Preview Card (`MediaView`, `NodeHoverCard`, `ListView`)
- **Visual Hierarchy & Placement**: `rounded-xl border border-[var(--color-outline)] bg-[var(--color-bg)]` container (`aspect-video` in `MediaView`/`ListView`, `h-32` in `NodeHoverCard`) displaying centered monospaced `WIP` text.

### Component: `NodeHoverCard` Inspect Hint
- **Before first click**: Displays `Click to inspect ↗` in `text-[var(--color-accent)]`.
- **After any node click**: Hidden for the rest of the session, including after `Reset layout`, until page reload.

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Navigation / Sizing Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Bottom sheet (`ProjectDrawer`), `ListView` grid | Touch targets `>= 44x44px` on `Visit ↗` and `Media` tab |
| **Desktop** | `>= 768px` | Floating `NodeHoverCard` & draggable `ProjectDrawer` | Seed mapping uses the same safe-canvas affine transform as mobile and simulation homing |

---

## 6. Interaction, Motion & Sound

- **Rainbow Cycle**: ~3 seconds per 360° rotation (`0.12 deg/ms`), synchronized with `GraphCanvas`'s 30fps (desktop) / 15fps (coarse) loop.
- **Audio**: `Art (WIP)` uses the same `syncSynthSwell` hover/inspect/drag audio swell as every other node.

---

## 7. Do's and Don'ts

- **DO** reuse existing CSS variables (`--color-outline`, `--color-bg`, `--color-muted`) for `WIP` cards.
- **DON'T** animate rainbow colors when `prefers-reduced-motion: reduce` is active.
- **DON'T** render a broken `Code ↗` button in `NodeHoverCard` when `project.repo` is omitted.
