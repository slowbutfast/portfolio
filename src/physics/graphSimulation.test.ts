import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bridgeExcitation,
  createSimulation,
  RECOIL_MS,
  RECONNECT_COOLDOWN_MS,
  RECONNECT_MULTIPLIER,
  rubberBandDisplacement,
  SNAP_MULTIPLIER,
  hoverDriftAcceleration,
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
  it('detaches a bridge beyond 1.6x rest distance and recovers after resetLayout', () => {
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
    for (let i = 0; i < 30; i += 1) sim.tick();
    expect(sim.findLink('a', 'b')!.isDetached).toBe(true);

    sim.resetLayout();
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
    sim.resetLayout();

    for (let i = 0; i < 600; i += 1) sim.tick();
    expect(sim.linkStates).toHaveLength(13);
    expect(sim.linkStates.every((link) => !link.isDetached)).toBe(true);
    sim.destroy();
  });
});

describe('decoupled drag and persistent user pinning', () => {
  it('keeps a non-dragged neighbor within <15px over a 160px drag', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const neighbor = sim.findNode('b')!;
    const startX = node.x;
    const startY = node.y;
    const before = { x: neighbor.x, y: neighbor.y };

    sim.dragStart(node);
    for (let step = 1; step <= 20; step += 1) {
      sim.dragMove(startX + (160 * step) / 20, startY);
      sim.tick();
    }

    const displacement = Math.hypot(neighbor.x - before.x, neighbor.y - before.y);
    expect(displacement).toBeLessThan(15);
    sim.destroy();
  });

  it('persists the user-placed fx/fy anchor after dragEnd', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;

    sim.dragStart(node);
    sim.dragMove(node.x + 140, node.y + 60);
    const pinnedX = node.fx;
    const pinnedY = node.fy;
    sim.dragEnd();

    expect(pinnedX).not.toBeNull();
    expect(pinnedY).not.toBeNull();
    expect(node.fx).toBe(pinnedX);
    expect(node.fy).toBe(pinnedY);
    sim.tick();
    expect(node.fx).toBe(pinnedX);
    expect(node.fy).toBe(pinnedY);
    sim.destroy();
  });

  it('scales and clamps pinned coordinates proportionally on resize', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;

    sim.dragStart(node);
    sim.dragMove(1000, 950);
    sim.dragEnd();
    const pinnedX = node.fx!;
    const pinnedY = node.fy!;

    sim.resize(2000, 400);
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), Math.max(min, max));
    expect(node.fx).toBeCloseTo(clamp(pinnedX * 2, 48, 2000 - 48), 5);
    expect(node.fy).toBeCloseTo(clamp(pinnedY * 0.4, 48, 400 - 48), 5);
    expect(node.x).toBe(node.fx);
    expect(node.y).toBe(node.fy);
    sim.destroy();
  });

  it('clears pins, detached flags, and restores planar seeds on resetLayout', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const link = sim.findLink('a', 'b')!;

    sim.dragStart(node);
    sim.dragMove(-5000, 500);
    expect(link.isDetached).toBe(true);
    sim.dragEnd();

    sim.resetLayout();
    expect(node.fx).toBeNull();
    expect(node.fy).toBeNull();
    expect(link.isDetached).toBe(false);
    expect(node.x).toBeCloseTo(0.4 * 1000, 6);
    expect(node.y).toBeCloseTo(0.5 * 1000, 6);

    for (let i = 0; i < 60; i += 1) sim.tick();
    expect(Math.abs(node.x - 0.4 * 1000)).toBeLessThan(30);
    expect(Math.abs(node.y - 0.5 * 1000)).toBeLessThan(30);
    sim.destroy();
  });
});

