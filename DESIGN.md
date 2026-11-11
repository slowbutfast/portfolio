---
name: Swiss Modernist Technical Drafting Specimen
colors:
  surface: "#111215"
  surface-dim: "#0a0a0c"
  surface-bright: "#1a1b20"
  surface-container-lowest: "#08080a"
  surface-container-low: "#0e0f12"
  surface-container: "#15161b"
  surface-container-high: "#1d1e24"
  surface-container-highest: "#25272e"
  on-surface: "#e4e4e7"
  on-surface-variant: "#a1a1aa"
  inverse-surface: "#f4f4f5"
  inverse-on-surface: "#0a0a0c"
  outline: "#71717a"
  outline-variant: "#27272a"
  surface-tint: "#00f0ff"
  primary: "#f4f4f5"
  on-primary: "#0a0a0c"
  primary-container: "#27272a"
  on-primary-container: "#f4f4f5"
  inverse-primary: "#18181b"
  secondary: "#00f0ff"
  on-secondary: "#00363d"
  secondary-container: "#00363d"
  on-secondary-container: "#00f0ff"
  tertiary: "#eab308"
  on-tertiary: "#3a3000"
  tertiary-container: "#422006"
  on-tertiary-container: "#fef08a"
  error: "#ef4444"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  background: "#0a0a0c"
  on-background: "#f4f4f5"
  surface-variant: "#18191e"
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: "700"
    lineHeight: 76px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Space Grotesk
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
  sm: 0px
  DEFAULT: 0px
  md: 0px
  lg: 0px
  xl: 0px
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
components:
  drafting-hud:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
  terminal-panel:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 8px
    height: 36px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 8px
    height: 36px
---

## Overview

High-precision typographic brand reveal and technical drafting design system rooted in **Swiss Modernism**, **technical drafting**, and **generative minimalism**. It frames typography and code not merely as static text, but as mathematical architecture and a functional tool for computation.

Root `DESIGN.md` is the authoritative visual identity definition for the project.

---

## Core Aesthetic Principles

### 1. Swiss Modernism & Editorial Rigor
- Strict invisible coordinate grid with asymmetrical balance and generous negative space.
- Disciplined margin annotations: running headers, edge coordinates (`X: 042.8 Y: 310.2`), index numbers (`[01/06]`), and classification tags at the periphery.
- Zero border radius on all architectural containers, dialogs, media cards, and buttons (`rounded: 0px`), structured with crisp 1px hairline borders (`#27272a` for decorative grid lines; `#71717a` for interactive boundaries). Circular geometry (`rounded: 9999px`) is reserved exclusively for canvas graph node anchors and status indicator dots.

### 2. Binary Monochrome with Surgical Color Accents
- The palette is overwhelmingly binary black (`#0a0a0c`) and crisp ink (`#f4f4f5`), maximizing optical contrast.
- Color appears strictly as a surgical conceptual punctuation mark:
  - **Surgical Cyan (`#00f0ff`):** Interactive focal points, active projection vectors, and terminal cursor states.
  - **Surgical Amber (`#eab308`):** Warning flags and non-zero terminal exit codes.

### 3. Deconstructed Technical Drafting
- Construction mechanics are elevated to visual art:
  - Center crosshairs (`+`) marking coordinate anchors.
  - Concentric drafting rings with 4 cardinal tick marks (0°, 90°, 180°, 270°).
  - Perpendicular vector distance callouts (`d: 142.6px`) restricted strictly to the active/hovered node.
  - 4 DOM corner registration crop marks framing the viewport.

### 4. Scale Juxtaposition
- Contrast between **micro-elements** (tiny 10–12px monospaced coordinates, SHA hashes, plate numbers) and **monumental macro-elements** (oversized display numerals `01`–`06` spanning edge-to-edge as architectural background watermarks).

---

## Typography System

- **Space Grotesk Variable:** Primary editorial and display font. Geometric, high-density sans-serif with subtle technical quirks. Used for monumental numerals, project titles, and section headers.
- **JetBrains Mono Variable:** Computational and drafting font. Monospaced clarity for coordinates, dimensional callouts, terminal simulations, tag matrix buttons, and margin tickers.

---

## Motion & Interaction Logic

- **Make the Process the Asset:** Expose tools of creation—vector nodes, coordinates, and bounding frames.
- **Contrast Smooth Interpolation with Hard Cuts:** Combine silky `d3-force` spatial physics with instantaneous, non-interpolated stepped frame cuts (step-time glyph decoding at 12fps for $\le 350\text{ms}$ on drawer open).
- **Respect Reduced Motion:** Bypasses canvas write-in and title scramble completely, rendering static circle layouts and resolved text immediately.
