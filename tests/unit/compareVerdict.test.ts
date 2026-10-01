import { describe, expect, it } from 'vitest';
import {
  buildPairFaq,
  buildVerdict,
  devHuntFacts,
  nearDuplicate,
  openSourceInfo,
  parseMonthlyPrice,
  priceInfo,
  type VerdictTool,
} from '@/utils/compareVerdict';
import { type ToolProfileData } from '@/utils/toolProfile';

const profile = (p: Partial<ToolProfileData>): ToolProfileData => ({
  summary: '',
  audience: null,
  best_for: null,
  features: [],
  use_cases: [],
  integrations: [],
  pricing: null,
  faq: [],
  alternatives: [],
  github: null,
  ...p,
});
const tool = (t: Partial<VerdictTool> & { id: number; name: string }): VerdictTool => ({
  slug: t.name.toLowerCase(),
  votes_count: 0,
  is_reference: true,
  launch_start: null,
  pricing: null,
  github_url: null,
  categories: [],
  profile: null,
  ...t,
});

const cursor = tool({
  id: 1,
  name: 'Cursor',
  profile: profile({
    best_for: 'AI-driven coding assistants',
    integrations: ['Slack', 'GitHub', 'Linear', 'JetBrains IDEs', 'Vercel'],
    pricing: {
      model: 'freemium',
      free_trial: null,
      plans: [
        { name: 'Hobby', price: 'Free', billing: null, highlights: [] },
        { name: 'Individual', price: '$20 / mo.', billing: 'per month', highlights: [] },
        { name: 'Teams', price: '$40 / user / mo.', billing: 'per month', highlights: [] },
      ],
    },
  }),
});
const windsurf = tool({
  id: 2,
  name: 'Windsurf',
  profile: profile({
    best_for: 'IDE with built-in multi-agent command center',
    integrations: ['Slack', 'Linear', 'Notion', 'Sentry', 'Vercel'],
    alternatives: [{ id: 1, best_for: 'AI-enhanced code editing', difference: 'Cursor is a standalone AI code editor.' }],
    pricing: {
      model: 'freemium',
      free_trial: null,
      plans: [
        { name: 'Free', price: '$0', billing: null, highlights: [] },
        { name: 'Pro', price: '$15', billing: 'per month', highlights: [] },
      ],
    },
  }),
});

describe('parseMonthlyPrice', () => {
  it('reads plain monthly prices', () => {
    expect(parseMonthlyPrice('$20 / mo.', 'per month')).toMatchObject({ amount: 20, currency: '$', perUser: false });
    expect(parseMonthlyPrice('$9', 'per month (billed annually)')).toMatchObject({ amount: 9 });
    expect(parseMonthlyPrice('$19', 'per user/month (billed annuall')).toMatchObject({ amount: 19, perUser: true });
    expect(parseMonthlyPrice('€29/month', null)).toMatchObject({ amount: 29, currency: '€' });
    expect(parseMonthlyPrice('$1,050/mo', null)).toMatchObject({ amount: 1050 });
  });
  it('skips prices it cannot compare', () => {
    expect(parseMonthlyPrice('2.9% + 30¢ per successful tran', null)).toBeNull();
    expect(parseMonthlyPrice('$2 per 1,000 searches', null)).toBeNull();
    expect(parseMonthlyPrice('$96/year', null)).toBeNull();
    expect(parseMonthlyPrice('$99', null)).toBeNull(); // no period
    expect(parseMonthlyPrice('$1,500+', 'per month')).toBeNull();
    expect(parseMonthlyPrice('$0', 'per month')).toBeNull();
    expect(parseMonthlyPrice('$5 per CPU / month', null)).toBeNull();
  });
});

describe('priceInfo', () => {
  it('uses the profile, then the product pricing type', () => {
    expect(priceInfo(cursor)).toMatchObject({ kind: 'freemium', freePlan: 'Hobby', lowest: { amount: 20, plan: 'Individual' } });
    expect(priceInfo(tool({ id: 3, name: 'X', pricing: 'Free' })).kind).toBe('free');
    expect(priceInfo(tool({ id: 3, name: 'X', pricing: 'Subscription' })).kind).toBe('paid');
    expect(priceInfo(tool({ id: 3, name: 'X' })).kind).toBe('unknown');
  });
  it('ignores pricing the owner hid', () => {
    const hidden = tool({ id: 3, name: 'X', profile: { ...cursor.profile!, hidden: ['pricing'] } });
    expect(priceInfo(hidden).kind).toBe('unknown');
  });
});

describe('openSourceInfo', () => {
  it('trusts GitHub stats only for the tool’s own repo', () => {
    const postman = tool({ id: 4, name: 'Postman', profile: profile({ github: { repo: 'postmanlabs/postman-plugin', stars: 5, forks: 0, license: 'Apache-2.0', language: null, pushed_at: null } }) });
    expect(openSourceInfo(postman).open).toBe(false);
    const insomnia = tool({
      id: 5,
      name: 'Insomnia',
      github_url: 'https://github.com/Kong/insomnia',
      profile: profile({ github: { repo: 'Kong/insomnia', stars: 36000, forks: 0, license: 'Apache-2.0', language: null, pushed_at: null } }),
    });
    expect(openSourceInfo(insomnia)).toEqual({ open: true, repo: 'Kong/insomnia', license: 'Apache-2.0', stars: 36000 });
    expect(openSourceInfo(tool({ id: 6, name: 'Y', categories: [{ name: 'Open Source' }] })).open).toBe(true);
  });
});

