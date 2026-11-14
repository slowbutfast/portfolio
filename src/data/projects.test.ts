import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ALL_TAGS,
  catalog,
  getVisibleTags,
  HIDDEN_TAGS,
  projects,
} from './projects';
import { PLANAR_NODE_SEEDS } from './graphSeeds';
import { deriveEdges } from '../utils/graphTopology';
import { serializeCatalog, validateCatalog } from './catalogSchema';
import { countSeedCrossings } from '../utils/graphPlanarity';
import { resolveCommand } from '../utils/terminalCommandResolver';
import type { Preview } from '../types/portfolio';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

function assetExists(src: string): boolean {
  const clean = src.replace(/^\/+/, '');
  return existsSync(resolve(repoRoot, clean));
}

const fixture = JSON.parse(
  readFileSync(resolve(repoRoot, 'src/data/__fixtures__/projects.pre-refactor.json'), 'utf8'),
) as {
  projects: Array<{ tags: string[] }>;
  seeds: unknown;
  hiddenTags: string[];
  visibleTags: string[][];
};

describe('golden equivalence with the pre-refactor catalog', () => {
  it('hydrates the exact same projects, seeds, hidden tags, and visible tags', () => {
    expect(projects).toEqual(fixture.projects);
    expect(PLANAR_NODE_SEEDS).toEqual(fixture.seeds);
    expect([...HIDDEN_TAGS]).toEqual(fixture.hiddenTags);
    expect(projects.map((project) => getVisibleTags(project.tags))).toEqual(
      fixture.visibleTags,
    );
  });

  it('derives ALL_TAGS in pre-refactor project-appearance order', () => {
    const expected = Array.from(
      new Set<string>(fixture.projects.flatMap((project) => project.tags)),
    );
    expect(ALL_TAGS).toEqual(expected);
  });

  it('commits projects.catalog.json in canonical serializeCatalog form', () => {
    const raw = readFileSync(resolve(repoRoot, 'src/data/projects.catalog.json'), 'utf8');
    expect(raw).toBe(serializeCatalog(catalog));
  });
});

