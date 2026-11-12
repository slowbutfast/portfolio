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

test.describe('portfolio graph SPA', () => {
  test('loads on desktop and mobile with zero console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Projects"]')).toHaveCount(1);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Portfolio');
    await openFilters(page);
    await expect(page.getByTestId('view-toggle-list')).toBeVisible();
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('list view renders 6 cards and a card click opens the project drawer', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('view-toggle-list').click();
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
    await openFilters(page);
    await page.getByTestId('view-toggle-list').click();
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const visited = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('portfolio_visited') ?? '[]'),
    );
    expect(visited).toContain('open-dungeon');
  });

  test('canvas selection anchors the inspector beside the node', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'anchored offset is only distinguishable on desktop');
    await page.goto('/');
    // Let the force simulation settle before panning the camera.
    await page.waitForTimeout(1500);
    // Focusing the semantic nav pans the camera so the node sits at canvas center.
    await page.getByTestId('nav-open-dungeon').focus();
    await page.waitForTimeout(1600);
    const canvas = page.getByTestId('graph-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    // Hover pins the centered node before the click blurs the semantic nav.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
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
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `Graph view violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: list view has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('card-open-dungeon')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `List view violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: open drawer has zero WCAG A/AA violations (dark)', async ({ page }) => {
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `Drawer violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: open drawer has zero WCAG A/AA violations (light)', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('portfolio_theme', 'light');
      } catch {
        // ignore storage denial
      }
    });
    await page.goto('/#/p/open-dungeon');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `Light drawer violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: graph view has zero WCAG A/AA violations (light)', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `Light graph violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('accessibility: list view has zero WCAG A/AA violations (light)', async ({ page }) => {
    await page.goto('/');
    await openFilters(page);
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('card-open-dungeon')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `Light list violations:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });

  test('controls expose clean accessible names and fluid pills', async ({ page }) => {
    await page.goto('/');
    const trigger = await openFilters(page);
    await expect(trigger).toHaveAccessibleName('Filters & Navigation');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const graphToggle = page.getByRole('button', { name: 'Graph' });
    const listToggle = page.getByRole('button', { name: 'List' });
    await expect(graphToggle).toBeVisible();
    await expect(listToggle).toBeVisible();
    await expect(graphToggle).toHaveAccessibleName('Graph');
    await expect(listToggle).toHaveAccessibleName('List');
    await expect(graphToggle).toHaveClass(/fluid-pill/);

    const llmPill = page.getByRole('button', { name: 'LLM', exact: true });
    await expect(llmPill).toHaveCount(1);
    await expect(llmPill).toHaveAccessibleName('LLM');
    await expect(llmPill).toHaveText('LLM');

    // No generated bracket glyphs remain on the fluid pills.
    const generatedContent = await graphToggle.evaluate((el) => ({
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

  test('pointer moves across the canvas cause zero React commits', async ({ page }) => {
    await page.goto('/');
    const canvas = page.getByTestId('graph-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('graph canvas has no bounding box');
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.__REACT_COMMITS__);
    const steps = 200;
    for (let i = 0; i < steps; i += 1) {
      const x = box.x + 20 + ((box.width - 40) * i) / steps;
      const y = box.y + box.height / 2 + Math.sin(i / 8) * (box.height / 4);
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