describe('buildVerdict', () => {
  it('uses each profile and the other tool’s alternatives entry', () => {
    const v = buildVerdict(cursor, windsurf, null);
    expect(v.sides[0]).toEqual({
      name: 'Cursor',
      reasons: ['AI-driven coding assistants', 'AI-enhanced code editing', "Integrations with GitHub or JetBrains IDEs (on Cursor's list, not Windsurf's)"],
    });
    expect(v.sides[1].reasons).toContain('The lower starting price: $15/month against $20/month');
    expect(v.notes).toEqual(['Cursor is a standalone AI code editor.']);
    expect(buildVerdict(cursor, windsurf, 'Cursor is a standalone AI code editor.').notes).toEqual([]);
  });
  it('omits a side with nothing to say', () => {
    const bare = tool({ id: 9, name: 'Bare' });
    const v = buildVerdict(cursor, bare, null);
    expect(v.sides.map(s => s.name)).toEqual(['Cursor']);
    expect(buildVerdict(bare, tool({ id: 10, name: 'Bare2' }), null)).toEqual({ sides: [], notes: [] });
  });
  it('names the alternative when the difference text does not', () => {
    const a = tool({ id: 1, name: 'Postman', profile: profile({ alternatives: [{ id: 2, best_for: null, difference: 'Supports REST and gRPC.' }] }) });
    expect(buildVerdict(a, tool({ id: 2, name: 'Insomnia' }), null).notes).toEqual(['Insomnia: Supports REST and gRPC.']);
  });
  it('drops near-duplicate reasons', () => {
    expect(nearDuplicate('Vite-native unit testing', 'Vite-based unit testing')).toBe(true);
    expect(nearDuplicate('Zero-config JavaScript testing', 'General JavaScript testing')).toBe(false);
  });
});

describe('buildPairFaq', () => {
  it('answers only what the data supports', () => {
    const faq = buildPairFaq(cursor, windsurf);
    expect(faq.map(f => f.q)).toEqual([
      'Is Cursor or Windsurf free?',
      'Which is cheaper, Cursor or Windsurf?',
      'Do Cursor and Windsurf integrate with the same tools?',
    ]);
    expect(faq[0].a).toBe('Cursor has a free plan (Hobby); paid plans start at $20/month (Individual). Windsurf has a free plan; paid plans start at $15/month (Pro).');
    expect(faq[1].a).toBe("Windsurf is cheaper to start with: Windsurf's Pro plan ($15/month) against Cursor's Individual plan ($20/month).");
    expect(faq[2].a).toBe('Partly. Both list Slack, Linear and Vercel. Cursor also lists GitHub and JetBrains IDEs; Windsurf also lists Notion and Sentry.');
  });
  it('skips questions it cannot answer', () => {
    expect(buildPairFaq(tool({ id: 1, name: 'A' }), tool({ id: 2, name: 'B' }))).toEqual([]);
    // Usage-based fees only: no cheaper question.
    const fees = (id: number, name: string) =>
      tool({ id, name, profile: profile({ pricing: { model: 'paid', free_trial: null, plans: [{ name: 'Standard', price: '2.9% + 30¢ per successful tran', billing: null, highlights: [] }] } }) });
    const faq = buildPairFaq(fees(1, 'Stripe'), fees(2, 'Paddle'));
    expect(faq).toEqual([{ q: 'Is Stripe or Paddle free?', a: 'No, both are paid and neither has a free plan.' }]);
  });
  it('handles two open-source tools', () => {
    const os = (id: number, name: string, repo: string) =>
      tool({ id, name, github_url: `https://github.com/${repo}`, profile: profile({ pricing: { model: 'open source', free_trial: null, plans: [] } }) });
    const faq = buildPairFaq(os(1, 'Jest', 'jestjs/jest'), os(2, 'Vitest', 'vitest-dev/vitest'));
    expect(faq).toEqual([
      { q: 'Is Jest or Vitest free?', a: 'Yes, both are free and open source.' },
      { q: 'Is Jest or Vitest open source?', a: 'Yes, both are open source: Jest (jestjs/jest on GitHub) and Vitest (vitest-dev/vitest on GitHub).' },
    ]);
  });
});

describe('devHuntFacts', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  it('says "Listed by DevHunt" for reference listings', () => {
    expect(devHuntFacts({ votes_count: 0, is_reference: true, launch_start: null }, now)).toEqual({ votes: null, status: 'Listed by DevHunt' });
  });
  it('shows votes and launch date for launches', () => {
    expect(devHuntFacts({ votes_count: 153, is_reference: false, launch_start: '2024-01-16T00:00:00Z' }, now)).toEqual({
      votes: '153 upvotes',
      status: 'Launched on DevHunt on Jan 16, 2024',
    });
    expect(devHuntFacts({ votes_count: 1, is_reference: false, launch_start: null }, now)).toEqual({ votes: '1 upvote', status: null });
  });
});

describe('launch-form pricing', () => {
  it('is only used to say what the listing says, never to compare', () => {
    const slides = tool({
      id: 1,
      name: 'Slides',
      profile: profile({ pricing: { model: 'paid', free_trial: true, plans: [{ name: 'Basic', price: '$3 per month per user', billing: 'per month', highlights: [] }] } }),
    });
    const toddle = tool({ id: 2, name: 'toddle', pricing: 'Free' });
    const faq = buildPairFaq(slides, toddle);
    expect(faq).toEqual([
      { q: 'Is Slides or toddle free?', a: 'Slides is paid, from $3/month per user (Basic), with a free trial. toddle is listed as free on DevHunt.' },
    ]);
    expect(buildVerdict(toddle, slides, null).sides).toEqual([]);
  });
});
