import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bridgeExcitation,
  createSimulation,
  rubberBandDisplacement,
  type GraphSimulation,
} from './graphSimulation';
import {
  bridgeOscillatorAmplitude,
  createBridgeOscillatorState,
  isBridgeOscillatorAtRest,
  stepBridgeOscillator,
} from '../utils/bridgeOscillator';
import { projects } from '../data/projects';
import { deriveEdges } from '../utils/graphTopology';
import { PLANAR_NODE_SEEDS, scaleSeeds } from '../data/graphSeeds';

const PROJECT_IDS = projects.map((p) => p.id);

// Derive the topology from the real catalog so this physics test exercises the
// same edge set the graph renders, instead of a hand-maintained copy that can
// silently drift from graphTopology's output.
const LINKS: { source: string; target: string }[] = deriveEdges(projects).map((e) => ({
  source: e.source,
  target: e.target,
}));

/** Ring initial positions so the settle is deterministic and symmetric. */
function ringPositions(width: number, height: number): Record<string, [number, number]> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.3;
  const out: Record<string, [number, number]> = {};
  PROJECT_IDS.forEach((id, i) => {
    const angle = (i / PROJECT_IDS.length) * Math.PI * 2;
    out[id] = [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });
  return out;
}

function settle(width: number, height: number) {
  const sim = createSimulation({
    nodes: PROJECT_IDS.map((id) => ({ id })),
    links: LINKS,
    width,
    height,
    initialPositions: ringPositions(width, height),
  });
  for (let i = 0; i < 300; i += 1) {
    sim.tick();
  }
  return sim;
}

function freshSim() {
  return createSimulation({
    nodes: PROJECT_IDS.map((id) => ({ id })),
    links: LINKS,
    width: 1200,
    height: 800,
    initialPositions: ringPositions(1200, 800),
  });
}

describe('graphSimulation seed homing', () => {
  it('accepts a display label and initializes from scaled planar seeds', () => {
    const sim = createSimulation({
      nodes: [{ id: 'open-dungeon', label: 'OpenDungeon' }],
      links: [],
      width: 1000,
      height: 500,
      seeds: { 'open-dungeon': { x: 0.4, y: 0.48 } },
    });

    const node = sim.findNode('open-dungeon')!;
    expect(node.label).toBe('OpenDungeon');
    expect(node.x).toBeCloseTo(400, 6);
    expect(node.y).toBeCloseTo(240, 6);

    sim.destroy();
  });

  it('re-scales seed targets when the viewport resizes', () => {
    const sim = createSimulation({
      nodes: [{ id: 'open-dungeon' }],
      links: [],
      width: 1000,
      height: 500,
      seeds: { 'open-dungeon': { x: 0.4, y: 0.48 } },
    });

    sim.resize(2000, 1000);
    for (let tick = 0; tick < 40; tick += 1) sim.tick();
    const node = sim.findNode('open-dungeon')!;
    expect(node.x).toBeGreaterThan(450);
    expect(node.y).toBeGreaterThan(270);

    sim.destroy();
  });
});

describe('graphSimulation hover pinning', () => {
  it('pins the hovered node and unpins it when the pointer leaves', () => {
    const sim = freshSim();
    const node = sim.findNode('open-dungeon')!;

    sim.hover(node);
    expect(sim.state).toBe('hover');
    expect(sim.hovered).toBe(node);
    expect(node.fx).toBe(node.x);
    expect(node.fy).toBe(node.y);

    sim.hover(null);
    expect(sim.state).toBe('idle');
    expect(sim.hovered).toBeNull();
    expect(node.fx).toBeNull();
    expect(node.fy).toBeNull();

    sim.destroy();
  });

  it('unpins the previous node before pinning a different one', () => {
    const sim = freshSim();
    const first = sim.findNode('open-dungeon')!;
    const second = sim.findNode('transcribe-plus')!;

    sim.hover(first);
    sim.hover(second);

    // The old bug left these pinned, freezing node H after the pointer left it.
    expect(first.fx).toBeNull();
    expect(first.fy).toBeNull();
    expect(second.fx).toBe(second.x);
    expect(second.fy).toBe(second.y);
    expect(sim.hovered).toBe(second);

    sim.destroy();
  });

  it('keeps the existing pin when hover re-fires on the same node', () => {
    const sim = freshSim();
    const node = sim.findNode('open-dungeon')!;

    sim.hover(node);
    const pinnedFx = node.fx;
    const pinnedFy = node.fy;
    // Simulate a physics tick nudging the node; a repeated hover must not chase
    // it and re-pin to the new coordinates.
    node.x += 40;
    node.y += 40;
    sim.hover(node);

    expect(node.fx).toBe(pinnedFx);
    expect(node.fy).toBe(pinnedFy);

    sim.destroy();
  });

  it('does not re-pin a node while it is coasting after a fling', () => {
    const sim = freshSim();
    const node = sim.findNode('open-dungeon')!;

    sim.dragStart(node);
    sim.dragMove(node.x + 60, node.y + 10);
    sim.dragEnd();
    expect(sim.state).toBe('coasting');

    sim.hover(node);
    expect(sim.hovered).toBeNull();

    sim.destroy();
  });
});

