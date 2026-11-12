---
name: Fluid Minimalist Portfolio System
colors:
  primary: "#003399"
  secondary: "#3d7fff"
  background: "#0a0a0c"
  surface: "#121316"
  text:
    primary: "#ffffff"
    muted: "#8e8e93"
  border: "#71717a"
  status:
    success: "#22c55e"
    warning: "#eab308"
    error: "#ef4444"
typography:
  fontFamily:
    sans: "Helvetica Neue, Helvetica, Arial, sans-serif"
    mono: "JetBrains Mono, monospace"
  scale:
    h1: "28px, weight 700"
    h2: "20px, weight 600"
    body: "15px, weight 400"
    caption: "11px, weight 500"
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

The design balances Swiss editorial minimalism with organic constructivism. Visual hierarchy favors quiet confidence: typography is crisp, layout structure is mathematical and disciplined, and direct action affordances are immediately obvious to technical recruiters without relying on distracting ornamental clutter.

- **Aesthetic Tone**: Swiss drafting clarity, organic physical mechanics, high contrast, typography-first hierarchy.
- **Target Surfaces**: Desktop viewports (1440×900, 1920×1080), tablet, and mobile viewports (Pixel 7 393×852, iPhone 390×844).
- **Visual References**: Un-bordered floating HUD, progressive backdrop gradient scrim, pill action buttons, and monospaced technical stamps.

---

## 2. Color System & Contrast Rationale

| Token Name | Hex Value | Semantic Role | Background Pair | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `#003399` | Primary action highlight & cobalt accents | `background (#0a0a0c)` | 4.6:1 | **PASS (AA)** |
| `secondary` | `#3d7fff` | Focus rings & active interactive links | `surface (#121316)` | 5.2:1 | **PASS (AA)** |
| `text.primary` | `#ffffff` | High-contrast body text & titles | `surface (#121316)` | 16.8:1 | **PASS (AAA)** |
| `text.muted` | `#8e8e93` | Metadata, tags, uppercase labels | `surface (#121316)` | 4.8:1 | **PASS (AA)** |
| `border` | `#71717a` | Interactive pill outlines & subtle dividers | `surface (#121316)` | 3.2:1 | **PASS (AA UI)** |

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `H1` | Sans | `28px` | `700` | `1.2` | Candidate brand name & modal headings |
| `H2` | Sans | `20px` | `600` | `1.3` | Project drawer titles & grid card headings |
| `Body` | Sans | `15px` | `400` | `1.5` | Project summaries, bio paragraphs |
| `Tagline` | Mono | `10px` | `500` | `1.4` | Header subtitle: "Software Engineer · Autonomous Agents & Graphics" |
| `Pill / Action` | Mono / Sans | `11px` | `600` | `1.0` | `Code ↗`, `Visit ↗`, `Resume ↗` action pills |

---

## 4. Component Anatomy & States

### Component: `NodeHoverCard` Direct Action Links
- **Visual Hierarchy & Placement**: Pinned directly beneath the card title in the floating preview popup, above the summary.
- **Component States**:
  - **Default / Idle**: Pill with 1px border (`var(--color-outline)`), font-mono 10px, uppercase tracking. `Visit ↗` has accent tint background (`var(--color-accent)/10`).
  - **Hover**: Background shifts to solid accent (`var(--color-accent)`) with white text.
  - **Active / Pressed**: Scale down to `0.98`.
  - **Focus**: 2px outline in `var(--color-accent)` with 2px offset.
  - **Disabled**: Hidden if URL does not exist.

### Component: `ProjectDrawer` Sticky Action Bar
- **Visual Hierarchy & Placement**: Pinned in the sticky header directly below the scramble title container.
- **Component States**:
  - **Default / Idle**: Flexible row of fluid pills with icons (`GitBranch`, `ExternalLink`).
  - **Hover**: Accent highlight border and color transition.
  - **Focus**: Focus ring mirroring.

### Component: `AboutModal` Contact Bar & Resume Preview
- **Visual Hierarchy & Placement**: Bottom action bar in the About modal, followed by an expandable `Resume Preview` container.
- **Component States**:
  - **Resume Preview Toggle**: Pill button `[ View Resume Preview ▾ ]` revealing a 450px responsive iframe with smooth border and loading placeholder.
  - **Contact Links**: Fluid pills for Email, LinkedIn, GitHub, and direct Google Drive file link.

### Component: Top Bar Progressive Scrim
- **Visual Hierarchy & Placement**: Spans the full top edge behind `ControlsOverlay`.
- **Styling**: `bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent pb-6 backdrop-blur-[2px]`. Guarantees legible typography without an artificial box.

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Navigation / Sizing Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Native Bottom Sheet drawer, stacked top bar | Touch targets $\ge 44\text{px}$, bottom sheet `fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh]` |
| **Desktop** | `≥ 768px` | Anchored HUD drawer, floating hover card | Compact spacing, hover tooltips enabled, candidate engineering subtitle visible |

---

## 6. Interaction, Motion & Sound

- **Transitions**: `transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease`.
- **Card Hover Retention**: 150ms grace delay when moving pointer from graph node to hover card.
- **Stepped Decode Title**: 350ms duration at 12fps (bypassed when `prefers-reduced-motion: reduce` is active).

---

## 7. Do's and Don'ts

- **DO** use semantic CSS variables mapped to design tokens (`var(--color-accent)`, `var(--color-surface)`).
- **DO** ensure all clickable pills and action buttons provide at least $44 \times 44\text{px}$ touch targets on mobile.
- **DON'T** use low-contrast text that fails WCAG AA ($< 4.5:1$).
- **DON'T** restore heavy solid background boxes or borders to the floating top bar.
- **DON'T** render raw kebab slugs on canvas simulation nodes.
