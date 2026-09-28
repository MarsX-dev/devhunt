import { describe, expect, it } from 'vitest';
import { renderUpsellEmail } from '@/utils/email-templates/dofollow-upsell-email';

const base = { firstName: 'Ada', toolName: 'Acme <CLI>', slug: 'acme-cli', notAFit: false };

describe('dofollow upsell email', () => {
  it('day 1 for a tool in the free queue: nofollow, queue date, $49 link with utm', () => {
    const m = renderUpsellEmail({ ...base, stage: 'day1', launchStart: new Date(Date.now() + 90 * 86400000).toISOString() });
    expect(m.subject).toBe("Acme <CLI>'s link on DevHunt is nofollow");
    expect(m.html).toContain('Acme &lt;CLI&gt;'); // tool name escaped
    expect(m.html).toContain('free launch queue');
    expect(m.html).toContain('/account/tools/activate-launch/acme-cli?utm_source=email&utm_medium=email&utm_campaign=dofollow-day1');
    expect(m.text).toContain('rel="nofollow"');
    expect(m.html).toContain('one more reminder');
  });
  it('day 7 is the last one; a tool listed in Other gets no launch perks', () => {
    const m = renderUpsellEmail({ ...base, stage: 'day7', launchStart: null, notAFit: true });
    expect(m.subject).toBe('Last reminder: a dofollow backlink for Acme <CLI>');
    expect(m.html).toContain('This is the last one.');
    expect(m.html).not.toContain('home page spotlight');
    expect(m.html).toContain('Get the dofollow link for $49');
  });
});
