import { describe, expect, it } from 'vitest';
import { resolveCommand, TerminalSession } from './terminalCommandResolver';
import type { TerminalCommand } from '../types/portfolio';

const COMMANDS: TerminalCommand[] = [
  {
    command: 'python3 build_resume.py --schema',
    output: ['emitting JSON schema for build_resume.py', '{"$schema":"...","flags":["--role","--summary"]}', 'schema written to stdout'],
    exitCode: 0,
    status: 'ok',
    durationMs: 210,
  },
  {
    command: 'npm test',
    output: ['> transcribe-plus@1.0.0 test', 'vitest run', 'Test Files  1 passed', 'Tests  72 passed', 'Duration  1.2s'],
    exitCode: 0,
    status: 'ok',
    durationMs: 1200,
  },
  {
    command: 'npm run lint',
    output: ['> eslint .', 'warning: no-unused-vars at src/index.js:12', '1 warning'],
    exitCode: 0,
    status: 'warn',
    durationMs: 830,
  },
];

describe('terminalCommandResolver', () => {
  it('resolves a recognized per-project command to its captured output and exit code', () => {
    const resolved = resolveCommand(COMMANDS, 'npm test');
    expect(resolved.exitCode).toBe(0);
    expect(resolved.status).toBe('ok');
    expect(resolved.output.length).toBeGreaterThan(0);
    expect(resolved.output.some((l) => l.includes('72 passed'))).toBe(true);
  });

  it('resolves commands case-insensitively after trimming whitespace', () => {
    const resolved = resolveCommand(COMMANDS, '  PYTHON3 BUILD_RESUME.PY --SCHEMA  ');
    expect(resolved.exitCode).toBe(0);
    expect(resolved.output.some((l) => l.includes('JSON schema'))).toBe(true);
  });

  it('returns exit code 127 with available suggestions for an unknown command', () => {
    const resolved = resolveCommand(COMMANDS, 'rm -rf /');
    expect(resolved.exitCode).toBe(127);
    expect(resolved.status).toBe('error');
    expect(resolved.output.some((l) => l.toLowerCase().includes('command not found'))).toBe(true);
    const joined = resolved.output.join('\n');
    expect(joined).toContain('npm test');
    expect(joined).toContain('--schema');
  });

  it('tracks executed command history with bounded navigation', () => {
    const session = new TerminalSession(COMMANDS);
    session.execute('npm test');
    session.execute('npm run lint');
    session.execute('definitely-not-a-command');

    expect(session.history).toHaveLength(3);

    expect(session.historyUp()).toBe('definitely-not-a-command');
    expect(session.historyUp()).toBe('npm run lint');
    expect(session.historyUp()).toBe('npm test');
    expect(session.historyUp()).toBe('npm test');

    expect(session.historyDown()).toBe('npm run lint');
    expect(session.historyDown()).toBe('definitely-not-a-command');
    expect(session.historyDown()).toBe('');
    expect(session.historyDown()).toBe('');
  });
});