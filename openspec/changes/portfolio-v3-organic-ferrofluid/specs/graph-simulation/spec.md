## MODIFIED Requirements

### Requirement: Decentralized equal mass node distribution
The system SHALL simulate nodes using uniform visual radius (22px) and uniform repulsive charge ($k_{charge} = -\min(w, h) \times 0.30$) with weak planar seed homing (`seedX`/`seedY` at `0.02`), soft link springs (strength `0.015`), collision radius (`48px`), and distance floor (`distanceMin = 50`), ensuring nodes distribute buoyantly across the viewport with minimum clearance of 44 pixels rather than clumping in the center or sticking against boundary walls.

#### Scenario: Graph initialization without central clump or corner pinning
- **WHEN** the canvas is initialized with the 8 project nodes
- **THEN** nodes distribute buoyantly across the viewport area maintaining at least 44 pixels center-to-center clearance without settling against viewport margins or collapsing onto OpenDungeon.

### Requirement: Dynamic hover gravitation wave
The system SHALL gate both simulation hover physics (`sim.hover(node)`) and preview card opening behind a single `200ms` pointer dwell timer, cancelling the dwell timer and clearing hover synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, a bidirectional `prefers-reduced-motion` transition, or while `state === 'coasting'`. Once dwell completes, the hovered node is transiently pinned (`fx = x; fy = y`) without becoming a persistent user placement.

The system SHALL render a purely visual deterministic ambient drift for every node with amplitude `3.5px`, updated at roughly `30fps`, paused while `document.hidden`, while the canvas is off-screen (`IntersectionObserver`), and under reduced motion. Rendering, pointer hit testing, and hover-card anchoring SHALL consume the same drift offset so the painted circle and its interactive target remain aligned. Ambient drift SHALL NOT exert any `d3-force` attraction or repulsion.

#### Scenario: Pointer sweeps across a node without dwelling
- **WHEN** the pointer crosses a node for less than `200ms` or while `state === 'coasting'`
- **THEN** neither `sim.hover` nor `NodeHoverCard` activates.

#### Scenario: Pointer dwells on a stationary node for 200ms
- **WHEN** the pointer remains on node H for `200ms` in `idle` state
- **THEN** `sim.hover(H)` pins node H, the visual ambient drift continues within its `3.5px` bound, and `NodeHoverCard` opens peripherally away from the measured canvas center.

#### Scenario: Pointer leaves or clicks a hovered node
- **WHEN** the pointer leaves node H, presses `pointerdown`, or starts a drag
- **THEN** the dwell timer is cancelled synchronously, node H is unpinned while any soft home anchor remains, `alphaTarget` cools to `0`, and `NodeHoverCard` closes.

### Requirement: Authoritative planar graph seed embedding and homing force
The system SHALL initialize graph simulation nodes from the authoritative normalized planar coordinate map (`PLANAR_NODE_SEEDS`), scaled to container dimensions $(width, height)$ via $(x = \text{seed}.x \times width, y = \text{seed}.y \times height)$, across the 13 undirected graph links derived from shared tags in `projects.ts`.

The system SHALL guarantee that:
1. **Initial Mount Layout**: Node coordinates scaled to any positive canvas dimensions ($width > 0, height > 0$) have strictly 0 segment crossings across all 13 links.
2. **Reduced-Motion Layout**: The static layout renders directly from these scaled planar seeds with 0 edge crossings.
3. **Unperturbed Resting State**: Before any user drag, weak homing forces (`seedX`/`seedY` with `strength: 0.02`) maintain 0 edge crossings on both desktop (1440×900) and mobile (393×852) viewports.
4. **Soft User Placement, Resize Scaling & Layout Reset**: When a user drags and releases a node, its final position becomes a soft `(homeX, homeY)` anchor and d3's hard `fx/fy` pin is cleared. An alpha-independent damped spring settles the node toward that home without freezing the simulation. On viewport `resize(nw, nh)`, home anchors SHALL scale proportionally (`homeX * (nw / prevWidth)`, `homeY * (nh / prevHeight)`) and clamp within `[BOUNDARY_MARGIN, dim - BOUNDARY_MARGIN]`. Activating `"Reset layout"` clears all soft homes, restores all detached permanent edges, and re-heats `seedX`/`seedY` homing to return the graph to its planar equilibrium.
5. **Ambient-Offset Planarity**: Applying the maximum visual ambient offset (`3.5px` per node, deterministic phases) to the scaled planar seeds SHALL preserve zero segment crossings on desktop (`1440×900`) and mobile (`393×852`) viewports.

