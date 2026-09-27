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

test.describe('portfolio graph SPA', () => {
  test('loads on desktop and mobile with zero console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Projects"]')).toHaveCount(1);
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.getByTestId('view-toggle-list')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('list view renders 6 cards and a card click opens the project drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-toggle-list').click();
    for (const id of PROJECT_IDS) {
      await expect(page.getByTestId(`card-${id}`)).toBeVisible();
    }
    await page.getByTestId('card-open-dungeon').click();
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('project-drawer')).toHaveAttribute('aria-modal', 'true');
  });

  test('terminal command chip executes and displays captured output', async ({ page }) => {
    await page.goto('/#/p/open-dungeon');
    await expect(page.getByTestId('project-drawer')).toBeVisible();
    await expect(page.getByTestId('command-chip').first()).toBeVisible();
    await page.getByTestId('command-chip').first().click();
    await expect(page.getByTestId('terminal-output')).toContainText('exit code');
  });

  test('LLM tag pill dims non-matching projects in the semantic nav', async ({ page }) => {
    await page.goto('/');
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
});