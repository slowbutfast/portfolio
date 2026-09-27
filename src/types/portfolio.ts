export type ParadigmTag =
  | 'LLM'
  | 'Express'
  | 'Vanilla JS'
  | 'Audio'
  | 'Agent Tooling'
  | 'LaTeX'
  | 'Geospatial'
  | 'WebExtension';

export type TerminalStatus = 'ok' | 'warn' | 'error';

export interface TerminalCommand {
  command: string;
  output: string[];
  exitCode: number;
  status?: TerminalStatus;
  durationMs?: number;
}

export interface TerminalDemo {
  prompt: string;
  commands: TerminalCommand[];
}

export type Preview =
  | { kind: 'terminal'; label: string }
  | { kind: 'video'; src: string; poster?: string; caption: string }
  | { kind: 'screenshot'; src: string; caption: string }
  | { kind: 'linkout'; url: string; label: string };

export interface ProjectData {
  id: string;
  title: string;
  summary: string;
  tags: ParadigmTag[];
  repo: string;
  liveUrl?: string;
  previews: Preview[];
  terminalDemo?: TerminalDemo;
}

/** Runtime node shape consumed by the d3-force simulation. */
export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius: number;
}