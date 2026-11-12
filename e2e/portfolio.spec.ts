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
    await expect(page.getByTestId('controls-dropdown-trigger')).toBeVisible();

    await openFilters(page);
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('list view renders 6 cards and a card click opens the project drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-toggle').click();
    for (const id of PROJECT_IDS) {
      await expect(page.getByTestId(`card-${id}`)).toBeVisible();
    }
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveAttribute('aria-modal', 'true');
  });

  test('terminal command chip executes and displays captured output', async ({ page }) => {
    await page.goto('/#/p/agentic-resume-builder');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('command-chip').first()).toBeVisible();
    await page.getByTestId('command-chip').first().click();
    await expect(page.getByTestId('terminal-output')).toContainText('exit code');
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
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await page.getByTestId('drawer-close').click();
    await expect(page.getByTestId('project-drawer')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe('');
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
    await openFilters(page);
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
    await page.goto('/');
    await page.getByTestId('nav-about').click();
    const modal = page.getByTestId('about-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toContainText('Creative Technologist');
    await expect(modal).toContainText('LLM agent tooling');
    await expect(page.getByTestId('about-github')).toHaveAttribute('href', GITHUB_URL);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');

    await page.getByTestId('nav-about').click();
    await expect(modal).toBeVisible();
    await page.getByTestId('about-close').click();
    await expect(modal).toHaveCount(0);
  });

  test('#/about deep link opens the modal and backdrop dismisses it', async ({ page }) => {
    await page.goto('/#/about');
    const modal = page.getByTestId('about-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('about-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
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
    await page.mouse.move(box.x + 10, box.y + box.height - 10);
    await expect(page.getByTestId('node-hover-card')).toHaveCount(0);
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
    await page.goto('/');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze();
    expect(
      results.violations,
      `Graph view violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: list view has zero WCAG A/AA violations (dark)', async ({ page }) => {
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
