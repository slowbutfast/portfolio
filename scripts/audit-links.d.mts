/** Type declarations for the plain-ESM link auditor CLI. */

export type LinkOutcome = 'pass' | 'warning' | 'fail';

export interface FetchResponseLike {
  status: number;
  ok?: boolean;
}

export interface FetchInitLike {
  method?: string;
  redirect?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface CheckUrlOptions {
  fetchImpl?: (url: string, init?: FetchInitLike) => Promise<FetchResponseLike>;
  timeoutMs?: number;
  retries?: number;
}

export interface CheckUrlResult {
  url: string;
  status: number;
  outcome: LinkOutcome;
  attempts: number;
  error?: string;
}

export const URL_PATTERN: RegExp;
export function extractUrlsFromSource(source: string): string[];
export function extractUniqueUrls(sources: string[]): string[];
export function classifyStatus(status: number): LinkOutcome;
export function isValidEmail(value: string): boolean;
export function checkUrl(url: string, options?: CheckUrlOptions): Promise<CheckUrlResult>;
export function loadSourceUrls(root?: string): Promise<string[]>;