describe('project catalog contract', () => {
  it('validates the real catalog against the canonical schema', () => {
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('contains unique kebab-case ids', () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('declares a non-empty classification and short title on every project', () => {
    for (const project of projects) {
      expect(project.classification.trim().length, `${project.id} classification`).toBeGreaterThan(0);
      expect(project.shortTitle.trim().length, `${project.id} shortTitle`).toBeGreaterThan(0);
      expect(project.shortTitle.length, `${project.id} shortTitle too long`).toBeLessThanOrEqual(18);
    }
  });

  it('keys seeds by exactly the project ids', () => {
    expect(Object.keys(PLANAR_NODE_SEEDS).sort()).toEqual(
      projects.map((project) => project.id).sort(),
    );
  });

  it('derives a crossing-free edge set from the real catalog', () => {
    const edges = deriveEdges(projects);
    expect(edges.length).toBeGreaterThan(0);
    const positions = Object.fromEntries(
      Object.entries(PLANAR_NODE_SEEDS).map(([id, seed]) => [id, [seed.x, seed.y] as [number, number]]),
    );
    expect(countSeedCrossings(positions, edges, projects.map((project) => project.id))).toBe(0);
  });

  it('defines kintsugi and ivy with their required metadata', () => {
    const kintsugi = projects.find((project) => project.id === 'kintsugi-fracture');
    const ivy = projects.find((project) => project.id === 'ivy-film-festival-2026');
    expect(kintsugi?.shortTitle).toBe('Kintsugi 3D');
    expect(kintsugi?.classification).toBe('PROCEDURAL MESH GENERATION // WEBGL');
    expect(kintsugi?.tags).toEqual(['Graphics', 'art']);
    expect(kintsugi?.repo).toBe('https://github.com/slowbutfast/kintsugi-fracture');
    expect(kintsugi?.liveUrl).toBe('https://kintsugi-fracture.vercel.app/');

    expect(ivy?.shortTitle).toBe('Ivy Film\nFestival');
    expect(ivy?.classification).toBe('STUDENT FILM FESTIVAL // BRAND & WEB');
    expect(ivy?.tags).toEqual(['Design']);
    expect(ivy?.repo).toBeUndefined();
    expect(ivy?.liveUrl).toBe('https://www.ivyfilmfestival.org/');
  });

  it('declares live demo URLs for transcribe-plus and sandwave-sim', () => {
    expect(projects.find((project) => project.id === 'transcribe-plus')?.liveUrl).toBe(
      'https://transcribe-plus-frontend.vercel.app/',
    );
    expect(projects.find((project) => project.id === 'sandwave-sim')?.liveUrl).toBe(
      'https://sandwave-sim.vercel.app/',
    );
  });

  it('treats repo as optional while engineering projects declare a GitHub URL', () => {
    for (const project of projects) {
      if (project.id === 'ivy-film-festival-2026' || project.id === 'art-wip') {
        expect(project.repo).toBeUndefined();
        continue;
      }
      expect(project.repo, `${project.id} repo`).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('configures art-wip with art/WIP metadata, /art/ liveUrl, and review flags', () => {
    const art = projects.find((project) => project.id === 'art-wip');
    expect(art?.title).toBe('art');
    expect(art?.shortTitle).toBe('art');
    expect(art?.summary).toBe('WIP');
    expect(art?.tags).toEqual(['art']);
    expect(getVisibleTags(art?.tags ?? [])).toEqual([]);
    expect(art?.liveUrl).toBe('/art/');
    expect(art?.rainbowOnInteract).toBe(true);
    expect(art?.omitIndex).toBe(true);
    expect(art?.hideOverview).toBe(true);
    expect(art?.revealLabelOnInspect).toBe(true);
    expect(art?.previews).toEqual([]);
  });

  it('keeps sandwave-sim at the acoustic tags plus implicit art tag', () => {
    expect(projects.find((project) => project.id === 'sandwave-sim')?.tags).toEqual([
      'Vanilla JS',
      'Audio',
      'art',
    ]);
  });

  it('declares a discriminated preview union on every project with media', () => {
    for (const project of projects) {
      if (project.id === 'art-wip') {
        expect(project.previews).toEqual([]);
        continue;
      }
      expect(project.previews.length).toBeGreaterThan(0);
      for (const preview of project.previews) {
        expect(['terminal', 'video', 'screenshot', 'linkout', 'wip']).toContain(preview.kind);
        if (preview.kind === 'video' || preview.kind === 'screenshot') {
          expect((preview as Extract<Preview, { kind: 'video' | 'screenshot' }>).src).toBeTruthy();
        }
      }
    }
  });

  it('points every video/screenshot src at a bundler-imported asset under src/assets/', () => {
    for (const project of projects) {
      for (const preview of project.previews) {
        if (preview.kind === 'video' || preview.kind === 'screenshot') {
          const { src } = preview as Extract<Preview, { kind: 'video' | 'screenshot' }>;
          expect(assetExists(src), `${project.id} missing asset: ${src}`).toBe(true);
        }
      }
    }
  });

  it('resolves every terminal command chip to a valid captured entry', () => {
    for (const project of projects) {
      if (!project.terminalDemo) continue;
      expect(project.terminalDemo.commands.length).toBeGreaterThan(0);
      for (const chip of project.terminalDemo.commands) {
        const resolved = resolveCommand(project.terminalDemo.commands, chip.command);
        expect(typeof resolved.exitCode, `${project.id}: ${chip.command}`).toBe('number');
        expect(resolved.output.length, `${project.id}: ${chip.command}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps art-wip disconnected from permanent edges', () => {
    const edges = deriveEdges(projects);
    expect(edges.some((edge) => edge.source === 'art-wip' || edge.target === 'art-wip')).toBe(
      false,
    );
  });
});
