---
name: Fluid Minimalist Portfolio System
colors:
  background: "#f6f6f4"
  surface: "#ffffff"
  surface-container: "#eae9e5"
  on-background: "#0a0a0c"
  on-surface: "#0a0a0c"
  on-surface-variant: "#525257"
  outline: "#71717a"
  outline-variant: "#c7c7cc"
  primary: "#003399"
  on-primary: "#ffffff"
  primary-container: "#003399"
  on-primary-container: "#ffffff"
  secondary: "#3d7fff"
  on-secondary: "#0a0a0c"
  tertiary: "#a16207"
  error: "#b91c1c"
typography:
  headline-xl:
    fontFamily: Helvetica
    fontSize: 72px
    fontWeight: "700"
    lineHeight: 76px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Helvetica
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Helvetica
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Helvetica
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Helvetica
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 22px
  label-light:
    fontFamily: Helvetica
    fontSize: 11px
    fontWeight: "300"
    lineHeight: 16px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Menlo
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.08em
  canvas-label:
    fontFamily: Helvetica
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
components:
  site-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-light}"
    rounded: "{rounded.none}"
  nav-link:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-light}"
    rounded: "{rounded.full}"
  floating-filters:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-light}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  fluid-pill:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-light}"
    rounded: "{rounded.full}"
    padding: 8px
    height: 32px
  hover-media-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
  about-modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
  title-knockout:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.label-light}"
    rounded: "{rounded.full}"
  inspector-tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
  terminal-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
---

## Overview

The portfolio is a **fluid minimalist personal showcase** for Gregory Lazatin: a warm architectural-paper canvas where pure circular primitives, bilateral ferrofluid connections, instant media previews, and Helvetica typography carry the visual identity. Light is the default theme; dark mode is an explicit one-click choice. A floating top bar frames the work; a 3-dot overflow menu holds search, filtering, and a singular reset; hovering a node reveals an interactive media card; and project inspection opens as a contextual HUD on desktop or a bottom sheet on mobile.

Root `DESIGN.md` is the authoritative visual identity definition for the project.

---

## Core Aesthetic Principles

### 1. Swiss Typography, Binary Contrast
- Helvetica / Helvetica Neue carries brand, headings, body, and canvas node label pills. Helvetica Light (`font-weight: 300`) carries metadata, tags, and secondary labels.
- Menlo, Monaco, Consolas, Liberation Mono, and Courier New form the monospace stack, scoped strictly to the terminal simulator, CLI specimens, and coordinate HUDs.
- Two calibrated modes: warm museum paper (`#f6f6f4`) with black primitives by default, and a deep black void (`#0a0a0c`) with white primitives on demand.
- Connections are pure binary: `#000000` in light mode and `#ffffff` in dark mode. No gray connection strokes.

### 2. Ferrofluid Constructivism
- Nodes are pure, flat circular primitives (`r = 22px`) with no shadows, bevels, crosshairs, or contour lines.
- Connected nodes fuse through bilateral cubic Bézier boundaries. The upper boundary leaves each circle along its exact perimeter tangent (C1 continuity), and the lower boundary is the mathematical reflection of the upper curve across the center-to-center axis. The waist cinches under distance tension.
- Clicked/visited nodes adopt hyperlink cobalt: `#003399` on light, `#3d7fff` on dark.
- Bridges are omitted entirely when circles touch or overlap (`d <= R_A + R_B`), never inverted through the centerline.

### 3. Radical Reduction (Ma)
- No background grid, visible brand banner, coordinate ticker, corner crop marks, plate captions, build stamps, or classification captions inside the inspector.
- The canvas cursor is the default arrow at rest and becomes a crosshair (`+`) only while hovering or dragging a project node, inviting direct manipulation without mis signaling that empty canvas is interactive.
- Project titles sit inside background-matched knockout pills so connections never obstruct reading.

### 4. Fluid Geometry, Planar Resting States & Dual Themes
- Controls, chips, filters, and close buttons are circular or pill-shaped (`rounded-full`). Floating dropdown and inspector cards use `rounded-2xl`.
- Interactive boundaries remain at least 3:1 against their background in both themes.
- Theme state persists in `localStorage`; visited project state also persists. `theme-init.js` applies a stored dark preference before first paint, while first-time visitors default to light.
- The six project nodes initialize from an authoritative planar embedding. `sandwave-sim` is nested strictly inside triangle(`open-dungeon`, `transcribe-plus`, `attention-max`), so all nine links have zero crossings before and after weak seed homing (`strength: 0.02`).

