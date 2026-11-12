import { detectAuthWall } from '../src/utils/previewPreflight';

/**
 * Runs once before the suite when PREVIEW_URL is set. A protected preview
 * answers every request with Vercel's authentication page, which would make
 * every test fail with an unrelated message. Fail once, clearly, instead.
 */
export default async function globalSetup(): Promise<void> {
  const previewUrl = process.env.PREVIEW_URL;
  if (!previewUrl) return;

  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers: Record<string, string> = {};
  if (secret) {
    headers['x-vercel-protection-bypass'] = secret;
    headers['x-vercel-set-bypass-cookie'] = 'true';
  }

  let response: Response;
  try {
    response = await fetch(previewUrl, { headers, redirect: 'follow' });
  } catch (error) {
    throw new Error(`Preview pre-flight could not reach ${previewUrl}: ${(error as Error).message}`);
  }

  const body = (await response.text()).slice(0, 20_000);
  const problem = detectAuthWall({ status: response.status, url: response.url, body });
  if (problem) {
    const hint = secret ? ' (a bypass secret was provided but was not accepted)' : '';
    throw new Error(`Preview pre-flight failed${hint}: ${problem}`);
  }
}
