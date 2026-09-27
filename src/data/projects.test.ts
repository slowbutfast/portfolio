import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { projects } from './projects';
import { deriveEdges } from '../utils/graphTopology';
import { resolveCommand } from '../utils/terminalCommandResolver';
import type { Preview } from '../types/portfolio';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));

function assetExists(src: string): boolean {
  const clean = src.replace(/^\/+/, '');
  return existsSync(resolve(publicDir, clean));
}

describe('project catalog contract', () => {
  it('contains 6 projects with unique non-empty ids', () => {
    expect(projects).toHaveLength(6);
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
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

  it('points every video/screenshot src at a file that exists under public/', () => {
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

  it('derives exactly the pinned 9 edges from the real catalog', () => {
    const edges = deriveEdges(projects);
    expect(edges).toHaveLength(9);
    const keys = edges.map((e) => [e.source, e.target].sort().join('<->')).sort();
    expect(keys).toEqual(
      [
        'agentic-resume-builder<->open-dungeon',
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