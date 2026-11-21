import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/learn',
  '/simulator',
  '/scenarios',
  '/scenarios/milky-way',
  '/edit',
  '/tools',
  '/glossary',
  '/cheatsheet',
  '/learn/camera/foundations',
  '/learn/camera/aperture',
  '/learn/camera/shutter',
  '/learn/camera/iso',
  '/learn/camera/metering',
  '/learn/camera/modes',
  '/learn/camera/white-balance',
  '/learn/camera/focus',
  '/learn/camera/together',
  '/learn/editing/workflow',
  '/learn/editing/basic-tone',
  '/learn/editing/curves',
  '/learn/editing/wb-post',
  '/learn/editing/hsl',
  '/learn/editing/color-grading',
];

for (const route of ROUTES) {
  test(`renders ${route} without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto(`/#${route}`);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors, errors.join('\n')).toEqual([]);
    // No horizontal page scroll.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('progress survives a reload', async ({ page }) => {
  await page.goto('/#/learn/camera/foundations');
  await page.getByRole('button', { name: 'Mark lesson complete' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '✓ Completed' })).toBeVisible();
});
