---
name: Fluid Minimalist Portfolio System
colors:
  background: "#0a0a0c"
  surface: "#121316"
  surface-container: "#18191e"
  on-background: "#ffffff"
  on-surface: "#ffffff"
  on-surface-variant: "#8e8e93"
  outline: "#71717a"
  outline-variant: "#27272a"
  primary: "#003399"
  on-primary: "#ffffff"
  primary-container: "#003399"
  on-primary-container: "#ffffff"
  secondary: "#3d7fff"
  on-secondary: "#ffffff"
  tertiary: "#eab308"
  error: "#ef4444"
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
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.08em
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
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
  nav-link:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  floating-filters:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  fluid-pill:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
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
    typography: "{typography.label-md}"
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

The portfolio is a **fluid minimalist personal showcase** for Gregory Lazatin: an expansive themed void where pure circular primitives, organic ferrofluid connections, instant media previews, and Helvetica typography carry the entire visual identity. A naked floating top bar frames the work; a `Filters ▾` popover holds search and filtering; hovering a node reveals a media card; and project inspection opens as a contextual HUD tooltip beside the selected node.

Root `DESIGN.md` is the authoritative visual identity definition for the project.

---

## Core Aesthetic Principles

### 1. Swiss Typography, Binary Contrast
- Helvetica / Helvetica Neue throughout the interface; JetBrains Mono only for computational micro-data and terminal output.
- Two calibrated modes: a deep black void with white primitives, and a warm museum-paper light mode with black primitives.
- Connections are pure binary: `#ffffff` in dark mode and `#000000` in light mode. No gray connection strokes.

### 2. Ferrofluid Constructivism
- Nodes are pure, flat circular primitives (`r = 22px`) with no shadows, bevels, crosshairs, or contour lines.
- Connected nodes fuse through tangent-continuous cubic Bézier fillets with flared attachments and a pinched waist that thins under distance tension.
- Clicked/visited nodes adopt hyperlink cobalt: `#3d7fff` on dark, `#003399` on light.

### 3. Radical Reduction (Ma)
- No background grid, visible brand banner, coordinate ticker, corner crop marks, plate captions, build stamps, or classification captions in the inspector.
- The canvas cursor is a crosshair (`+`), inviting direct manipulation without adding chrome.
- Project titles sit inside background-matched knockout pills so connections never obstruct reading.

### 4. Fluid Geometry & Dual Themes
- Controls, chips, filters, and close buttons are circular or pill-shaped (`rounded-full`). Floating dropdown and inspector cards use `rounded-2xl`.
- Interactive boundaries remain at least 3:1 against their background in both themes.
- Theme state persists in `localStorage`; visited project state also persists.

### 5. Human Identity & Discoverability
- The top-left wordmark is the author's name (`Gregory Lazatin`), rendered as naked typography with no pill, panel, or background container.
- Top-right navigation is equally bare: `About`, `GitHub ↗`, `Grid` / `Graph`, and `Filters ▾`.
- Hovering any node on a fine-pointer device immediately reveals a floating media card with its video or screenshot, title, tags, and summary.
- The About modal carries the biography, focus areas, contact, and GitHub profile.

---

## Color System

| Token | Dark Mode | Light Mode | Role |
| :--- | :--- | :--- | :--- |
| `background` | `#0a0a0c` | `#f6f6f4` | Canvas / publication void |
| `surface` | `#121316` | `#ffffff` | Floating filters and inspector card |
| `surface-container` | `#18191e` | `#eae9e5` | Pills and secondary surfaces |
| `on-background` / `on-surface` | `#ffffff` | `#0a0a0c` | Primary ink / nodes |
| `on-surface-variant` | `#8e8e93` | `#6c6c70` | Muted metadata |
| `outline` | `#71717a` | `#8e8e93` | Interactive boundaries (≥3:1) |
| `outline-variant` | `#27272a` | `#c7c7cc` | Decorative dividers |
| `primary` | `#003399` | `#003399` | International Klein Blue brand accent |
| `secondary` | `#3d7fff` | `#003399` | Dark-calibrated cobalt focus / visited |
| `tertiary` | `#eab308` | `#a16207` | Terminal warning / non-zero exit |

---

## Typography Hierarchy

