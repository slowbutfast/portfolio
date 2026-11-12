import { describe, expect, it } from 'vitest';
import { detectAuthWall } from './previewPreflight';

const OK_BODY = '<!doctype html><html><head><title>SYS.PORTFOLIO</title></head><body><div id="root"></div></body></html>';

describe('detectAuthWall', () => {
  it('returns null for a normal application response', () => {
    expect(detectAuthWall({ status: 200, url: 'https://x.vercel.app/', body: OK_BODY })).toBeNull();
  });

  it('flags a 401 and names the bypass secret', () => {
    const message = detectAuthWall({ status: 401, url: 'https://x.vercel.app/', body: '' });
    expect(message).toContain('VERCEL_AUTOMATION_BYPASS_SECRET');
  });

  it('flags a redirect to the Vercel SSO host', () => {
    const message = detectAuthWall({
      status: 200,
      url: 'https://vercel.com/sso-api?url=https%3A%2F%2Fx.vercel.app',
      body: OK_BODY,
    });
    expect(message).toContain('VERCEL_AUTOMATION_BYPASS_SECRET');
  });

  it('flags the Vercel Authentication page body even at status 200', () => {
    const message = detectAuthWall({
      status: 200,
      url: 'https://x.vercel.app/',
      body: '<html><title>Authentication Required</title><p>Vercel Authentication</p></html>',
    });
    expect(message).toContain('VERCEL_AUTOMATION_BYPASS_SECRET');
  });

  it('does not flag a 404 from the application as an auth wall', () => {
    expect(detectAuthWall({ status: 404, url: 'https://x.vercel.app/nope', body: 'Not found' })).toBeNull();
  });
});