describe('graphSimulation headless physics', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 390x844', 390, 844],
  ])('%s maintains >= 44px clearance, bounds containment, OD centroid freedom, and stabilizes', (_label, width, height) => {
    const sim = settle(width, height);
    const nodes = sim.nodes;
    const alpha = sim.sim.alpha();

    for (const a of nodes) {
      expect(a.x).toBeGreaterThanOrEqual(20);
      expect(a.x).toBeLessThanOrEqual(width - 20);
      expect(a.y).toBeGreaterThanOrEqual(20);
      expect(a.y).toBeLessThanOrEqual(height - 20);
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        expect(dist, `${nodes[i].id} <-> ${nodes[j].id} clearance`).toBeGreaterThanOrEqual(44);
      }
    }

    const od = nodes.find((n) => n.id === 'open-dungeon')!;
    const offCenter = Math.abs(od.x - width / 2) > 40 || Math.abs(od.y - height / 2) > 40;
    expect(offCenter, 'open-dungeon must not sit at the centroid').toBe(true);

    expect(alpha).toBeLessThan(0.005);

    sim.destroy();
  });
});

describe('rubber-band drag tether', () => {
  it('cushions displacement so the pinned point asymptotes to the tether radius', () => {
    const anchor = { x: 100, y: 100 };
    const near = rubberBandDisplacement(anchor, { x: 200, y: 100 }, 200);
    expect(near.x).toBeCloseTo(100 + 100 / Math.sqrt(1 + 0.25), 6);

    const far = rubberBandDisplacement(anchor, { x: 100000, y: 100 }, 200);
    expect(far.x - anchor.x).toBeLessThan(200);
    expect(far.x - anchor.x).toBeGreaterThan(199);
    expect(far.y).toBeCloseTo(100, 6);
  });
});

describe('drag-time bridge snapping and recovery', () => {
  it('detaches a bridge beyond 2x rest distance and reconnects after release', () => {
    const width = 1000;
    const height = 1000;
    const seeds = {
      a: { x: 0.4, y: 0.5 },
      b: { x: 0.5, y: 0.5 },
    };
    const sim = createSimulation({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b', tags: ['Design'] }],
      width,
      height,
      seeds,
      initialPositions: scaleSeeds(seeds, width, height),
    });

    const link = sim.findLink('a', 'b')!;
    expect(link.restDistance).toBeCloseTo(100, 6);

    const node = sim.findNode('a')!;
    sim.dragStart(node);
    // Pull the node far to the left. The tether caps the visual displacement,
    // but it is still well beyond twice the 100px rest distance.
    sim.dragMove(-5000, 500);
    expect(link.isDetached).toBe(true);

    sim.dragEnd();
    for (let i = 0; i < 600; i += 1) sim.tick();

    expect(sim.findLink('a', 'b')!.isDetached).toBe(false);
    expect(sim.linkStates).toHaveLength(1);
    sim.destroy();
  });

  it('preserves all 13 topological edges with zero permanent edge loss', () => {
    const width = 1440;
    const height = 900;
    const edges = deriveEdges(projects);
    const sim = createSimulation({
      nodes: projects.map((project) => ({ id: project.id, label: project.shortTitle })),
      links: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        tags: edge.tags,
      })),
      width,
      height,
      seeds: PLANAR_NODE_SEEDS,
      initialPositions: scaleSeeds(PLANAR_NODE_SEEDS, width, height),
    });

    expect(sim.linkStates).toHaveLength(13);
    const node = sim.findNode('attention-max')!;
    sim.dragStart(node);
    sim.dragMove(node.x + 900, node.y + 400);
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);
    sim.dragEnd();

    for (let i = 0; i < 600; i += 1) sim.tick();
    expect(sim.linkStates).toHaveLength(13);
    expect(sim.linkStates.every((link) => !link.isDetached)).toBe(true);
    sim.destroy();
  });
});

