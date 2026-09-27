import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type ForceManyBody,
  type ForceX,
  type ForceY,
} from 'd3-force';
import type { GraphNode } from '../types/portfolio';

export type SimState = 'idle' | 'hover' | 'drag' | 'coasting';

export interface SimulationOptions {
  nodes: { id: string }[];
  links: { source: string; target: string }[];
  width: number;
  height: number;
  /** Optional deterministic seed positions keyed by node id. */
  initialPositions?: Record<string, [number, number]>;
  radius?: number;
}

export interface GraphSimulation {
  sim: Simulation<GraphNode, undefined>;
  nodes: GraphNode[];
  links: SimulationLinkDatum<GraphNode>[];
  state: SimState;
  hovered: GraphNode | null;
  tick(): void;
  poll(): void;
  resize(width: number, height: number): void;
  hover(node: GraphNode | null): void;
  dragStart(node: GraphNode): void;
  dragMove(x: number, y: number): void;
  dragEnd(): void;
  findNode(id: string): GraphNode | undefined;
  destroy(): void;
}

const NODE_RADIUS = 18;
const BOUNDARY_MARGIN = 40;
const COLLIDE_RADIUS = 30;
const LINK_DISTANCE = 180;
const LINK_STRENGTH = 0.05;
const CENTER_STRENGTH = 0.035;
const CHARGE_SCALE = 0.55;
const MAX_FLING = 15;
const VELOCITY_DECAY_IDLE = 0.4;
const VELOCITY_DECAY_COAST = 0.18;
const COAST_RESTORE_SPEED = 0.5;

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

export function createSimulation(opts: SimulationOptions): GraphSimulation {
  const { width, height, radius = NODE_RADIUS } = opts;
  const initialRadius = Math.min(width, height) * 0.28;

  const nodes: GraphNode[] = opts.nodes.map((n, i) => {
    const seed = opts.initialPositions?.[n.id];
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
    return { id: n.id, label: n.id, radius, x, y, vx: 0, vy: 0, fx: null, fy: null };
  });

  const links: SimulationLinkDatum<GraphNode>[] = opts.links.map((l) => ({ ...l }));

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
        .distance(LINK_DISTANCE)
        .strength(LINK_STRENGTH),
    )
    .force('collide', forceCollide<GraphNode>().radius(COLLIDE_RADIUS))
    .force('x', forceX<GraphNode>(width / 2).strength(CENTER_STRENGTH))
    .force('y', forceY<GraphNode>(height / 2).strength(CENTER_STRENGTH))
    .stop();

  let state: SimState = 'idle';
  let hoveredNode: GraphNode | null = null;
  let dragNode: GraphNode | null = null;
  let coastingNode: GraphNode | null = null;
  const dragSamples: { x: number; y: number; t: number }[] = [];

  sim.force('boundary', createBoundaryForce(width, height, BOUNDARY_MARGIN, nodes));

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
    // pointermove re-pins the node and re-reheats the simulation.
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
    dragSamples.length = 0;
    dragSamples.push({ x: node.x, y: node.y, t: performance.now() });
    state = 'drag';
    sim.alphaTarget(0.2).restart();
  }

  function dragMove(x: number, y: number): void {
    if (state !== 'drag' || !dragNode) return;
    dragNode.fx = x;
    dragNode.fy = y;
    dragSamples.push({ x, y, t: performance.now() });
    if (dragSamples.length > 3) dragSamples.shift();
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
  }

  function resize(nw: number, nh: number): void {
    (sim.force('x') as ForceX<GraphNode> | undefined)?.x(nw / 2);
    (sim.force('y') as ForceY<GraphNode> | undefined)?.y(nh / 2);
    (sim.force('charge') as ForceManyBody<GraphNode> | undefined)?.strength(chargeStrength(nw, nh));
    sim.force('boundary', createBoundaryForce(nw, nh, BOUNDARY_MARGIN, nodes));
    sim.alpha(0.2).restart();
  }

  return {
    sim,
    nodes,
    links,
    get state() {
      return state;
    },
    get hovered() {
      return hoveredNode;
    },
    tick,
    poll,
    resize,
    hover,
    dragStart,
    dragMove,
    dragEnd,
    findNode: (id) => nodes.find((n) => n.id === id),
    destroy: () => {
      sim.stop();
      sim.on('tick', null);
      sim.on('end', null);
    },
  };
}