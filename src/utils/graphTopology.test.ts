import { describe, expect, it } from 'vitest';
import { deriveEdges } from './graphTopology';
import type { ParadigmTag } from '../types/portfolio';

interface TaggedProject {
  id: string;
  tags: ParadigmTag[];
}

const CATALOG: TaggedProject[] = [
  { id: 'open-dungeon', tags: ['Express', 'Vanilla JS', 'LLM', 'Agent Tooling'] },
  { id: 'agentic-resume-builder', tags: ['Agent Tooling', 'LaTeX'] },
  { id: 'pict-climate-risk-viz-chatbot', tags: ['Express', 'LLM', 'Geospatial'] },
  { id: 'transcribe-plus', tags: ['Express', 'Vanilla JS', 'Audio'] },
  { id: 'sandwave-sim', tags: ['Vanilla JS', 'Audio'] },
  { id: 'attention-max', tags: ['Vanilla JS', 'WebExtension'] },
];

const EXPECTED_EDGES: [string, string][] = [
  ['open-dungeon', 'pict-climate-risk-viz-chatbot'],
  ['open-dungeon', 'transcribe-plus'],
  ['open-dungeon', 'sandwave-sim'],
  ['open-dungeon', 'attention-max'],
  ['open-dungeon', 'agentic-resume-builder'],
  ['pict-climate-risk-viz-chatbot', 'transcribe-plus'],
  ['transcribe-plus', 'sandwave-sim'],
  ['transcribe-plus', 'attention-max'],
  ['sandwave-sim', 'attention-max'],
];

describe('graphTopology tag-derived edges', () => {
  it('produces exactly the 9 pinned undirected edges', () => {
    const edges = deriveEdges(CATALOG);
    expect(edges).toHaveLength(9);

    const pairs = edges.map((e) => [e.source, e.target].sort().join('<->')).sort();
    const expected = EXPECTED_EDGES.map(([a, b]) => [a, b].sort().join('<->')).sort();
    expect(pairs).toEqual(expected);
  });

  it('labels each edge with the shared paradigm tags', () => {
    const edges = deriveEdges(CATALOG);
    const byPair = new Map(edges.map((e) => [`${e.source}<->${e.target}`, e.tags]));

    expect(byPair.get('open-dungeon<->pict-climate-risk-viz-chatbot')).toEqual(['Express', 'LLM']);
    expect(byPair.get('open-dungeon<->transcribe-plus')).toEqual(['Express', 'Vanilla JS']);
    expect(byPair.get('transcribe-plus<->sandwave-sim')).toEqual(['Audio', 'Vanilla JS']);
  });

  it('produces no edges when projects share no paradigm tags', () => {
    const isolated: TaggedProject[] = [
      { id: 'a', tags: ['LLM'] },
      { id: 'b', tags: ['Audio'] },
      { id: 'c', tags: ['LaTeX'] },
    ];
    expect(deriveEdges(isolated)).toEqual([]);
  });

  it('does not generate self-loops', () => {
    const edges = deriveEdges(CATALOG);
    for (const e of edges) {
      expect(e.source).not.toBe(e.target);
    }
  });
});