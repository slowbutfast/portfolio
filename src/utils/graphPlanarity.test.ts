import { describe, expect, it } from 'vitest';
import { PLANAR_NODE_SEEDS, scaleSeeds } from '../data/graphSeeds';
import { projects } from '../data/projects';
import { deriveEdges, type GraphEdge } from '../utils/graphTopology';
import { createSimulation } from '../physics/graphSimulation';
import { countSeedCrossings, pointInTriangle } from './graphPlanarity';

type Point = [number, number];
type Positions = Record<string, Point>;

const PROJECT_IDS = projects.map((project) => project.id);
const EDGES: GraphEdge[] = deriveEdges(projects);

function countCrossings(positions: Positions, edges: GraphEdge[] = EDGES): number {
  return countSeedCrossings(positions, edges, PROJECT_IDS);
}

describe('planar catalog invariants', () => {
  it('derives a non-empty crossing-free permanent edge set', () => {
    expect(EDGES.length).toBeGreaterThan(0);
    expect(PROJECT_IDS.length).toBe(new Set(PROJECT_IDS).size);
  });

  it('gives every project except art-wip at least one permanent connection', () => {
    const degree = new Map<string, number>(PROJECT_IDS.map((id) => [id, 0]));
    for (const edge of EDGES) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
    for (const id of PROJECT_IDS) {
      if (id === 'art-wip') {
        expect(degree.get(id), `${id} degree`).toBe(0);
      } else {
        expect(degree.get(id), `${id} degree`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps sandwave-sim on the acoustic tags plus implicit art tag and disconnected from kintsugi', () => {
    const sandwave = projects.find((project) => project.id === 'sandwave-sim');
    expect(sandwave?.tags).toEqual(['Vanilla JS', 'Audio', 'art']);
    const connectedToKintsugi = EDGES.some(
      (edge) =>
        (edge.source === 'sandwave-sim' && edge.target === 'kintsugi-fracture') ||
        (edge.source === 'kintsugi-fracture' && edge.target === 'sandwave-sim'),
    );
    expect(connectedToKintsugi).toBe(false);
  });

  it('keys the planar seeds by exactly the catalog ids', () => {
    expect(Object.keys(PLANAR_NODE_SEEDS).sort()).toEqual([...PROJECT_IDS].sort());
    expect(PLANAR_NODE_SEEDS['pict-climate-risk-viz-chatbot']).toBeDefined();
    expect(PLANAR_NODE_SEEDS['kintsugi-fracture']).toBeDefined();
    expect(PLANAR_NODE_SEEDS['ivy-film-festival-2026']).toBeDefined();
    expect(PLANAR_NODE_SEEDS['art-wip']).toBeDefined();
  });

  it('throws when asked to count crossings for an unknown project id', () => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, 1440, 900);
    expect(() =>
      countCrossings({ ...positions, 'not-a-project': [10, 10] }),
    ).toThrow(/Unknown project id/);
  });
});

describe('PLANAR_NODE_SEEDS embedding', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
    ['wide 1920x1080', 1920, 1080],
    ['narrow 320x900', 320, 900],
  ])('has zero segment crossings on %s before simulation', (_label, width, height) => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
    expect(countCrossings(positions)).toBe(0);
  });

  it('nests sandwave-sim strictly inside triangle(open-dungeon, transcribe-plus, attention-max)', () => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, 1200, 800);
    const a = positions['open-dungeon'];
    const b = positions['transcribe-plus'];
    const c = positions['attention-max'];
    const p = positions['sandwave-sim'];

    expect(pointInTriangle(p, a, b, c)).toBe(true);
    expect(pointInTriangle([0, 0], a, b, c)).toBe(false);
  });
});

describe('graph planarity after unperturbed d3-force ticks', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
    ['narrow 320x900', 320, 900],
  ])('maintains zero crossings and >=44px separation after 300 ticks on %s', (_label, width, height) => {
    const initialPositions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
    for (const [id, [sx, sy]] of Object.entries(initialPositions)) {
      expect(sx, `${id} x inside safe canvas`).toBeGreaterThanOrEqual(48);
      expect(sx, `${id} x inside safe canvas`).toBeLessThanOrEqual(width - 48);
      expect(sy, `${id} y inside safe canvas`).toBeGreaterThanOrEqual(48);
      expect(sy, `${id} y inside safe canvas`).toBeLessThanOrEqual(height - 48);
    }
    const sim = createSimulation({
      nodes: projects.map((project) => ({ id: project.id, label: project.shortTitle })),
      links: EDGES.map((edge) => ({
        source: edge.source,
        target: edge.target,
        tags: edge.tags,
      })),
      width,
      height,
      seeds: PLANAR_NODE_SEEDS,
      initialPositions,
    });

    for (let tick = 0; tick < 300; tick += 1) {
      sim.tick();
    }

    const restingPositions: Positions = {};
    for (const node of sim.nodes) {
      restingPositions[node.id] = [node.x, node.y];
    }

    for (let i = 0; i < sim.nodes.length; i += 1) {
      for (let j = i + 1; j < sim.nodes.length; j += 1) {
        const a = sim.nodes[i];
        const b = sim.nodes[j];
        expect(
          Math.hypot(a.x - b.x, a.y - b.y),
          `${a.id} <-> ${b.id} separation`,
        ).toBeGreaterThanOrEqual(44);
      }
    }

    expect(countCrossings(restingPositions)).toBe(0);
    sim.destroy();
  });

  it('returns to zero crossings and >=44px separation after resetLayout', () => {
    const width = 1440;
    const height = 900;
    const sim = createSimulation({
      nodes: projects.map((project) => ({ id: project.id, label: project.shortTitle })),
      links: EDGES.map((edge) => ({
        source: edge.source,
        target: edge.target,
        tags: edge.tags,
      })),
      width,
      height,
      seeds: PLANAR_NODE_SEEDS,
      initialPositions: scaleSeeds(PLANAR_NODE_SEEDS, width, height),
    });

    const node = sim.findNode('attention-max')!;
    sim.dragStart(node);
    sim.dragMove(node.x + 900, node.y + 400);
    sim.tick();
    sim.dragEnd();
    expect(sim.linkStates.some((link) => link.isDetached)).toBe(true);

    sim.resetLayout();
    for (let tick = 0; tick < 300; tick += 1) sim.tick();

    const positions: Positions = {};
    for (const resting of sim.nodes) {
      positions[resting.id] = [resting.x, resting.y];
    }
    for (let i = 0; i < sim.nodes.length; i += 1) {
      for (let j = i + 1; j < sim.nodes.length; j += 1) {
        const a = sim.nodes[i];
        const b = sim.nodes[j];
        expect(
          Math.hypot(a.x - b.x, a.y - b.y),
          `${a.id} <-> ${b.id} separation after reset`,
        ).toBeGreaterThanOrEqual(44);
      }
    }
    expect(countCrossings(positions)).toBe(0);
    sim.destroy();
  });
});
