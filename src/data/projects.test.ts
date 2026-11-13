import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { projects } from './projects';
import { deriveEdges } from '../utils/graphTopology';
import { resolveCommand } from '../utils/terminalCommandResolver';
import type { Preview } from '../types/portfolio';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

function assetExists(src: string): boolean {
  const clean = src.replace(/^\/+/, '');
  return existsSync(resolve(repoRoot, clean));
}

describe('project catalog contract', () => {
  it('contains 8 projects with unique non-empty ids', () => {
    expect(projects).toHaveLength(8);
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('declares a non-empty classification on all 8 projects', () => {
    expect(projects).toHaveLength(8);
    for (const p of projects) {
      expect(typeof p.classification, `${p.id} classification type`).toBe('string');
      expect(p.classification.trim().length, `${p.id} classification empty`).toBeGreaterThan(0);
    }
  });

  it('declares a mandatory non-empty shortTitle on all 8 projects', () => {
    expect(projects).toHaveLength(8);
    for (const p of projects) {
      expect(typeof p.shortTitle, `${p.id} shortTitle type`).toBe('string');
      expect(p.shortTitle.trim().length, `${p.id} shortTitle empty`).toBeGreaterThan(0);
      expect(p.shortTitle.length, `${p.id} shortTitle too long`).toBeLessThanOrEqual(16);
    }
    expect(projects.map((p) => p.shortTitle)).toEqual([
      'OpenDungeon',
      'Resume Builder',
      'Climate Risk',
      'Transcribe+',
      'Sandwave',
      'AttentionMax',
      'Kintsugi 3D',
      'Ivy Film Fest',
    ]);
  });

  it('preserves the pinned catalog order and ids', () => {
    expect(projects.map((p) => p.id)).toEqual([
      'open-dungeon',
      'agentic-resume-builder',
      'pict-climate-risk-viz-chatbot',
      'transcribe-plus',
      'sandwave-sim',
      'attention-max',
      'kintsugi-fracture',
      'ivy-film-festival-2026',
    ]);
  });

  it('defines the new projects with the required classification and summary', () => {
    const kintsugi = projects.find((p) => p.id === 'kintsugi-fracture');
    const ivy = projects.find((p) => p.id === 'ivy-film-festival-2026');
    expect(kintsugi?.shortTitle).toBe('Kintsugi 3D');
    expect(kintsugi?.classification).toBe('PROCEDURAL MESH GENERATION // WEBGL');
    expect(kintsugi?.tags).toEqual(['Graphics']);
    expect(kintsugi?.repo).toBe('https://github.com/slowbutfast/kintsugi-fracture');
    expect(kintsugi?.liveUrl).toBe('https://kintsugi-fracture.vercel.app/');

    expect(ivy?.shortTitle).toBe('Ivy Film Fest');
    expect(ivy?.classification).toBe('STUDENT FILM FESTIVAL // BRAND & WEB');
    expect(ivy?.summary).toBe(
      'Web design, visual identity, and interactive screening program for the student-run Ivy Film Festival.',
    );
    expect(ivy?.tags).toEqual(['Design']);
    expect(ivy?.repo).toBeUndefined();
    expect(ivy?.liveUrl).toBe('https://www.ivyfilmfestival.org/');
  });

  it('declares live demo URLs for transcribe-plus and sandwave-sim', () => {
    const transcribe = projects.find((p) => p.id === 'transcribe-plus');
    const sandwave = projects.find((p) => p.id === 'sandwave-sim');
    expect(transcribe?.liveUrl).toBe('https://transcribe-plus-frontend.vercel.app/');
    expect(sandwave?.liveUrl).toBe('https://sandwave-sim.vercel.app/');
  });

  it('treats repo as optional while every other project declares a GitHub URL', () => {
    for (const p of projects) {
      if (p.id === 'ivy-film-festival-2026') {
        expect(p.repo).toBeUndefined();
        continue;
      }
      expect(typeof p.repo, `${p.id} repo`).toBe('string');
      expect(p.repo).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('keeps sandwave-sim at exactly the two acoustic tags', () => {
    const sandwave = projects.find((p) => p.id === 'sandwave-sim');
    expect(sandwave?.tags).toEqual(['Vanilla JS', 'Audio']);
  });


  it('declares a discriminated preview union on every project', () => {
    for (const p of projects) {
      expect(p.previews.length).toBeGreaterThan(0);
      for (const preview of p.previews) {
        expect(['terminal', 'video', 'screenshot', 'linkout']).toContain(preview.kind);
        if (preview.kind === 'video' || preview.kind === 'screenshot') {
          expect((preview as Extract<Preview, { kind: 'video' | 'screenshot' }>).src).toBeTruthy();
        }
      }
    }
  });

  it('points every video/screenshot src at a bundler-imported asset under src/assets/', () => {
    for (const p of projects) {
      for (const preview of p.previews) {
        if (preview.kind === 'video' || preview.kind === 'screenshot') {
          const { src } = preview as Extract<Preview, { kind: 'video' | 'screenshot' }>;
          expect(assetExists(src), `${p.id} missing asset: ${src}`).toBe(true);
        }
      }
    }
  });

  it('resolves every terminal command chip to a valid captured entry', () => {
    for (const p of projects) {
      if (!p.terminalDemo) continue;
      expect(p.terminalDemo.commands.length).toBeGreaterThan(0);
      for (const chip of p.terminalDemo.commands) {
        const resolved = resolveCommand(p.terminalDemo.commands, chip.command);
        expect(typeof resolved.exitCode, `${p.id}: ${chip.command}`).toBe('number');
        expect(resolved.output.length, `${p.id}: ${chip.command}`).toBeGreaterThan(0);
      }
    }
  });

  it('derives exactly the pinned 13 edges from the real catalog', () => {
    const edges = deriveEdges(projects);
    expect(edges).toHaveLength(13);
    const keys = edges.map((e) => [e.source, e.target].sort().join('<->')).sort();
    expect(keys).toEqual(
      [
        'agentic-resume-builder<->attention-max',
        'agentic-resume-builder<->ivy-film-festival-2026',
        'agentic-resume-builder<->open-dungeon',
        'attention-max<->ivy-film-festival-2026',
        'attention-max<->kintsugi-fracture',
        'attention-max<->open-dungeon',
        'attention-max<->sandwave-sim',
        'attention-max<->transcribe-plus',
        'open-dungeon<->pict-climate-risk-viz-chatbot',
        'open-dungeon<->sandwave-sim',
        'open-dungeon<->transcribe-plus',
        'pict-climate-risk-viz-chatbot<->transcribe-plus',
        'sandwave-sim<->transcribe-plus',
      ].sort(),
    );
  });
});