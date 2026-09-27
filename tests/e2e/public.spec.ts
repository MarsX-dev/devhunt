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
  // The newsletter banner slides in over the cards for new visitors; start as one who closed it.
  await page.addInitScript(() => localStorage.setItem('isNewsletterActive', 'true'));
  await page.emulateMedia({ reducedMotion: 'reduce' }); // no smooth scrolling or card animations while hovering
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
  await expect(page.getByRole('button', { name: /Upvote/ }).first()).toBeVisible();
  await settle(page);
  expect(errors).toEqual([]);
});

test('upvoting while logged out goes to the login page', async ({ page }) => {
  await page.goto('/tool/knecht-works');
  await page.getByRole('button', { name: /^Upvote \d+$/ }).first().click(); // the header button (rows below have small ones)
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

test('rows link straight to the tool page, with a skeleton while it loads', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/upcoming');
  const row = page.locator('ol li a[href^="/tool/"]').first();
  const href = await row.getAttribute('href');
  await row.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('link', { name: /Visit website/i })).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
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

test('home page shows the all-time stats bar and the latest 30 winners as compact rows', async ({ page }) => {
  await page.goto('/');
  const stats = page.locator('#site-stats');
  await expect(stats.locator('dt')).toHaveCount(4);
  for (const label of ['impressions', 'domain_rating', 'tools_launched', 'developers']) {
    await expect(stats.getByText(label)).toBeVisible();
  }
  // Recent growth badges fade in after load.
  await expect(stats.getByText(/▲ \+[\d,.KM]+ (today|this week)$/).first()).toBeVisible();
  const winners = page.locator('#past-winners li');
  await expect(winners.first()).toBeVisible();
  expect(await winners.count()).toBeLessThanOrEqual(30);
  expect(await winners.count()).toBeGreaterThanOrEqual(20);
  // One line each.
  const heights = await winners.evaluateAll(rows => rows.map(r => r.getBoundingClientRect().height));
  expect(Math.max(...heights)).toBeLessThan(64);
});

test('auto-generated paracast demo videos are not shown', async ({ page, request }) => {
  const { testEnv } = await import('../env');
  const base = testEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = testEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')!;
  const res = await request.get(`${base}/rest/v1/products?select=slug&deleted=eq.false&demo_video_url=like.*paracast*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const [tool] = await res.json();
  await page.goto(`/tool/${tool.slug}`);
  await expect(page.locator('main img, img').first()).toBeVisible();
  await settle(page);
  expect(await page.locator('video, source[src*="paracast"]').count()).toBe(0);
});

test('home page feels live: activity strip, top 3 as full cards, the rest compact', async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(() => localStorage.setItem('isNewsletterActive', 'true'));
  await page.goto('/');
  const live = page.locator('#live-activity');
  await expect(live.getByLabel('Live')).toBeVisible();
  await expect(live.getByText(/joined DevHunt|upvoted|commented on|listed/)).toBeVisible();
  const first = await live.innerText();
  await expect.poll(async () => live.innerText(), { timeout: 12_000 }).not.toBe(first); // cycles to the next event

  // Top 3 in the podium panel, the rest compact, and every tool name starts at the same x.
  const podium = page.locator('#podium > li');
  await expect(podium.first()).toBeVisible();
  expect(await podium.count()).toBeLessThanOrEqual(3);
  const rest = page.locator('#more-launches > li');
  if ((await rest.count()) > 0) {
    await expect(rest.first()).toBeVisible();
    const nameX = (items: Element[]) => items.map(li => Math.round(li.querySelector('h3')!.getBoundingClientRect().left));
    const rowHeight = (items: Element[]) => items.map(li => li.firstElementChild!.getBoundingClientRect().height); // card row, without comment
    expect(new Set([...(await podium.evaluateAll(nameX)), ...(await rest.evaluateAll(nameX))]).size).toBe(1);
    const bigHeights = await podium.evaluateAll(rowHeight);
    const smallHeights = await rest.evaluateAll(rowHeight);
    expect(Math.max(...smallHeights)).toBeLessThan(Math.min(...bigHeights));
  }
  await settle(page);
  expect(errors).toEqual([]);
});

test('past winners load more, categories link to their pages, countdown is running', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('isNewsletterActive', 'true'));
  await page.goto('/');
  await expect(page.getByText(/^(Voting closes in|Final hours!)/)).toBeVisible();

  const winners = page.locator('#past-winners li');
  await expect(winners.first()).toBeVisible();
  const before = await winners.count();
  const more = page.getByRole('button', { name: /^Show more \(\d+ more winners\)$/ });
  const remaining = Number((await more.innerText()).match(/\d+/)![0]);
  await more.click();
  await expect(winners).toHaveCount(before + Math.min(30, remaining));

  const category = page.locator('#categories a').first();
  await expect(category).toBeVisible();
  expect(await page.locator('#categories a').count()).toBeGreaterThan(10);
  const href = await category.getAttribute('href');
  await category.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('home page shows top winners by upvotes and the unique visitor count', async ({ page }) => {
  await page.goto('/');
  const top = page.locator('#top-winners');
  await expect(top.getByRole('heading', { name: 'Top winners' })).toBeVisible();
  const votes = (await top.locator('li').allInnerTexts()).map(t => Number(t.match(/▲\s*([\d,]+) upvotes/)?.[1].replace(/,/g, '')));
  expect(votes.length).toBeGreaterThan(3);
  expect(votes.every(Number.isFinite)).toBe(true);
  expect([...votes].sort((a, b) => b - a)).toEqual(votes);
  await expect(page.getByText(/[\d,]{7,} unique visitors since launch/)).toBeVisible();
});

test('tool pages show features, alternatives and an FAQ with structured data', async ({ page }) => {
  await page.goto('/tool/clerk');
  await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Clerk vs alternatives' })).toBeVisible();
  await expect(page.locator('#compare table a[href^="/tool/"]').first()).toBeVisible();
  const faq = page.locator('#faq details').first();
  await faq.locator('summary').click();
  await expect(faq.locator('p')).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some(s => s.includes('"FAQPage"'))).toBe(true);
});
