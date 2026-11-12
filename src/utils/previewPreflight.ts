const REMEDIATION =
  'The preview is protected by Vercel Deployment Protection. Set VERCEL_AUTOMATION_BYPASS_SECRET ' +
  '(the project\'s "Protection Bypass for Automation" secret) so requests carry x-vercel-protection-bypass.';

export interface PreflightResponse {
  status: number;
  /** Final URL after redirects. */
  url: string;
  /** Response body text (may be truncated). */
  body: string;
}

/**
 * Detect that a request to PREVIEW_URL hit Vercel's authentication page
 * instead of the application. Returns an actionable message, or null when the
 * response looks like the app (including legitimate 404s).
 */
export function detectAuthWall(response: PreflightResponse): string | null {
  if (response.status === 401) {
    return `Preview returned 401. ${REMEDIATION}`;
  }

  let host = '';
  try {
    host = new URL(response.url).hostname;
  } catch {
    // Unparseable URL: rely on status and body checks only.
  }
  if (host === 'vercel.com' || host.endsWith('.vercel.com')) {
    return `Preview redirected to ${host}. ${REMEDIATION}`;
  }

  if (/Vercel Authentication|Authentication Required|vercel\.com\/sso/i.test(response.body)) {
    return `Preview returned the Vercel authentication page. ${REMEDIATION}`;
  }
  return null;
}
