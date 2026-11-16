import type { ParadigmTag } from '../types/portfolio';

export interface GraphEdge {
  source: string;
  target: string;
  tags: ParadigmTag[];
}

type Tagged = { id: string; tags: readonly ParadigmTag[] };

/** Filter tags without touching the catalog or tag registry modules. */
export function getVisibleTagsPure(
  tags: readonly ParadigmTag[],
  hiddenTags: ReadonlySet<ParadigmTag>,
): ParadigmTag[] {
  return tags.filter((tag) => !hiddenTags.has(tag));
}

/**
 * Derive an undirected edge between two projects if and only if they share at
 * least one visible controlled paradigm tag. Edge labels carry the shared tags.
 * This is the pure server-safe core: it has zero catalog/JSON imports so Vercel
 * functions and the dev plugin can share one implementation.
 */
export function deriveEdgesPure(
  projects: readonly Tagged[],
  hiddenTags: ReadonlySet<ParadigmTag>,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (let i = 0; i < projects.length; i += 1) {
    for (let j = i + 1; j < projects.length; j += 1) {
      const a = projects[i];
      const b = projects[j];
      const shared = getVisibleTagsPure(a.tags, hiddenTags)
        .filter((tag) => b.tags.includes(tag))
        .sort();
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
