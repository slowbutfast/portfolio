import { getVisibleTags, HIDDEN_TAGS } from '../data/tagRegistry';
import type { ParadigmTag } from '../types/portfolio';

export interface GraphEdge {
  source: string;
  target: string;
  tags: ParadigmTag[];
}

type Tagged = { id: string; tags: ParadigmTag[] };

/**
 * Derive an undirected edge between two projects if and only if they share at
 * least one visible controlled paradigm tag. Edge labels carry the shared tags.
 * `hiddenTags` is injectable so Studio drafts can preview topology without
 * mutating module state. Output is deterministically sorted.
 */
export function deriveEdges(
  projects: Tagged[],
  hiddenTags: ReadonlySet<ParadigmTag> = HIDDEN_TAGS,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (let i = 0; i < projects.length; i += 1) {
    for (let j = i + 1; j < projects.length; j += 1) {
      const a = projects[i];
      const b = projects[j];
      const shared = getVisibleTags(a.tags, hiddenTags).filter((t) => b.tags.includes(t)).sort();
      if (shared.length > 0) {
        edges.push({ source: a.id, target: b.id, tags: shared });
      }
    }
  }
  return edges.sort((p, q) => {
    const keyP = [p.source, p.target].sort().join('\u0000');
    const keyQ = [q.source, q.target].sort().join('\u0000');
    return keyP < keyQ ? -1 : keyP > keyQ ? 1 : 0;
  });
}