import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  commitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  build: {
    // Emit every font subset as a real file. Inlined `data:` URIs would be
    // blocked by vercel.json's `default-src 'self'` CSP.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'e2e/**'],
  },
});
