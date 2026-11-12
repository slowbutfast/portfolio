import { useMemo, useRef, useState } from 'react';
import type { TerminalDemo } from '../types/portfolio';
import { TerminalSession, type ResolvedCommand } from '../utils/terminalCommandResolver';

interface TerminalSimulatorProps {
  demo: TerminalDemo;
}

function lineClass(line: string): string {
  if (line.includes('[ok]')) return 'text-[#22c55e]';
  if (line.includes('[warn]')) return 'text-[#eab308]';
  if (line.includes('[error]')) return 'text-[#ef4444]';
  return 'text-[#d4d4d8]';
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
      className="overflow-hidden rounded-none border border-[#27272a] bg-[#08080a] font-mono text-[13px] leading-relaxed"
      data-testid="terminal"
      data-prompt={demo.prompt}
      title={demo.prompt}
    >
      <div className="flex items-center gap-2 border-b border-[#27272a] bg-[#0e0f12] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/80" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/80" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/80" aria-hidden="true" />
        <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
          TERMINAL // SESSION
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#27272a] px-3 py-2">
        {chips.map((cmd) => (
          <button
            key={cmd}
            type="button"
            data-testid="command-chip"
            onClick={() => execute(cmd)}
            className="min-h-11 rounded-none border border-[#71717a] px-2 py-1 text-[12px] text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] focus-visible:border-[#00f0ff] focus-visible:text-[#00f0ff] md:min-h-0"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div
        ref={outputRef}
        data-testid="terminal-output"
        className="h-56 overflow-y-auto px-3 py-2 text-[12px]"
        aria-live="polite"
      >
        {entries.length === 0 && (
          <p className="text-[#a1a1aa]">Run a command chip above, or type one and press Enter.</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex gap-2">
              <span aria-hidden="true" className="text-[#00f0ff]">
                &gt;_
              </span>
              <span className="text-[#f4f4f5]">{entry.command}</span>
            </div>
            {entry.output.map((line, j) => (
              <div key={j} className={lineClass(line)}>
                {line || '\u00a0'}
              </div>
            ))}
            <span
              data-testid="exit-status"
              className={`mt-1 inline-flex items-center border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                entry.exitCode === 0
                  ? 'border-[#22c55e]/60 text-[#22c55e]'
                  : 'border-[#eab308] text-[#eab308]'
              }`}
            >
              exit code {entry.exitCode}
            </span>
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-[#27272a] bg-[#0e0f12] px-3 py-2"
      >
        <span aria-hidden="true" className="shrink-0 text-[#00f0ff]">
          &gt;_
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal command input"
          placeholder="type a command…"
          className="min-h-11 w-full bg-transparent text-[#f4f4f5] outline-none placeholder:text-[#71717a] md:min-h-0"
        />
      </form>
    </div>
  );
}
