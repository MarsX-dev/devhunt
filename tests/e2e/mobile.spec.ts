import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, settle, trackErrors } from './helpers';

for (const path of ['/', '/tool/knecht-works', '/blog', '/all-dev-tools']) {
  test(`${path} fits a phone screen`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    await settle(page);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
}

test('tool logos load on mobile', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('a[href^="/tool/"] img').first();
  await logo.scrollIntoViewIfNeeded();
  await expect.poll(async () => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});
