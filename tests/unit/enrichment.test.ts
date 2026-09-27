import { describe, expect, it } from 'vitest';
import { relevantHits, searchQueries, sourceName, validateExtraction, type SearchHit } from '@/utils/enrichment';

const hits: SearchHit[] = [
  { url: 'https://www.producthunt.com/products/daytona', title: 'Daytona on Product Hunt', description: 'Daytona was #1 Product of the Day. "Daytona saved our team hours every week," says Ana.' },
  { url: 'https://www.daytona.io/dotfiles/recap', title: 'Launch recap', description: 'We are thrilled: Daytona has been awarded #1 SaaS product of the week.' },
  { url: 'https://news.ycombinator.com/item?id=1', title: 'Show HN: Daytona', description: 'Discussion' },
  { url: 'https://art.example.com/daytona-beach', title: 'Daytona Beach paintings', description: 'Landscapes' },
];

describe('sources and queries', () => {
  it('names well-known sources and the official site', () => {
    expect(sourceName('https://www.producthunt.com/products/x')).toBe('Product Hunt');
    expect(sourceName('https://news.ycombinator.com/item?id=1')).toBe('Hacker News');
    expect(sourceName('https://blog.daytona.io/x', 'daytona.io')).toBe('Official site');
    expect(sourceName('https://someblog.dev/post')).toBe('someblog.dev');
  });
  it('builds the three searches', () => {
    expect(searchQueries('Daytona', 'daytona.io').general).toBe('"Daytona" daytona.io');
  });
});

describe('relevantHits', () => {
  it('uses JEV answers and always keeps the official site', () => {
    const answers = { r0: { noul: 0.95 }, r1: { noul: 0.1 }, r2: { noul: 0.8 }, r3: { noul: 0.05 } };
    expect(relevantHits(hits, answers, 'Daytona', 'daytona.io').map(h => h.url)).toEqual([hits[0].url, hits[1].url, hits[2].url]);
  });
  it('falls back to a name match without JEV', () => {
    expect(relevantHits(hits, null, 'Daytona', 'daytona.io')).toHaveLength(4);
    expect(relevantHits(hits, null, 'Knecht', 'knecht.works')).toHaveLength(0);
  });
});

describe('validateExtraction', () => {
  const raw = {
    awards: [
      { title: '#1 Product of the Day', platform: 'Product Hunt', url: hits[0].url, evidence: 'Daytona was #1 Product of the Day' },
      { title: '#1 Product of the Month', platform: 'Product Hunt', url: hits[0].url, evidence: 'Product of the Month' }, // not in text
      { title: 'Golden Kitty', url: 'https://made-up.example.com', evidence: 'x' }, // not a result
    ],
    reviews: [
      { quote: 'Daytona saved our team hours every week,', author: 'Ana', url: hits[0].url },
      { quote: 'The best dev environment tool I have ever used', url: hits[0].url }, // invented
    ],
    mentions: [
      { title: 'Show HN: Daytona', type: 'discussion', url: hits[2].url },
      { title: 'Our own blog', url: hits[1].url }, // official site is not a mention
    ],
    highlights: ['Spin up sandboxes in 90ms', 'x'],
  };
  const items = validateExtraction(raw, hits, 'daytona.io');
  it('keeps only verifiable items', () => {
    expect(items).toEqual([
      { kind: 'award', title: '#1 Product of the Day', body: null, url: hits[0].url, source: 'Product Hunt' },
      { kind: 'review', title: 'Daytona saved our team hours every week,', body: 'Ana', url: hits[0].url, source: 'Product Hunt' },
      { kind: 'mention', title: 'Show HN: Daytona', url: hits[2].url, source: 'Hacker News', meta: { type: 'discussion' } },
      { kind: 'highlight', title: 'Spin up sandboxes in 90ms', source: 'Official site' },
    ]);
  });
  it('ignores junk', () => {
    expect(validateExtraction(null, hits, 'daytona.io')).toEqual([]);
    expect(validateExtraction({ awards: 'x' }, hits, 'daytona.io')).toEqual([]);
  });
});
