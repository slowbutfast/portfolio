import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PREVIEW_URL ?? 'http://localhost:5199';
const isPreview = Boolean(process.env.PREVIEW_URL);

// Protected previews answer with Vercel's auth page unless the request carries
// the project's "Protection Bypass for Automation" secret.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || undefined;

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
  // Fails once with a clear message when a preview is behind the auth wall.
  globalSetup: isPreview ? './e2e/global-setup.ts' : undefined,
  use: {
    baseURL,
    // Traces record request headers, so with a bypass secret in play they would
    // leak it to anyone who can download the report. Keep them off in that case.
    trace: bypassSecret ? 'off' : 'on-first-retry',
    extraHTTPHeaders: bypassSecret
      ? {
          'x-vercel-protection-bypass': bypassSecret,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : undefined,
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
