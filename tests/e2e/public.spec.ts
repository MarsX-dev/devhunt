import { expect, test } from '@playwright/test';
import { settle, trackErrors } from './helpers';

test('home page lists this week\'s tools without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.locator('a[href^="/tool/"]').first()).toBeVisible();
  expect(await page.locator('a a').count()).toBe(0); // no nested links
  await settle(page);
  expect(errors).toEqual([]);
});

test('external-link icon opens the tool website, not the card', async ({ page, context }) => {
  await page.goto('/');
  const card = page.locator('li', { has: page.locator('[aria-label="Open website in a new tab"]') }).first();
  await card.hover();
  const [popup] = await Promise.all([context.waitForEvent('page'), card.locator('[aria-label="Open website in a new tab"]').click()]);
  expect(popup.url()).toContain('ref=devhunt');
  await popup.close();
  await expect(page).toHaveURL(/\/$/);
});

test('tool page renders details and upvote button', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/tool/knecht-works');
  await expect(page.getByRole('heading', { name: /Knecht Works/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Upvote/ })).toBeVisible();
  await settle(page);
  expect(errors).toEqual([]);
});

test('upvoting while logged out goes to the login page', async ({ page }) => {
  await page.goto('/tool/knecht-works');
  await page.getByRole('button', { name: /^\d+ Upvote$/ }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Continue with Google')).toBeVisible();
});

test('Sign In opens the login modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).first().click();
  await expect(page.getByText('Continue with Github').first()).toBeVisible();
});

test('unknown pages show the 404 page with a 404 status', async ({ page }) => {
  const res = await page.goto('/does-not-exist-xyz');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('search finds tools', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search button' }).last().click();
  await page.keyboard.type('api');
  await expect(page.locator('a[href^="/tool/"]').filter({ hasText: /api/i }).first()).toBeVisible();
});

test('blog lists posts and opens one', async ({ page }) => {
  await page.goto('/blog');
  const first = page.getByRole('link', { name: 'Read More' }).first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page.locator('h1')).toBeVisible();
});

test('clicking a card on /upcoming opens the preview with description and screenshots', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/upcoming');
  const card = page.locator('a[href^="/tool/"]').first();
  const href = await card.getAttribute('href');
  const heading = page.locator('li').filter({ has: page.locator(`a[href="${href}"]`) }).first().getByRole('heading').first();
  const toolName = (await heading.innerText()).trim();
  await heading.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  // The preview modal renders the tool's details from the list props (no page load).
  await expect(page.getByRole('link', { name: /Live preview/i }).first()).toBeVisible();
  // Description HTML and the screenshot gallery come from the list props.
  const description = await page.evaluate(() => document.querySelector('.prose, [class*="prose"]')?.textContent?.trim().length ?? 0);
  expect(description).toBeGreaterThan(20);
  expect(await page.locator(`img[alt="${toolName}"]`).count()).toBeGreaterThan(1); // logo + gallery screenshots
  expect(errors).toEqual([]);
});

test('/upcoming shows 4 weeks and loads 4 more with "Show more"', async ({ page }) => {
  const weekHeadings = page.locator('[data-week]');
  await page.goto('/upcoming');
  await expect(weekHeadings).toHaveCount(4);
  const more = page.getByRole('link', { name: /Show more \([\d,]+ tools scheduled\)/ });
  await expect(more).toBeVisible();
  const before = Number((await more.innerText()).match(/\(([\d,]+)/)![1].replace(/,/g, ''));
  expect(before).toBeGreaterThan(0);
  await more.click();
  await expect(page).toHaveURL(/weeks=8/);
  await expect(weekHeadings).toHaveCount(8);
  // Lands on the first newly added week.
  await expect(page).toHaveURL(/#week-5$/);
  await expect(page.locator('#week-5')).toBeInViewport();
  // Weeks must be consecutive Tuesdays, also across a year boundary.
  const dates = await weekHeadings.evaluateAll(els => els.map(el => new Date(`${el.getAttribute('data-week')}T00:00:00Z`).getTime()));
  dates.slice(1).forEach((d, i) => expect(d - dates[i]).toBe(7 * 24 * 3600 * 1000));
});
