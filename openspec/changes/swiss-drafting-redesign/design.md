---
name: Swiss Modernist Technical Drafting Specimen
colors:
  primary: "#00f0ff"
  secondary: "#eab308"
  background: "#0a0a0c"
  surface: "#111215"
  text:
    primary: "#f4f4f5"
    muted: "#a1a1aa"
  border: "#71717a"
  status:
    success: "#22c55e"
    warning: "#eab308"
    error: "#ef4444"
typography:
  fontFamily:
    sans: "'Space Grotesk Variable', ui-sans-serif, sans-serif"
    mono: "'JetBrains Mono Variable', monospace"
  scale:
    h1: "1.75rem (28px), weight 700"
    h2: "1.25rem (20px), weight 600"
    body: "0.9375rem (15px), weight 400"
    caption: "0.75rem (12px), weight 500"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
  full: "9999px"
---

## 1. Visual Overview & Philosophy

The visual identity is anchored in **Swiss Modernism**, **ferrofluid minimalism**, and **generative restraint**. It frames code, architecture, and relational links not as an engineered blueprint of annotations, but as pure circular forms held in organic magnetic tension. Root `DESIGN.md` is the authoritative token source.

- **Aesthetic Tone**: Computational precision, deep dark-room monochrome, quiet 1px hairline dividers, pure flat circular primitives, organic meniscus bridges, and surgical punctuation accents.
- **Target Surfaces**: Full-screen 2D force graph canvas (pure obsidian void), quiet peripheral HUD, blueprint modal drawer, and two-column asymmetric publication list.
- **Zero Radius Scope**: All interactive surfaces, buttons, tag pills, dialogs, media previews (`MediaView`), and terminal panels feature `rounded: 0px` (`rounded-none`). `rounded.full` (9999px) is reserved strictly for circular canvas node anchors and status indicator dots.

---

## 2. Color System & Contrast Rationale

| Token Name | Hex Value | Semantic Role | Background Pair | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text.primary` | `#f4f4f5` | High-contrast body & titles | `#0a0a0c` | 18.0:1 | **PASS (AAA)** |
| `text.muted` | `#a1a1aa` | Coordinates, plate numbers, secondary info | `#0a0a0c` | 7.7:1 | **PASS (AAA)** |
| `border` | `#71717a` | Interactive UI boundaries (buttons, inputs) | `#0a0a0c` | 4.09:1 | **PASS (AA - 1.4.11)** |
| `border` | `#71717a` | Interactive UI boundaries on surface | `#111215` | 3.86:1 | **PASS (AA - 1.4.11)** |
| `border.decorative` | `#27272a` | Quiet hairline dividers | `#0a0a0c` | 1.33:1 | **PASS (Exempt - Decorative)** |
| `primary` | `#00f0ff` | Surgical cyan active highlight | `#0a0a0c` | 14.0:1 | **PASS (AAA)** |
| `secondary` | `#eab308` | Surgical amber warning/exit status | `#0a0a0c` | 10.3:1 | **PASS (AAA)** |

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Display Macro` | Space Grotesk | `96px` | `800` | `1.0` | Translucent watermark index numerals (`01`, `02`) in drawer and list |
| `H1` | Space Grotesk | `28px` | `700` | `1.2` | Page title in top HUD (`ControlsOverlay`) |
| `H2` | Space Grotesk | `20px` | `600` | `1.3` | Project drawer dialog title, section headings, list item titles |
| `Body` | Space Grotesk | `15px` | `400` | `1.5` | Project descriptions and modal summaries |
| `Data Mono` | JetBrains Mono | `12px` | `500` | `1.4` | Coordinates, CLI logs, tags, plate numbers |
| `Micro Mono` | JetBrains Mono | `10px` | `500` | `1.2` | Margin coordinate ticker and quiet metadata (`aria-hidden` where decorative) |

---

## 4. Component Anatomy & States

### Component: `ControlsOverlay` HUD Frame
- **Visual Hierarchy**: Quiet peripheral HUD with a pure typographic brand mark (`SYS.PORTFOLIO`). No corner crop marks, subtitle stamps, or decorative graph icon.
- **States**:
  - **Tag Pills**: Quiet monospaced typographic labels with a subtle 1px `#71717a` border and no generated bracket glyphs. Idle is transparent; active selection inverts with `#00f0ff` cyan text and border.
  - **View Toggle Buttons**: Clean text `"Graph"` / `"List"` with active state highlighted in high-contrast `#f4f4f5` on `#18191e`.
  - **Margin Ticker**: Direct DOM ref element showing live `X: --- Y: ---` updated via rAF in canvas-local coordinate space; renders `X: --- Y: ---` when unmounted or in list view.

