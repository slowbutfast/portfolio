import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ambientDriftOffset,
  bridgeExcitation,
  createSimulation,
  RECOIL_MS,
  RECONNECT_COOLDOWN_MS,
  RECONNECT_MULTIPLIER,
  rubberBandDisplacement,
  SNAP_MULTIPLIER,
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

type SeedPoint = [number, number];

function cross(origin: SeedPoint, a: SeedPoint, b: SeedPoint): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function properIntersection(a: SeedPoint, b: SeedPoint, c: SeedPoint, d: SeedPoint): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Count proper crossings in a position map without importing test helpers. */
function countSeedCrossings(positions: Record<string, SeedPoint>): number {
  const segments = LINKS.map((edge) => ({
    ...edge,
    a: positions[edge.source],
    b: positions[edge.target],
  }));
  let crossings = 0;
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const left = segments[i];
      const right = segments[j];
      const sharesEndpoint =
        left.source === right.source ||
        left.source === right.target ||
        left.target === right.source ||
        left.target === right.target;
      if (sharesEndpoint) continue;
      if (properIntersection(left.a, left.b, right.a, right.b)) crossings += 1;
    }
  }
  return crossings;
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
    expect(node.x).toBeCloseTo(48 + 0.4 * (1000 - 96), 6);
    expect(node.y).toBeCloseTo(48 + 0.48 * (500 - 96), 6);

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
    expect(link.restDistance).toBeCloseTo(90.4, 6);

    const node = sim.findNode('a')!;
    sim.dragStart(node);
    // Pull the node far to the left. The tether caps the visual displacement,
    // but it is still well beyond twice the 100px rest distance.
    sim.dragMove(-5000, 500);
    sim.tick();
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
    sim.tick();
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
      // The decoupling must come from force isolation, never neighbor pins.
      expect(neighbor.fx, `neighbor fx at step ${step}`).toBeNull();
      expect(neighbor.fy, `neighbor fy at step ${step}`).toBeNull();
    }

    const displacement = Math.hypot(neighbor.x - before.x, neighbor.y - before.y);
    expect(displacement).toBeLessThan(12);
    sim.destroy();
  });

  it('advances the viscous drag follower on the frame clock, not pointer events', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const startX = node.x;

    sim.dragStart(node);
    sim.dragMove(startX + 160, node.y);
    // The pointer sample only stores a target; the next physics frame moves it.
    expect(node.fx).toBeCloseTo(startX, 6);

    const positions: number[] = [];
    for (let tick = 0; tick < 20; tick += 1) {
      sim.tick();
      positions.push(node.fx ?? node.x);
    }

    expect(positions[0]).toBeGreaterThan(startX);
    expect(positions[0]).toBeLessThan(startX + 160);
    for (let index = 1; index < positions.length; index += 1) {
      expect(positions[index]).toBeGreaterThanOrEqual(positions[index - 1] - 1e-6);
    }
    expect(positions.at(-1)!).toBeGreaterThan(startX + 100);
    sim.destroy();
  });

  it('settles toward a soft home anchor without keeping fx/fy pins', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;

    sim.dragStart(node);
    sim.dragMove(760, 720);
    const homeX = node.fx ?? node.x;
    const homeY = node.fy ?? node.y;
    sim.dragEnd();

    expect(node.fx).toBeNull();
    expect(node.fy).toBeNull();

    // Nudge the released node away; the alpha-independent home spring must pull
    // it back smoothly without a hard pin.
    node.x += 90;
    node.y += 45;
    for (let tick = 0; tick < 300; tick += 1) sim.tick();
    expect(Math.hypot(node.x - homeX, node.y - homeY)).toBeLessThan(2);

    sim.resetLayout();
    expect(Math.abs(node.x - 0.4 * 1000)).toBeLessThan(30);
    expect(Math.abs(node.y - 0.5 * 1000)).toBeLessThan(30);
    sim.destroy();
  });

  it('scales and clamps soft home anchors proportionally on resize', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;

    sim.dragStart(node);
    sim.dragMove(1000, 950);
    const homeX = node.fx ?? node.x;
    const homeY = node.fy ?? node.y;
    sim.dragEnd();

    sim.resize(2000, 400);
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), Math.max(min, max));
    const expectedX = clamp(homeX * 2, 48, 2000 - 48);
    const expectedY = clamp(homeY * 0.4, 48, 400 - 48);
    node.x = expectedX + 60;
    node.y = expectedY + 30;
    for (let tick = 0; tick < 260; tick += 1) sim.tick();
    expect(Math.hypot(node.x - expectedX, node.y - expectedY)).toBeLessThan(2);
    sim.destroy();
  });

  it('clears pins, detached flags, and restores planar seeds on resetLayout', () => {
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const link = sim.findLink('a', 'b')!;

    sim.dragStart(node);
    sim.dragMove(-5000, 500);
    sim.tick();
    expect(link.isDetached).toBe(true);
    sim.dragEnd();

    sim.resetLayout();
    expect(node.fx).toBeNull();
    expect(node.fy).toBeNull();
    expect(link.isDetached).toBe(false);
    expect(node.x).toBeCloseTo(48 + 0.4 * (1000 - 96), 6);
    expect(node.y).toBeCloseTo(48 + 0.5 * (1000 - 96), 6);

    for (let i = 0; i < 60; i += 1) sim.tick();
    expect(Math.abs(node.x - (48 + 0.4 * (1000 - 96)))).toBeLessThan(30);
    expect(Math.abs(node.y - (48 + 0.5 * (1000 - 96)))).toBeLessThan(30);
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

  it('uses render-clock detachedAt/reconnect timestamps and emits a reconnect ripple', () => {
    let now = 1000;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
    const sim = twoNodeSim();
    const node = sim.findNode('a')!;
    const other = sim.findNode('b')!;
    const link = sim.findLink('a', 'b')!;

    sim.dragStart(node);
    sim.dragMove(-5000, 500);
    sim.tick();
    expect(link.isDetached).toBe(true);
    expect(link.detachedAt).not.toBeNull();
    const detachedAt = link.detachedAt!;
    expect(detachedAt).toBe(1000);

    // The recoil timestamp is a render-clock fact, not an afterTick counter, so
    // it must remain stable even while the simulation is idle/stopped.
    now = 1110;
    sim.sim.stop();
    expect(link.detachedAt).toBe(detachedAt);
    expect(now - detachedAt).toBeLessThan(RECOIL_MS);

    sim.dragEnd();
    expect(link.reconnectCooldownUntil).toBe(now + RECONNECT_COOLDOWN_MS);

    // Put the released node inside the 1.25x radius without any fx/fy pin. The
    // cooldown must still hold the bridge detached until its timestamp passes.
    node.x = other.x - RECONNECT_MULTIPLIER * link.restDistance * 0.96;
    node.y = other.y;
    node.fx = null;
    node.fy = null;
    node.vx = 0;
    node.vy = 0;
    now = 1200;
    sim.tick();
    expect(link.isDetached).toBe(true);

    now = 1110 + RECONNECT_COOLDOWN_MS + 50;
    sim.tick();
    expect(link.isDetached).toBe(false);
    expect(link.detachedAt).toBeNull();
    expect(bridgeOscillatorAmplitude(link.oscillator)).toBeGreaterThan(0.05);
    clock.mockRestore();
    sim.destroy();
  });
});

