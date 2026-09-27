import { useMemo, useRef, useState } from 'react';
import type { TerminalDemo } from '../types/portfolio';
import { TerminalSession, type ResolvedCommand } from '../utils/terminalCommandResolver';

interface TerminalSimulatorProps {
  demo: TerminalDemo;
}

function lineClass(line: string): string {
  if (line.includes('[ok]')) return 'text-emerald-400';
  if (line.includes('[warn]')) return 'text-amber-400';
  if (line.includes('[error]')) return 'text-red-400';
  return 'text-stone-300';
}

export function TerminalSimulator({ demo }: TerminalSimulatorProps) {
  const sessionRef = useRef<TerminalSession | null>(null);
  if (!sessionRef.current) sessionRef.current = new TerminalSession(demo.commands);
  const session = sessionRef.current;

  const [entries, setEntries] = useState<ResolvedCommand[]>([]);
  const [input, setInput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  const chips = useMemo(() => demo.commands.map((c) => c.command), [demo]);

  const execute = (raw: string) => {
    const resolved = session.execute(raw);
    setEntries((prev) => [...prev, resolved]);
    setInput('');
    requestAnimationFrame(() => {
      outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    execute(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const v = session.historyUp();
      if (v !== null) setInput(v);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const v = session.historyDown();
      setInput(v ?? '');
    }
  };

  return (
    <div
      className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 text-[13px] leading-relaxed"
      data-testid="terminal"
    >
      <div className="flex items-center gap-2 border-b border-stone-800 px-3 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-500/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-2 text-xs text-stone-500">terminal — {demo.prompt}</span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stone-800 px-3 py-2">
        {chips.map((cmd) => (
          <button
            key={cmd}
            type="button"
            data-testid="command-chip"
            onClick={() => execute(cmd)}
            className="rounded border border-stone-700 px-2 py-1 font-mono text-[12px] text-stone-300 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div
        ref={outputRef}
        data-testid="terminal-output"
        className="h-56 overflow-y-auto px-3 py-2 font-mono text-[12px]"
        aria-live="polite"
      >
        {entries.length === 0 && (
          <p className="text-stone-600">Run a command chip above, or type one and press Enter.</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="text-stone-500">
              {demo.prompt} <span className="text-stone-200">{entry.command}</span>
            </div>
            {entry.output.map((line, j) => (
              <div key={j} className={lineClass(line)}>
                {line || '\u00a0'}
              </div>
            ))}
            <div
              className={
                entry.exitCode === 0
                  ? 'text-emerald-400'
                  : entry.exitCode === 127
                    ? 'text-red-400'
                    : 'text-amber-400'
              }
            >
              exit code {entry.exitCode}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-stone-800 px-3 py-2 font-mono">
        <span className="text-emerald-400">{demo.prompt}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal command input"
          placeholder="type a command…"
          className="w-full bg-transparent text-stone-200 outline-none placeholder:text-stone-600"
        />
      </form>
    </div>
  );
}