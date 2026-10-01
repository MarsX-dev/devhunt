import { describe, expect, it } from 'vitest';
import { SITEMAP_NAMESPACE, categoryPath, pagesEntries, sitemapIndexXml, toolEntries, urlsetXml } from '@/utils/sitemap';
import { alternativesIndexable, compareIndexable } from '@/utils/seoIndex';

const locs = (xml: string) => Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), m => m[1]);
// A bare '&' (not part of an entity) makes the whole sitemap invalid XML.
const hasBareAmpersand = (xml: string) => /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(xml);

const tools = [
  { slug: 'knecht-works', username: 'alice', updated_at: '2026-09-30T10:00:00Z' },
  { slug: 'second-tool', username: 'alice', updated_at: null },
  { slug: 'third', username: '99minds_Giftcard&Loyalty' },
  { slug: 'orphan-tool', username: null },
];

describe('sitemap xml', () => {
  const pages = urlsetXml(pagesEntries(tools, ['AI', 'UI Library']));
  const toolsXml = urlsetXml(toolEntries(tools));

  it('starts with the XML declaration and uses the standard namespace', () => {
    expect(pages.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(pages).toContain(`<urlset xmlns="${SITEMAP_NAMESPACE}">`);
    expect(SITEMAP_NAMESPACE).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  it('lists categories and distinct maker profiles in pages, every tool in tools', () => {
    const all = locs(pages);
    expect(all).toContain('https://devhunt.org/tools/ai');
    expect(all).toContain('https://devhunt.org/tools/ui-library');
    expect(all.filter(l => l.includes('/@'))).toEqual(['https://devhunt.org/@alice', 'https://devhunt.org/@99minds_Giftcard%26Loyalty']);
    expect(locs(toolsXml)).toHaveLength(4);
  });

  it('adds lastmod only when the date is known', () => {
    expect(toolsXml).toContain('<loc>https://devhunt.org/tool/knecht-works</loc><lastmod>2026-09-30T10:00:00.000Z</lastmod>');
    expect(toolsXml).toContain('<loc>https://devhunt.org/tool/second-tool</loc></url>');
  });

  it('never emits a bare ampersand', () => {
    expect(hasBareAmpersand(pages)).toBe(false);
    expect(hasBareAmpersand(toolsXml)).toBe(false);
  });

  it('builds a sitemap index', () => {
    const index = sitemapIndexXml(['https://devhunt.org/sitemaps/tools.xml']);
    expect(index).toContain(`<sitemapindex xmlns="${SITEMAP_NAMESPACE}">`);
    expect(index).toContain('<sitemap><loc>https://devhunt.org/sitemaps/tools.xml</loc></sitemap>');
  });

  it('builds category paths the same way the navigation does', () => {
    expect(categoryPath('Workflow automation')).toBe('/tools/workflow-automation');
  });
});

describe('programmatic page index gate', () => {
  it('indexes pilot tools and well-voted tools only', () => {
    expect(alternativesIndexable({ slug: 'yt1d', votes_count: 0 })).toBe(true);
    expect(alternativesIndexable({ slug: 'unknown', votes_count: 9 })).toBe(false);
    expect(alternativesIndexable({ slug: 'unknown', votes_count: 10 })).toBe(true);
  });

  it('indexes a comparison when either side is a pilot tool or both are well voted', () => {
    expect(compareIndexable({ slug: 'yt1d', votes_count: 0 }, { slug: 'x', votes_count: 0 })).toBe(true);
    expect(compareIndexable({ slug: 'a', votes_count: 25 }, { slug: 'b', votes_count: 19 })).toBe(false);
    expect(compareIndexable({ slug: 'a', votes_count: 25 }, { slug: 'b', votes_count: 20 })).toBe(true);
  });
});

describe('indexNowPayload', () => {
  it('sends the changed tools plus the listing pages, keyed to devhunt.org', async () => {
    const { indexNowPayload, INDEXNOW_KEY } = await import('@/utils/indexnow');
    const p = indexNowPayload([{ slug: 'yt1d' }, { slug: 'a&b' }, { slug: 'yt1d' }]);
    expect(p.host).toBe('devhunt.org');
    expect(p.keyLocation).toBe(`https://devhunt.org/${INDEXNOW_KEY}.txt`);
    expect(p.urlList).toEqual(['https://devhunt.org/', 'https://devhunt.org/upcoming', 'https://devhunt.org/tool/yt1d', 'https://devhunt.org/tool/a%26b']);
  });
});

describe('toolTitle', () => {
  it('uses the test title only for the cohort and keeps the old title otherwise', async () => {
    const { toolTitle } = await import('@/utils/seoIndex');
    expect(toolTitle('toolfk', ' ToolFK', 'Online toolkit')).toMatch(/^ToolFK: Features, Pricing & Alternatives \(\d{4}\)$/);
    expect(toolTitle('yt1d', 'YT1D', 'Free YouTube Video Downloader')).toBe('YT1D - Free YouTube Video Downloader');
  });
});

describe('DevHunt badge', () => {
  it('links to the tool page with a plain <a><img>, escaped', async () => {
    const { badgeHtml, badgeMarkdown, badgeSvg, badgeLabel } = await import('@/utils/badge');
    const html = badgeHtml('a&b', 'Tool "X" <1>', 'light');
    expect(html).toContain('href="https://devhunt.org/tool/a%26b"');
    expect(html).toContain('src="https://devhunt.org/badge/a%26b.svg?theme=light"');
    expect(html).toContain('alt="Tool &quot;X&quot; &lt;1&gt; - Featured on DevHunt"');
    expect(badgeMarkdown('yt1d', 'YT1D')).toBe('[![YT1D on DevHunt](https://devhunt.org/badge/yt1d.svg)](https://devhunt.org/tool/yt1d)');
    expect(badgeLabel(2)).toBe('#2 Dev Tool of the Week');
    expect(badgeLabel(7)).toBe('Featured on');
    expect(badgeSvg({ rank: 1 })).toContain('#1 DEV TOOL OF THE WEEK');
    expect(badgeSvg({})).toMatch(/^<svg[^>]+role="img"/);
  });
});