describe('visual ambient drift', () => {
  it('is deterministic and bounded by the 3.5px amplitude', () => {
    for (const id of ['open-dungeon', 'attention-max', 'ivy-film-festival-2026']) {
      const first = ambientDriftOffset(id, 1234);
      const second = ambientDriftOffset(id, 1234);
      expect(first).toEqual(second);
      expect(Math.hypot(first.x, first.y)).toBeLessThanOrEqual(3.5 + 1e-9);
    }
  });

  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
  ])('keeps zero crossings at maximum ambient offset on %s', (_label, width, height) => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
    for (const time of [0, 137, 999, 4321, 98765]) {
      const displaced: Record<string, [number, number]> = {};
      for (const id of PROJECT_IDS) {
        const offset = ambientDriftOffset(id, time);
        const base = positions[id];
        displaced[id] = [base[0] + offset.x, base[1] + offset.y];
      }
      expect(countSeedCrossings(displaced), `t=${time}ms`).toBe(0);
    }
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

  it('connectLink adds a real forceLink spring and clears on resetLayout', () => {
    const sim = fullSim();
    expect(sim.connectLink('art-wip', 'open-dungeon')).toBe(true);
    expect(sim.links).toHaveLength(14);
    expect(sim.linkStates).toHaveLength(14);
    expect(sim.findLink('art-wip', 'open-dungeon')).toBeDefined();
    // Duplicate connectLink is ignored.
    expect(sim.connectLink('art-wip', 'open-dungeon')).toBe(false);
    expect(sim.links).toHaveLength(14);

    // Resetting layout clears dynamic links back to the 13 permanent edges.
    sim.resetLayout();
    expect(sim.links).toHaveLength(13);
    expect(sim.linkStates).toHaveLength(13);
    expect(sim.findLink('art-wip', 'open-dungeon')).toBeUndefined();
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
      sim.tick();
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
    sim.tick();
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
    sim.tick();
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

  it('cancels a drag with zero fling velocity and an unmoved home anchor', () => {
    const sim = twoNodeSim();
    const listener = tickListener(sim);
    const node = sim.findNode('a')!;
    drive(sim, listener, 1);

    // Establish a committed home anchor with a normal release first.
    sim.dragStart(node);
    sim.dragMove(node.x + 80, node.y);
    drive(sim, listener, 8);
    sim.dragEnd();
    drive(sim, listener, 300);
    const committedHome = { x: node.x, y: node.y };

    sim.dragStart(node);
    sim.dragMove(committedHome.x + 280, committedHome.y + 120);
    drive(sim, listener, 12);
    const dragged = { x: node.fx!, y: node.fy! };
    expect(
      Math.hypot(dragged.x - committedHome.x, dragged.y - committedHome.y),
    ).toBeGreaterThan(60);

    // pointercancel semantics: release the pin without a fling and without
    // committing the dragged coordinate as the new home.
    sim.dragEnd({ cancel: true });
    expect(sim.state).toBe('idle');
    expect(node.fx).toBeNull();
    expect(node.fy).toBeNull();
    expect(node.vx).toBe(0);
    expect(node.vy).toBe(0);

    // The previously committed home spring wins over the abandoned position.
    drive(sim, listener, 600);
    const fromHome = Math.hypot(
      node.x - committedHome.x,
      node.y - committedHome.y,
    );
    const fromDragged = Math.hypot(node.x - dragged.x, node.y - dragged.y);
    expect(fromHome).toBeLessThan(15);
    expect(fromHome).toBeLessThan(fromDragged);
    sim.destroy();
  });

  it('returns a never-placed node to its pre-drag position on cancel', () => {
    const sim = twoNodeSim();
    const listener = tickListener(sim);
    const node = sim.findNode('a')!;
    drive(sim, listener, 1);
    const resting = { x: node.x, y: node.y };

    sim.dragStart(node);
    sim.dragMove(resting.x + 280, resting.y + 120);
    drive(sim, listener, 12);
    expect(
      Math.hypot((node.fx ?? 0) - resting.x, (node.fy ?? 0) - resting.y),
    ).toBeGreaterThan(60);

    sim.dragEnd({ cancel: true });
    drive(sim, listener, 600);

    // No prior normal release exists, so the cancel path must seed the home
    // spring from the pre-drag anchor to bring the node back.
    expect(Math.hypot(node.x - resting.x, node.y - resting.y)).toBeLessThan(15);
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