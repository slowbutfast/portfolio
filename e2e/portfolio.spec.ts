import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

const PROJECT_IDS = [
  'open-dungeon',
  'agentic-resume-builder',
  'pict-climate-risk-viz-chatbot',
  'transcribe-plus',
  'sandwave-sim',
  'attention-max',
  'kintsugi-fracture',
  'ivy-film-festival-2026',
];

const GITHUB_URL = 'https://github.com/slowbutfast';

const edgeKey = (a: string, b: string) => [a, b].sort().join('\u0000');

// Vercel injects its Preview Comments toolbar (vercel.live/_next-live/feedback)
// into preview deployments. Our strict CSP (`script-src 'self'`) correctly
// blocks it, which logs a console error that is not an application defect.
// Production has no toolbar. Ignore only this known, Vercel-injected script;
// every other console error, including any other CSP violation, still fails.
const VERCEL_TOOLBAR_CSP_ERROR = /vercel\.live\/_next-live\/feedback/;

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !VERCEL_TOOLBAR_CSP_ERROR.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function openFilters(page: Page) {
  const trigger = page.getByTestId('controls-dropdown-trigger');
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click();
  }
  await expect(page.getByTestId('controls-dropdown')).toBeVisible();
  return trigger;
}

async function useLightTheme(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('portfolio_theme', 'light');
    } catch {
      // ignore storage denial
    }
  });
}

async function useDarkTheme(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('portfolio_theme', 'dark');
    } catch {
      // ignore storage denial
    }
  });
}

const HEADER_ORDER = [
  'nav-about',
  'nav-github',
  'view-toggle',
  'audio-toggle',
  'theme-toggle',
  'controls-dropdown-trigger',
];

const MOBILE_HEADER_ORDER = [
  'nav-about',
  'view-toggle',
  'theme-toggle',
  'controls-dropdown-trigger',
];

async function headerOrder(page: Page): Promise<string[]> {
  return page.evaluate((ids) => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('header [data-testid]'),
    );
    return nodes
      .filter((node) => node.offsetParent !== null)
      .map((node) => node.dataset.testid ?? '')
      .filter((id) => ids.includes(id));
  }, HEADER_ORDER);
}

const isMobile = (testInfo: { project: { name: string } }) =>
  testInfo.project.name === 'mobile';

async function blurActiveElement(page: Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
}

/** Focus a semantic-nav entry so the camera centers that node. */
async function focusNode(page: Page, id = 'open-dungeon') {
  await page.getByTestId(`nav-${id}`).focus();
  await page.waitForTimeout(1600);
}

async function tapCenteredNode(page: Page, id = 'open-dungeon') {
  await focusNode(page, id);
  const canvas = page.getByTestId('graph-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('graph canvas has no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('project-drawer')).toBeVisible();
  return box;
}

