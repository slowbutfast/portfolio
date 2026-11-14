import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const realCatalogPath = process.env.PORTFOLIO_STUDIO_E2E_REAL_CATALOG ?? '';
let realCatalogBytes = '';

test.skip(Boolean(process.env.PREVIEW_URL), 'Project Studio is dev-only.');
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  realCatalogBytes = readFileSync(realCatalogPath, 'utf8');
});

test.afterAll(() => {
  // The isolated temp catalog must absorb every write.
  expect(readFileSync(realCatalogPath, 'utf8')).toBe(realCatalogBytes);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/#/studio');
  await expect(page.getByTestId('studio-app')).toBeVisible();
  await expect(page.getByTestId('studio-dirty')).toHaveText('Synced');
});

test('creates, renames, saves, and deletes a project with its seed', async ({ page }) => {
  await page.getByTestId('studio-add-project').click();
  await expect(page.getByTestId('studio-project-id')).toHaveValue('project-10');
  await expect(page.getByTestId('studio-dirty')).toHaveText('Unsaved changes');

  await page.getByTestId('studio-title').fill('E2E Project');
  await page.getByTestId('studio-summary').fill('Created by the Studio E2E suite.');
  await page.getByTestId('studio-project-id').fill('e2e-project');

  await expect(page.getByTestId('seed-e2e-project')).toBeVisible();
  await expect(page.getByTestId('seed-project-10')).toHaveCount(0);

  const beforeSave = await page.getByTestId('studio-project-id').inputValue();
  expect(beforeSave).toBe('e2e-project');

  const save = page.getByTestId('studio-save');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByTestId('studio-dirty')).toHaveText('Synced');

  await page.getByTestId('studio-project-e2e-project').click();
  await page.getByTestId('studio-delete-project').click();
  await expect(page.getByTestId('studio-project-e2e-project')).toHaveCount(0);
  await page.getByTestId('studio-save').click();
  await expect(page.getByTestId('studio-dirty')).toHaveText('Synced');
});

test('manages tags, protects art, and previews live edge changes', async ({ page }) => {
  const tagManager = page.getByRole('region', { name: 'Tag manager' });
  await expect(page.getByRole('button', { name: 'Delete tag art' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Rename tag art' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Toggle hidden art' })).toBeDisabled();

  await page.getByLabel('New tag').fill('E2E-Tag');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await expect(tagManager.getByText('E2E-Tag', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Rename tag E2E-Tag' }).click();
  await page.getByLabel('Rename E2E-Tag').fill('E2E-Renamed');
  await page.getByLabel('Rename E2E-Tag').press('Enter');
  await expect(tagManager.getByText('E2E-Renamed', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Toggle hidden E2E-Renamed' }).click();
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'E2E-Renamed' })
      .getByText('hidden', { exact: true }),
  ).toBeVisible();

  await page.getByTestId('studio-discard').click();
  await expect(tagManager.getByText('E2E-Renamed', { exact: true })).toHaveCount(0);
});

test('blocks saving when a dragged seed creates a crossing', async ({ page }) => {
  const minimap = page.getByTestId('seed-minimap');
  const mapBox = (await minimap.boundingBox())!;
  const node = page.getByTestId('seed-attention-max');
  const nodeBox = (await node.boundingBox())!;

  await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(mapBox.x + mapBox.width * 0.06, mapBox.y + mapBox.height * 0.06, {
    steps: 12,
  });
  await page.mouse.up();

  await expect(page.getByRole('alert')).toContainText('Save blocked');
  await expect(page.getByTestId('studio-save')).toBeDisabled();

  await page.getByTestId('studio-discard').click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('runs Check Links and renders inline status with latency', async ({ page }) => {
  await page.route('**/__studio/api/audit-links', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          url: 'https://github.com/slowbutfast/open-dungeon',
          status: 200,
          classification: 'pass',
          latencyMs: 12,
        },
      ]),
    });
  });

  await page.getByTestId('studio-check-links').click();
  await expect(page.getByText(/pass · 200 · 12ms/)).toBeVisible();
});

test('shows the Studio only in dev mode', async ({ page }) => {
  await page.goto('/#/studio');
  await expect(page.getByTestId('studio-app')).toBeVisible();
  await page.getByRole('button', { name: '← Portfolio' }).click();
  await expect(page.getByTestId('studio-app')).toHaveCount(0);
});
