import { describe, expect, it } from 'vitest';
import { cleanMarkdown, githubRepo, pickPages, validateProfile } from '@/utils/toolProfile';

const candidates = [
  { id: 1, name: 'Alpha', slogan: 'Auth for apps' },
  { id: 2, name: 'Beta', slogan: 'Sandboxes' },
];
const base = {
  summary: 'Acme is a hosted auth service.',
  features: [
    { title: 'Drop-in UI', description: 'Sign-in components for React.' },
    { title: 'SSO', description: 'Connect SAML providers.' },
  ],
  faq: [{ q: 'Is there a free tier?', a: 'Yes, up to 10,000 users per month.' }],
};

describe('tool profiles', () => {
  it('keeps only paid plans whose price is on the pricing page', () => {
    const raw = {
      ...base,
      pricing: {
        model: 'freemium',
        plans: [
          { name: 'Free', price: '$0', highlights: [] },
          { name: 'Pro', price: '$20', billing: 'per month', highlights: ['MFA'] },
          { name: 'Team', price: '$99', billing: 'per month', highlights: [] },
        ],
      },
    };
    const profile = validateProfile(raw, 'Acme auth', candidates, null, 'Hobby $0 · Pro $ 20 / month');
    expect(profile?.pricing?.plans.map(p => p.name)).toEqual(['Free', 'Pro']);
    // Without a pricing page, no paid plans.
    expect(validateProfile(raw, 'Pro $20', candidates, null)?.pricing?.plans.map(p => p.name)).toEqual(['Free']);
  });

  it('keeps integrations named in the source and alternatives from the candidates', () => {
    const raw = {
      ...base,
      integrations: ['Next.js', 'Django'],
      alternatives: [
        { id: 2, difference: 'Beta runs code, Acme does auth.', best_for: 'Sandboxes' },
        { id: 2, difference: 'duplicate' },
        { id: 99, difference: 'not a candidate' },
      ],
    };
    const profile = validateProfile(raw, 'Works with Next.js and React', candidates, null)!;
    expect(profile.integrations).toEqual(['Next.js']);
    expect(profile.alternatives).toEqual([{ id: 2, difference: 'Beta runs code, Acme does auth.', best_for: 'Sandboxes' }]);
  });

  it('drops hype, fixes odd hyphens and rejects thin output', () => {
    const profile = validateProfile(
      { ...base, summary: 'Acme is a full‑stack auth tool.', features: [...base.features, { title: 'X', description: 'A revolutionary thing.' }] },
      '',
      [],
      null,
    )!;
    expect(profile.summary).toBe('Acme is a full-stack auth tool.');
    expect(profile.features).toHaveLength(2);
    expect(validateProfile({ summary: 'Acme.', features: [], faq: [] }, '', [], null)).toBeNull();
    expect(validateProfile(null, '', [], null)).toBeNull();
  });

  it('finds pricing/features pages and GitHub repos', () => {
    const links = ['https://acme.dev/pricing', 'https://acme.dev/features#x', 'https://other.com/pricing', 'https://docs.acme.dev/intro'];
    expect(pickPages(links, 'https://www.acme.dev')).toEqual(['https://acme.dev/pricing', 'https://acme.dev/features']);
    expect(githubRepo([null, 'https://github.com/sponsors/acme', 'https://github.com/acme/acme.git'])).toBe('acme/acme');
    expect(githubRepo(['https://acme.dev'])).toBeNull();
  });

  it('strips images and link targets from markdown', () => {
    expect(cleanMarkdown('![logo](a.png) Hi [docs](https://x.dev)\n\n\n\nok')).toBe('Hi docs\n\nok');
  });
});
