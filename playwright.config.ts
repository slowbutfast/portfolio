import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PREVIEW_URL ?? 'http://localhost:5199';
const isPreview = Boolean(process.env.PREVIEW_URL);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // A single worker avoids two simultaneous WebServer/dev-server handshakes
  // racing for port 5199 (ECONNREFUSED) across the desktop and mobile projects.
  workers: 1,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // When PREVIEW_URL is set, point the suite at a live Vercel edge preview
  // deployment instead of booting a local dev server.
  ...(isPreview
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --port 5199 --strictPort',
          url: 'http://localhost:5199',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
