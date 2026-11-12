import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { resolveCommitHash } from './src/utils/commitHash';

// Vercel's system variable first, then a local checkout, then `dev`. Git's
// stderr is suppressed so builds without `.git` do not log a fatal error.
const commitHash = resolveCommitHash(process.env, () =>
  execSync('git rev-parse --short HEAD', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
);

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
