import { describe, expect, it } from 'vitest';
import { PLANAR_NODE_SEEDS, scaleSeeds } from '../data/graphSeeds';
import { projects } from '../data/projects';
import { deriveEdges, type GraphEdge } from '../utils/graphTopology';
import { createSimulation } from '../physics/graphSimulation';

type Point = [number, number];
type Positions = Record<string, Point>;

const PROJECT_IDS = projects.map((project) => project.id);
const EDGES: GraphEdge[] = deriveEdges(projects);

function cross(origin: Point, a: Point, b: Point): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function properIntersection(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Count proper crossings; unknown and missing ids are hard errors. */
function countCrossings(positions: Positions, edges: GraphEdge[] = EDGES): number {
  const known = new Set(PROJECT_IDS);
  for (const id of Object.keys(positions)) {
    if (!known.has(id)) throw new Error(`Unknown project id in position map: ${id}`);
  }
  for (const edge of edges) {
    if (!positions[edge.source] || !positions[edge.target]) {
      throw new Error(`Missing position for edge ${edge.source} <-> ${edge.target}`);
    }
  }

  const segments = edges.map((edge) => ({
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

describe('8-project planar catalog', () => {
  it('has exactly 8 projects and 13 tag-derived edges', () => {
    expect(projects).toHaveLength(8);
    expect(EDGES).toHaveLength(13);
    expect(projects).toHaveLength(PROJECT_IDS.length);
    expect(new Set(PROJECT_IDS).size).toBe(PROJECT_IDS.length);
  });

  it('gives every project at least one graph connection', () => {
    const degree = new Map<string, number>(PROJECT_IDS.map((id) => [id, 0]));
    for (const edge of EDGES) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
    for (const id of PROJECT_IDS) {
      expect(degree.get(id), `${id} degree`).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps sandwave-sim on only the acoustic tags and disconnected from kintsugi', () => {
    const sandwave = projects.find((project) => project.id === 'sandwave-sim');
    expect(sandwave?.tags).toEqual(['Vanilla JS', 'Audio']);
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

    const total = Math.abs(cross(a, b, c));
    const parts =
      Math.abs(cross(p, a, b)) + Math.abs(cross(p, b, c)) + Math.abs(cross(p, c, a));
    expect(parts).toBeCloseTo(total, 6);
  });
});

describe('graph planarity after unperturbed d3-force ticks', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
  ])('maintains zero crossings and >=44px separation after 300 ticks on %s', (_label, width, height) => {
    const initialPositions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
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
});
