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
export const SNAP_MULTIPLIER = 2;
/** A released bridge reforms once the nodes return within this multiple. */
export const RECONNECT_MULTIPLIER = 1.4;
/** Oscillator excitation scale: distance acceleration -> bridge displacement. */
const EXCITATION_SCALE = 0.004;
const MAX_EXCITATION = 180;

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

  const sim = forceSimulation<GraphNode>(nodes)
    .force(
      'charge',
      forceManyBody<GraphNode>()
        .strength(chargeStrength(width, height))
        .distanceMin(50),
    )
    .force(
      'link',
      forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(links)
        .id((d) => d.id)
        .distance((link) => {
          const s = (link.source as GraphNode).id ?? (link.source as unknown as string);
          const t = (link.target as GraphNode).id ?? (link.target as unknown as string);
          return restDistances.get(linkKey(String(s), String(t))) ?? LINK_DISTANCE;
        })
        .strength(LINK_STRENGTH),
    )
    .force('collide', forceCollide<GraphNode>().radius(COLLIDE_RADIUS))
    .force('seedX', seedForceX)
    .force('seedY', seedForceY)
    .stop();

  let state: SimState = 'idle';
  let hoveredNode: GraphNode | null = null;
  let dragNode: GraphNode | null = null;
  let coastingNode: GraphNode | null = null;
  let dragAnchor = { x: 0, y: 0 };
  let tetherRadius = Math.max(120, Math.min(width, height) * 0.75);
  const dragSamples: { x: number; y: number; t: number }[] = [];

  sim.force('boundary', createBoundaryForce(width, height, BOUNDARY_MARGIN, nodes));

  const nodeById = (id: string): GraphNode | undefined => nodes.find((n) => n.id === id);

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

  const updateLinkStates = (dtMs: number): void => {
    const dtSeconds = Math.max(0.001, dtMs / 1000);
    for (const link of linkStates) {
      const distance = linkDistance(link);
      // Visual severance is only possible while dragging. At rest, or after a
      // release once the nodes are back inside the reconnect radius, every
      // topological edge remains present.
      if (state === 'drag') {
        if (distance > SNAP_MULTIPLIER * link.restDistance) link.isDetached = true;
        else if (distance <= RECONNECT_MULTIPLIER * link.restDistance) link.isDetached = false;
      } else if (link.isDetached && distance <= RECONNECT_MULTIPLIER * link.restDistance) {
        link.isDetached = false;
      }

      const velocity = (distance - link.previousDistance) / dtSeconds;
      const acceleration = (velocity - link.previousVelocity) / dtSeconds;
      const excitation = Math.max(
        -MAX_EXCITATION,
        Math.min(MAX_EXCITATION, acceleration * EXCITATION_SCALE),
      );
      stepBridgeOscillator(link.oscillator, dtMs, excitation);
      link.previousDistance = distance;
      link.previousVelocity = velocity;
    }
  };

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
      const pull = alpha * 0.08 * (dist - 120);
      const ux = dx / dist;
      const uy = dy / dist;
      other.vx = (other.vx ?? 0) - ux * pull;
      other.vy = (other.vy ?? 0) - uy * pull;
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
    updateLinkStates(TICK_MS);
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
    // stay set and it remains frozen after the pointer moves away.
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
    hoveredNode = null;
    dragNode = node;
    node.fx = node.x;
    node.fy = node.y;
    dragAnchor = { x: node.x, y: node.y };
    dragSamples.length = 0;
    dragSamples.push({ x: node.x, y: node.y, t: performance.now() });
    state = 'drag';
    sim.alphaTarget(0.2).restart();
  }

  function dragMove(x: number, y: number): void {
    if (state !== 'drag' || !dragNode) return;
    const pinned = rubberBandDisplacement(dragAnchor, { x, y }, tetherRadius);
    dragNode.fx = pinned.x;
    dragNode.fy = pinned.y;
    dragSamples.push({ x: pinned.x, y: pinned.y, t: performance.now() });
    if (dragSamples.length > 3) dragSamples.shift();
    updateLinkStates(TICK_MS);
  }

  function dragEnd(): void {
    if (state !== 'drag' || !dragNode) return;
    const node = dragNode;
    node.fx = null;
    node.fy = null;

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
    dragSamples.length = 0;
    state = 'coasting';
    sim.velocityDecay(VELOCITY_DECAY_COAST);
    sim.alphaTarget(0);
    sim.alpha(0.3).restart();
    // Reconnect immediately when the release point is already inside the
    // recovery radius; otherwise the tick loop reforms it as the node settles.
    updateLinkStates(TICK_MS);
  }

  function resize(nw: number, nh: number): void {
    recomputeTargets(nw, nh);
    recomputeRestDistances(nw, nh);
    for (const link of linkStates) {
      link.restDistance = restDistances.get(linkKey(link.source, link.target)) ?? LINK_DISTANCE;
    }
    tetherRadius = Math.max(120, Math.min(nw, nh) * 0.75);
    (sim.force('charge') as ForceManyBody<GraphNode> | undefined)?.strength(
      chargeStrength(nw, nh),
    );
    sim.force('boundary', createBoundaryForce(nw, nh, BOUNDARY_MARGIN, nodes));
    sim.alpha(0.2).restart();
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
      sim.on('end', null);
    },
  };
}
