import { detectAuthWall } from '../src/utils/previewPreflight';

/**
 * Runs once before the suite when PREVIEW_URL is set. A protected preview
 * answers every request with Vercel's authentication page, which would make
 * every test fail with an unrelated message. Fail once, clearly, instead.
 */
export default async function globalSetup(): Promise<void> {
  const previewUrl = process.env.PREVIEW_URL;
  if (!previewUrl) return;

  // Trim: a secret pasted into a CI settings form often carries a trailing newline.
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || undefined;
  const headers: Record<string, string> = {};
  if (secret) {
    headers['x-vercel-protection-bypass'] = secret;
    headers['x-vercel-set-bypass-cookie'] = 'true';
  }

  // A transient network error should not fail the whole gate, so retry briefly.
  // Node's fetch reports every network failure as a bare "fetch failed"; the
  // useful detail (DNS, TLS, reset, redirect loop) is on `error.cause`.
  const attempts = 3;
  let response: Response | undefined;
  let lastFailure = '';
  for (let attempt = 1; attempt <= attempts && !response; attempt += 1) {
    try {
      response = await fetch(previewUrl, { headers, redirect: 'follow' });
    } catch (error) {
      const err = error as Error & { cause?: { code?: string; message?: string } };
      const cause = err.cause ? ` (${err.cause.code ?? 'no code'}: ${err.cause.message ?? 'no message'})` : '';
      lastFailure = `${err.message}${cause}`;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  if (!response) {
    throw new Error(
      `Preview pre-flight could not reach ${new URL(previewUrl).host} after ${attempts} attempts: ${lastFailure}`,
    );
  }

  const body = (await response.text()).slice(0, 20_000);
  const problem = detectAuthWall({ status: response.status, url: response.url, body });
  if (problem) {
    const hint = secret ? ' (a bypass secret was provided but was not accepted)' : '';
    throw new Error(`Preview pre-flight failed${hint}: ${problem}`);
  }
}