type TickListener = () => void;

function fullSim(): GraphSimulation {
  const width = 1440;
  const height = 900;
  const edges = deriveEdges(projects);
  return createSimulation({
    nodes: projects.map((project) => ({ id: project.id, label: project.shortTitle })),
    links: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      tags: edge.tags,
    })),
    width,
    height,
    seeds: PLANAR_NODE_SEEDS,
    initialPositions: scaleSeeds(PLANAR_NODE_SEEDS, width, height),
  });
}

function twoNodeSim(): GraphSimulation {
  const width = 1000;
  const height = 1000;
  const seeds = {
    a: { x: 0.4, y: 0.5 },
    b: { x: 0.67, y: 0.5 },
  };
  return createSimulation({
    nodes: [{ id: 'a' }, { id: 'b' }],
    links: [{ source: 'a', target: 'b', tags: ['Design'] }],
    width,
    height,
    seeds,
    initialPositions: scaleSeeds(seeds, width, height),
  });
}

function tickListener(sim: GraphSimulation): TickListener {
  const listener = sim.sim.on('tick.links') as unknown as TickListener | undefined;
  expect(listener).toBeTypeOf('function');
  return listener as TickListener;
}

describe('d3 tick event path', () => {
  let now = 0;

  beforeEach(() => {
    now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function drive(
    sim: GraphSimulation,
    listener: TickListener,
    iterations: number,
  ): void {
    for (let i = 0; i < iterations; i += 1) {
      now += 1000 / 60;
      sim.sim.tick();
      listener();
      sim.poll();
    }
  }

  it('registers a tick.links listener', () => {
    const sim = fullSim();
    expect(tickListener(sim)).toBeTypeOf('function');
    sim.destroy();
  });

  it('reconnects a released, detached bridge', () => {
    const sim = fullSim();
    const listener = tickListener(sim);
    const node = sim.findNode('attention-max')!;
    drive(sim, listener, 1);

    sim.dragStart(node);
    sim.dragMove(node.x - 2000, node.y);
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);

    sim.dragEnd();
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);

    const tracked = sim.linkStates
      .filter((link) => link.isDetached)
      .sort((a, b) => b.restDistance - a.restDistance)[0];
    let reconnectDistance: number | null = null;
    for (let i = 0; i < 600 && reconnectDistance === null; i += 1) {
      now += 1000 / 60;
      sim.sim.tick();
      listener();
      sim.poll();
      if (!tracked.isDetached) {
        const source = sim.findNode(tracked.source)!;
        const target = sim.findNode(tracked.target)!;
        reconnectDistance = Math.hypot(source.x - target.x, source.y - target.y);
      }
    }
    expect(reconnectDistance).not.toBeNull();
    expect(reconnectDistance!).toBeLessThanOrEqual(2 * tracked.restDistance);

    drive(sim, listener, 600);
    expect(sim.linkStates.every((link) => !link.isDetached)).toBe(true);
    sim.destroy();
  });

  it('does not reconnect through the idle backstop beyond 2x rest distance', () => {
    const sim = twoNodeSim();
    const listener = tickListener(sim);
    const node = sim.findNode('a')!;
    const other = sim.findNode('b')!;
    const link = sim.findLink('a', 'b')!;
    drive(sim, listener, 1);

    sim.dragStart(node);
    sim.dragMove(-5000, 500);
    expect(link.isDetached).toBe(true);
    sim.dragEnd();

    // Force the coast-to-idle transition while the node is still stretched far
    // beyond the snap radius.
    node.vx = 0;
    node.vy = 0;
    sim.poll();
    expect(sim.state).toBe('idle');
    expect(Math.hypot(node.x - other.x, node.y - other.y)).toBeGreaterThan(
      2 * link.restDistance,
    );

    now += 1000 / 60;
    sim.sim.tick();
    listener();
    sim.poll();
    expect(link.isDetached).toBe(true);

    let reconnectDistance: number | null = null;
    for (let i = 0; i < 600 && reconnectDistance === null; i += 1) {
      now += 1000 / 60;
      sim.sim.tick();
      listener();
      sim.poll();
      if (!link.isDetached) {
        reconnectDistance = Math.hypot(node.x - other.x, node.y - other.y);
      }
    }
    expect(reconnectDistance).not.toBeNull();
    expect(reconnectDistance!).toBeLessThanOrEqual(2 * link.restDistance);
    sim.destroy();
  });

  it('commits the final pinned coordinate on dragEnd without a tick', () => {
    const sim = twoNodeSim();
    const listener = tickListener(sim);
    const node = sim.findNode('a')!;
    drive(sim, listener, 1);

    sim.dragStart(node);
    sim.dragMove(120, 900);
    const pinnedX = node.fx;
    const pinnedY = node.fy;
    expect(pinnedX).not.toBeNull();
    expect(pinnedY).not.toBeNull();

    sim.dragEnd();
    expect(node.x).toBe(pinnedX);
    expect(node.y).toBe(pinnedY);
    sim.destroy();
  });

  it('rings down oscillators and reaches idle', () => {
    const sim = fullSim();
    const listener = tickListener(sim);
    const node = sim.findNode('attention-max')!;
    drive(sim, listener, 1);

    sim.dragStart(node);
    sim.dragMove(node.x - 320, node.y + 120);
    drive(sim, listener, 4);
    sim.dragEnd();
    drive(sim, listener, 900);

    for (const link of sim.linkStates) {
      expect(bridgeOscillatorAmplitude(link.oscillator)).toBeLessThan(0.01);
      expect(isBridgeOscillatorAtRest(link.oscillator)).toBe(true);
    }
    expect(sim.isIdle).toBe(true);
    sim.destroy();
  });

  it('does not inject an impulse on the first tick', () => {
    const sim = fullSim();
    const listener = tickListener(sim);
    drive(sim, listener, 1);
    for (const link of sim.linkStates) {
      expect(link.oscillator.sag).toBeCloseTo(0, 9);
    }
    sim.destroy();
  });
});

