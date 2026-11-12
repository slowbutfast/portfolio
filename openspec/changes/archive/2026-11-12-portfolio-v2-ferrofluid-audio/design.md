---
name: Fluid Ferrofluid Minimalist Portfolio
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

The portfolio balances Swiss modernist drafting precision with tactile, physical ferrofluid mechanics and subtle analog synthesizer feedback. Visual hierarchy emphasizes quiet technical rigor: crisp typography using authentic Helvetica and Helvetica Light (`font-weight: 300`) with Menlo reserved exclusively for code and terminals; layouts defaulting to warm architectural paper (`#f6f6f4`); fluid bridges that exhibit organic inertia, momentum, and viscous damping; and an unobtrusive procedural audio engine that grounds visual interactions with warm analog acoustic resonance.

- **Aesthetic Tone**: Swiss modernist clarity, constructivist drafting grid, organic ferrofluid physics, analog circuit warmth.
- **Target Surfaces**: Desktop viewports (1440×900, 1920×1080), tablet displays, and mobile viewports (Pixel 7 393×852, iPhone 390×844).
- **Default Theme**: Light theme default for initial visits (`#f6f6f4`), with zero-flash switching to dark mode (`#0a0a0c`).

---

## 2. Color System & Contrast Rationale

| Token Name | Hex Value | Semantic Role | Background Pair | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `#003399` | Cobalt interactive actions & node fills | `background (#f6f6f4)` | 10.2:1 | **PASS (AAA text)** |
| `secondary` | `#3d7fff` | Focus rings & non-text interactive UI boundaries (WCAG 2.1 SC 1.4.11) | `surface (#ffffff)` | 3.4:1 | **PASS (Non-text UI >= 3.0:1)** |
| `text.primary` | `#0a0a0c` | High-contrast body text & titles | `surface (#ffffff)` | 19.5:1 | **PASS (AAA text)** |
| `text.muted` | `#525257` | Metadata, tags, uppercase labels | `surface-container (#eae9e5)` | 6.4:1 | **PASS (AAA text)** |
| `border` | `#71717a` | Interactive pill outlines & subtle dividers | `surface-container (#eae9e5)` | 3.96:1 | **PASS (AA UI boundaries >= 3.0:1)** |

> [!NOTE]
> `--color-secondary: #3d7fff` is reserved strictly for non-text UI indicators (focus outlines, active selection rings, and dark-theme brand fills with light text per WCAG 2.1 SC 1.4.11). It does NOT meet the 4.5:1 threshold for normal text against white and is strictly prohibited from body or caption copy on light surfaces.

---

## 3. Typography Hierarchy & Platform Fallbacks

| Level | Font Stack | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `H1` | `'Helvetica Neue', Helvetica, -apple-system, Arial, sans-serif` | `28px` | `700` | `1.2` | Candidate brand name & modal headings |
| `H2` | `'Helvetica Neue', Helvetica, -apple-system, Arial, sans-serif` | `20px` | `600` | `1.3` | Project drawer titles & grid card headings |
| `Body` | `'Helvetica Neue', Helvetica, -apple-system, Arial, sans-serif` | `15px` | `400` | `1.5` | Bio text, project summaries, drawer content |
| `Secondary / Tag` | `'Helvetica Neue Light', 'Helvetica Light', Arial, sans-serif` | `11px` | `300` | `1.4` | Metadata, tags, uppercase plate labels (renders Helvetica Light where available, falling back cleanly to sans-serif system fonts) |
| `Code / Mono` | `'Menlo', 'Monaco', 'Consolas', monospace` | `12px` | `400` | `1.5` | Code blocks, CLI output, technical parameters |

---

## 4. Component Anatomy & Micro-Interactions

### 4.1. 8-Node Planar Graph Canvas
- **Node Geometry**: 8 circular disks representing catalog projects, maintaining the standard invariant radius `NODE_RADIUS = 22px` (focus radius 22px, with touch target padding meeting WCAG $\ge 44\text{px}$ criteria).
- **Initial Layout**: Normalized planar layout guaranteeing 0 crossings for all 13 undirected edges:
  - `agentic-resume-builder`: `(0.18, 0.50)`
  - `open-dungeon`: `(0.40, 0.48)`
  - `pict-climate-risk-viz-chatbot`: `(0.56, 0.22)`
  - `transcribe-plus`: `(0.72, 0.42)`
  - `attention-max`: `(0.52, 0.80)`
  - `sandwave-sim`: `(0.56, 0.55)` (strictly nested inside $\triangle(\text{OD}, \text{TP}, \text{AM})$)
  - `kintsugi-fracture`: `(0.84, 0.72)` (attached to `attention-max` via `Graphics`)
  - `ivy-film-festival-2026`: `(0.15, 0.75)` (attached to `agentic-resume-builder` and `attention-max` via `Design`)
- **Resting Appearance**: All 13 edges remain continuously connected at rest with full thickness ($W_{base}(n) = \min(R_A, R_B) \times 0.65$ clamped to $6 + 4(n-1)\text{px}$). No snapping occurs at rest or on initial page load.

### 4.2. Dynamic Bridge Oscillation & Ferrofluid Mechanics
- **Inertial Momentum**: When a node is dragged or released, the connection bridge exhibits physical inertia, sagging and bouncing laterally perpendicular to the link vector:
  $$\ddot{\delta} + 2\zeta\omega_n \dot{\delta} + \omega_n^2 \delta = F_{perp}$$
  with underdamped response ($\zeta = 0.35, \omega_n = 14\text{ rad/s}$) computed across fixed $\le 16\text{ms}$ substeps.
