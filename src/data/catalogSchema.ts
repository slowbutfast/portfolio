import type { ParadigmTag } from '../types/portfolio';
import { deriveEdges } from '../utils/graphTopology';
import { countSeedCrossings, type Positions } from '../utils/graphPlanarity';

export const PROJECT_ID_PATTERN = /^[a-z0-9-]+$/;
export const RESERVED_PROJECT_ID = 'art-wip';
export const RESERVED_TAG = 'art';
export const MAX_CATALOG_BYTES = 256 * 1024;

export type CatalogPreview =
  | { kind: 'terminal'; label: string }
  | { kind: 'video'; assetKey: string; poster?: string; caption: string }
  | { kind: 'screenshot'; assetKey: string; caption: string }
  | { kind: 'wip'; label: string }
  | { kind: 'linkout'; url: string; label: string };

export interface CatalogTerminalDemo {
  capturedKey: string;
  prompt: string;
}

export interface CatalogProject {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  classification: string;
  tags: ParadigmTag[];
  repo?: string;
  liveUrl?: string;
  rainbowOnInteract?: boolean;
  omitIndex?: boolean;
  hideOverview?: boolean;
  revealLabelOnInspect?: boolean;
  previews: CatalogPreview[];
  terminalDemo?: CatalogTerminalDemo;
}

export interface ProjectCatalog {
  tags: ParadigmTag[];
  hiddenTags: ParadigmTag[];
  projects: CatalogProject[];
  seeds: Record<string, { x: number; y: number }>;
}

export interface CatalogRegistries {
  assetKeys?: ReadonlySet<string>;
  capturedKeys?: ReadonlySet<string>;
}

