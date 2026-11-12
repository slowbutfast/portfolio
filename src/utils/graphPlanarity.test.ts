import { describe, expect, it } from 'vitest';
import { PLANAR_NODE_SEEDS, scaleSeeds } from '../data/graphSeeds';
import { projects } from '../data/projects';
import { deriveEdges } from '../utils/graphTopology';
import { createSimulation } from '../physics/graphSimulation';

type Point = [number, number];
type Positions = Record<string, Point>;

const EDGES = deriveEdges(projects).map((edge) => ({
  source: edge.source,
  target: edge.target,
}));

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

/** Count proper crossings between edges that do not share an endpoint. */
function countCrossings(positions: Positions): number {
  const segments = EDGES.map((edge) => ({
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

describe('PLANAR_NODE_SEEDS embedding', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
    ['wide 1920x1080', 1920, 1080],
    ['narrow 320x900', 320, 900],
  ])('has zero segment crossings on %s before simulation', (_label, width, height) => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
    expect(EDGES).toHaveLength(9);
    expect(countCrossings(positions)).toBe(0);
  });

  it('nests sandwave-sim strictly inside triangle(open-dungeon, transcribe-plus, attention-max)', () => {
    const positions = scaleSeeds(PLANAR_NODE_SEEDS, 1200, 800);
    const a = positions['open-dungeon'];
    const b = positions['transcribe-plus'];
    const c = positions['attention-max'];
    const p = positions['sandwave-sim'];

    const area = (x: Point, y: Point, z: Point) => cross(x, y, z);
    const total = Math.abs(area(a, b, c));
    const parts =
      Math.abs(area(p, a, b)) + Math.abs(area(p, b, c)) + Math.abs(area(p, c, a));
    expect(parts).toBeCloseTo(total, 6);
  });
});

describe('graph planarity after unperturbed d3-force ticks', () => {
  it.each([
    ['desktop 1440x900', 1440, 900],
    ['mobile 393x852', 393, 852],
  ])('maintains zero crossings after 300 ticks on %s', (_label, width, height) => {
    const initialPositions = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
    const sim = createSimulation({
      nodes: projects.map((project) => ({ id: project.id, label: project.shortTitle })),
      links: EDGES,
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

    expect(countCrossings(restingPositions)).toBe(0);
    sim.destroy();
  });
});
