import { describe, expect, it } from 'vitest';
import { SITEMAP_NAMESPACE, buildSitemapXml, categoryPath } from '@/utils/sitemap';

const locs = (xml: string) => Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), m => m[1]);
// A bare '&' (not part of an entity) makes the whole sitemap invalid XML.
const hasBareAmpersand = (xml: string) => /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(xml);

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml(
    [
      { slug: 'knecht-works', username: 'alice' },
      { slug: 'second-tool', username: 'alice' },
      { slug: 'third', username: '99minds_Giftcard&Loyalty' },
      { slug: 'orphan-tool', username: null },
    ],
    ['AI', 'UI Library'],
  );

  it('starts with the XML declaration and uses the standard namespace', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain(`<urlset xmlns="${SITEMAP_NAMESPACE}">`);
    expect(SITEMAP_NAMESPACE).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  it('lists every tool, category and distinct maker profile', () => {
    const all = locs(xml);
    expect(all.filter(l => l.includes('/tool/'))).toHaveLength(4);
    expect(all).toContain('https://devhunt.org/tools/ai');
    expect(all).toContain('https://devhunt.org/tools/ui-library');
    expect(all.filter(l => l.includes('/@'))).toEqual(['https://devhunt.org/@alice', 'https://devhunt.org/@99minds_Giftcard%26Loyalty']);
  });

  it('never emits a bare ampersand', () => {
    expect(hasBareAmpersand(xml)).toBe(false);
  });

  it('builds category paths the same way the navigation does', () => {
    expect(categoryPath('Workflow automation')).toBe('/tools/workflow-automation');
  });
});
