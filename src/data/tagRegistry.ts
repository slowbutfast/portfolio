import type { ParadigmTag } from '../types/portfolio';
import catalogJson from './projects.catalog.json';
import type { ProjectCatalog } from './catalogSchema';

export const catalog = catalogJson as ProjectCatalog;

/** Tags kept latent in graph topology and hidden from UI tag chips. */
export const HIDDEN_TAGS: ReadonlySet<ParadigmTag> = new Set<ParadigmTag>(catalog.hiddenTags);

/** Ordered tag vocabulary from the canonical catalog. */
export const ALL_TAGS: ParadigmTag[] = catalog.tags;

export function getVisibleTags(
  tags: readonly ParadigmTag[],
  hiddenTags: ReadonlySet<ParadigmTag> = HIDDEN_TAGS,
): ParadigmTag[] {
  return tags.filter((tag) => !hiddenTags.has(tag));
}