#### Scenario: Canvas graph initializes on first load
- **WHEN** the 2D canvas mounts with dynamic physics enabled on any viewport (e.g. 1440x900 desktop or 393x852 mobile)
- **THEN** simulation nodes initialize at the scaled planar seed positions with zero edge crossings between any of the 13 connection links.

#### Scenario: User drags and places a node
- **WHEN** the user drags a node to a new position and releases the pointer
- **THEN** the node settles softly toward its user-placed home while d3's `fx/fy` remains `null`, and non-dragged neighbors remain within `< 15px` displacement during the drag without neighbor `fx/fy` pins.

#### Scenario: User activates Reset layout
- **WHEN** the user clicks `"Reset layout"` in the 3-dot dropdown menu
- **THEN** all soft home anchors are cleared, any detached permanent edges recover, and `seedX`/`seedY` homing restores the planar resting equilibrium.

#### Scenario: Maximum ambient drift remains planar
- **WHEN** every node is displaced by its maximum deterministic ambient drift offset on desktop or mobile
- **THEN** the 13 permanent edges still have zero proper crossings.

### Requirement: Bilateral tangent-continuous fluid bridge geometry
The system SHALL construct connection bridges between nodes using pure bilateral geometry across the center-to-center axis:
- Handle-first fillets: the cubic handle length is `HANDLE_GAP_RATIO * gap` scaled down by hub angular crowding to `min(R_A, R_B) * tan(MAX_SPREAD_ANGLE)` (`MAX_SPREAD_ANGLE = Math.PI / 6.2`). The old fixed `HANDLE_RADIUS_RATIO` cap is removed.
- Perimeter spread and rest waist: per-endpoint spread angles `theta_i = atan(alpha * handle / R_i)`, capped by `MAX_SPREAD_ANGLE`, are solved by monotone bisection for the target ratio `REST_WAIST_RATIO = 0.58` at rest, smoothstepping toward zero at `d_snap(e) = 1.6 * L_rest(e)`.
- C1 control-point guard: the solve clamps `alpha >= 1`, equivalently `handle <= R_i * tan(theta_i)`, so all four control-point normal offsets remain `>= 0` and the curves never cross the centerline. When the clamp wins at long gaps or hubs the waist is narrower than the `0.58` target but remains genuinely concave with `waistWidth < 2 * averageHalf`.
- Sag is injected as a signed handle extension and clamped so it cannot push a control point across the centerline.
- Control points leave circle circumferences along exact circle tangent rays, guaranteeing true $C^1$ tangent continuity at both circle boundaries and exact bilateral reflection across $\vec{u}$.
- Axis-aligned gradient blending: bridges between nodes of differing colors (e.g., visited/active cobalt `#003399` and unvisited black `#000000`) SHALL interpolate smoothly along the bridge axis via `createLinearGradient(a.x, a.y, b.x, b.y)`.
- Close-node guard: when center distance $d \le R_A + R_B$, bridge calculation returns `null` and rendering is bypassed.

#### Scenario: Rendering bridge between adjacent nodes at rest
- **WHEN** the canvas draws a connection between two nodes at equilibrium distance ($d \approx L_{rest}(e)$)
- **THEN** the bridge renders with bilaterally symmetric concave hourglass curves (`waistWidth < 2 * averageHalf`), all four control-point normal offsets `>= 0`, smooth $C^1$ tangent continuity, and smooth axis-aligned color gradient blending when endpoint colors differ.