const PROJECT_FIELD_ORDER = [
  'id',
  'title',
  'shortTitle',
  'summary',
  'classification',
  'tags',
  'repo',
  'liveUrl',
  'rainbowOnInteract',
  'omitIndex',
  'hideOverview',
  'revealLabelOnInspect',
  'previews',
  'terminalDemo',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Accept only `https:` URLs or site-relative `/` paths (never `//host`). */
export function isSafeLink(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  if (value.includes('\\') || /[\s]/.test(value)) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePreview(
  preview: unknown,
  index: number,
  projectId: string,
  errors: string[],
  registries: CatalogRegistries,
): void {
  const prefix = `projects[${projectId}].previews[${index}]`;
  if (!isRecord(preview)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  switch (preview.kind) {
    case 'terminal':
    case 'wip':
      if (!isNonEmptyString(preview.label)) errors.push(`${prefix}.label is required`);
      break;
    case 'screenshot':
    case 'video':
      if (!isNonEmptyString(preview.assetKey)) {
        errors.push(`${prefix}.assetKey is required`);
      } else if (registries.assetKeys && !registries.assetKeys.has(preview.assetKey)) {
        errors.push(`${prefix}.assetKey "${preview.assetKey}" is not a bundled asset`);
      }
      if (!isNonEmptyString(preview.caption)) errors.push(`${prefix}.caption is required`);
      if (preview.poster !== undefined && !isNonEmptyString(preview.poster)) {
        errors.push(`${prefix}.poster must be a non-empty string`);
      }
      break;
    case 'linkout':
      if (!isNonEmptyString(preview.label)) errors.push(`${prefix}.label is required`);
      if (!isSafeLink(preview.url)) errors.push(`${prefix}.url must be https: or a / path`);
      break;
    default:
      errors.push(`${prefix}.kind must be terminal, video, screenshot, wip, or linkout`);
  }
}

/** Pure structural/semantic validation shared by the dev plugin and hydrator. */
export function validateCatalog(input: unknown, registries: CatalogRegistries = {}): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ['catalog must be a JSON object'];

  const tags = input.tags;
  const hiddenTags = input.hiddenTags;
  const projects = input.projects;
  const seeds = input.seeds;

  if (!Array.isArray(tags) || tags.length === 0) {
    errors.push('tags must be a non-empty array');
  }
  const tagSet = new Set<string>();
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (!isNonEmptyString(tag)) {
        errors.push('tags entries must be non-empty strings');
      } else if (tagSet.has(tag)) {
        errors.push(`duplicate tag "${tag}"`);
      } else {
        tagSet.add(tag);
      }
    }
  }

  const hiddenSet = new Set<string>();
  if (!Array.isArray(hiddenTags)) {
    errors.push('hiddenTags must be an array');
  } else {
    for (const tag of hiddenTags) {
      if (!isNonEmptyString(tag)) {
        errors.push('hiddenTags entries must be non-empty strings');
      } else if (hiddenSet.has(tag)) {
        errors.push(`duplicate hidden tag "${tag}"`);
      } else {
        hiddenSet.add(tag);
      }
      if (!tagSet.has(tag)) errors.push(`hidden tag "${String(tag)}" is not declared in tags`);
    }
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    errors.push('projects must be a non-empty array');
  }
  const projectIds = new Set<string>();
  if (Array.isArray(projects)) {
    projects.forEach((project, index) => {
      if (!isRecord(project)) {
        errors.push(`projects[${index}] must be an object`);
        return;
      }
      const id = project.id;
      if (!isNonEmptyString(id) || !PROJECT_ID_PATTERN.test(id)) {
        errors.push(`projects[${index}].id must match ${PROJECT_ID_PATTERN}`);
      } else if (projectIds.has(id)) {
        errors.push(`duplicate project id "${id}"`);
      } else {
        projectIds.add(id);
      }
      const label = isNonEmptyString(id) ? id : String(index);
      for (const field of ['title', 'shortTitle', 'summary', 'classification'] as const) {
        if (!isNonEmptyString(project[field])) {
          errors.push(`projects[${label}].${field} must be a non-empty string`);
        }
      }
      if (project.repo !== undefined && !isSafeLink(project.repo)) {
        errors.push(`projects[${label}].repo must be https: or a / path`);
      }
      if (project.liveUrl !== undefined && !isSafeLink(project.liveUrl)) {
        errors.push(`projects[${label}].liveUrl must be https: or a / path`);
      }
      for (const flag of [
        'rainbowOnInteract',
        'omitIndex',
        'hideOverview',
        'revealLabelOnInspect',
      ] as const) {
        if (project[flag] !== undefined && typeof project[flag] !== 'boolean') {
          errors.push(`projects[${label}].${flag} must be a boolean`);
        }
      }
      if (!Array.isArray(project.tags)) {
        errors.push(`projects[${label}].tags must be an array`);
      } else {
        for (const tag of project.tags) {
          if (!isNonEmptyString(tag)) {
            errors.push(`projects[${label}].tags entries must be non-empty strings`);
          } else if (!tagSet.has(tag)) {
            errors.push(`projects[${label}].tags contains undeclared tag "${tag}"`);
          }
        }
      }
      if (!Array.isArray(project.previews)) {
        errors.push(`projects[${label}].previews must be an array`);
      } else {
        project.previews.forEach((preview, previewIndex) => {
          validatePreview(preview, previewIndex, label, errors, registries);
        });
      }
      if (project.terminalDemo !== undefined) {
        const demo = project.terminalDemo;
        if (!isRecord(demo)) {
          errors.push(`projects[${label}].terminalDemo must be an object`);
        } else {
          if (!isNonEmptyString(demo.capturedKey)) {
            errors.push(`projects[${label}].terminalDemo.capturedKey is required`);
          } else if (
            registries.capturedKeys &&
            !registries.capturedKeys.has(demo.capturedKey)
          ) {
            errors.push(
              `projects[${label}].terminalDemo.capturedKey "${demo.capturedKey}" is not a captured demo`,
            );
          }
          if (!isNonEmptyString(demo.prompt)) {
            errors.push(`projects[${label}].terminalDemo.prompt is required`);
          }
        }
      }
    });
  }

  if (!projectIds.has(RESERVED_PROJECT_ID)) {
    errors.push(`reserved project "${RESERVED_PROJECT_ID}" must remain in projects`);
  }
  if (!tagSet.has(RESERVED_TAG) || !hiddenSet.has(RESERVED_TAG)) {
    errors.push(`reserved tag "${RESERVED_TAG}" must remain in tags and hiddenTags`);
  }

  if (!isRecord(seeds)) {
    errors.push('seeds must be an object');
  } else {
    const seedIds = Object.keys(seeds);
    for (const id of seedIds) {
      if (!projectIds.has(id)) errors.push(`seeds contains unknown project id "${id}"`);
      const seed = seeds[id];
      if (
        !isRecord(seed) ||
        typeof seed.x !== 'number' ||
        typeof seed.y !== 'number' ||
        !Number.isFinite(seed.x) ||
        !Number.isFinite(seed.y) ||
        seed.x < 0 ||
        seed.x > 1 ||
        seed.y < 0 ||
        seed.y > 1
      ) {
        errors.push(`seeds["${id}"] must have finite x/y in [0, 1]`);
      }
    }
    for (const id of projectIds) {
      if (!(id in seeds)) errors.push(`seeds is missing project id "${id}"`);
    }
    if (errors.length === 0 && Array.isArray(projects)) {
      // Every shape invariant passed above, so the cast is safe; reuse the
      // production edge derivation instead of maintaining a second copy.
      const edges = deriveEdges(
        projects as Array<{ id: string; tags: string[] }>,
        hiddenSet,
      );
      const positions: Positions = {};
      for (const [id, seed] of Object.entries(seeds)) {
        if (isRecord(seed) && typeof seed.x === 'number' && typeof seed.y === 'number') {
          positions[id] = [seed.x, seed.y];
        }
      }
      if (countSeedCrossings(positions, edges) > 0) {
        errors.push('seeds produce crossing graph edges; a planar layout is required');
      }
    }
  }

  return errors;
}