describe('snap hysteresis, recoil, and reconnect cooldown', () => {
  it('uses the 1.6x snap and 1.25x reconnect multipliers', () => {
    expect(SNAP_MULTIPLIER).toBe(1.6);
    expect(RECONNECT_MULTIPLIER).toBe(1.25);
    expect(RECOIL_MS).toBe(220);
    expect(RECONNECT_COOLDOWN_MS).toBe(350);
  });

  it('emits a 220ms recoil and honors the 350ms post-release cooldown', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const other = sim.findNode('b')!;
    const link = sim.findLink('a', 'b')!;

    sim.dragStart(node);
    sim.dragMove(-5000, 500);
    expect(link.isDetached).toBe(true);
    expect(link.recoilProgress).toBe(1);
    sim.dragEnd();
    expect(link.reconnectCooldownUntil).toBeCloseTo(RECONNECT_COOLDOWN_MS, 5);

    sim.tick();
    expect(link.recoilProgress).toBeGreaterThan(0);
    expect(link.recoilProgress).toBeLessThan(1);

    // Put the released node back inside the 1.25x reconnect radius. The
    // cooldown must still hold the bridge detached.
    node.x = other.x - RECONNECT_MULTIPLIER * link.restDistance * 0.96;
    node.y = other.y;
    node.fx = node.x;
    node.fy = node.y;
    node.vx = 0;
    node.vy = 0;
    for (let i = 0; i < 10; i += 1) sim.tick();
    expect(link.isDetached).toBe(true);

    for (let i = 0; i < 20; i += 1) sim.tick();
    expect(link.isDetached).toBe(false);
    expect(link.recoilProgress).toBe(0);
    sim.destroy();
  });
});

describe('hover drift exclusion zone', () => {
  it('is zero inside 110px and ramps to 0.025 outside it', () => {
    expect(hoverDriftAcceleration(0, 1)).toBe(0);
    expect(hoverDriftAcceleration(110, 1)).toBe(0);
    expect(hoverDriftAcceleration(220, 1)).toBeCloseTo(0.025, 6);
    expect(hoverDriftAcceleration(500, 1)).toBeCloseTo(0.025, 6);
    expect(hoverDriftAcceleration(165, 1)).toBeCloseTo(0.0125, 6);
  });
});

describe('proximity pairs never create force links', () => {
  it('keeps exactly the 13 permanent links in the simulation', () => {
    const sim = fullSim();
    expect(sim.links).toHaveLength(13);
    expect(sim.linkStates).toHaveLength(13);
    expect(sim.sim.force('proximity')).toBeUndefined();
    sim.destroy();
  });
});

describe('mobile snap reachability', () => {
  it('can drag every permanent edge past 1.6x rest distance at 393x852', () => {
    const width = 393;
    const height = 852;
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

    for (const link of sim.linkStates) {
      sim.resetLayout();
      const source = sim.findNode(link.source)!;
      const target = sim.findNode(link.target)!;
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      const distance = Math.hypot(dx, dy) || 1;
      sim.dragStart(source);
      sim.dragMove(
        source.x + (dx / distance) * 100000,
        source.y + (dy / distance) * 100000,
      );
      expect(
        link.isDetached,
        `${link.source} -> ${link.target} (rest ${link.restDistance.toFixed(1)}px)`,
      ).toBe(true);
      sim.dragEnd();
    }
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

  it('reconnects a released, detached bridge once cooldown expires and it returns', () => {
    const sim = fullSim();
    const listener = tickListener(sim);
    const node = sim.findNode('attention-max')!;
    const home = scaleSeeds(PLANAR_NODE_SEEDS, 1440, 900)['attention-max'];
    drive(sim, listener, 1);

    sim.dragStart(node);
    sim.dragMove(node.x - 2000, node.y);
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);

    sim.dragEnd();
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);

    // Return the pinned node to its planar home and wait past the cooldown.
    node.fx = home[0];
    node.fy = home[1];
    drive(sim, listener, 600);
    expect(sim.linkStates.every((link) => !link.isDetached)).toBe(true);
    sim.destroy();
  });

  it('keeps a pinned far-away bridge detached until resetLayout', () => {
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

    node.vx = 0;
    node.vy = 0;
    sim.poll();
    expect(sim.state).toBe('idle');
    expect(Math.hypot(node.x - other.x, node.y - other.y)).toBeGreaterThan(
      RECONNECT_MULTIPLIER * link.restDistance,
    );

    // No idle backstop may pop the bridge back while the node is far away.
    drive(sim, listener, 600);
    expect(link.isDetached).toBe(true);

    sim.resetLayout();
    drive(sim, listener, 5);
    expect(link.isDetached).toBe(false);
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