| Level | Family | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Display Macro` | Helvetica | `96px` | `800` | List index numerals |
| `Wordmark` | Helvetica | `18–28px` | `700` | `Gregory Lazatin` floating brand |
| `H1` | Helvetica | `28px` | `700` | Screen-reader-only page title |
| `H2` | Helvetica | `20px` | `600` | Project titles in list and inspector |
| `Body` | Helvetica | `15px` | `400` | Summaries and descriptions |
| `Data Mono` | JetBrains Mono | `12px` | `500` | Search, tags, terminal, metadata |
| `Micro Mono` | JetBrains Mono | `10px` | `500` | Pills and index badges |

---

## Component Anatomy

### Floating Top Bar
- Naked typography floating directly over the canvas: `Gregory Lazatin` at top-left; `About`, `GitHub ↗`, `Grid` / `Graph`, and `Filters ▾` at top-right.
- No background fill, no border, and no pill wrapper around the top bar or its text links.
- Clicking the wordmark resets filters and returns to graph view. The view toggle lives in the bar; `Filters` opens a `rounded-2xl` popover containing search, stackable tag pills, reset, and the theme switch.

### Instant Node Hover Media Card
- On fine-pointer hover over any graph node, a `rounded-2xl` media card appears adjacent to the node (`+28px, -40px`) and clamps to a 20px viewport margin.
- Shows the project's video clip when available, otherwise a screenshot, otherwise a CLI specimen panel; follows with title, `Click to inspect ↗`, a two-line summary, and tags.
- `pointer-events-none` so the underlying node remains clickable; hidden while the inspector or About modal is open.

### About Modal
- Accessible `role="dialog"` / `aria-modal="true"` card with focus trap, Escape dismissal, backdrop click, and focus restoration.
- Contains the `Gregory Lazatin` wordmark, `Creative Technologist & Software Engineer` subtitle, bio, focus-area pills, contact line, and `https://github.com/slowbutfast` link.

### Canvas Primitives & Ferrofluid Bridges
- Pure flat circles at `r = 22px`; visited nodes in cobalt; hovered/focused nodes in the active accent.
- Cubic meniscus bridges attach flush to both circumferences, flare at the contact tangent, and narrow at the midpoint as distance increases.
- Title knockout pills are filled with the theme background only — no stroke, no outline, no border.
- Cursor: `crosshair`.

### Floating Inspector Tooltip
- Positioned beside the clicked node with `(+32px, -40px)` offset, clamped to the viewport with a 16px margin.
- Deep links resolve the target node's screen position on cold load and keep the card anchored while physics settles.
- `rounded-2xl` card, maximum width `420px`, maximum height `85vh`, blurred surface, sticky header.
- Terminal tab is curated for `agentic-resume-builder` only; other projects present Media and Link tabs.
- Plate, build SHA, and classification captions are omitted.

### Publication List & Media
- Asymmetric two-column Swiss editorial rhythm with monumental index numerals and fluid pill tags; index/classification stamps are omitted.
- Media previews render video and screenshots without figcaption captions; accessible names live on the media elements.

---

## Motion & Interaction

- **Silky Physics:** `d3-force` with 22px nodes, 36px collision clearance, 210px link rest distance, and `0.18` coasting decay.
- **Ferrofluid Tension:** Bridge width and waist respond continuously to distance; no interpolation loops or keyframes are needed.
- **Stepped Title Decode:** 12fps, ≤350ms, once per drawer open, bypassed under `prefers-reduced-motion`.
- **Theme Transition:** 180ms background/color ease; reduced-motion users receive instant changes.

---

## Responsive Layout

| Viewport | Pattern | Rules |
| :--- | :--- | :--- |
| Mobile `< 768px` | Wrapped naked top bar, clamped inspector card, stacked filter popover | Touch targets ≥44px, safe-area insets; hover card disabled on coarse pointers |
| Desktop `≥ 768px` | Naked top bar, HUD tooltip beside node, hover media card | Compact mono metadata, crosshair canvas |

---

## Do's and Don'ts

- **DO** keep connections pure binary (`#ffffff` dark, `#000000` light).
- **DO** use International Klein Blue `#003399` as the brand accent, with `#3d7fff` for dark-mode focus.
- **DO** keep the top bar as naked typography — no background panel, border, or pill wrapper.
- **DO** fill canvas title knockout pills with the theme background only; never stroke them.
- **DO** reveal an instant hover media card on fine-pointer devices.
- **DO** keep the canvas void free of grids, tickers, crop marks, crosshairs on nodes, and captions.
- **DO** use `rounded-full` for controls/chips and `rounded-2xl` for floating cards.
- **DON'T** render the terminal for any project other than `agentic-resume-builder`.
- **DON'T** introduce un-themed hardcoded colors; bind visuals to CSS custom properties.
- **DON'T** put live mouse coordinates into React state.
- **DON'T** duplicate `<h1>` headings inside the inspector.
