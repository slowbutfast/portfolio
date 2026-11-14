/** Type declarations for the plain-ESM link auditor CLI (shared implementation). */

export type LinkOutcome = 'pass' | 'warning' | 'fail';

export interface FetchResponseLike {
  status: number;
  ok?: boolean;
  headers?: { get?: (name: string) => string | null };
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
  maxRedirects?: number;
  resolveImpl?: (hostname: string) => Promise<string[]>;
  userAgent?: string;
}

export interface CheckUrlResult {
  url: string;
  status: number;
  outcome: LinkOutcome;
  attempts: number;
  latencyMs: number;
  finalUrl?: string;
  blocked?: boolean;
  error?: string;
}

export interface PinnedRequestOptions {
  hostname: string;
  port: number | string;
  path: string;
  method?: string;
  headers: Record<string, string>;
  servername?: string;
}

export interface PinnedRequest {
  module: 'http' | 'https';
  options: PinnedRequestOptions;
}

export const URL_PATTERN: RegExp;
export function extractUrlsFromSource(source: string): string[];
export function extractUniqueUrls(sources: string[]): string[];
export function classifyStatus(status: number): LinkOutcome;
export function isValidEmail(value: string): boolean;
export function isBlockedAddress(address: string): boolean;
export function buildPinnedRequestOptions(url: string | URL, address: string): PinnedRequest;
export function checkUrl(url: string, options?: CheckUrlOptions): Promise<CheckUrlResult>;
export function loadSourceUrls(root?: string): Promise<string[]>;