async function dragSheetHandle(page: Page, deltaY: number) {
  const handle = page.getByTestId('sheet-drag-handle');
  const box = await handle.boundingBox();
  if (!box) throw new Error('sheet drag handle has no bounding box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + deltaY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

async function sheetHeightRatio(page: Page): Promise<number> {
  const drawer = page.getByTestId('project-drawer');
  const box = await drawer.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('sheet geometry unavailable');
  return box.height / viewport.height;
}

/**
 * Focus the semantic nav to pan the camera onto a node, then hover the canvas
 * center. The node is pinned by hover so the preview card stays visible.
 */
async function hoverCenteredNode(page: Page, projectId = 'open-dungeon') {
  await page.waitForTimeout(1500);
  await page.getByTestId(`nav-${projectId}`).focus();
  await page.waitForTimeout(1600);
  const canvas = page.getByTestId('graph-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('graph canvas has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('node-hover-card')).toBeVisible();
  return box;
}

function axeTags() {
  return ['wcag2a', 'wcag2aa', 'wcag21aa'];
}

test.describe('portfolio graph SPA', () => {
  test('loads on desktop and mobile with zero console errors', async ({ page }, testInfo) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Projects"]')).toHaveCount(1);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Portfolio');

    await expect(page.getByTestId('brand-home')).toHaveText('Gregory Lazatin');
    await expect(page.getByTestId('nav-about')).toBeVisible();
    await expect(page.getByTestId('view-toggle')).toHaveText('Grid');
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    await expect(page.getByTestId('controls-dropdown-trigger')).toBeVisible();

    if (isMobile(testInfo)) {
      await expect(page.getByTestId('nav-github')).toBeHidden();
      await expect(page.getByTestId('audio-toggle')).toBeHidden();
      await openFilters(page);
      await expect(page.getByTestId('mobile-audio-toggle')).toBeVisible();
      await expect(page.getByTestId('mobile-volume-slider')).toBeVisible();
      await expect(page.getByTestId('reset-layout')).toBeVisible();
    } else {
      await expect(page.getByTestId('nav-github')).toBeVisible();
      await expect(page.getByTestId('audio-toggle')).toBeVisible();
      await expect(page.getByTestId('audio-toggle')).toHaveAttribute('aria-pressed', 'false');
      await openFilters(page);
    }
    await expect(page.getByTestId('search-input')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('first visit defaults to the Light color scheme', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
      'content',
      'light dark',
    );
    expect(errors).toEqual([]);
  });

  test('theme-init applies a stored dark preference before the app mounts', async ({ page }) => {
    await useDarkTheme(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('document metadata uses the canonical candidate identity', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Gregory Lazatin | Portfolio');
    const metadata = await page.evaluate(() => ({
      description: document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ogDescription: document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute('content'),
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      twitterCard: document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute('content'),
    }));
    for (const value of Object.values(metadata)) {
      expect(value, JSON.stringify(metadata)).toBeTruthy();
    }
    expect(metadata.ogTitle).toContain('Gregory Lazatin');
    expect(metadata.twitterCard).toBe('summary_large_image');
  });

  test('header controls follow the canonical top-right sequence', async ({ page }, testInfo) => {
    await page.goto('/');
    expect(await headerOrder(page)).toEqual(
      isMobile(testInfo) ? MOBILE_HEADER_ORDER : HEADER_ORDER,
    );
    if (isMobile(testInfo)) {
      await expect(page.getByTestId('nav-github')).toBeHidden();
      await expect(page.getByTestId('audio-toggle')).toBeHidden();
    } else {
      await expect(page.getByTestId('audio-toggle')).toHaveText('Sound');
    }
    await expect(page.getByTestId('theme-toggle')).toHaveText(/^(Dark|Light)$/);
    await expect(page.getByTestId('top-scrim')).toBeVisible();

    // The theme toggle lives in the header, not inside the Filters dropdown.
    await openFilters(page);
    await expect(
      page.getByTestId('controls-dropdown').getByTestId('theme-toggle'),
    ).toHaveCount(0);
  });

  test('Sound toggle persists the user preference across reloads', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'mobile in-menu Sound is covered separately');
    const errors = trackErrors(page);
    await page.goto('/');
    const toggle = page.getByTestId('audio-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAccessibleName('Sound');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName('Sound');
    expect(
      await page.evaluate(() => localStorage.getItem('portfolio_sound_enabled')),
    ).toBe('true');

    await page.reload();
    await expect(page.getByTestId('audio-toggle')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('audio-toggle').click();
    await expect(page.getByTestId('audio-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.evaluate(() => localStorage.getItem('portfolio_sound_enabled')),
    ).toBe('false');
    expect(errors).toEqual([]);
  });

  test('volume popover appears only while Sound is enabled and hides after 500ms', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover volume popover runs on desktop');
    await page.goto('/');
    const toggle = page.getByTestId('audio-toggle');
    const popover = page.getByTestId('volume-popover');
    const slider = page.getByTestId('volume-slider');

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.hover();
    await expect(popover).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(popover).toBeVisible();
    await expect(slider).toHaveValue('1');

    const setVolume = async (value: number) => {
      await slider.evaluate((element, next) => {
        const input = element as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(input, String(next));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    };

    await setVolume(0.35);
    await expect(slider).toHaveValue('0.35');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('portfolio_sound_volume')))
      .toBe('0.35');

    await setVolume(0);
    await expect(slider).toHaveValue('0');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.mouse.move(12, 800);
    await page.waitForTimeout(650);
    await expect(popover).toHaveCount(0);

    await toggle.hover();
    await expect(popover).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(popover).toHaveCount(0);
  });

  test('Ivy Film Fest drawer renders Visit without a Code action', async ({ page }) => {
    await page.goto('/#/p/ivy-film-festival-2026');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('drawer-heading')).toHaveText('Ivy Film Festival 2026');
    await expect(page.getByTestId('drawer-visit')).toBeVisible();
    await expect(page.getByTestId('drawer-visit')).toHaveAttribute(
      'href',
      'https://www.ivyfilmfestival.org/',
    );
    await expect(page.getByTestId('drawer-code')).toHaveCount(0);

    await page.goto('/#/p/kintsugi-fracture');
    await expect(page.getByTestId('drawer-code')).toBeVisible();
    await expect(page.getByTestId('drawer-visit')).toHaveAttribute(
      'href',
      'https://kintsugi-fracture.vercel.app/',
    );
  });

  test('list view renders 8 cards and a card click opens the project drawer', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await page.getByTestId('view-toggle').click();
    expect(PROJECT_IDS).toHaveLength(8);
    for (const id of PROJECT_IDS) {
      await expect(page.getByTestId(`card-${id}`)).toBeVisible();
    }
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveAttribute('aria-modal', 'true');
    expect(errors).toEqual([]);
  });

  test('graph view exposes all 8 project nodes through the semantic nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.locator('nav[aria-label="Projects"] button')).toHaveCount(8);
    for (const id of PROJECT_IDS) {
      await expect(page.getByTestId(`nav-${id}`)).toHaveCount(1);
    }
  });

  test('grid cards render 16:9 thumbnails and a terminal specimen fallback', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('view-toggle').click();

    const mediaCard = page.getByTestId('card-open-dungeon');
    await expect(mediaCard.locator('img')).toBeVisible();
    await expect(mediaCard.locator('img')).toHaveAttribute('loading', 'lazy');
    await expect(
      mediaCard.locator('img').locator('xpath=..'),
    ).toHaveClass(/aspect-video/);

    const terminalCard = page.getByTestId('card-agentic-resume-builder');
    await expect(page.getByTestId('terminal-specimen-agentic-resume-builder')).toBeVisible();
    await expect(page.getByTestId('terminal-specimen-agentic-resume-builder')).not.toContainText(
      '[CLI Specimen]',
    );
    await expect(terminalCard.locator('img')).toHaveCount(0);

    const index = mediaCard.getByText('01', { exact: true });
    const heading = mediaCard.locator('h2');
    const summary = mediaCard.locator('p');
    const preview = mediaCard.locator('img');
    const firstTag = mediaCard.locator('.fluid-pill').first();
    const indexBox = await index.boundingBox();
    const headingBox = await heading.boundingBox();
    const summaryBox = await summary.boundingBox();
    const previewBox = await preview.boundingBox();
    const tagBox = await firstTag.boundingBox();
    if (!indexBox || !headingBox || !summaryBox || !previewBox || !tagBox) {
      throw new Error('grid card hierarchy is missing a measurable element');
    }
    expect(headingBox.x).toBeGreaterThan(indexBox.x);
    expect(Math.abs(
      headingBox.y + headingBox.height / 2 - (indexBox.y + indexBox.height / 2),
    )).toBeLessThan(12);
    expect(summaryBox.y).toBeGreaterThan(headingBox.y + headingBox.height - 2);
    expect(previewBox.y).toBeGreaterThan(summaryBox.y + summaryBox.height - 2);
    expect(tagBox.y).toBeGreaterThan(previewBox.y + previewBox.height - 2);
  });

  test('terminal command chip executes and displays captured output', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/#/p/agentic-resume-builder');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('command-chip').first()).toBeVisible();
    await page.getByTestId('command-chip').first().click();
    await expect(page.getByTestId('terminal-output')).toContainText('exit code');
    expect(errors).toEqual([]);
  });

  test('terminal tab is curated to the Resume Builder project', async ({ page }) => {
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('preview-tab-terminal')).toHaveCount(0);
    await expect(page.getByTestId('preview-tab-media')).toBeVisible();

    await page.getByTestId('drawer-close').click();
    await page.goto('/#/p/agentic-resume-builder');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('command-chip').first()).toBeVisible();
  });

  test('drawer elevates Code/Visit and uses a segmented Media/Terminal track', async ({
    page,
  }) => {
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();

    const track = page.getByTestId('preview-tabs-track');
    await expect(track).toBeVisible();
    await expect(track).toHaveClass(/rounded-full/);
    await expect(track).toHaveClass(/bg-\[var\(--color-surface-container\)\]/);
    await expect(page.getByTestId('preview-tab-media')).toBeVisible();
    // The legacy Link tab is retired.
    await expect(page.getByTestId('preview-tab-link')).toHaveCount(0);

    await expect(page.getByTestId('drawer-code')).toBeVisible();
    await expect(page.getByTestId('drawer-code')).toHaveAttribute(
      'href',
      'https://github.com/slowbutfast/open-dungeon',
    );
    await expect(page.getByTestId('drawer-visit')).toBeVisible();
    await expect(page.getByTestId('drawer-visit')).toHaveAttribute(
      'href',
      'https://open-dungeon-three.vercel.app/',
    );

    // Contextual reference linkouts now live in the Overview section.
    await expect(page.getByTestId('drawer-overview')).toBeVisible();
    await expect(page.getByTestId('overview-link-0')).toBeVisible();
    await expect(page.getByTestId('overview-link-0')).toHaveAttribute(
      'href',
      'https://open-dungeon-three.vercel.app/',
    );

    // A single-modality project still shows its track and no Link tab.
    await page.goto('/#/p/agentic-resume-builder');
    await expect(page.getByTestId('preview-tabs-track')).toBeVisible();
    await expect(page.getByTestId('preview-tab-terminal')).toBeVisible();
    await expect(page.getByTestId('preview-tab-link')).toHaveCount(0);
    await expect(page.getByTestId('drawer-code')).toBeVisible();
    await expect(page.getByTestId('drawer-visit')).toHaveCount(0);
  });

  test('mobile drawer opens at the Half detent with a slim sticky header', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'bottom-sheet layout is mobile-only');
    await page.goto('/#/p/open-dungeon');
    const drawer = page.getByTestId('project-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-sheet-detent', 'half');
    await expect(drawer).toHaveClass(/bottom-0/);
    await expect(drawer).toHaveClass(/rounded-t-2xl/);
    await expect(page.getByTestId('sheet-drag-handle')).toBeVisible();

    const ratio = await sheetHeightRatio(page);
    expect(ratio).toBeGreaterThan(0.53);
    expect(ratio).toBeLessThan(0.59);

    const headerHeight = await drawer
      .locator('header')
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(headerHeight).toBeLessThan(120);

    // Actions and summary scroll inside the body, not in the pinned header.
    await expect(drawer.locator('header').getByTestId('drawer-code')).toHaveCount(0);
    await expect(drawer.getByTestId('drawer-code')).toHaveCount(1);
    await expect(drawer.getByTestId('drawer-code')).toBeVisible();
    await expect(drawer.getByTestId('drawer-visit')).toBeVisible();

    const box = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
    }
  });

  test('mobile header is a single row at 393 and wraps without clipping at 320', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile header layout');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await expect(page.getByTestId('nav-github')).toBeHidden();
    await expect(page.getByTestId('audio-toggle')).toBeHidden();
    await expect(page.getByTestId('nav-about')).toBeVisible();
    await expect(page.getByTestId('view-toggle')).toBeVisible();
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    await expect(page.getByTestId('controls-dropdown-trigger')).toBeVisible();

    const headerHeight = await page
      .locator('header')
      .first()
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(headerHeight).toBeLessThan(72);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      393,
    );

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(400);
    const wordmark = page.getByTestId('brand-home');
    await expect(wordmark).toBeVisible();
    await expect(wordmark).toHaveText('Gregory Lazatin');
    const wordmarkBox = await wordmark.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(wordmarkBox.scrollWidth).toBeLessThanOrEqual(wordmarkBox.clientWidth + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });

  test('coarse pointers cap DPR at 2 and idle ambient at 15fps', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'power budget applies to touch-first devices');
    await page.goto('/');
    const canvas = page.getByTestId('graph-canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(3000);
    expect(await canvas.getAttribute('data-render-dpr')).toBe('2');
    const before = Number(await canvas.getAttribute('data-render-count'));
    await page.waitForTimeout(1000);
    const after = Number(await canvas.getAttribute('data-render-count'));
    const frames = after - before;
    expect(frames).toBeGreaterThanOrEqual(8);
    expect(frames).toBeLessThanOrEqual(25);
  });

  test('mobile 3-dot menu hosts Sound, volume, and a reachable Reset', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'in-menu Sound is mobile/coarse-pointer only');
    const errors = trackErrors(page);
    await page.goto('/');
    await openFilters(page);
    const toggle = page.getByTestId('mobile-audio-toggle');
    const slider = page.getByTestId('mobile-volume-slider');
    await expect(toggle).toBeVisible();
    await expect(slider).toBeVisible();
    const toggleBox = await toggle.boundingBox();
    const sliderBox = await slider.boundingBox();
    expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(sliderBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const indicator = page.getByTestId('controls-sound-indicator');
    await expect(indicator).toBeVisible();
    const dotBox = await indicator.boundingBox();
    expect(dotBox?.width ?? 0).toBeGreaterThanOrEqual(5);

    await slider.evaluate((element, next) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, String(next));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, 0.32);
    await expect(slider).toHaveValue('0.32');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('portfolio_sound_volume')))
      .toBe('0.32');

    // A canceled slider gesture must not throw away the last value.
    await slider.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch' });
    await slider.dispatchEvent('pointercancel', { pointerId: 9, pointerType: 'touch' });
    await expect(slider).toHaveValue('0.32');

    // Short landscape viewport: the panel scrolls and Reset remains reachable.
    await page.setViewportSize({ width: 852, height: 393 });
    await page.waitForTimeout(400);
    await openFilters(page);
    const dropdown = page.getByTestId('controls-dropdown');
    const scroll = await dropdown.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    }));
    expect(scroll.overflowY).toBe('auto');
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    const reset = page.getByTestId('reset-layout');
    await reset.scrollIntoViewIfNeeded();
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(page.getByTestId('search-input')).toHaveValue('');

    // Narrow portrait: Reset is reachable without horizontal clipping.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(400);
    await openFilters(page);
    await reset.scrollIntoViewIfNeeded();
    await expect(reset).toBeVisible();
    await reset.click();
    expect(errors).toEqual([]);
  });

  test('pointercancel ends a drag cleanly and empty-canvas tap clears sticky focal', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'touch pointer lifecycle');
    const errors = trackErrors(page);
    await page.goto('/');
    await page.waitForTimeout(1500);
    const canvas = page.getByTestId('graph-canvas');
    await focusNode(page);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 60, centerY + 40, { steps: 6 });
    await expect
      .poll(() => canvas.getAttribute('data-sim-state'))
      .toBe('drag');
    await page.dispatchEvent('[data-testid="graph-canvas"]', 'pointercancel', {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: centerX + 60,
      clientY: centerY + 40,
      isPrimary: true,
    });
    await page.waitForTimeout(200);
    await expect
      .poll(() => canvas.getAttribute('data-sim-state'))
      .toBe('idle');
    await page.mouse.up().catch(() => {});

    // A canceled gesture must not be interpreted as a tap; the next tap does open.
    await blurActiveElement(page);
    await page.waitForTimeout(700);
    await tapCenteredNode(page);
    await page.getByTestId('drawer-close').click();
    await blurActiveElement(page);
    await page.waitForTimeout(900);

    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);
    expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')))).toBeLessThan(2);
    expect(Math.abs(Number(await canvas.getAttribute('data-camera-y')))).toBeLessThan(2);

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport unavailable');
    await page.touchscreen.tap(viewport.width - 20, 100);
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBe(0);
    expect(errors).toEqual([]);
  });

  test('mobile sheet pans the selected node into the measured strip and snaps detents', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile sheet camera + detents');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.waitForTimeout(1500);
    await tapCenteredNode(page);
    const canvas = page.getByTestId('graph-canvas');
    const drawer = page.getByTestId('project-drawer');
    await page.waitForTimeout(1000);

    const strip = async () => {
      const headerBottom = await page
        .locator('header')
        .first()
        .evaluate((element) => element.getBoundingClientRect().bottom);
      const sheetTop = (await drawer.boundingBox())!.y;
      const selectedY = Number(await canvas.getAttribute('data-selected-screen-y'));
      return { headerBottom, sheetTop, selectedY };
    };

    let geometry = await strip();
    expect(geometry.selectedY).toBeGreaterThan(geometry.headerBottom);
    expect(geometry.selectedY).toBeLessThan(geometry.sheetTop);
    expect(
      Math.abs(geometry.selectedY - (geometry.headerBottom + geometry.sheetTop) / 2),
    ).toBeLessThan(30);

    await blurActiveElement(page);
    await page.setViewportSize({ width: 852, height: 393 });
    await page.waitForTimeout(900);
    await expect(drawer).toBeVisible();
    geometry = await strip();
    expect(geometry.selectedY).toBeGreaterThan(geometry.headerBottom);
    expect(geometry.selectedY).toBeLessThan(geometry.sheetTop);

    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForTimeout(900);
    await dragSheetHandle(page, -300);
    await expect(drawer).toHaveAttribute('data-sheet-detent', 'full');
    expect(await sheetHeightRatio(page)).toBeGreaterThan(0.83);

    await dragSheetHandle(page, 400);
    await expect(drawer).toHaveAttribute('data-sheet-detent', 'peek');
    expect(await sheetHeightRatio(page)).toBeLessThan(0.32);

    await dragSheetHandle(page, 170);
    await expect(drawer).toHaveCount(0);
    await blurActiveElement(page);
    await page.waitForTimeout(900);
    expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')))).toBeLessThan(2);
    expect(Math.abs(Number(await canvas.getAttribute('data-camera-y')))).toBeLessThan(2);
  });

  test('portrait, landscape, and tablet matrix stays reachable without overflow', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'responsive matrix runs once on the mobile project');
    for (const viewport of [
      { width: 393, height: 852 },
      { width: 852, height: 393 },
      { width: 375, height: 667 },
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForTimeout(1200);
      await expect(page.getByTestId('graph-canvas')).toBeVisible();
      await expect(page.getByTestId('brand-home')).toBeVisible();
      await expect(page.getByTestId('controls-dropdown-trigger')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);

      await openFilters(page);
      const reset = page.getByTestId('reset-layout');
      await reset.scrollIntoViewIfNeeded();
      await expect(reset).toBeVisible();
      await page.keyboard.press('Escape');

      await page.goto('/#/p/open-dungeon');
      const drawer = page.getByTestId('project-drawer');
      await expect(drawer).toBeVisible();
      const box = await drawer.boundingBox();
      if (!box) throw new Error(`drawer has no box at ${viewport.width}x${viewport.height}`);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      const detent = await drawer.getAttribute('data-sheet-detent');
      if (detent) {
        expect(Math.round(box.y + box.height)).toBe(viewport.height);
      } else {
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      }
      await page.getByTestId('drawer-close').click();
      await expect(drawer).toHaveCount(0);
    }
  });

  test('LLM tag pill dims non-matching projects in the semantic nav', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('tag-pill-LLM').click();

    await expect(page.getByTestId('nav-open-dungeon')).not.toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('nav-pict-climate-risk-viz-chatbot')).not.toHaveAttribute('data-dimmed', 'true');

    await expect(page.getByTestId('nav-transcribe-plus')).toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('nav-sandwave-sim')).toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('nav-attention-max')).toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('nav-agentic-resume-builder')).toHaveAttribute('data-dimmed', 'true');
  });

  test('search dims non-matching projects', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('search-input').fill('dungeon');
    await expect(page.getByTestId('nav-open-dungeon')).not.toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('nav-transcribe-plus')).toHaveAttribute('data-dimmed', 'true');
  });

  test('deep link #/p/open-dungeon opens the drawer on load and closing clears the hash', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await page.getByTestId('drawer-close').click();
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe('');
    expect(errors).toEqual([]);
  });

  test('unknown deep link slug is ignored without crashing', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/#/p/non-existent-tool');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('Escape closes the project drawer', async ({ page }) => {
    await page.goto('/#/p/transcribe-plus');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
  });

  test('theme switch persists across reloads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('opening a project records it in the visited set', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-toggle').click();
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const visited = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('portfolio_visited') ?? '[]'),
    );
    expect(visited).toContain('open-dungeon');
  });

  test('About button opens the modal and Escape/close dismiss it', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await page.getByTestId('nav-about').click();
    const modal = page.getByTestId('about-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toContainText(
      'Gregory Lazatin is currently a Junior at Brown University studying Computer Science.',
    );
    await expect(modal).not.toContainText('Creative Technologist');
    await expect(modal).not.toContainText('Focus areas');
    await expect(modal).not.toContainText('LLM agent tooling');

    await expect(page.getByTestId('about-email')).toHaveAttribute(
      'href',
      'mailto:gregory.lazatin2006@gmail.com',
    );
    await expect(page.getByTestId('about-linkedin')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/gregory-lazatin/',
    );
    await expect(page.getByTestId('about-github')).toHaveAttribute('href', GITHUB_URL);
    await expect(page.getByTestId('about-resume')).toHaveAttribute(
      'href',
      /drive\.google\.com\/file\/.+\/view/,
    );

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');

    await page.getByTestId('nav-about').click();
    await expect(modal).toBeVisible();
    await page.getByTestId('about-close').click();
    await expect(modal).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('About modal click-to-loads the sandboxed Google Drive resume preview', async ({
    page,
  }) => {
    await page.goto('/#/about');
    await expect(page.getByTestId('about-modal')).toBeVisible();
    await expect(page.getByTestId('resume-preview-iframe')).toHaveCount(0);
    await page.getByTestId('about-resume-preview-trigger').click();
    const frame = page.getByTestId('resume-preview-iframe');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute(
      'src',
      /drive\.google\.com\/file\/.+\/preview/,
    );
    await expect(frame).toHaveAttribute('sandbox', /allow-scripts/);
  });

  test('#/about deep link opens the modal and backdrop dismisses it', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/#/about');
    const modal = page.getByTestId('about-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('about-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
    expect(errors).toEqual([]);
  });

  test('GitHub navigation and profile links point to slowbutfast', async ({ page }, testInfo) => {
    await page.goto('/');
    if (isMobile(testInfo)) {
      await expect(page.getByTestId('nav-github')).toBeHidden();
    } else {
      await expect(page.getByTestId('nav-github')).toHaveAttribute('href', GITHUB_URL);
    }
    await page.getByTestId('nav-about').click();
    await expect(page.getByTestId('about-github')).toHaveAttribute('href', GITHUB_URL);
    await expect(page.getByTestId('about-github')).toBeVisible();
  });

  test('dragging a node and releasing settles without console errors', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pointer drag smoke test runs on desktop');
    const errors = trackErrors(page);
    await page.goto('/');
    const box = await hoverCenteredNode(page);
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 260, startY + 140, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(1400);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('hovering a node reveals its media preview card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    const box = await hoverCenteredNode(page);
    await expect(page.getByTestId('hover-card-title')).toHaveText('OpenDungeon');
    await expect(page.getByTestId('node-hover-card')).toContainText('Click to inspect');
    await expect(page.getByTestId('hover-code')).toHaveAttribute(
      'href',
      'https://github.com/slowbutfast/open-dungeon',
    );
    await expect(page.getByTestId('hover-visit')).toBeVisible();
    await page.mouse.move(box.x + 10, box.y + box.height - 10);
    await expect(page.getByTestId('node-hover-card')).toHaveCount(0);
  });

  test('terminal-only hover fallback omits the CLI specimen badge', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    await hoverCenteredNode(page, 'kintsugi-fracture');
    const card = page.getByTestId('node-hover-card');
    await expect(card).toContainText('Kintsugi Fracture');
    await expect(card).not.toContainText('CLI specimen');
    await expect(card).not.toContainText('[CLI Specimen]');
    await expect(card).not.toContainText('>_');
  });

  test('hover card survives a 150ms pointer transfer and dismisses on drag', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    await hoverCenteredNode(page);
    const card = page.getByTestId('node-hover-card');
    await expect(card).toBeVisible();

    const cardBox = await card.boundingBox();
    if (!cardBox) throw new Error('hover card has no bounding box');
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.waitForTimeout(300);
    await expect(card).toBeVisible();
    await expect(page.getByTestId('hover-code')).toBeVisible();

    // Returning to the node and starting a drag dismisses the card immediately.
    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(card).toBeVisible();
    await page.mouse.down();
    await expect(card).toHaveCount(0);
    await page.mouse.up();
  });

  test('3-dot menu exposes one Reset that clears filters, layout, and visited colors', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('portfolio_visited', JSON.stringify(['open-dungeon']));
      } catch {
        // ignore storage denial
      }
    });
    await page.goto('/');
    const trigger = await openFilters(page);
    const dropdown = page.getByTestId('controls-dropdown');
    await expect(trigger).toHaveAccessibleName('Filters & Layout');
    await expect(dropdown.getByRole('heading', { name: 'Filters' })).toBeVisible();

    await page.getByTestId('tag-pill-LLM').click();
    await page.getByTestId('search-input').fill('dungeon');
    await expect(page.getByTestId('nav-transcribe-plus')).toHaveAttribute('data-dimmed', 'true');

    await expect(dropdown.getByTestId('reset-filters')).toHaveCount(0);
    const reset = dropdown.getByTestId('reset-layout');
    await expect(reset).toHaveAccessibleName('Reset');
    await expect(reset).toHaveText('Reset');

    await reset.click();
    await expect(page.getByTestId('tag-pill-LLM')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('search-input')).toHaveValue('');
    await expect(page.getByTestId('nav-transcribe-plus')).not.toHaveAttribute(
      'data-dimmed',
      'true',
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem('portfolio_visited');
          return raw ? (JSON.parse(raw) as string[]).length : 0;
        }),
      )
      .toBe(0);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
  });

  test('canvas cursor is crosshair only while over or dragging a node', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pointer cursor test runs on desktop');
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);
    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    const cursorAt = async (x: number, y: number) => {
      await page.mouse.move(x, y);
      await page.waitForTimeout(60);
      return canvas.evaluate((element) => getComputedStyle(element).cursor);
    };

    await expect
      .poll(() => cursorAt(box.x + 10, box.y + box.height - 10))
      .toBe('default');
    await expect
      .poll(() => cursorAt(box.x + box.width / 2, box.y + box.height / 2))
      .toBe('crosshair');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await canvas.evaluate((element) => getComputedStyle(element).cursor)).toBe(
      'crosshair',
    );
    await page.mouse.up();
  });

  test('LLM filter dims every edge with a non-matching endpoint', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('tag-pill-LLM').click();
    const raw = await page.getByTestId('graph-canvas').getAttribute('data-dimmed-edges');
    const dimmedEdges = new Set((raw ?? '').split(',').filter(Boolean));

    // Both LLM projects stay bright; the edge between them remains active.
    expect(dimmedEdges.has(edgeKey('open-dungeon', 'pict-climate-risk-viz-chatbot'))).toBe(false);
    // A mixed active/dimmed pair must dim, unlike the old `&&` behavior.
    expect(dimmedEdges.has(edgeKey('open-dungeon', 'transcribe-plus'))).toBe(true);
    expect(dimmedEdges.has(edgeKey('attention-max', 'kintsugi-fracture'))).toBe(true);
    expect(dimmedEdges.size).toBe(12);
  });

  test('hover dwell suppresses fast sweeps and opens after 250ms', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);

    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Cross the centered node and leave well inside the 250ms dwell window.
    await page.mouse.move(centerX, centerY);
    await page.mouse.move(box.x + 12, box.y + box.height - 12);
    await page.waitForTimeout(120);
    await expect(page.getByTestId('node-hover-card')).toHaveCount(0);

    // Returning and dwelling opens the card only after the timer fires.
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(180);
    await expect(page.getByTestId('node-hover-card')).toHaveCount(0);
    await expect(page.getByTestId('node-hover-card')).toBeVisible();
  });

  test('focal edge tag pills persist while the inspector is open', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);
    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await expect(page.getByTestId('node-hover-card')).toBeVisible();
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);

    await page.mouse.click(centerX, centerY);
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
    // The inspected focal connection stays sticky after closing the drawer.
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);

    // Leaving the node does not clear the sticky highlight.
    await page.mouse.move(box.x + 12, box.y + box.height - 12);
    await page.waitForTimeout(150);
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);

    // Re-center the node, dwell on it for 250ms, then leave and blur the
    // semantic nav. The sticky highlight must already be cleared; otherwise
    // the focal tag pills would remain after both hover and focus are gone.
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);
    await page.mouse.move(centerX, centerY);
    await expect(page.getByTestId('node-hover-card')).toBeVisible();
    await page.mouse.move(box.x + 12, box.y + box.height - 12);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBe(0);
  });

  test('Reset clears the sticky inspected focus', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'sticky focus test runs on desktop');
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await page.getByTestId('drawer-close').click();
    const canvas = page.getByTestId('graph-canvas');
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBeGreaterThan(0);

    await openFilters(page);
    await page.getByTestId('reset-layout').click();
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-focal-tag-pills')) ?? 0))
      .toBe(0);
  });

  test('mid-drag reduced-motion transition releases the drag cleanly', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pointer drag test runs on desktop');
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);
    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(300);
    await page.mouse.down();
    await page.mouse.move(centerX + 120, centerY + 80, { steps: 8 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => canvas.getAttribute('data-sim-state'))
      .toBe('idle');
  });

  test('live reduced-motion transitions freeze and resume hover capability', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await page.goto('/');
    const box = await hoverCenteredNode(page);
    const card = page.getByTestId('node-hover-card');
    await expect(card).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(card).toHaveCount(0);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(350);
    await expect(card).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.move(box.x + 12, box.y + box.height - 12);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(card).toBeVisible();
  });

  for (const viewport of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'narrow mobile', width: 393, height: 852 },
  ]) {
    test(`hover card stays inside the ${viewport.label} viewport at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await hoverCenteredNode(page);
      const card = page.getByTestId('node-hover-card');
      const cardBox = await card.boundingBox();
      if (!cardBox) throw new Error('hover card has no bounding box');
      const margin = 20;

      expect(cardBox.x).toBeGreaterThanOrEqual(margin - 1);
      expect(cardBox.y).toBeGreaterThanOrEqual(margin - 1);
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(viewport.width - margin + 1);
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(viewport.height - margin + 1);

      const cardCenter = {
        x: cardBox.x + cardBox.width / 2,
        y: cardBox.y + cardBox.height / 2,
      };
      const offset = Math.hypot(
        cardCenter.x - viewport.width / 2,
        cardCenter.y - viewport.height / 2,
      );
      expect(offset).toBeGreaterThan(60);
    });
  }

  test('desktop inspector drags from its border and stays inside the viewport', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'drawer dragging runs on desktop');
    await page.goto('/#/p/open-dungeon');
    const drawer = page.getByTestId('project-drawer');
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(600);
    const before = await drawer.boundingBox();
    if (!before) throw new Error('drawer drag geometry is unavailable');

    // The left border is the drag surface; hovering it shows the move cursor.
    const startX = before.x + 3;
    const startY = before.y + before.height / 2;
    await page.mouse.move(startX, startY);
    await expect
      .poll(() => drawer.evaluate((element) => getComputedStyle(element).cursor))
      .toBe('move');
    await page.mouse.down();
    await page.mouse.move(startX + 140, startY + 60, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const after = await drawer.boundingBox();
    if (!after) throw new Error('drawer lost its bounding box after dragging');
    expect(
      Math.hypot(after.x - before.x, after.y - before.y),
    ).toBeGreaterThan(60);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport is unavailable');
    expect(after.x).toBeGreaterThanOrEqual(15);
    expect(after.y).toBeGreaterThanOrEqual(70);
    expect(after.x + after.width).toBeLessThanOrEqual(viewport.width - 15);
    expect(after.y + after.height).toBeLessThanOrEqual(viewport.height - 15);
  });

  test('canvas selection anchors the inspector beside the node', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'anchored offset is only distinguishable on desktop');
    await page.goto('/');
    const box = await hoverCenteredNode(page);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const drawer = page.getByTestId('project-drawer');
    await expect(drawer).toBeVisible();
    const panel = await drawer.boundingBox();
    if (!panel) throw new Error('project drawer has no bounding box');
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport is unavailable');
    expect(panel.x).toBeGreaterThanOrEqual(15);
    expect(panel.y).toBeGreaterThanOrEqual(70);
    expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width - 15);
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height - 15);
    const anchorX = box.x + box.width / 2;
    const besideNode =
      panel.x + panel.width <= anchorX + 40 || panel.x >= anchorX - 40;
    expect(besideNode).toBe(true);
  });

  test('accessibility: graph view has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await useDarkTheme(page);
    await page.goto('/');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Graph view violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: list view has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await useDarkTheme(page);
    await page.goto('/');
    await page.getByTestId('view-toggle').click();
    await expect(page.getByTestId('card-open-dungeon')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `List view violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: open drawer has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await useDarkTheme(page);
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Drawer violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: open drawer has zero WCAG A/AA violations (light)', async ({ page }) => {
    await useLightTheme(page);
    await page.goto('/#/p/open-dungeon');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Light drawer violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: About modal has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await useDarkTheme(page);
    await page.goto('/#/about');
    await expect(page.getByTestId('about-modal')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `About modal violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: About modal has zero WCAG A/AA violations (light)', async ({ page }) => {
    await useLightTheme(page);
    await page.goto('/#/about');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('about-modal')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Light About modal violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: hover media card has zero WCAG A/AA violations (dark)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await useDarkTheme(page);
    await page.goto('/');
    await hoverCenteredNode(page);
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Hover card violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: hover media card has zero WCAG A/AA violations (light)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover previews are desktop-only');
    await useLightTheme(page);
    await page.goto('/');
    await hoverCenteredNode(page);
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Light hover card violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: graph view has zero WCAG A/AA violations (light)', async ({ page }) => {
    await useLightTheme(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Light graph violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: list view has zero WCAG A/AA violations (light)', async ({ page }) => {
    await useLightTheme(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('view-toggle').click();
    await expect(page.getByTestId('card-open-dungeon')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Light list violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('controls expose clean accessible names and fluid pills', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByTestId('brand-home')).toHaveText('Gregory Lazatin');
    await expect(page.getByTestId('nav-about')).toHaveAccessibleName('About');
    await expect(page.getByTestId('view-toggle')).toHaveAccessibleName('Switch to list view');
    if (isMobile(testInfo)) {
      await expect(page.getByTestId('nav-github')).toBeHidden();
      await expect(page.getByTestId('audio-toggle')).toBeHidden();
    } else {
      await expect(page.getByTestId('nav-github')).toHaveAccessibleName('GitHub');
      await expect(page.getByTestId('audio-toggle')).toHaveAccessibleName('Sound');
      await expect(page.getByTestId('audio-toggle')).toHaveAttribute('aria-pressed', 'false');
    }
    const trigger = await openFilters(page);
    await expect(trigger).toHaveAccessibleName('Filters & Layout');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    if (isMobile(testInfo)) {
      await expect(page.getByTestId('mobile-audio-toggle')).toHaveAccessibleName('Sound');
      await expect(page.getByTestId('mobile-audio-toggle')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await expect(page.getByTestId('mobile-volume-slider')).toHaveAccessibleName(
        'Sound volume',
      );
    }

    const llmPill = page.getByRole('button', { name: 'LLM', exact: true });
    await expect(llmPill).toHaveCount(1);
    await expect(llmPill).toHaveAccessibleName('LLM');
    await expect(llmPill).toHaveText('LLM');
    await expect(llmPill).toHaveClass(/fluid-pill/);

    const generatedContent = await llmPill.evaluate((el) => ({
      before: getComputedStyle(el, '::before').content,
      after: getComputedStyle(el, '::after').content,
    }));
    for (const content of [generatedContent.before, generatedContent.after]) {
      expect(['none', 'normal', '""']).toContain(content);
    }

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('drawer keeps exactly one h1 and an accessible h2 heading', async ({ page }) => {
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const heading = page.getByTestId('drawer-heading');
    await expect(heading).toHaveText('OpenDungeon');
    await expect(heading).toHaveJSProperty('tagName', 'H2');
  });

  test('reduced motion renders the resolved drawer title immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/p/transcribe-plus');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('drawer-title')).toHaveText('Transcribe Plus');
  });

  test('reduced motion filter toggles repaint the static graph', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('tag-pill-LLM').click();
    // The static ring cannot rely on the rAF loop; assert the semantic nav
    // updates and the canvas remains visible after the explicit repaint.
    await expect(page.getByTestId('nav-transcribe-plus')).toHaveAttribute('data-dimmed', 'true');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await page.keyboard.press('Escape');
    const pixelChange = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="graph-canvas"]');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let opaque = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque += 1;
      return opaque;
    });
    expect(pixelChange).not.toBeNull();
    expect(pixelChange).toBeGreaterThan(0);
  });

  test('pointer moves along the canvas edge cause zero React commits', async ({ page }) => {
    // React production builds never call Profiler onRender, so this would pass
    // vacuously against a deployed (production) build.
    test.skip(Boolean(process.env.PREVIEW_URL), 'requires a development build (Profiler commits)');
    await page.goto('/');
    const canvas = page.getByTestId('graph-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.__REACT_COMMITS__);
    const steps = 200;
    const y = box.y + box.height - 8;
    for (let i = 0; i < steps; i += 1) {
      const x = box.x + 20 + ((box.width - 40) * i) / steps;
      await page.mouse.move(x, y);
    }
    const after = await page.evaluate(() => window.__REACT_COMMITS__);
    expect(after - before).toBe(0);
  });

  test('sustains frame rate under 4x CPU throttling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'CPU throttle test runs on desktop only');
    await page.goto('/');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    try {
      const meanDelta = await page.evaluate(async () => {
        const sample = (frames: number) =>
          new Promise<number[]>((resolve) => {
            const deltas: number[] = [];
            let last = performance.now();
            let count = 0;
            const frame = (now: number) => {
              deltas.push(now - last);
              last = now;
              count += 1;
              if (count < frames) requestAnimationFrame(frame);
              else resolve(deltas);
            };
            requestAnimationFrame(frame);
          });
        await sample(30); // warmup
        const deltas = await sample(60);
        const measured = deltas.slice(3);
        return measured.reduce((sum, d) => sum + d, 0) / measured.length;
      });
      expect(meanDelta).toBeLessThan(20);
    } finally {
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
  });
});
