import { describe, expect, it } from 'vitest';
import { createSimulation } from './graphSimulation';
import { projects } from '../data/projects';
import { deriveEdges } from '../utils/graphTopology';

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
  ])('%s maintains >= 60px clearance, bounds containment, OD centroid freedom, and stabilizes', (_label, width, height) => {
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
        expect(dist, `${nodes[i].id} <-> ${nodes[j].id} clearance`).toBeGreaterThanOrEqual(60);
      }
    }

    const od = nodes.find((n) => n.id === 'open-dungeon')!;
    const offCenter = Math.abs(od.x - width / 2) > 40 || Math.abs(od.y - height / 2) > 40;
    expect(offCenter, 'open-dungeon must not sit at the centroid').toBe(true);

    expect(alpha).toBeLessThan(0.005);

    sim.destroy();
  });
});