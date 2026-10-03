import { type Page, expect } from '@playwright/test';

// Third-party beacons that fail outside devhunt.org (e.g. tiny.devhunt.org rejects localhost) are not app errors.
const IGNORED = [/tiny\.devhunt\.org/, /clarity\.ms/, /analytic-api\.marsx\.dev/, /Failed to load resource: the server responded with a status of 403/];

// Collects console errors and uncaught exceptions for the page's lifetime.
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !IGNORED.some(re => re.test(msg.text()))) errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  return errors;
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

// Production analytics keep the network busy, so 'networkidle' never settles there.
// Wait for load, then give hydration time to surface errors.
export async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(2_000);
}
