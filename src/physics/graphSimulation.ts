import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  type Simulation,
  type SimulationLinkDatum,
} from 'd3-force';
import type { GraphNode } from '../types/portfolio';
import {
  bridgeOscillatorAmplitude,
  createBridgeOscillatorState,
  isBridgeOscillatorAtRest,
  stepBridgeOscillator,
  type BridgeOscillatorState,
} from '../utils/bridgeOscillator';
import { PLANAR_NODE_SEEDS, scaleSeedPoint } from '../data/graphSeeds';

export type SimState = 'idle' | 'hover' | 'drag' | 'coasting';

/** Input node shape accepted by the headless simulation. */
export interface SimulationNode {
  id: string;
  /** Human-readable canvas label; defaults to the id when omitted. */
  label?: string;
}

export interface SimulationOptions {
  nodes: SimulationNode[];
  links: { source: string; target: string; tags?: string[] }[];
  width: number;
  height: number;
  /** Optional deterministic seed positions keyed by node id. */
  initialPositions?: Record<string, [number, number]>;
  /** Optional normalized planar seeds, scaled to the viewport on create/resize. */
  seeds?: Record<string, { x: number; y: number }>;
  radius?: number;
}

/** Per-edge state used by the bridge renderer and drag snapping. */
export interface BridgeLinkState {
  source: string;
  target: string;
  sharedTagCount: number;
  /** Authoritative rest distance from the scaled planar seeds. */
  restDistance: number;
  /** True while the user has stretched this bridge past the snap threshold. */
  isDetached: boolean;
  /** Render-clock timestamp of the snap, or null when the bridge is attached. */
  detachedAt: number | null;
  /** Render-clock timestamp before which reconnection is blocked. */
  reconnectCooldownUntil: number;
  oscillator: BridgeOscillatorState;
  previousDistance: number;
  previousVelocity: number;
}

export interface GraphSimulation {
  sim: Simulation<GraphNode, undefined>;
  nodes: GraphNode[];
  links: SimulationLinkDatum<GraphNode>[];
  linkStates: BridgeLinkState[];
  state: SimState;
  hovered: GraphNode | null;
  isIdle: boolean;
  tick(): void;
  poll(): void;
  resize(width: number, height: number): void;
  hover(node: GraphNode | null): void;
  dragStart(node: GraphNode): void;
  dragMove(x: number, y: number): void;
  /**
   * Release an active drag. `cancel: true` abandons the gesture: no fling
   * velocity is applied and no new home anchor is committed, so the node
   * springs back to its previous resting position.
   */
  dragEnd(options?: { cancel?: boolean }): void;
  /** Clear user pins and detached flags, then restore the planar seeds. */
  resetLayout(): void;
  findNode(id: string): GraphNode | undefined;
  findLink(source: string, target: string): BridgeLinkState | undefined;
  restDistance(source: string, target: string): number;
  destroy(): void;
}

const NODE_RADIUS = 22;
const BOUNDARY_MARGIN = 48;
const COLLIDE_RADIUS = 48;
const LINK_DISTANCE = 180;
const LINK_STRENGTH = 0.015;
/** Weak homing keeps the graph in its planar basin without pinning nodes. */
const SEED_STRENGTH = 0.02;
const CHARGE_SCALE = 0.3;
const MAX_FLING = 15;
const VELOCITY_DECAY_IDLE = 0.4;
const VELOCITY_DECAY_COAST = 0.18;
const COAST_RESTORE_SPEED = 0.5;
const TICK_MS = 1000 / 60;
/** Stretch past this multiple of the rest distance severs the visual bridge. */
export const SNAP_MULTIPLIER = 1.6;
/** A released bridge reforms once the nodes return within this multiple. */
export const RECONNECT_MULTIPLIER = 1.25;
/** Retracting droplet recoil duration after a snap, in milliseconds. */
export const RECOIL_MS = 220;
/** Post-release window before a detached permanent edge may reform. */
export const RECONNECT_COOLDOWN_MS = 350;
/** Deterministic visual ambient drift amplitude, in pixels. */
export const AMBIENT_DRIFT_AMPLITUDE = 3.5;
/** Alpha-independent home-anchor spring stiffness. */
const HOME_SPRING_STIFFNESS = 0.02;
/** Velocity damping applied alongside the home spring. */
const HOME_SPRING_DAMPING = 0.18;
/** Viscous pointer lag time constant for the dragged node, in milliseconds. */
const DRAG_LAG_MS = 45;
/** Collision radius multiplier while a node is actively dragged. */
const DRAG_COLLIDE_SCALE = 0.4;
/** Excitation injected when a detached bridge reforms. */
const RECONNECT_RIPPLE_EXCITATION = 900;
/**
 * Oscillator excitation scale: distance acceleration -> bridge displacement.
 * Tuned against the 60Hz moderate/extreme fling profiles in
 * graphSimulation.test.ts: scale 0.04 plus a ±2000 excitation clamp yields
 * ~1.8px peak sag on a 120px/150ms fling and ~2.3px on a 260px/60ms fling.
 */
