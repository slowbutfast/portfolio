/// <reference types="vite/client" />

/** Build-time commit hash injected by Vite's `define`. */
declare const __COMMIT_HASH__: string;

interface Window {
  /** Incremented by the root React <Profiler> on every committed render. */
  __REACT_COMMITS__: number;
}
