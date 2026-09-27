import { describe, expect, it } from 'vitest';
import { createSimulation } from './graphSimulation';

const PROJECT_IDS = [
  'open-dungeon',
  'agentic-resume-builder',
  'pict-climate-risk-viz-chatbot',
  'transcribe-plus',
  'sandwave-sim',
  'attention-max',
];

const LINKS: { source: string; target: string }[] = [
  { source: 'open-dungeon', target: 'pict-climate-risk-viz-chatbot' },
  { source: 'open-dungeon', target: 'transcribe-plus' },
  { source: 'open-dungeon', target: 'sandwave-sim' },
  { source: 'open-dungeon', target: 'attention-max' },
  { source: 'open-dungeon', target: 'agentic-resume-builder' },
  { source: 'pict-climate-risk-viz-chatbot', target: 'transcribe-plus' },
  { source: 'transcribe-plus', target: 'sandwave-sim' },
  { source: 'transcribe-plus', target: 'attention-max' },
  { source: 'sandwave-sim', target: 'attention-max' },
];

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