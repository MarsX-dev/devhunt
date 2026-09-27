import { describe, expect, it } from 'vitest';
import { CLIENT_STEPS, cleanId, cleanProps, cleanUtm, deviceFrom, formatDailyReport } from '@/utils/funnel';

describe('funnel', () => {
  it('accepts only browser steps from the browser', () => {
    expect(CLIENT_STEPS.has('url_entered')).toBe(true);
    expect(CLIENT_STEPS.has('paid')).toBe(false);
    expect(CLIENT_STEPS.has('tool_created')).toBe(false);
  });

  it('keeps props small and flat', () => {
    expect(cleanProps({ url: ' https://a.dev ', ok: true, ms: 1200, categories: ['AI', 'API', { x: 1 }], nested: { a: 1 }, 'Bad Key': 1 })).toEqual({
      url: 'https://a.dev',
      ok: true,
      ms: 1200,
      categories: ['AI', 'API'],
    });
    expect(cleanProps('x')).toEqual({});
    expect((cleanProps({ note: 'x'.repeat(500) }).note as string).length).toBe(300);
  });

  it('validates ids, utm and devices', () => {
    expect(cleanId('abc123def456')).toBe('abc123def456');
    expect(cleanId('x; drop')).toBeNull();
    expect(cleanUtm({ utm_source: 'x', foo: 'bar' })).toEqual({ utm_source: 'x' });
    expect(cleanUtm({})).toBeNull();
    expect(deviceFrom('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile')).toBe('mobile');
    expect(deviceFrom('Mozilla/5.0 (Macintosh) Chrome/140')).toBe('desktop');
  });

  it('formats the daily Discord report', () => {
    const text = formatDailyReport({
      date: '2026-09-27',
      day: { submit_click: 40, submit_view: 30, url_entered: 20, form_submitted: 12, tool_created: 10, launch_view: 9, checkout_started: 3, paid: 1, free_chosen: 5 },
      week: { submit_click: 250, paid: 6 },
      revenueDay: 49,
      revenueWeek: 294,
      traffic: { visitors: 1200, pageviews: 4100, newVisitors: 800, countries: [{ country: 'US', visitors: 400 }] },
      newUsers: 31,
      dropped: [{ who: 'Ana', tool: 'Acme', step: 'checkout_canceled', country: 'DE' }],
    });
    expect(text).toContain('DevHunt daily report · 2026-09-27 (UTC)');
    expect(text).toContain('1,200 visitors · 4,100 page views · 800 new · 31 sign-ups');
    expect(text).toContain('countries US 33%');
    expect(text).toMatch(/opened checkout\s+3 \S+\s+33%\s+0/);
    expect(text).toMatch(/paid\s+1 \S*\s+33%\s+6/);
    expect(text).toContain('revenue   $49 that day · $294 last 7 days');
    expect(text).toContain('- Ana (Acme) · came back unpaid · DE');
  });
});
