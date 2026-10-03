import { describe, expect, it } from 'vitest';
import { draftFromPage, guessCategories, guessPricing, markdownIntro, mergeClassification, parseJevAnswers, splitTitle, tagline } from '@/utils/toolImport';

const categories = [
  { id: 10, name: 'AI' },
  { id: 16, name: 'API' },
  { id: 8, name: 'Open Source' },
  { id: 29, name: 'Monitoring' },
  { id: 17, name: 'DB' },
];

describe('splitTitle', () => {
  it('finds the brand and the tagline', () => {
    expect(splitTitle('Knecht – Automate maintenance across your projects')).toEqual({ name: 'Knecht', rest: 'Automate maintenance across your projects' });
    expect(splitTitle('Ship faster with previews | Livecycle')).toEqual({ name: 'Livecycle', rest: 'Ship faster with previews' });
    expect(splitTitle('Daytona')).toEqual({ name: 'Daytona', rest: '' });
    expect(splitTitle('Langfuse: Open Source Agent Evals & Observability').name).toBe('Langfuse');
  });
});

describe('markdownIntro', () => {
  it('keeps real paragraphs as plain text', () => {
    const md = '# Hero\n\n![logo](x.png)\n\nWe use cookies to improve your experience and our privacy policy explains it.\n\nStores a unique browser identifier to help detect malicious activity and manage traffic for the service.\n\nFooBar is an [open source](https://x) observability platform for LLM apps, with traces and evals built in.';
    expect(markdownIntro(md)).toBe('FooBar is an open source observability platform for LLM apps, with traces and evals built in.');
  });
});

describe('tagline', () => {
  it('prefers a whole first sentence over a clipped one', () => {
    expect(tagline('Trace, evaluate, and improve AI agents with one open platform. Use production data to understand behavior and ship better quality.')).toBe(
      'Trace, evaluate, and improve AI agents with one open platform.',
    );
    expect(tagline('Short and sweet')).toBe('Short and sweet');
  });
});

describe('guessPricing', () => {
  it('reads common pricing wording', () => {
    expect(guessPricing('Pro plan $19/mo, billed annually')).toBe(2);
    expect(guessPricing('Lifetime deal: pay once, use forever')).toBe(3);
    expect(guessPricing('Free and open-source under MIT')).toBe(1);
    expect(guessPricing('Contact sales')).toBeNull();
  });
});

describe('guessCategories', () => {
  it('scores categories by name and keywords', () => {
    const text = 'Open-source LLM observability. Trace your AI agents, monitor prompts, alerting on errors. Self-hosted with Postgres. Monitoring and logs.';
    const ids = guessCategories(text, categories);
    expect(ids).toContain(10); // AI
    expect(ids).toContain(29); // Monitoring
    expect(ids.length).toBeLessThanOrEqual(3);
    expect(guessCategories('A calm page about nothing in particular.', categories)).toEqual([]);
  });
});

describe('draftFromPage', () => {
  it('builds a full draft from page metadata', () => {
    const draft = draftFromPage(
      {
        url: 'https://www.foobar.dev/',
        title: 'FooBar - LLM observability for teams',
        description: 'Trace, evaluate and monitor your LLM apps.',
        ogImage: '/og.png',
        markdown: 'FooBar is an open-source AI observability platform. Monitor your LLM apps with monitoring dashboards and alerting. Free forever for small teams.',
      },
      categories,
    );
    expect(draft).toMatchObject({
      name: 'FooBar',
      slogan: 'Trace, evaluate and monitor your LLM apps.',
      description: expect.stringMatching(/^Trace, evaluate and monitor your LLM apps\.\n\nFooBar is an open-source/),
      website: 'https://www.foobar.dev/',
      pricingTypeId: 1,
      logoUrl: 'https://www.google.com/s2/favicons?domain=foobar.dev&sz=128',
      screenshotUrls: ['https://www.foobar.dev/og.png'],
    });
    expect(draft.categoryIds).toContain(10);
  });
});

describe('mergeClassification', () => {
  const draft = draftFromPage({ url: 'https://x.dev', title: 'X', description: 'Old slogan' }, categories);
  it('takes valid AI fields and keeps the rest', () => {
    const merged = mergeClassification(draft, { name: 'X Cloud', slogan: 'New slogan', pricing: 'Subscription', categories: ['api', 'Nope', 'DB'] }, categories);
    expect(merged).toMatchObject({ name: 'X Cloud', slogan: 'New slogan', pricingTypeId: 2, categoryIds: [16, 17], website: 'https://x.dev' });
  });
  it('ignores junk', () => {
    expect(mergeClassification(draft, 'not json', categories)).toEqual(draft);
    expect(mergeClassification(draft, { name: '', categories: 'AI' }, categories)).toEqual(draft);
  });
});

describe('parseJevAnswers', () => {
  it('reads the pricing choice and the most likely categories', () => {
    const body = {
      answers: {
        pricing: { type: 'choice', choice: 'Subscription', probabilities: {}, confidence: 0.8 },
        category_10: { type: 'noul', noul: 0.97 },
        category_16: { type: 'noul', noul: 0.3 },
        category_8: { type: 'noul', noul: 0.71 },
        category_29: { type: 'noul', noul: 0.88 },
        category_17: { type: 'noul', noul: 0.62 },
      },
    };
    expect(parseJevAnswers(body, categories)).toEqual({ pricing: 'Subscription', categories: ['AI', 'Monitoring', 'Open Source'] });
    expect(parseJevAnswers({}, categories)).toEqual({ pricing: undefined, categories: [] });
  });
});