### 5. Human Identity & Discoverability
- The top-left wordmark is the author's name (`Gregory Lazatin`), rendered as naked typography with no pill, panel, or background container.
- Top-right navigation is equally bare and ordered: `About`, `GitHub ↗`, `Graph` / `Grid`, `Sound`, `Dark` / `Light`, and a 3-dot overflow menu (`...`).
- Hovering any node on a fine-pointer device reveals an interactive media card with its video or screenshot, title, tags, summary, and direct `Code ↗` / `Visit ↗` actions. A 150ms pointer-transfer grace period keeps the card alive when the cursor moves from node to card.
- The About modal carries the canonical Brown University bio and top-mounted Email, LinkedIn, GitHub, and Resume links; the resume preview is a click-to-load sandboxed Google Drive iframe.

---

## Color System

| Token | Dark Mode | Light Mode | Role |
| :--- | :--- | :--- | :--- |
| `background` | `#0a0a0c` | `#f6f6f4` | Canvas / publication void |
| `surface` | `#121316` | `#ffffff` | Floating filters, hover card, inspector |
| `surface-container` | `#18191e` | `#eae9e5` | Segmented tab track and secondary surfaces |
| `on-background` / `on-surface` | `#ffffff` | `#0a0a0c` | Primary ink / nodes |
| `on-surface-variant` | `#8e8e93` | `#525257` | Muted metadata (6.4:1 on `#eae9e5`) |
| `outline` | `#71717a` | `#71717a` | Interactive boundaries (3.96:1 on `#eae9e5`) |
| `outline-variant` | `#27272a` | `#c7c7cc` | Decorative dividers |
| `primary` | `#003399` | `#003399` | International Klein Blue brand accent |
| `secondary` | `#3d7fff` | `#3d7fff` | Non-text focus rings and selection boundaries |
| `tertiary` | `#eab308` | `#a16207` | Terminal warning / non-zero exit |

> **Contrast rule:** `#3d7fff` is reserved for non-text UI indicators (focus rings, selection boundaries, active rings) that meet WCAG 2.1 SC 1.4.11 at >= 3:1. It is not approved for normal text on white or paper surfaces.

---

## Typography Hierarchy

| Level | Family | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Display Macro` | Helvetica | `96px` | `800` | List index numerals |
| `Wordmark` | Helvetica | `18–28px` | `700` | `Gregory Lazatin` floating brand |
| `H1` | Helvetica | `28px` | `700` | Screen-reader-only page title |
| `H2` | Helvetica | `20px` | `600` | Project titles in list and inspector |
| `Body` | Helvetica | `15px` | `400` | Summaries and descriptions |
| `Secondary / Tag` | Helvetica Light | `11px` | `300` | Metadata, tags, uppercase plate labels |
| `Canvas Label` | Helvetica | `12px` | `500` | 2D canvas project node pills |
| `Data Mono` | Menlo | `12px` | `400–500` | Terminal output, CLI specimens, coordinate HUD |

---

## Component Anatomy

### Floating Top Bar
- Naked typography floating directly over the canvas: `Gregory Lazatin` at top-left; `About`, `GitHub ↗`, `Graph` / `Grid`, `Sound`, `Dark` / `Light`, and a 3-dot overflow menu (`...`) at top-right, in that exact order.
- No background fill, no border, and no pill wrapper around the top bar or its text links. A progressive gradient scrim from `var(--color-bg)` to transparent preserves legibility when Grid cards scroll beneath the bar.
- Clicking the wordmark returns to graph view and resets the HUD. `Dark` / `Light` toggles the theme directly in the bar; the 3-dot menu opens a `rounded-2xl` popover containing the `Filters` heading, search, stackable tag pills, and a singular `Reset` action that clears filters, layout, and visited-node colors.

### Instant Node Hover Media Card
- On fine-pointer hover over any graph node, a `rounded-2xl` media card appears adjacent to the node (`+28px, -40px`) and clamps to a 20px viewport margin.
- Shows the project's video clip when available, otherwise a screenshot, otherwise a CLI specimen panel; follows with title, `Click to inspect ↗`, a two-line summary, tags, and direct `Code ↗` / `Visit ↗` actions.
- `pointer-events-auto` with a 150ms dismissal grace period: entering the card cancels dismissal; leaving it restarts the timer. Starting a canvas node drag dismisses immediately.

### About Modal
- Accessible `role="dialog"` / `aria-modal="true"` card with focus trap, Escape dismissal, backdrop click, and focus restoration.
- Contains the `Gregory Lazatin` wordmark, top-mounted contact pills (Email, LinkedIn, GitHub, Resume), and the canonical Brown University bio. No role subtitle and no focus-area tag pills.
- `Preview resume` click-to-loads a sandboxed `https://drive.google.com/.../preview` iframe; the frame remains unloaded until requested.

