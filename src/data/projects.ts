import type { ParadigmTag, Preview, ProjectData, TerminalDemo } from '../types/portfolio';
import { validateCatalog, type CatalogPreview, type ProjectCatalog } from './catalogSchema';
import catalogJson from './projects.catalog.json';
import { ALL_TAGS, catalog, HIDDEN_TAGS, getVisibleTags } from './tagRegistry';

export { ALL_TAGS, HIDDEN_TAGS, catalog, getVisibleTags };

const catalogData = catalogJson as ProjectCatalog;

interface CapturedDemo {
  prompt: string;
  commands: TerminalDemo['commands'];
}

// Narrow globs: only real media and captured terminal demos become modules.
const assetModules = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const capturedModules = import.meta.glob('./captured/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, CapturedDemo>;

const ASSET_PREFIX = '../assets/';
const CAPTURED_PREFIX = './captured/';

const assetKeys = new Set(
  Object.keys(assetModules).map((key) => key.slice(ASSET_PREFIX.length)),
);
const capturedKeys = new Set(
  Object.keys(capturedModules)
    .filter((key) => key.startsWith(CAPTURED_PREFIX) && key.endsWith('.json'))
    .map((key) => key.slice(CAPTURED_PREFIX.length, -'.json'.length)),
);

const catalogErrors = validateCatalog(catalogData, { assetKeys, capturedKeys });
if (catalogErrors.length > 0) {
  throw new Error(`Invalid projects.catalog.json:\n- ${catalogErrors.join('\n- ')}`);
}

function resolveAsset(assetKey: string): string {
  const url = assetModules[`${ASSET_PREFIX}${assetKey}`];
  if (!url) throw new Error(`Unknown assetKey "${assetKey}"`);
  return url;
}

function hydratePreview(preview: CatalogPreview): Preview {
  switch (preview.kind) {
    case 'screenshot':
      return { kind: 'screenshot', src: resolveAsset(preview.assetKey), caption: preview.caption };
    case 'video': {
      const hydrated: Extract<Preview, { kind: 'video' }> = {
        kind: 'video',
        src: resolveAsset(preview.assetKey),
        caption: preview.caption,
      };
      if (preview.poster) hydrated.poster = resolveAsset(preview.poster);
      return hydrated;
    }
    default:
      return preview;
  }
}

function hydrateTerminalDemo(demo: {
  capturedKey: string;
  prompt: string;
}): TerminalDemo {
  const captured = capturedModules[`${CAPTURED_PREFIX}${demo.capturedKey}.json`];
  if (!captured) throw new Error(`Unknown capturedKey "${demo.capturedKey}"`);
  return { prompt: demo.prompt, commands: captured.commands };
}

function hydrateProject(project: ProjectCatalog['projects'][number]): ProjectData {
  const hydrated: ProjectData = {
    id: project.id,
    title: project.title,
    shortTitle: project.shortTitle,
    summary: project.summary,
    classification: project.classification,
    tags: [...project.tags],
    previews: project.previews.map(hydratePreview),
  };
  if (project.repo !== undefined) hydrated.repo = project.repo;
  if (project.liveUrl !== undefined) hydrated.liveUrl = project.liveUrl;
  if (project.rainbowOnInteract) hydrated.rainbowOnInteract = true;
  if (project.omitIndex) hydrated.omitIndex = true;
  if (project.hideOverview) hydrated.hideOverview = true;
  if (project.revealLabelOnInspect) hydrated.revealLabelOnInspect = true;
  if (project.terminalDemo) hydrated.terminalDemo = hydrateTerminalDemo(project.terminalDemo);
  return hydrated;
}

export const projects: ProjectData[] = catalogData.projects.map(hydrateProject);

export function getProjectById(id: string): ProjectData | undefined {
  return projects.find((project) => project.id === id);
}

export type { ParadigmTag };
