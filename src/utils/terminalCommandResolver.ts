import type { TerminalCommand, TerminalStatus } from '../types/portfolio';

export interface ResolvedCommand {
  command: string;
  output: string[];
  exitCode: number;
  status: TerminalStatus;
  durationMs: number;
}

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fallbackStatus(exitCode: number): TerminalStatus {
  if (exitCode === 0) return 'ok';
  if (exitCode === 127) return 'error';
  return 'warn';
}

/** Suggest a bounded set of available commands for an unknown input. */
function suggest(commands: TerminalCommand[], input: string): string[] {
  const needle = input.trim().toLowerCase();
  const available = commands.map((c) => c.command);
  const prefixed = available.filter((c) => c.toLowerCase().startsWith(needle));
  const pool = prefixed.length > 0 ? prefixed : available;
  return [...new Set(pool)].slice(0, 3);
}

/**
 * Resolve a typed command against a project's command table. Recognized
 * commands return their captured output and exit code; unrecognized commands
 * return exit code 127 with a "command not found" notice and suggestions.
 * Resolution is case-insensitive after whitespace normalization.
 */
export function resolveCommand(commands: TerminalCommand[], input: string): ResolvedCommand {
  const needle = normalize(input);
  const hit = commands.find((c) => normalize(c.command) === needle);
  if (hit) {
    return {
      command: hit.command,
      output: hit.output,
      exitCode: hit.exitCode,
      status: hit.status ?? fallbackStatus(hit.exitCode),
      durationMs: hit.durationMs ?? 0,
    };
  }

  const trimmed = input.trim();
  return {
    command: trimmed,
    output: [
      `bash: ${trimmed}: command not found`,
      '',
      'available commands:',
      ...suggest(commands, input).map((s) => `  - ${s}`),
    ],
    exitCode: 127,
    status: 'error',
    durationMs: 0,
  };
}

/** Interactive terminal session tracking executed command history. */
export class TerminalSession {
  readonly history: string[] = [];
  private cursor = 0;

  constructor(private readonly commands: TerminalCommand[]) {}

  execute(input: string): ResolvedCommand {
    const resolved = resolveCommand(this.commands, input);
    const trimmed = input.trim();
    if (trimmed) {
      this.history.push(trimmed);
      this.cursor = this.history.length;
    }
    return resolved;
  }

  historyUp(): string | null {
    if (this.history.length === 0) return null;
    this.cursor = Math.max(0, this.cursor - 1);
    return this.history[this.cursor] ?? null;
  }

  historyDown(): string | null {
    if (this.history.length === 0) return null;
    this.cursor = Math.min(this.history.length, this.cursor + 1);
    return this.cursor < this.history.length ? this.history[this.cursor] : '';
  }
}