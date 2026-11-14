import type { ParadigmTag } from '../types/portfolio';
import catalogJson from './projects.catalog.json';
import type { ProjectCatalog } from './catalogSchema';

export const catalog = catalogJson as ProjectCatalog;

/** Tags kept latent in graph topology and hidden from UI tag chips. */
export const HIDDEN_TAGS: ReadonlySet<ParadigmTag> = new Set<ParadigmTag>(catalog.hiddenTags);

/**
 * Ordered tag vocabulary in first project-appearance order, matching the
 * pre-refactor `projects.flatMap((project) => project.tags)` derivation so the
 * ControlsOverlay pills keep their original order.
 */
export const ALL_TAGS: ParadigmTag[] = Array.from(
  new Set<ParadigmTag>(catalog.projects.flatMap((project) => project.tags)),
);

export function getVisibleTags(
  tags: readonly ParadigmTag[],
  hiddenTags: ReadonlySet<ParadigmTag> = HIDDEN_TAGS,
): ParadigmTag[] {
  return tags.filter((tag) => !hiddenTags.has(tag));
}
