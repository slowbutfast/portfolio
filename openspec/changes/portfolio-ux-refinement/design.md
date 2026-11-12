---
name: Fluid Minimalist Portfolio System
colors:
  primary: "#003399"
  secondary: "#3d7fff"
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
    h1: "28px, weight 700"
    h2: "20px, weight 600"
    body: "15px, weight 400"
    caption: "11px, weight 300"
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

The design balances Swiss modernist typography with organic constructivist physics. Visual hierarchy emphasizes quiet technical confidence: typography uses authentic Helvetica and Helvetica Light (`font-weight: 300`) with Menlo for code and terminals; layouts default to warm architectural paper (`#f6f6f4`); fluid bridges reflect 100% bilateral symmetry across connection axes; and candidate conversion paths are immediately obvious without visual clutter.

- **Aesthetic Tone**: Swiss drafting clarity, organic physical mechanics, high contrast, typography-first hierarchy.
- **Target Surfaces**: Desktop viewports (1440×900, 1920×1080), tablet, and mobile viewports (Pixel 7 393×852, iPhone 390×844).
- **Default Theme**: Light theme default for new visitors (`#f6f6f4`), with instant theme switching to dark mode (`#0a0a0c`).

---

## 2. Color System & Contrast Rationale

| Token Name | Hex Value | Semantic Role | Background Pair | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `#003399` | Cobalt interactive actions & visited nodes | `background (#f6f6f4)` | 10.2:1 | **PASS (AAA)** |
| `secondary` | `#3d7fff` | Focus rings & dark-mode accent | `surface (#ffffff)` | 3.4:1 | **PASS (AA UI)** |
| `text.primary` | `#0a0a0c` | High-contrast body text & titles | `surface (#ffffff)` | 19.5:1 | **PASS (AAA)** |
| `text.muted` | `#525257` | Metadata, tags, uppercase labels | `surface-container (#eae9e5)` | 6.4:1 | **PASS (AAA)** |
| `border` | `#71717a` | Interactive pill outlines & subtle dividers | `surface-container (#eae9e5)` | 3.96:1 | **PASS (AA UI)** |

---

## 3. Typography Hierarchy

| Level | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `H1` | Sans (Helvetica) | `28px` | `700` | `1.2` | Candidate brand name & modal headings |
| `H2` | Sans (Helvetica) | `20px` | `600` | `1.3` | Project drawer titles & grid card headings |
| `Body` | Sans (Helvetica) | `15px` | `400` | `1.5` | Bio text, project summaries |
| `Secondary / Tag` | Sans (Helvetica Light) | `11px` | `300` | `1.4` | Metadata, tags, uppercase plate labels |
| `Code / Data` | Mono (Menlo) | `12px` | `400` | `1.4` | Terminal simulator, coordinates, CLI specimens |

---

## 4. Component Anatomy & States

### Component: Top Bar Controls Sequence
- **Placement**: Spans top edge; header items sequence:
  1. `Gregory Lazatin` (Brand button)
  2. `About`
  3. `GitHub ↗`
  4. `Graph` / `Grid` (View toggle)
  5. `Dark` / `Light` (Theme toggle)
  6. `Filters ▾` (Dropdown)

### Component: `AboutModal` Contact Bar & Brown University Bio
- **Placement**: Dialog top section immediately below heading.
- **Top Actions**: Row of fluid pills for Email, LinkedIn, GitHub, and Resume.
- **Body**: Single clean paragraph detailing Brown University CS studies and technical background. No subtitle, no focus area tag pills.

### Component: `ProjectDrawer` Segmented Tabs Track
- **Placement**: Positioned below project tags in drawer body.
- **Styling**: `bg-[var(--color-surface-container)] rounded-full p-1 inline-flex items-center gap-1`.
- **States**: Active tab elevated via `bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm font-medium`.

### Component: Bilateral Bézier Fluid Bridges
- **Geometry**: Constructed in edge-local coordinates. Upper curve leaves circle A along forward tangent ray $\vec{T}_{A,top}$ and terminates at circle B along $\vec{T}_{B,top}$. Lower curve is the exact mathematical reflection across the centerline axis $\vec{u}$.
- **Waist Pinch**: Controlled via distance tension formula $1 - d / d_{max}$, clamped to prevent negative neck widths.

---

## 5. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Layout Pattern | Navigation / Sizing Rules |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Native Bottom Sheet drawer, stacked top bar | Touch targets $\ge 44\text{px}$, bottom sheet `max-h-[85dvh]` |
| **Desktop** | `≥ 768px` | Anchored HUD drawer, floating hover card | Compact spacing, hover tooltips enabled |

---

## 6. Do's and Don'ts

- **DO** use Menlo for monospace technical code and terminal tables.
- **DO** use Helvetica Light (`font-weight: 300`) for secondary metadata and tags.
- **DO** enforce bilateral symmetry across all canvas connection bridges.
- **DON'T** use low-contrast text that fails WCAG AA ($< 4.5:1$).
- **DON'T** restore heavy solid background boxes or borders to the floating top bar.
- **DON'T** allow connection bridges to invert when nodes touch or overlap during drag.