### Canvas Primitives & Bilateral Bridges
- Pure flat circles at `r = 22px`; visited nodes in cobalt; hovered/focused nodes in the active accent.
- Cubic boundaries attach flush to both circumferences along exact tangent rays and mirror exactly across the center-to-center axis, producing a symmetrical hourglass waist. Every control-point normal offset stays non-negative.
- Filtering illuminates an edge only when both endpoint nodes match; any dimmed endpoint dims the whole connection. Focal permanent edges display up to three shared-tag pills stacked vertically at their midpoint.
- A close-node guard returns `null` when circles touch or overlap, so no inverted or crossed geometry renders during a drag.
- Title knockout pills are filled with the theme background only — no stroke, no outline, no border — and use the Helvetica sans stack.

### Floating Inspector Tooltip
- Positioned beside the clicked node with `(+32px, -40px)` offset, clamped to the viewport with a 16px margin on desktop.
- On mobile (`< 768px`) the inspector docks to the bottom edge as a `rounded-t-2xl` bottom sheet with `max-h-[85dvh]`.
- Sticky header carries the project title, summary, and permanent `Code ↗` and, when available, `Visit ↗` actions.
- Content tabs live in a distinct segmented track (`bg-[var(--color-surface-container)] rounded-full p-1`) containing only `Media` and/or `Terminal`, with >= 44px touch targets. The legacy `Link` tab is retired.
- Non-repository linkouts render contextually in the Overview section. Plate, build SHA, and classification captions are omitted.

### Publication List & Media
- Asymmetric two-column Swiss editorial rhythm with 16:9 thumbnails, understated monospaced index stamps, and fluid pill tags.
- Grid card hierarchy is fixed: `01  Title` inline in one row, then the summary subtitle, then the 16:9 preview, then tag pills. Cards with visual previews render a lazy-loaded video or screenshot. Terminal-only projects render an authentic dark CLI specimen without a `[CLI Specimen]` badge or broken image.
- Media previews render video and screenshots without figcaption captions; accessible names live on the media elements.

---

## Motion & Interaction

- **Silky Physics:** `d3-force` with 22px nodes, 36px collision clearance, weak seed homing (`strength: 0.02`), and `0.18` coasting decay.
- **Planar Resting State:** Initial, reduced-motion, and settled layouts derive from `PLANAR_NODE_SEEDS`; active dragging may temporarily displace nodes and homing returns them to the planar basin.
- **Ferrofluid Tension:** Bridge width and waist respond continuously to distance; no interpolation loops or keyframes are needed.
- **Stepped Title Decode:** 12fps, <=350ms, once per drawer open, bypassed under `prefers-reduced-motion`.
- **Theme Transition:** 180ms background/color ease; reduced-motion users receive instant changes. `theme-init.js` prevents first-paint theme flashes.

---

## Responsive Layout

| Viewport | Pattern | Rules |
| :--- | :--- | :--- |
| Mobile `< 768px` | Wrapped naked top bar, bottom-sheet inspector, stacked filter popover | Touch targets >= 44px, safe-area insets, `max-h-[85dvh]`; hover card disabled on coarse pointers |
| Desktop `>= 768px` | Naked top bar, HUD tooltip beside node, interactive hover card | Compact light metadata, node-hover crosshair, clamped inspector |

---

## Do's and Don'ts

- **DO** keep connections pure binary (`#000000` light, `#ffffff` dark).
- **DO** use International Klein Blue `#003399` as the light-theme brand accent, with `#3d7fff` for dark-mode non-text focus indicators.
- **DO** keep the top bar as naked typography — no background panel, border, or pill wrapper.
- **DO** fill canvas title knockout pills with the theme background only; never stroke them.
- **DO** reveal an interactive hover media card on fine-pointer devices with a 150ms transfer grace period.
- **DO** initialize and restore the graph from the authoritative planar seeds.
- **DO** use Helvetica Light (`font-weight: 300`) for secondary metadata and tags.
- **DO** use `rounded-full` for controls/chips and `rounded-2xl` for floating cards.
- **DON'T** use Menlo outside terminals, CLI specimens, and coordinate HUDs.
- **DON'T** use `#3d7fff` for normal text on light surfaces.
- **DON'T** render the terminal for any project other than `agentic-resume-builder`.
- **DON'T** introduce un-themed hardcoded colors in the interface; bind visuals to CSS custom properties.
- **DON'T** put live mouse coordinates into React state.
- **DON'T** duplicate `<h1>` headings inside the inspector.
- **DON'T** restore a redundant `Link` preview tab.
