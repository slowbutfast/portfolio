export type LinkOutcome = 'pass' | 'warning' | 'fail';

export interface LinkCheckResult {
  url: string;
  status: number;
  outcome: LinkOutcome;
  attempts: number;
  latencyMs: number;
  finalUrl?: string;
  blocked?: boolean;
  error?: string;
}

export interface LinkCheckOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  maxRedirects?: number;
  resolveImpl?: (hostname: string) => Promise<string[]>;
  userAgent?: string;
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
export function extractUniqueUrls(sources: readonly string[]): string[];
export function classifyStatus(status: number): LinkOutcome;
export function isValidEmail(value: string): boolean;
export function isBlockedAddress(address: string): boolean;
export function buildPinnedRequestOptions(url: string | URL, address: string): PinnedRequest;
export function checkUrl(url: string, options?: LinkCheckOptions): Promise<LinkCheckResult>;
