import { copyFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const isPreview = Boolean(process.env.PREVIEW_URL);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const realCatalog = resolve(repoRoot, 'src/data/projects.catalog.json');

// Studio CRUD must never touch the developer's working tree. Each run boots an
// isolated dev server pointed at a temporary copy of the canonical catalog.
const tempDir = mkdtempSync(join(tmpdir(), 'portfolio-studio-e2e-'));
mkdirSync(tempDir, { recursive: true });
const tempCatalog = join(tempDir, 'projects.catalog.json');
copyFileSync(realCatalog, tempCatalog);
process.env.PORTFOLIO_STUDIO_CATALOG_PATH = tempCatalog;
process.env.PORTFOLIO_STUDIO_E2E_REAL_CATALOG = realCatalog;

export default defineConfig({
  testDir: '.',
  testMatch: 'studio.spec.ts',
  timeout: 45_000,
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PREVIEW_URL ?? 'http://localhost:5299',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  ...(isPreview
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --port 5299 --strictPort',
          url: 'http://localhost:5299',
          reuseExistingServer: false,
          timeout: 60_000,
          env: {
            ...process.env,
            PORTFOLIO_STUDIO_WRITE: '1',
            PORTFOLIO_STUDIO_CATALOG_PATH: tempCatalog,
          },
        },
      }),
});