const EXCITATION_SCALE = 0.04;
const MAX_EXCITATION = 2000;

/** Clamp distance acceleration into the oscillator's displacement input. */
export function bridgeExcitation(accelerationPxPerS2: number): number {
  return Math.max(
    -MAX_EXCITATION,
    Math.min(MAX_EXCITATION, accelerationPxPerS2 * EXCITATION_SCALE),
  );
}

/**
 * Deterministic, purely visual ambient breathing offset. Every node gets a
 * stable phase derived from its id; the offset magnitude never exceeds
 * `amplitude`. Rendering and hit testing consume the same value so pointer
 * targets stay aligned with the painted circles.
 */
export function ambientDriftOffset(
  id: string,
  timeMs: number,
  amplitude = AMBIENT_DRIFT_AMPLITUDE,
): { x: number; y: number } {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const phase = ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
  const angle = timeMs * 0.001 + phase;
  return {
    x: amplitude * Math.cos(angle),
    y: amplitude * Math.sin(angle),
  };
}

function chargeStrength(width: number, height: number): number {
  return -Math.min(width, height) * CHARGE_SCALE;
}

function createBoundaryForce(
  width: number,
  height: number,
  margin: number,
  nodes: GraphNode[],
): (alpha: number) => void {
  return (alpha: number) => {
    const k = 0.1 * alpha;
    for (const n of nodes) {
      if (n.x < margin) n.vx = (n.vx ?? 0) + (margin - n.x) * k;
      else if (n.x > width - margin) n.vx = (n.vx ?? 0) - (n.x - (width - margin)) * k;
      if (n.y < margin) n.vy = (n.vy ?? 0) + (margin - n.y) * k;
      else if (n.y > height - margin) n.vy = (n.vy ?? 0) - (n.y - (height - margin)) * k;
    }
  };
}

/**
 * Rubber-band displacement. Pulling `target` away from `anchor` is cushioned so
 * displacement asymptotes to the tether radius instead of running off-canvas:
 *   P = anchor + delta / sqrt(1 + (|delta| / R)^2)
 */
export function rubberBandDisplacement(
  anchor: { x: number; y: number },
  target: { x: number; y: number },
  tetherRadius: number,
): { x: number; y: number } {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.0001) return { x: anchor.x, y: anchor.y };
  const radius = Math.max(1, tetherRadius);
  const scale = 1 / Math.sqrt(1 + (distance / radius) ** 2);
  return { x: anchor.x + dx * scale, y: anchor.y + dy * scale };
}