- **Per-Edge Rest-Normalized Waist Cinching**:
  $$W_{waist}(d) = W_{base}(n) \times \left(1 - \frac{d - L_{rest}(e)}{d_{snap}(e) - L_{rest}(e)}\right)^{1.25} \quad \text{for } d > L_{rest}(e)$$
  where $L_{rest}(e) = \|\text{seed}_u - \text{seed}_v\|$ and $d_{snap}(e) = 2.0 \times L_{rest}(e)$. For $d \le L_{rest}(e)$, $W_{waist} = W_{base}(n)$. Cinching only occurs when nodes are pulled apart past their natural seed rest distance during a drag.
- **Drag-Time Snapping & Rubber-Band Tether**:
  - Detachment threshold: $d > 2.0 \times L_{rest}(e)$, active **only** while the user is dragging.
  - When detached, the visual bridge unmounts with a fluid droplet recoil curve. A rubber-band displacement function applies resistance to pinned drag coordinates (`fx`, `fy`), cushioning against dragging off-screen.
  - Upon pointer release, nodes spring elastically toward their rest basins; once $d \le 1.4 \times L_{rest}(e)$, connection bridges reform with a soft damped ripple.

### 4.3. Smooth Drawer Tracking
- When a project is active in the inspector drawer and physics settles or window resizes, the drawer smoothly tracks the target anchor position using an exponential lerp:
  $$P_{drawer}(t + \Delta t) = P_{drawer}(t) + (P_{target}(t) - P_{drawer}(t)) \times (1 - e^{-18 \Delta t})$$
  eliminating discrete stepping or stutter. At rest, the position snaps cleanly to integer device pixels.

### 4.4. Header Controls Sequence & Sound Toggle
- Top-right header controls maintain canonical sequence:
  `About` | `GitHub ↗` | `Graph` / `Grid` | `Sound` | `Dark` / `Light` | `Filters ▾`
- The `Sound` button uses bare text styling identical to sibling controls (`text-xs font-mono tracking-wider uppercase transition-colors`).
- `aria-pressed="true"` when unmuted, `aria-pressed="false"` when muted.
- Preference state is saved in `localStorage.portfolio_sound_enabled`.

### 4.5. Project Drawer Header Actions
- The sticky header provides direct action links:
  - `Visit ↗`: Always rendered if `liveUrl` is present.
  - `Code ↗`: Rendered only when `repo` is defined on `ProjectData`. For closed-source or client work without a public repository (e.g., `ivy-film-festival-2026`), the `Code ↗` button is omitted cleanly from the DOM without empty spacing or broken links.

---

## 5. Procedural Auditory Ergonomics

To provide tactile physical presence without irritating users or draining battery:

1. **Warm Analog Transformer Drone**:
   - 65Hz sawtooth oscillator lowpass-filtered at 600Hz (24dB/oct), set at -24dBFS (linear gain 0.063).
   - Rich overtones at 130, 195, 260, 325, 390, 455, 520 Hz pass through cleanly, producing an authentic transformer hum audible on iPhone and laptop speakers without sub-bass distortion.
   - Low-level pink noise floor (-36dBFS, linear gain 0.016) adds natural circuit warmth.

2. **Hover Resonant Swell**:
   - Parallel resonant bandpass filter ($Q = 2.5$) tuned to 750Hz resting center.
   - Hovering over a node increases bandpass gain by +6dB with an exponential ramp (50ms), creating a focused acoustic focus cue.

3. **Spatial Interactive Modulation**:
   - Pointer horizontal coordinate $X$ maps to stereo pan: $\text{pan} \in [-0.75, 0.75]$.
   - Pointer vertical coordinate $Y$ modulates bandpass center frequency: $Y \in [0, H] \to f \in [450\text{Hz}, 1400\text{Hz}]$.
   - Node dragging applies subtle $\pm 5\%$ frequency modulation to the base oscillator.

4. **De-zippering, Autoplay Compliance & Battery Conservation**:
   - All parameter transitions use Web Audio `setTargetAtTime(target, ctx.currentTime, 0.05)` to eliminate zipper clicks.
   - AudioContext is a singleton, initialized lazily upon explicit interaction.
   - Armed state seamlessly resumes playback on first user touch if `portfolio_sound_enabled` was previously enabled.
   - When tab visibility is hidden (`document.hidden === true`), the AudioContext automatically suspends, resuming upon returning to foreground.

---

## 6. Accessibility & Motion Independence

- **`prefers-reduced-motion: reduce`**:
  - Damped harmonic bridge oscillation is completely bypassed; bridges render as static smooth Bézier paths.
  - Graph nodes initialize directly at fixed scaled planar seed coordinates without physics settling.
  - Continuous rAF loop is suspended immediately upon render.
  - Audio playback remains independently controlled by the user via the `Sound` toggle button.
- **Screen Reader Support**:
  - All interactive buttons have descriptive accessible labels and valid ARIA attributes (`aria-pressed`, `aria-expanded`).
  - Graph nodes expose full project titles and tags to screen readers via semantic DOM navigation elements overlaid on the HTML5 2D canvas.
  - Contrast ratios meet or exceed WCAG 2.1 AA / AAA standards across all interactive controls.
