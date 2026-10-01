#!/usr/bin/env node
// Headless Playwright capture of a sibling app's index.html into a committed
// src/assets/screenshots/ PNG. Used by scripts/capture-demos.sh to source an
// authentic 1280x720 screenshot for sandwave-sim without a synthetic card.
//
// Usage: node scripts/capture-sandwave.mjs <index.html> <out.png>
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , srcArg, outArg] = process.argv;
if (!srcArg || !outArg) {
  console.error('usage: capture-sandwave.mjs <index.html> <out.png>');
  process.exit(1);
}

const srcPath = resolve(srcArg);
const outPath = resolve(outArg);

await mkdir(dirname(outPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`file://${srcPath}`, { waitUntil: 'load', timeout: 60_000 });
// Give the Chladni simulation a beat to draw its nodal sand pattern.
await page.waitForTimeout(1500);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();
console.log(`capture/sandwave-sim: wrote ${outPath}`);