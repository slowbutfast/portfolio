import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  type Simulation,
  type SimulationLinkDatum,
  type ForceManyBody,
} from 'd3-force';
import type { GraphNode } from '../types/portfolio';
import {
  bridgeOscillatorAmplitude,
  createBridgeOscillatorState,
  isBridgeOscillatorAtRest,
  stepBridgeOscillator,
  type BridgeOscillatorState,
} from '../utils/bridgeOscillator';
import { PLANAR_NODE_SEEDS } from '../data/graphSeeds';

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
  /** Retracting droplet progress after a snap (`1 -> 0` over `RECOIL_MS`). */
  recoilProgress: number;
  /** Simulation-clock timestamp before which reconnection is blocked. */
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
  dragEnd(): void;
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
/** Soft radial exclusion zone for the ambient hover drift, in pixels. */
export const HOVER_EXCLUSION_RADIUS = 110;
/** Peak hover-drift acceleration outside the exclusion zone. */
export const HOVER_DRIFT_STRENGTH = 0.025;
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
 * Slow ambient hover drift. Neighbors inside the `HOVER_EXCLUSION_RADIUS`
 * receive no force; outside it, the outward acceleration ramps linearly from
 * zero to `HOVER_DRIFT_STRENGTH` over another exclusion radius.
 */
