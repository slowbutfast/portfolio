import manifest from './asset-manifest.json';

export interface AssetManifest {
  assetKeys: string[];
  capturedKeys: string[];
}

/**
 * Static import so Vercel's bundler traces and ships `asset-manifest.json`
 * even though `.vercelignore` excludes the `scripts/` directory that could
 * otherwise regenerate it at build time.
 */
export const assetManifest: AssetManifest = manifest;

export const assetKeySet: ReadonlySet<string> = new Set(assetManifest.assetKeys);
export const capturedKeySet: ReadonlySet<string> = new Set(assetManifest.capturedKeys);
