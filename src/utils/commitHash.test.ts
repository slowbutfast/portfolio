import { describe, expect, it, vi } from 'vitest';
import { resolveCommitHash } from './commitHash';

describe('resolveCommitHash', () => {
  it('uses the first 7 characters of VERCEL_GIT_COMMIT_SHA without calling git', () => {
    const runGit = vi.fn(() => 'ffffff');
    const hash = resolveCommitHash(
      { VERCEL_GIT_COMMIT_SHA: '0123456789abcdef0123456789abcdef01234567' },
      runGit,
    );
    expect(hash).toBe('0123456');
    expect(runGit).not.toHaveBeenCalled();
  });

  it('falls back to the trimmed git output when the Vercel variable is unset', () => {
    expect(resolveCommitHash({}, () => 'abc1234\n')).toBe('abc1234');
  });

  it('treats an empty VERCEL_GIT_COMMIT_SHA as unset', () => {
    expect(resolveCommitHash({ VERCEL_GIT_COMMIT_SHA: '' }, () => 'abc1234')).toBe('abc1234');
  });

  it('returns a Vercel SHA shorter than 7 characters as-is', () => {
    expect(resolveCommitHash({ VERCEL_GIT_COMMIT_SHA: 'abc' }, () => 'zzzzzzz')).toBe('abc');
  });

  it('returns dev without throwing when git fails and the Vercel variable is unset', () => {
    const runGit = () => {
      throw new Error('fatal: not a git repository');
    };
    expect(resolveCommitHash({}, runGit)).toBe('dev');
  });

  it('returns dev when git prints only whitespace', () => {
    expect(resolveCommitHash({}, () => '  \n')).toBe('dev');
  });
});