export function hoverDriftAcceleration(distance: number, alpha: number): number {
  if (distance <= HOVER_EXCLUSION_RADIUS) return 0;
  const ramp = Math.min(
    1,
    (distance - HOVER_EXCLUSION_RADIUS) / HOVER_EXCLUSION_RADIUS,
  );
  return alpha * HOVER_DRIFT_STRENGTH * ramp;
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
        targets.set(node.id, [seed.x * w, seed.y * h]);
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
  /** User placements survive hover unpinning and resize scaling. */
  const userPinnedIds = new Set<string>();
  let previousWidth = width;
  let previousHeight = height;

  const restDistances = new Map<string, number>();
  const linkKey = (a: string, b: string) => [a, b].sort().join('\u0000');
  const recomputeRestDistances = (w: number, h: number) => {
    restDistances.clear();
    for (const link of opts.links) {
      // Seed distances are normalized to a 1x1 box. Scale each axis by the
      // container size (the seed map uses an affine embedding).
      const a = seeds[link.source];
      const b = seeds[link.target];
      const scaled = a && b
        ? Math.hypot((a.x - b.x) * w, (a.y - b.y) * h)
        : LINK_DISTANCE;
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
      recoilProgress: 0,
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

  const sim = forceSimulation<GraphNode>(nodes)
    .force(
      'charge',
      forceManyBody<GraphNode>()
        .strength(chargeStrength(width, height))
        .distanceMin(50),
    )
    .force('link', linkForce)
    .force('collide', forceCollide<GraphNode>().radius(COLLIDE_RADIUS))
    .force('seedX', seedForceX)
    .force('seedY', seedForceY)
    .stop();

  let state: SimState = 'idle';
  let hoveredNode: GraphNode | null = null;
  let dragNode: GraphNode | null = null;
  let coastingNode: GraphNode | null = null;
  let dragAnchor = { x: 0, y: 0 };
  // The diagonal tether lets every planarity-preserving edge reach its 1.6x
  // snap radius even on the 393x852 mobile viewport.
  let tetherRadius = Math.max(120, Math.hypot(width, height) * 0.75);
  const dragSamples: { x: number; y: number; t: number }[] = [];
  /** Direct neighbors are held still for the duration of an active drag. */
  const dragNeighborPins = new Map<string, { fx: number | null; fy: number | null }>();
  /** Monotonic simulation clock advanced by frame deltas, not wall time. */
  let simClock = 0;

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
    for (const link of linkStates) {
      const distance = linkDistance(link);
      // Visual severance is only possible while dragging. After release, the
      // 350ms cooldown and the narrower 1.25x reconnect radius govern recovery.
      if (state === 'drag') {
        if (distance > SNAP_MULTIPLIER * link.restDistance) {
          if (!link.isDetached) {
            link.isDetached = true;
            link.recoilProgress = 1;
            link.reconnectCooldownUntil = 0;
          }
        } else if (distance <= RECONNECT_MULTIPLIER * link.restDistance) {
          link.isDetached = false;
          link.recoilProgress = 0;
        }
      } else if (
        link.isDetached &&
        simClock >= link.reconnectCooldownUntil &&
        distance <= RECONNECT_MULTIPLIER * link.restDistance
      ) {
        link.isDetached = false;
        link.recoilProgress = 0;
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
    const elapsed = Number.isFinite(dtMs) ? Math.max(0, dtMs) : 0;
    simClock += elapsed;
    updateLinkTopology();
    stepLinkOscillators(dtMs);
    for (const link of linkStates) {
      if (link.isDetached && link.recoilProgress > 0) {
        link.recoilProgress = Math.max(0, link.recoilProgress - elapsed / RECOIL_MS);
      }
    }
  };

  let lastTickAt: number | null = null;
  sim.on('tick.links', () => {
    const now = performance.now();
    const dtMs = lastTickAt === null ? 0 : now - lastTickAt;
    lastTickAt = now;
    if (dtMs > 0) afterTick(dtMs);
    else updateLinkTopology();
  });

  const hoverAttraction = (alpha: number): void => {
    if (state !== 'hover' || !hoveredNode) return;
    const h = hoveredNode;
    for (const link of links) {
      const a = link.source as GraphNode;
      const b = link.target as GraphNode;
      const other = a === h ? b : b === h ? a : null;
      if (!other) continue;
      const dx = other.x - h.x;
      const dy = other.y - h.y;
      const dist = Math.hypot(dx, dy) || 1;
      const push = hoverDriftAcceleration(dist, alpha);
      if (push === 0) continue;
      other.vx = (other.vx ?? 0) + (dx / dist) * push;
      other.vy = (other.vy ?? 0) + (dy / dist) * push;
    }
  };
  sim.force('hoverAttraction', hoverAttraction);

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
        if (!userPinnedIds.has(hoveredNode.id)) {
          hoveredNode.fx = null;
          hoveredNode.fy = null;
        }
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
    // stay set and it remains frozen after the pointer moves away. User-placed
    // anchors survive hover transitions.
    if (hoveredNode && !userPinnedIds.has(hoveredNode.id)) {
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

  const freezeDragNeighbors = (node: GraphNode): void => {
    dragNeighborPins.clear();
    for (const link of linkStates) {
      const otherId =
        link.source === node.id ? link.target : link.target === node.id ? link.source : null;
      if (!otherId || dragNeighborPins.has(otherId)) continue;
      const other = nodeById(otherId);
      if (!other) continue;
      dragNeighborPins.set(otherId, { fx: other.fx ?? null, fy: other.fy ?? null });
      other.fx = other.x;
      other.fy = other.y;
    }
  };

  const restoreDragNeighbors = (): void => {
    for (const [id, previous] of dragNeighborPins) {
      const node = nodeById(id);
      if (!node) continue;
      node.fx = previous.fx;
      node.fy = previous.fy;
    }
    dragNeighborPins.clear();
  };

  function dragStart(node: GraphNode): void {
    if (hoveredNode && !userPinnedIds.has(hoveredNode.id)) {
      hoveredNode.fx = null;
      hoveredNode.fy = null;
    }
    hoveredNode = null;
    dragNode = node;
    node.fx = node.x;
    node.fy = node.y;
    dragAnchor = { x: node.x, y: node.y };
    dragSamples.length = 0;
    dragSamples.push({ x: node.x, y: node.y, t: performance.now() });
    state = 'drag';
    // Zero the link spring on this node's edges and hold its direct neighbors
    // still so charge/collision forces cannot drag them along.
    refreshLinkStrength();
    freezeDragNeighbors(node);
    sim.alphaTarget(0.2).restart();
  }

  function dragMove(x: number, y: number): void {
    if (state !== 'drag' || !dragNode) return;
    const pinned = rubberBandDisplacement(dragAnchor, { x, y }, tetherRadius);
    dragNode.fx = pinned.x;
    dragNode.fy = pinned.y;
    dragSamples.push({ x: pinned.x, y: pinned.y, t: performance.now() });
    if (dragSamples.length > 3) dragSamples.shift();
    updateLinkTopology();
  }

  function dragEnd(): void {
    if (state !== 'drag' || !dragNode) return;
    const node = dragNode;
    // Commit the last pinned coordinate before unpinning. A pointerup can
    // arrive between physics ticks, so node.x/y may still hold the drag-start
    // position; using it would falsely reconnect a bridge on release.
    const releaseX = node.fx;
    const releaseY = node.fy;
    // Persist the user's placement. d3-force's native `fx/fy` pin keeps the
    // node exactly where it was released until resetLayout() or a resize maps
    // it proportionally.
    if (releaseX != null) {
      node.x = releaseX;
      node.fx = releaseX;
    }
    if (releaseY != null) {
      node.y = releaseY;
      node.fy = releaseY;
    }
    userPinnedIds.add(node.id);

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
    restoreDragNeighbors();
    dragSamples.length = 0;
    state = 'coasting';
    for (const link of linkStates) {
      if (link.isDetached) {
        link.reconnectCooldownUntil = simClock + RECONNECT_COOLDOWN_MS;
      }
    }
    // Restore full spring strength on every edge now that the drag is over.
    refreshLinkStrength();
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
    }
    previousWidth = nw;
    previousHeight = nh;
    recomputeTargets(nw, nh);
    recomputeRestDistances(nw, nh);
    for (const link of linkStates) {
      link.restDistance = restDistances.get(linkKey(link.source, link.target)) ?? LINK_DISTANCE;
    }
    tetherRadius = Math.max(120, Math.hypot(nw, nh) * 0.75);
    (sim.force('charge') as ForceManyBody<GraphNode> | undefined)?.strength(
      chargeStrength(nw, nh),
    );
    sim.force('boundary', createBoundaryForce(nw, nh, BOUNDARY_MARGIN, nodes));
    sim.alpha(0.2).restart();
  }

  function resetLayout(): void {
    userPinnedIds.clear();
    hoveredNode = null;
    dragNode = null;
    coastingNode = null;
    dragNeighborPins.clear();
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
      link.recoilProgress = 0;
      link.reconnectCooldownUntil = 0;
      link.previousDistance = 0;
      link.previousVelocity = 0;
    }
    refreshLinkStrength();
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