### Component: `GraphCanvas` Ferrofluid Node Geometry
- **Node Anatomy**:
  - Pure, flat, solid circular primitives at canonical radius $r = 18\text{px}$ with crisp edges.
  - No center crosshairs, no concentric tick rings, no shadows, bevels, or contour lines.
  - Hit target remains strictly at canonical physics radius $r = 18\text{px}$.
- **Ferrofluid Bridges**:
  - Connected nodes closer than $160\text{px}$ fuse through an organic meniscus bridge whose tangent contact points narrow toward a waist at the midpoint.
  - Idle bridges render in the same ink as the node primitives; dimmed pairs fade.
  - Hover/Focus state highlights the active node and its incident bridges in luminous cyan, with no mechanical distance callouts (`d: 142px`).

### Component: `ProjectDrawer` Blueprint Modal
- **Visual Hierarchy**: Right-aligned slide-out drawer on desktop, bottom sheet on mobile, with sharp 0px radius (`rounded-none`).
- **Title Scrambler**: Semantic `<h2 className="sr-only">` with `<span aria-hidden="true">` in the same CSS grid cell to prevent proportional font width jitter. Runs a 12fps scramble for 350ms on open, bypassed under `prefers-reduced-motion`.
- **Watermark Numerals**: Oversized `01`–`06` watermark numeral behind content with 10% opacity.

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Sizing & Touch Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Stacked HUD controls, bottom sheet drawer | Touch targets $\ge 44\text{px}$, safe-area inset padding |
| **Desktop** | `≥ 768px` | Minimal edge HUD, right slide-out blueprint drawer | Compact 12px monospaced typography, hover ferrofluid bridging enabled |

---

## 6. Interaction, Motion & Sound

- **Silky Continuous Physics**: `d3-force` simulation with 0.18 coasting velocity decay for natural fling inertia.
- **Ferrofluid Cohesion**: Connected nodes in proximity merge through organic meniscus bridges that emerge and recede with distance; focal interaction illuminates the active node and its incident bridges in cyan.
- **Stepped Hard Cuts**: 12fps non-interpolated character decoding on drawer open; instantaneous monochrome state transitions.
- **Reduced Motion**: Full fallback to static circular layout, no bridge animation, and immediate display of final title strings.

---

## 7. Do's and Don'ts

- **DO** use `#71717a` for interactive boundaries to guarantee WCAG 1.4.11 3:1 compliance.
- **DO** self-host all fonts locally using `@fontsource-variable/*` packages and disable Vite asset inlining (`assetsInlineLimit: 0`) to prevent `data:font` CSP violations.
- **DO** let pure circular primitives and organic meniscus bridges carry the visual identity.
- **DO** draw fluid bridges only for connected nodes within 160px proximity to prevent rAF hot-path degradation.
- **DON'T** add background grids, crosshairs, concentric tick rings, corner crop marks, or bracket glyphs.
- **DON'T** put live mouse coordinates into React state.
- **DON'T** duplicate `<h1>` headings inside modal dialogs.
- **DON'T** leave rounded corners on `MediaView`, `ListView`, or `TerminalSimulator`.