export function createSimulation(opts: SimulationOptions): GraphSimulation {
  const { width, height, radius = NODE_RADIUS } = opts;
  const initialRadius = Math.min(width, height) * 0.28;

  // Homing targets: normalized seeds scaled to the viewport. Nodes without a
  // seed keep their explicit initial position (or canvas center as a fallback),
  // which preserves the deterministic ring used by headless physics tests.
  const targets = new Map<string, [number, number]>();
  const recomputeTargets = (w: number, h: number) => {
    for (const node of opts.nodes) {
      const seed = opts.seeds?.[node.id];
      if (seed) {
        targets.set(node.id, scaleSeedPoint(seed, w, h, BOUNDARY_MARGIN));
        continue;
      }
      const explicit = opts.initialPositions?.[node.id];
      if (explicit) targets.set(node.id, explicit);
      else targets.set(node.id, [w / 2, h / 2]);
    }
  };
  recomputeTargets(width, height);

  const nodes: GraphNode[] = opts.nodes.map((n, i) => {
    const seed = opts.seeds?.[n.id]
      ? targets.get(n.id)
      : opts.initialPositions?.[n.id];
    let x: number;
    let y: number;
    if (seed) {
      x = seed[0];
      y = seed[1];
    } else {
      const angle = (i / opts.nodes.length) * Math.PI * 2;
      x = width / 2 + initialRadius * Math.cos(angle);
      y = height / 2 + initialRadius * Math.sin(angle);
    }
    return {
      id: n.id,
      label: n.label ?? n.id,
      radius,
      x,
      y,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    };
  });

  const links: SimulationLinkDatum<GraphNode>[] = opts.links.map((l) => ({ ...l }));

  const seeds = opts.seeds ?? PLANAR_NODE_SEEDS;
  /** Soft user-placement anchors; no hard fx/fy locks survive a release. */
  const homeAnchors = new Map<string, { x: number; y: number }>();
  let previousWidth = width;
  let previousHeight = height;
  let chargeScale = chargeStrength(width, height);

  const restDistances = new Map<string, number>();
  const linkKey = (a: string, b: string) => [a, b].sort().join('\u0000');
  const recomputeRestDistances = (w: number, h: number) => {
    restDistances.clear();
    for (const link of opts.links) {
      // Seed distances use the same safe-canvas affine transform as homing
      // targets so rest lengths match the boundary-safe planar layout.
      const a = seeds[link.source];
      const b = seeds[link.target];
      let scaled = LINK_DISTANCE;
      if (a && b) {
        const [ax, ay] = scaleSeedPoint(a, w, h, BOUNDARY_MARGIN);
        const [bx, by] = scaleSeedPoint(b, w, h, BOUNDARY_MARGIN);
        scaled = Math.hypot(ax - bx, ay - by);
      }
      restDistances.set(linkKey(link.source, link.target), Math.max(1, scaled));
    }
  };
  recomputeRestDistances(width, height);

  const linkStates: BridgeLinkState[] = opts.links.map((link) => {
    const shared = link.tags?.length ?? 1;
    return {
      source: link.source,
      target: link.target,
      sharedTagCount: Math.max(1, shared),
      restDistance: restDistances.get(linkKey(link.source, link.target)) ?? LINK_DISTANCE,
      isDetached: false,
      detachedAt: null,
      reconnectCooldownUntil: 0,
      oscillator: createBridgeOscillatorState(),
      previousDistance: 0,
      previousVelocity: 0,
    };
  });

  // Custom weak homing forces. Two explicit axes keep the planar basin of
  // attraction while allowing drag and fling gestures to move a node.
  const seedForceX = (alpha: number): void => {
    const k = SEED_STRENGTH * alpha;
    for (const node of nodes) {
      const target = targets.get(node.id);
      if (target) node.vx = (node.vx ?? 0) + (target[0] - node.x) * k;
    }
  };
  const seedForceY = (alpha: number): void => {
    const k = SEED_STRENGTH * alpha;
    for (const node of nodes) {
      const target = targets.get(node.id);
      if (target) node.vy = (node.vy ?? 0) + (target[1] - node.y) * k;
    }
  };

  const linkForce = forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(links)
    .id((d) => d.id)
    .distance((link) => {
      const s = (link.source as GraphNode).id ?? (link.source as unknown as string);
      const t = (link.target as GraphNode).id ?? (link.target as unknown as string);
      return restDistances.get(linkKey(String(s), String(t))) ?? LINK_DISTANCE;
    })
    .strength(LINK_STRENGTH);

  let state: SimState = 'idle';
  let hoveredNode: GraphNode | null = null;
  let dragNode: GraphNode | null = null;
  let coastingNode: GraphNode | null = null;
  let dragAnchor = { x: 0, y: 0 };
  let dragTarget: { x: number; y: number } | null = null;
  // The diagonal tether lets every planarity-preserving edge reach its 1.6x
  // snap radius even on the 393x852 mobile viewport.
  let tetherRadius = Math.max(120, Math.hypot(width, height) * 0.75);
  const dragSamples: { x: number; y: number; t: number }[] = [];

  /** The dragged node neither emits charge nor collides at full radius. */
  const chargeForNode = (node: GraphNode): number =>
    node === dragNode ? 0 : chargeScale;
  const collideRadiusForNode = (node: GraphNode): number =>
    node === dragNode ? radius * DRAG_COLLIDE_SCALE : COLLIDE_RADIUS;

  const chargeForce = forceManyBody<GraphNode>()
    .strength(chargeForNode)
    .distanceMin(50);
  const collideForce = forceCollide<GraphNode>().radius(collideRadiusForNode);

  /**
   * Alpha-independent damped home spring. Released nodes keep drifting back to
   * their user-chosen anchor without hard fx/fy locks, even as d3 alpha decays.
   */
  const homeForce = (): void => {
    for (const node of nodes) {
      const home = homeAnchors.get(node.id);
      if (!home) continue;
      node.vx =
        (node.vx ?? 0) +
        (home.x - node.x) * HOME_SPRING_STIFFNESS -
        (node.vx ?? 0) * HOME_SPRING_DAMPING;
      node.vy =
        (node.vy ?? 0) +
        (home.y - node.y) * HOME_SPRING_STIFFNESS -
        (node.vy ?? 0) * HOME_SPRING_DAMPING;
    }
  };

  const sim = forceSimulation<GraphNode>(nodes)
    .force('charge', chargeForce)
    .force('link', linkForce)
    .force('collide', collideForce)
    .force('seedX', seedForceX)
    .force('seedY', seedForceY)
    .force('home', homeForce)
    .stop();

  sim.force('boundary', createBoundaryForce(width, height, BOUNDARY_MARGIN, nodes));

  const nodeById = (id: string): GraphNode | undefined => nodes.find((n) => n.id === id);

  /**
   * d3-force caches per-link strengths when `.strength(fn)` is assigned. Re-run
   * the assignment on every drag boundary so the zero-strength drag links take
   * effect synchronously instead of reading a stale cached array.
   */
  const refreshLinkStrength = (): void => {
    linkForce.strength((link) => {
      if (state !== 'drag' || !dragNode) return LINK_STRENGTH;
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;
      return source === dragNode || target === dragNode ? 0 : LINK_STRENGTH;
    });
  };

  /** Re-evaluate d3's cached charge/collision copies after drag transitions. */
  const refreshDragIsolation = (): void => {
    chargeForce.strength(chargeForNode);
    collideForce.radius(collideRadiusForNode);
  };

  /** Current center distance for a link, using live node positions. */
  const linkDistance = (link: BridgeLinkState): number => {
    const a = nodeById(link.source);
    const b = nodeById(link.target);
    if (!a || !b) return 0;
    const ax = a === dragNode && a.fx != null ? a.fx : a.x;
    const ay = a === dragNode && a.fy != null ? a.fy : a.y;
    const bx = b === dragNode && b.fx != null ? b.fx : b.x;
    const by = b === dragNode && b.fy != null ? b.fy : b.y;
    return Math.hypot(ax - bx, ay - by);
  };

  const updateLinkTopology = (): void => {
    const now = performance.now();
    for (const link of linkStates) {
      const distance = linkDistance(link);
      // Visual severance is only possible while dragging. After release, the
      // 350ms render-clock cooldown and the 1.25x reconnect radius govern
      // recovery, independent of whether d3 alpha has cooled.
      if (state === 'drag') {
        if (distance > SNAP_MULTIPLIER * link.restDistance) {
          if (!link.isDetached) {
            link.isDetached = true;
            link.detachedAt = now;
            link.reconnectCooldownUntil = 0;
          }
        } else if (distance <= RECONNECT_MULTIPLIER * link.restDistance) {
          if (link.isDetached) {
            link.isDetached = false;
            link.detachedAt = null;
            link.previousDistance = 0;
            link.previousVelocity = 0;
            stepBridgeOscillator(link.oscillator, TICK_MS, RECONNECT_RIPPLE_EXCITATION);
          }
        }
      } else if (
        link.isDetached &&
        now >= link.reconnectCooldownUntil &&
        distance <= RECONNECT_MULTIPLIER * link.restDistance
      ) {
        link.isDetached = false;
        link.detachedAt = null;
        link.previousDistance = 0;
        link.previousVelocity = 0;
        stepBridgeOscillator(link.oscillator, TICK_MS, RECONNECT_RIPPLE_EXCITATION);
      }
    }
  };

  const stepLinkOscillators = (dtMs: number): void => {
    // A real frame delta is clamped to the oscillator's supported range. A gap
    // longer than 100ms (idle suspend, background tab) re-primes the derivative
    // instead of injecting a fictitious impulse.
    const clampedMs = Math.max(1, Math.min(32, dtMs));
    const dtSeconds = clampedMs / 1000;
    const reprime = dtMs > 100;
    for (const link of linkStates) {
      const distance = linkDistance(link);
      if (link.previousDistance === 0 || reprime) {
        // Prime on the first sample so a cold start never looks like a jump
        // from zero to the current edge length.
        link.previousDistance = distance;
        link.previousVelocity = 0;
        if (reprime) stepBridgeOscillator(link.oscillator, clampedMs, 0);
        continue;
      }
      const velocity = (distance - link.previousDistance) / dtSeconds;
      const acceleration = (velocity - link.previousVelocity) / dtSeconds;
      stepBridgeOscillator(link.oscillator, clampedMs, bridgeExcitation(acceleration));
      link.previousDistance = distance;
      link.previousVelocity = velocity;
    }
  };

  const afterTick = (dtMs: number): void => {
    if (state === 'drag' && dragNode && dragTarget) {
      const clampedDt = Math.max(
        1,
        Math.min(32, Number.isFinite(dtMs) ? dtMs : TICK_MS),
      );
      const lag = 1 - Math.exp(-clampedDt / DRAG_LAG_MS);
      const currentX = dragNode.fx ?? dragNode.x;
      const currentY = dragNode.fy ?? dragNode.y;
      dragNode.fx = currentX + (dragTarget.x - currentX) * lag;
      dragNode.fy = currentY + (dragTarget.y - currentY) * lag;
    }
    updateLinkTopology();
    stepLinkOscillators(dtMs);
  };

  let lastTickAt: number | null = null;
  sim.on('tick.links', () => {
    const now = performance.now();
    const dtMs = lastTickAt === null ? 0 : now - lastTickAt;
    lastTickAt = now;
    if (dtMs > 0) afterTick(dtMs);
    else updateLinkTopology();
  });

  function poll(): void {
    if (state === 'coasting' && coastingNode) {
      const speed = Math.hypot(coastingNode.vx ?? 0, coastingNode.vy ?? 0);
      if (speed < COAST_RESTORE_SPEED) {
        sim.velocityDecay(VELOCITY_DECAY_IDLE);
        coastingNode = null;
        state = 'idle';
      }
    }
  }

  function tick(): void {
    sim.tick();
    afterTick(TICK_MS);
    poll();
  }

  function hover(node: GraphNode | null): void {
    if (state === 'drag' || state === 'coasting') return;
    if (!node) {
      if (state === 'hover' && hoveredNode) {
        hoveredNode.fx = null;
        hoveredNode.fy = null;
        hoveredNode = null;
        sim.alphaTarget(0);
        state = 'idle';
      }
      return;
    }
    // Re-hovering the already-pinned node is a no-op; without this guard every
    // pointermove re-pins the node and re-heats the simulation.
    if (hoveredNode === node) return;
    // Unpin the previous node before pinning the new one, otherwise its fx/fy
    // stay set and it remains frozen after the pointer moves away. Soft home
    // anchors (not hover state) preserve user-placed positions.
    if (hoveredNode) {
      hoveredNode.fx = null;
      hoveredNode.fy = null;
    }
    hoveredNode = node;
    node.fx = node.x;
    node.fy = node.y;
    state = 'hover';
    sim.alphaTarget(0.15);
    sim.alpha(0.3).restart();
  }

  function dragStart(node: GraphNode): void {
    if (hoveredNode) {
      hoveredNode.fx = null;
      hoveredNode.fy = null;
    }
    hoveredNode = null;
    dragNode = node;
    node.fx = node.x;
    node.fy = node.y;
    dragAnchor = { x: node.x, y: node.y };
    dragTarget = { x: node.x, y: node.y };
    dragSamples.length = 0;
    dragSamples.push({ x: node.x, y: node.y, t: performance.now() });
    state = 'drag';
    // Zero the link spring and isolate this node's charge/collision footprint
    // so neighbors follow through by less than 12px without being frozen.
    refreshLinkStrength();
    refreshDragIsolation();
    sim.alphaTarget(0.2).restart();
  }

  function dragMove(x: number, y: number): void {
    if (state !== 'drag' || !dragNode) return;
    dragTarget = rubberBandDisplacement(dragAnchor, { x, y }, tetherRadius);
    dragSamples.push({ x: dragTarget.x, y: dragTarget.y, t: performance.now() });
    if (dragSamples.length > 3) dragSamples.shift();
  }

  function dragEnd(options?: { cancel?: boolean }): void {
    if (state !== 'drag' || !dragNode) return;
    const node = dragNode;

    if (options?.cancel) {
      // OS gesture interruption: drop the hard pin without committing the
      // dragged coordinate as the new home. Seed the home spring from the
      // pre-drag anchor for nodes that have never been placed, so a canceled
      // first drag still returns to where it started.
      if (!homeAnchors.has(node.id) && dragAnchor) {
        homeAnchors.set(node.id, { x: dragAnchor.x, y: dragAnchor.y });
      }
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;

      coastingNode = null;
      dragNode = null;
      dragTarget = null;
      dragSamples.length = 0;
      state = 'idle';
      refreshLinkStrength();
      refreshDragIsolation();
      sim.velocityDecay(VELOCITY_DECAY_IDLE);
      sim.alphaTarget(0);
      sim.alpha(0.2).restart();
      updateLinkTopology();
      return;
    }

    // Commit the last dragged coordinate before releasing the hard pin.
    const releaseX = node.fx;
    const releaseY = node.fy;
    if (releaseX != null) node.x = releaseX;
    if (releaseY != null) node.y = releaseY;
    node.fx = null;
    node.fy = null;
    if (releaseX != null && releaseY != null) {
      homeAnchors.set(node.id, { x: releaseX, y: releaseY });
    }

    const len = dragSamples.length;
    if (len >= 2) {
      const a = dragSamples[Math.max(0, len - 3)];
      const b = dragSamples[len - 1];
      const dtSec = (b.t - a.t) / 1000;
      const pxPerMsX = dtSec > 0 ? (b.x - a.x) / dtSec : 0;
      const pxPerMsY = dtSec > 0 ? (b.y - a.y) / dtSec : 0;
      let vx = pxPerMsX / 60;
      let vy = pxPerMsY / 60;
      const mag = Math.hypot(vx, vy);
      if (mag > MAX_FLING) {
        vx = (vx / mag) * MAX_FLING;
        vy = (vy / mag) * MAX_FLING;
      }
      node.vx = vx;
      node.vy = vy;
    }

    coastingNode = node;
    dragNode = null;
    dragTarget = null;
    dragSamples.length = 0;
    state = 'coasting';
    const releasedAt = performance.now();
    for (const link of linkStates) {
      if (link.isDetached) {
        link.reconnectCooldownUntil = releasedAt + RECONNECT_COOLDOWN_MS;
      }
    }
    // Restore full link strength and the normal charge/collision footprint.
    refreshLinkStrength();
    refreshDragIsolation();
    sim.velocityDecay(VELOCITY_DECAY_COAST);
    sim.alphaTarget(0);
    sim.alpha(0.3).restart();
    // The cooldown gates any immediate reconnect; once it expires the
    // tick.links listener reforms the bridge when the node is back in range.
    updateLinkTopology();
  }

  function resize(nw: number, nh: number): void {
    const scaleX = previousWidth > 0 ? nw / previousWidth : 1;
    const scaleY = previousHeight > 0 ? nh / previousHeight : 1;
    const clampAxis = (value: number, max: number) =>
      Math.min(Math.max(value, BOUNDARY_MARGIN), Math.max(BOUNDARY_MARGIN, max - BOUNDARY_MARGIN));
    for (const node of nodes) {
      if (node.fx != null) {
        node.fx = clampAxis(node.fx * scaleX, nw);
        node.x = node.fx;
      }
      if (node.fy != null) {
        node.fy = clampAxis(node.fy * scaleY, nh);
        node.y = node.fy;
      }
      const home = homeAnchors.get(node.id);
      if (home) {
        homeAnchors.set(node.id, {
          x: clampAxis(home.x * scaleX, nw),
          y: clampAxis(home.y * scaleY, nh),
        });
      }
    }
    previousWidth = nw;
    previousHeight = nh;
    recomputeTargets(nw, nh);
    recomputeRestDistances(nw, nh);
    for (const link of linkStates) {
      link.restDistance = restDistances.get(linkKey(link.source, link.target)) ?? LINK_DISTANCE;
    }
    tetherRadius = Math.max(120, Math.hypot(nw, nh) * 0.75);
    chargeScale = chargeStrength(nw, nh);
    chargeForce.strength(chargeForNode);
    sim.force('boundary', createBoundaryForce(nw, nh, BOUNDARY_MARGIN, nodes));
    sim.alpha(0.2).restart();
  }

  function resetLayout(): void {
    homeAnchors.clear();
    hoveredNode = null;
    dragNode = null;
    coastingNode = null;
    dragTarget = null;
    state = 'idle';
    for (const node of nodes) {
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;
      const target = targets.get(node.id);
      if (target) {
        node.x = target[0];
        node.y = target[1];
      }
    }
    for (const link of linkStates) {
      link.isDetached = false;
      link.detachedAt = null;
      link.reconnectCooldownUntil = 0;
      link.previousDistance = 0;
      link.previousVelocity = 0;
    }
    refreshLinkStrength();
    refreshDragIsolation();
    sim.velocityDecay(VELOCITY_DECAY_IDLE);
    sim.alphaTarget(0);
    sim.alpha(0.4).restart();
    updateLinkTopology();
  }

  const isIdle = (): boolean => {
    if (state !== 'idle') return false;
    if (sim.alpha() > 0.01) return false;
    for (const node of nodes) {
      if (Math.hypot(node.vx ?? 0, node.vy ?? 0) >= 0.01) return false;
    }
    for (const link of linkStates) {
      if (bridgeOscillatorAmplitude(link.oscillator) >= 0.1) return false;
      if (!isBridgeOscillatorAtRest(link.oscillator)) return false;
    }
    return true;
  };

  return {
    sim,
    nodes,
    links,
    linkStates,
    get state() {
      return state;
    },
    get hovered() {
      return hoveredNode;
    },
    get isIdle() {
      return isIdle();
    },
    tick,
    poll,
    resize,
    hover,
    dragStart,
    dragMove,
    dragEnd,
    resetLayout,
    findNode: (id) => nodes.find((n) => n.id === id),
    findLink: (source, target) => {
      const key = linkKey(source, target);
      return linkStates.find((l) => linkKey(l.source, l.target) === key);
    },
    restDistance: (source, target) =>
      restDistances.get(linkKey(source, target)) ?? LINK_DISTANCE,
    destroy: () => {
      sim.stop();
      sim.on('tick', null);
      sim.on('tick.links', null);
      sim.on('end', null);
    },
  };
}
