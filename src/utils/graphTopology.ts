import { HIDDEN_TAGS } from '../data/tagRegistry';
import type { ParadigmTag } from '../types/portfolio';
import { deriveEdgesPure, type GraphEdge } from './graphEdges';

export type { GraphEdge } from './graphEdges';

type Tagged = { id: string; tags: ParadigmTag[] };

/**
 * Client-facing wrapper around the pure edge core. Defaults to the catalog's
 * hidden tags so callers keep their historical signature; Studio passes its
 * draft `hiddenTags` explicitly for live topology previews.
 */
export function deriveEdges(
  projects: Tagged[],
  hiddenTags: ReadonlySet<ParadigmTag> = HIDDEN_TAGS,
): GraphEdge[] {
  return deriveEdgesPure(projects, hiddenTags);
}
