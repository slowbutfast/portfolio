import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Directories Vercel uploads even though `.vercelignore` lists them. */
const UPLOAD_EXCEPTIONS = new Set(['.git', 'node_modules', 'dist']);

/**
 * Parse the directory entries from `.vercelignore`. File globs are irrelevant
 * to import resolution; only directory prefixes can hide a module.
 */
export function parseIgnoredDirectories(source: string): string[] {
  const directories: string[] = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    if (!line.endsWith('/')) continue;
    const directory = line.replace(/^\.?\//, '').replace(/\/$/, '');
    if (directory === '' || UPLOAD_EXCEPTIONS.has(directory)) continue;
    directories.push(directory);
  }
  return directories;
}

interface BuildConfig {
  include?: string[];
  exclude?: string[];
}

/** Read the same config Vercel's build passes to `tsc`. */
export function loadBuildConfig(root: string): BuildConfig {
  return JSON.parse(
    readFileSync(resolve(root, 'tsconfig.build.json'), 'utf8'),
  ) as BuildConfig;
}

function toPosix(value: string): string {
  return value.split(sep).join('/');
}

function globToRegExp(pattern: string): RegExp {
  let source = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        i += 1;
        if (pattern[i + 1] === '/') {
          i += 1;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
    } else if (char === '?') {
      source += '[^/]';
    } else if ('\\^$+?.()|{}[]'.includes(char)) {
      source += `\\${char}`;
    } else {
      source += char;
    }
  }
  return new RegExp(`${source}$`);
}

/** Match a repo-relative posix path against a tsconfig include/exclude glob. */
export function matchesTsConfigPattern(relativePath: string, pattern: string): boolean {
  const path = toPosix(relativePath).replace(/^\.\//, '');
  const normalized = toPosix(pattern).replace(/^\.\//, '');
  if (!normalized.includes('*')) {
    return path === normalized || path.startsWith(`${normalized}/`);
  }
  return globToRegExp(normalized).test(path);
}

/** Files typechecked by `tsc --noEmit -p tsconfig.build.json`. */
export function collectBuildTypecheckFiles(root: string): string[] {
  const config = loadBuildConfig(root);
  const include = config.include ?? [];
  const exclude = config.exclude ?? [];
  const candidates = new Set<string>();

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const absolute = resolve(directory, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!/\.(?:ts|tsx)$/.test(entry)) continue;
      candidates.add(absolute);
    }
  };

  for (const entry of include) {
    const normalized = toPosix(entry);
    const wildcardIndex = normalized.indexOf('*');
    const staticPrefix = (
      wildcardIndex === -1 ? normalized : normalized.slice(0, wildcardIndex)
    ).replace(/\/+$/, '');
    const absolute = resolve(root, staticPrefix || '.');
    try {
      const stats = statSync(absolute);
      if (stats.isDirectory()) walk(absolute);
      else if (stats.isFile()) candidates.add(absolute);
    } catch {
      // A missing include root contributes no files.
    }
  }

  return [...candidates]
    .filter((absolute) => {
      const repoRelative = toPosix(relative(root, absolute));
      const included = include.some((pattern) =>
        matchesTsConfigPattern(repoRelative, pattern),
      );
      const excluded = exclude.some((pattern) =>
        matchesTsConfigPattern(repoRelative, pattern),
      );
      return included && !excluded;
    })
    .sort();
}

const IMPORT_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /^\s*import\s+['"]([^'"]+)['"]/gm,
];

/** Relative import specifiers in source order, without duplicates. */
export function extractRelativeImports(source: string): string[] {
  const specifiers = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        specifiers.add(specifier);
      }
    }
  }
  return [...specifiers];
}

/**
 * Pure parity check: return imports that resolve under a directory Vercel
 * strips. `filePath` and `root` are absolute paths.
 */
export function findIgnoredImports(
  filePath: string,
  source: string,
  ignoredDirectories: string[],
  root: string,
): string[] {
  const ignored = new Set(ignoredDirectories);
  const offenders: string[] = [];
  for (const specifier of extractRelativeImports(source)) {
    const resolved = resolve(dirname(filePath), specifier);
    const repoRelative = relative(root, resolved);
    if (repoRelative === '' || repoRelative.startsWith('..')) continue;
    const firstSegment = repoRelative.split(sep)[0];
    if (ignored.has(firstSegment)) offenders.push(specifier);
  }
  return offenders;
}

describe('Vercel build file-set parity', () => {
  const ignoredDirectories = parseIgnoredDirectories(
    readFileSync(resolve(repoRoot, '.vercelignore'), 'utf8'),
  );

  it('collects the ignored directory prefixes that can hide modules', () => {
    expect(ignoredDirectories).toEqual(
      expect.arrayContaining(['scripts', 'e2e', 'openspec']),
    );
    expect(ignoredDirectories).not.toContain('node_modules');
    expect(ignoredDirectories).not.toContain('dist');
  });

  it('derives its checked file set from tsconfig.build.json', () => {
    const config = loadBuildConfig(repoRoot);
    expect(config.include).toEqual(expect.arrayContaining(['src', 'vite.config.ts']));
    expect(config.exclude).toEqual(
      expect.arrayContaining([
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
      ]),
    );

    const files = collectBuildTypecheckFiles(repoRoot);
    expect(files).toContain(resolve(repoRoot, 'vite.config.ts'));
    for (const file of files) {
      const repoRelative = relative(repoRoot, file).split(sep).join('/');
      expect(
        repoRelative === 'vite.config.ts' || repoRelative.startsWith('src/'),
      ).toBe(true);
      expect(repoRelative).not.toMatch(/\.(?:test|spec)\.tsx?$/);
    }
  });

  it('matches broadened tsconfig test excludes', () => {
    expect(matchesTsConfigPattern('src/foo.test.tsx', '**/*.test.tsx')).toBe(true);
    expect(matchesTsConfigPattern('src/foo.spec.ts', '**/*.spec.ts')).toBe(true);
    expect(matchesTsConfigPattern('src/foo.ts', '**/*.test.ts')).toBe(false);
  });

  it('flags a shipped source importing from an ignored directory', () => {
    const offenders = findIgnoredImports(
      resolve(repoRoot, 'src/utils/example.ts'),
      "import { checkUrl } from '../../scripts/audit-links.mjs';",
      ['scripts'],
      repoRoot,
    );
    expect(offenders).toEqual(['../../scripts/audit-links.mjs']);
  });

  it('typechecks only shipped files without reaching into ignored directories', () => {
    const offenders: string[] = [];
    for (const file of collectBuildTypecheckFiles(repoRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const specifier of findIgnoredImports(
        file,
        source,
        ignoredDirectories,
        repoRoot,
      )) {
        offenders.push(`${relative(repoRoot, file)} -> ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