function orderedPreview(preview: CatalogPreview): Record<string, unknown> {
  switch (preview.kind) {
    case 'terminal':
    case 'wip':
      return { kind: preview.kind, label: preview.label };
    case 'screenshot':
      return { kind: preview.kind, assetKey: preview.assetKey, caption: preview.caption };
    case 'video':
      return preview.poster === undefined
        ? { kind: preview.kind, assetKey: preview.assetKey, caption: preview.caption }
        : {
            kind: preview.kind,
            assetKey: preview.assetKey,
            poster: preview.poster,
            caption: preview.caption,
          };
    case 'linkout':
      return { kind: preview.kind, url: preview.url, label: preview.label };
  }
}

function orderedProject(project: CatalogProject): Record<string, unknown> {
  const source = project as unknown as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  for (const field of PROJECT_FIELD_ORDER) {
    const value = source[field];
    if (value === undefined) continue;
    if (field === 'previews' && Array.isArray(value)) {
      ordered.previews = (value as CatalogPreview[]).map(orderedPreview);
    } else if (field === 'terminalDemo' && isRecord(value)) {
      ordered.terminalDemo = {
        capturedKey: value.capturedKey,
        prompt: value.prompt,
      };
    } else {
      ordered[field] = value;
    }
  }
  return ordered;
}

/**
 * Deterministic canonical formatting: stable top-level key order, sorted tag
 * and seed keys, stable project field order, 2-space indent, trailing newline.
 */
export function serializeCatalog(catalog: ProjectCatalog): string {
  const ordered = {
    tags: [...catalog.tags].sort(),
    hiddenTags: [...catalog.hiddenTags].sort(),
    projects: catalog.projects.map(orderedProject),
    seeds: Object.fromEntries(
      Object.keys(catalog.seeds)
        .sort()
        .map((id) => [id, { x: catalog.seeds[id].x, y: catalog.seeds[id].y }]),
    ),
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}
