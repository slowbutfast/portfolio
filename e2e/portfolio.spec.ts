import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

const PROJECT_IDS = [
  'open-dungeon',
  'agentic-resume-builder',
  'pict-climate-risk-viz-chatbot',
  'transcribe-plus',
  'sandwave-sim',
  'attention-max',
];

const GITHUB_URL = 'https://github.com/slowbutfast';

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
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
  'theme-toggle',
  'controls-dropdown-trigger',
];

async function headerOrder(page: Page): Promise<string[]> {
  return page.evaluate((ids) => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('header [data-testid]'),
    );
    return nodes
      .map((node) => node.dataset.testid ?? '')
      .filter((id) => ids.includes(id));
  }, HEADER_ORDER);
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
  test('loads on desktop and mobile with zero console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Projects"]')).toHaveCount(1);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Portfolio');

    await expect(page.getByTestId('brand-home')).toHaveText('Gregory Lazatin');
    await expect(page.getByTestId('nav-about')).toBeVisible();
    await expect(page.getByTestId('nav-github')).toBeVisible();
    await expect(page.getByTestId('view-toggle')).toHaveText('Grid');
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    await expect(page.getByTestId('controls-dropdown-trigger')).toBeVisible();

    await openFilters(page);
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
    await expect(page).toHaveTitle(
      'Gregory Lazatin — Software Engineer & Creative Technologist',
    );
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

  test('header controls follow the canonical top-right sequence', async ({ page }) => {
    await page.goto('/');
    expect(await headerOrder(page)).toEqual(HEADER_ORDER);
    await expect(page.getByTestId('theme-toggle')).toHaveText(/^(Dark|Light)$/);
    await expect(page.getByTestId('top-scrim')).toBeVisible();

    // The theme toggle lives in the header, not inside the Filters dropdown.
    await openFilters(page);
    await expect(
      page.getByTestId('controls-dropdown').getByTestId('theme-toggle'),
    ).toHaveCount(0);
  });

  test('list view renders 6 cards and a card click opens the project drawer', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await page.getByTestId('view-toggle').click();
    for (const id of PROJECT_IDS) {
      await expect(page.getByTestId(`card-${id}`)).toBeVisible();
    }
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveAttribute('aria-modal', 'true');
    expect(errors).toEqual([]);
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
    await expect(page.getByTestId('terminal-specimen-agentic-resume-builder')).toContainText(
      '[CLI Specimen]',
    );
    await expect(terminalCard.locator('img')).toHaveCount(0);
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

  test('mobile drawer docks as an 85dvh bottom sheet', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'bottom-sheet layout is mobile-only');
    await page.goto('/#/p/open-dungeon');
    const drawer = page.getByTestId('project-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/max-h-\[85dvh\]/);
    await expect(drawer).toHaveClass(/bottom-0/);
    await expect(drawer).toHaveClass(/rounded-t-2xl/);
    const box = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
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

  test('GitHub navigation and profile links point to slowbutfast', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-github')).toHaveAttribute('href', GITHUB_URL);
    await page.getByTestId('nav-about').click();
    await expect(page.getByTestId('about-github')).toHaveAttribute('href', GITHUB_URL);
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

  test('canvas selection anchors the inspector beside the node', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'anchored offset is only distinguishable on desktop');
    await page.goto('/');
    const box = await hoverCenteredNode(page);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const drawer = page.getByTestId('project-drawer');
    await expect(drawer).toBeVisible();
    const left = await drawer.evaluate((el) => Number.parseFloat((el as HTMLElement).style.left));
    expect(left).toBeGreaterThan(box.width / 2 - 100);
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

  test('controls expose clean accessible names and fluid pills', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('brand-home')).toHaveText('Gregory Lazatin');
    await expect(page.getByTestId('nav-about')).toHaveAccessibleName('About');
    await expect(page.getByTestId('nav-github')).toHaveAccessibleName('GitHub');
    await expect(page.getByTestId('view-toggle')).toHaveAccessibleName('Switch to list view');
    const trigger = await openFilters(page);
    await expect(trigger).toHaveAccessibleName('Filters & Navigation');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

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
