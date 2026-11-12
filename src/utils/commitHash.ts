/**
 * Resolve the build-time commit hash exposed as `__COMMIT_HASH__`.
 *
 * Order (never throws):
 *   1. first 7 characters of a non-empty VERCEL_GIT_COMMIT_SHA (Git-integration builds)
 *   2. trimmed output of `runGit()` (local builds with a checkout)
 *   3. the literal `dev` (CLI uploads and other builds without `.git`)
 *
 * `runGit` is injected so each branch is unit-testable without git.
 */
export function resolveCommitHash(
  env: Record<string, string | undefined>,
  runGit: () => string,
): string {
  const vercelSha = env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (vercelSha) return vercelSha.slice(0, 7);

  try {
    const gitSha = runGit().trim();
    if (gitSha) return gitSha;
  } catch {
    // Not a git checkout, or git is unavailable: fall through to `dev`.
  }
  return 'dev';
}
