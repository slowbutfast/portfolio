import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT_URL = new URL('../public/assets/screenshots/', import.meta.url);
const OUT_DIR = fileURLToPath(OUT_URL);

// Only projects whose catalog entry declares a `screenshot` preview get a
// generated card. Keep this list in sync with src/data/projects.ts so the
// committed public/assets/screenshots/ tree never accumulates dead images.
const PROJECTS = [
  {
    id: 'open-dungeon',
    title: 'OpenDungeon',
    summary: 'Generative text-adventure engine with a 20-tool MCP server and OAuth-gated multiplayer canvas.',
    tags: ['Express', 'Vanilla JS', 'LLM', 'Agent Tooling'],
    accent: '#0f172a',
    motif: 'dungeon',
  },
  {
    id: 'pict-climate-risk-viz-chatbot',
    title: 'PICT Climate Risk Viz',
    summary: 'Geospatial climate-risk chat and raster visualization built on an Express + React 19 backend.',
    tags: ['Express', 'LLM', 'Geospatial'],
    accent: '#1e40af',
    motif: 'map',
  },
  {
    id: 'sandwave-sim',
    title: 'Sandwave Sim',
    summary: 'Vanilla JS Chladni plate acoustic simulator rendering nodal-line sand patterns with Web Audio.',
    tags: ['Vanilla JS', 'Audio'],
    accent: '#581c87',
    motif: 'plate',
  },
  {
    id: 'attention-max',
    title: 'Attention Max',
    summary: 'Firefox MV3 extension that gamifies focus sessions with a popup timer and options dashboard.',
    tags: ['Vanilla JS', 'WebExtension'],
    accent: '#9a3412',
    motif: 'focus',
  },
];

const MOTIFS = {
  dungeon: (c) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M40 30h80v40h40v100H40z" fill="none" stroke="${c}" stroke-width="3"/><circle cx="120" cy="70" r="6" fill="${c}"/><path d="M80 170v-30M120 170v-60" stroke="${c}" stroke-width="3"/></svg>`,
  map: (c) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M100 30l-40 25-30-15v110l30 15 40-25 40 25 30-15V60l-30 15z" fill="none" stroke="${c}" stroke-width="3"/><path d="M60 55v110M140 75v110" stroke="${c}" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  plate: (c) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="70" fill="none" stroke="${c}" stroke-width="3"/><path d="M30 100h140M100 30v140" stroke="${c}" stroke-width="2" opacity="0.7"/><circle cx="100" cy="100" r="30" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/></svg>`,
  focus: (c) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="70" fill="none" stroke="${c}" stroke-width="3"/><path d="M100 30v30M100 140v30M30 100h30M140 100h30" stroke="${c}" stroke-width="3"/><circle cx="100" cy="100" r="14" fill="${c}"/></svg>`,
};

function cardHtml(p) {
  const motif = MOTIFS[p.motif](p.accent);
  const tags = p.tags.map((t) => `<span style="border:1px solid ${p.accent};color:${p.accent};border-radius:999px;padding:3px 10px;font-size:13px;letter-spacing:0.04em;">${t}</span>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 750px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #0d0d0f; color: #f5f5f4; display: flex; }
    .panel { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 48px; background: radial-gradient(900px 500px at 85% 0%, ${p.accent}26, transparent 60%); }
    .top { display: flex; align-items: center; gap: 12px; font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase; color: #a8a29e; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: ${p.accent}; }
    h1 { font-size: 54px; font-weight: 700; letter-spacing: -0.02em; margin-top: 18px; }
    .summary { margin-top: 16px; font-size: 19px; line-height: 1.55; color: #d6d3d1; max-width: 620px; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
    .foot { display: flex; align-items: center; gap: 14px; color: #78716c; font-size: 14px; }
    .art { width: 420px; display: flex; align-items: center; justify-content: center; }
  </style></head><body>
    <div class="panel">
      <div class="top"><span class="dot"></span><span>portfolio / project preview</span></div>
      <div><h1>${p.title}</h1><p class="summary">${p.summary}</p><div class="tags">${tags}</div></div>
      <div class="foot">${p.id} · paradigm tags · 2026</div>
    </div>
    <div class="art">${motif}</div>
  </body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 2 });
await mkdir(OUT_DIR, { recursive: true });
for (const p of PROJECTS) {
  await page.setContent(cardHtml(p), { waitUntil: 'networkidle' });
  const out = new URL(`./${p.id}.png`, OUT_URL);
  await page.screenshot({ path: out.pathname, type: 'png' });
  console.log(`wrote ${out.pathname}`);
}
await browser.close();