### Requirement: Drag-time meniscus snapping and elastic tether recovery
The system SHALL manage bridge severance and recovery as follows:
- Each edge $e$ defines an authoritative rest distance $L_{rest}(e)$ equal to the Euclidean distance between its scaled planar seeds.
- When center distance exceeds `SNAP_MULTIPLIER` (`1.6`) $\times L_{rest}(e)$ during drag, the bridge detaches (`isDetached = true`) and records a render-clock `detachedAt` timestamp, while topological edges remain intact in the model.
- Recoil is render-clock driven: `p = 1 - easeOutCubic((performance.now() - detachedAt) / 220)` draws retracting teardrop tips anchored to the live endpoint positions, independent of whether d3 alpha has cooled.
- Upon pointer release (`dragEnd`), a `350ms` render-clock `reconnectCooldownUntil` prevents immediate visual pop-back; once the timestamp passes and distance drops to or below `RECONNECT_MULTIPLIER` (`1.25`) $\times L_{rest}(e)$ (or when `"Reset layout"` is invoked), the bridge smoothly reforms with a damped oscillation ripple.

#### Scenario: User drags a node beyond 1.6x snapping distance
- **WHEN** a user drags a node until center distance exceeds $1.6 \times L_{rest}(e)$
- **THEN** the bridge detaches visually with a `220ms` retracting droplet recoil animation while rubber-band resistance cushions outward movement and non-dragged neighbors displace `< 15px`.

#### Scenario: Reconnection respects 350ms post-release cooldown
- **WHEN** a detached bridge returns within $1.25 \times L_{rest}(e)$ before `350ms` has elapsed since `dragEnd`
- **THEN** reconnection waits until the `350ms` cooldown expires before reforming the visual bridge.

## ADDED Requirements

### Requirement: Proximity-only visual webbing for non-edge pairs
The system SHALL render transient proximity-only bridges exclusively between node pairs that do NOT share a permanent edge, using `computeBridgeGeometry` when $R_A + R_B < d < \text{PROXIMITY\_MAX\_DIST}$ (`96px`), fading in with a smoothstep over $[R_A + R_B, R_A + R_B + 12]$ px and tapering to zero alpha at `PROXIMITY_MAX_DIST`, exerting zero `d3-force` attraction or repulsion, and drawing underneath permanent bridges and nodes in deterministic sorted-pair order.

#### Scenario: Non-edge nodes approach within proximity band
- **WHEN** two non-linked nodes move within `96px` (and $> R_A + R_B$) center-to-center
- **THEN** a zero-force proximity bridge renders beneath permanent bridges and nodes using the same $C^1$ hourglass curve language.

#### Scenario: Detached permanent edge enters proximity band
- **WHEN** a detached permanent edge pair moves within `96px` during cooldown or above `1.25x` reconnect distance
- **THEN** no proximity bridge is drawn for that pair, preserving the snap cue until permanent-edge reconnection occurs.

### Requirement: Measured peripheral hover card placement
The system SHALL position `NodeHoverCard` using measured card bounds (`ResizeObserver`) projected outward from the measured canvas-container center (`getBoundingClientRect()`), not the window center, along `(nodeScreenPos - canvasCenter)`, and clamped to viewport + safe-area margins (`20px`), with an inward fallback only when the outward quadrant clips on narrow viewports (`393x852`).

#### Scenario: Hover card opens on desktop or mobile
- **WHEN** `NodeHoverCard` opens for a node after the `200ms` dwell
- **THEN** the card anchors peripherally outside the central graph cluster without overflowing viewport bounds.

## REMOVED Requirements

### Requirement: Canvas initial write-in animation
**Reason**: Decorative guide rings were removed in favor of flat circular primitives (`r = 22px`).
**Migration**: Nodes paint immediately in their resting state without circumferential ring animations.