describe('fling amplitude', () => {
  const DT_MS = 1000 / 60;

  function smoothstep(t: number): number {
    const clamped = Math.min(1, Math.max(0, t));
    return clamped * clamped * (3 - 2 * clamped);
  }

  function simulateFling(delta: number, durationSeconds: number) {
    const state = createBridgeOscillatorState();
    let previousDistance = 300;
    let previousVelocity = 0;
    let peak = 0;
    const steps = Math.ceil((durationSeconds + 1.5) * 60);
    for (let i = 1; i <= steps; i += 1) {
      const time = (i * DT_MS) / 1000;
      const distance = 300 + delta * smoothstep(time / durationSeconds);
      const velocity = (distance - previousDistance) / (DT_MS / 1000);
      const acceleration = (velocity - previousVelocity) / (DT_MS / 1000);
      stepBridgeOscillator(state, DT_MS, bridgeExcitation(acceleration));
      previousDistance = distance;
      previousVelocity = velocity;
      if (time >= durationSeconds) {
        peak = Math.max(peak, Math.abs(state.sag));
      }
    }
    return { peak, final: Math.abs(state.sag) };
  }

  it('produces a perceptible but bounded moderate fling', () => {
    const result = simulateFling(120, 0.15);
    expect(result.peak).toBeGreaterThanOrEqual(1.2);
    expect(result.peak).toBeLessThanOrEqual(3.0);
    expect(result.final).toBeLessThan(0.01);
  });

  it('bounds an extreme fling and decays to rest', () => {
    const result = simulateFling(260, 0.06);
    expect(result.peak).toBeLessThanOrEqual(4.0);
    expect(result.final).toBeLessThan(0.01);
  });
});