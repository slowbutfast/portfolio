export type ParadigmTag =
  | 'LLM'
  | 'Express'
  | 'Vanilla JS'
  | 'Audio'
  | 'Agent Tooling'
  | 'LaTeX'
  | 'Geospatial'
  | 'WebExtension'
  | 'Graphics'
  | 'Design';

export type TerminalStatus = 'ok' | 'warn' | 'error';

/** Light and dark presentation modes for the portfolio shell. */
export type ThemeMode = 'dark' | 'light';

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
  | { kind: 'wip'; label: string }
  | { kind: 'linkout'; url: string; label: string };

export interface ProjectData {
  id: string;
  title: string;
  /** Compact graph/canvas label. Required so nodes never fall back to raw ids. */
  shortTitle: string;
  summary: string;
  /** Curated uppercase engineering classification, e.g. "AGENTIC ... // ...". */
  classification: string;
  tags: ParadigmTag[];
  /** Public source repository. Omitted for client/design work without one. */
  repo?: string;
  liveUrl?: string;
  /** Opt-in rainbow RGB pulse on hover or while visited (until canvas reset). */
  rainbowOnInteract?: boolean;
  previews: Preview[];
  terminalDemo?: TerminalDemo;
}

/**
 * Single source of truth for candidate identity, contact endpoints, and
 * canonical page metadata.
 */
export interface CandidateProfile {
  name: string;
  tagline: string;
  title: string;
  bio: string;
  email: string;
  linkedin: string;
  github: string;
  resumeUrl: string;
  resumeEmbedUrl: string;
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
  /** True once the project has been opened, persisted across visits. */
  visited?: boolean;
}

/** Viewport-space point used to anchor hover cards and the inspector tooltip. */
export type HoverAnchor = { x: number; y: number };

/** Active node-hover preview state, or null when no node is hovered. */
export type HoverState = { project: ProjectData; position: HoverAnchor } | null;