import { describe, expect, it } from 'vitest';
import { isCheckoutPaid, planLaunch, resolvePaidWeek } from '@/utils/launchPlanning';

const now = new Date('2026-09-27T12:00:00Z');
const week = (start: string, count: number, n: number) => ({
  week: n,
  startDate: `${start}T00:00:00Z`,
  endDate: new Date(Date.parse(`${start}T00:00:00Z`) + 7 * 864e5 - 1000).toISOString(),
  count,
});
const weeks = [week('2026-09-29', 26, 39), week('2026-10-06', 30, 40), week('2026-10-13', 3, 41), week('2029-07-31', 11, 31)];

describe('planLaunch', () => {
  it('normal: uses the chosen week when it has a free slot', () => {
    const plan = planLaunch(weeks, '2026-10-13', 'normal', now);
    expect(plan).toMatchObject({ ok: true, launch: { week: 41 }, paidWeek: null });
  });

  it('normal: falls back to the free queue when the chosen week filled up', () => {
    const plan = planLaunch(weeks, '2026-09-29', 'normal', now);
    expect(plan.ok && plan.launch.startDate.startsWith('2026-10-13')).toBe(true);
  });

  it('free: nearest week with a free slot', () => {
    const plan = planLaunch(weeks, undefined, 'free', now);
    expect(plan.ok && plan.launch.week).toBe(41);
  });

  it('paid: parks in the free queue and remembers the paid week', () => {
    const plan = planLaunch(weeks, '2026-09-29', 'paid', now);
    expect(plan).toMatchObject({ ok: true, launch: { week: 41 }, paidWeek: { week: 39 } });
  });

  it('paid: rejects a missing or already-started week', () => {
    expect(planLaunch(weeks, undefined, 'paid', now).ok).toBe(false);
    expect(planLaunch([week('2026-09-22', 0, 38), ...weeks], '2026-09-22', 'paid', now).ok).toBe(false);
  });

  it('free: errors when every week is full', () => {
    expect(planLaunch([week('2026-09-29', 20, 39)], undefined, 'free', now).ok).toBe(false);
  });
});

describe('resolvePaidWeek', () => {
  it('keeps a paid week that has not started', () => {
    expect(resolvePaidWeek({ week: 40, startDate: '2026-10-06T00:00:00Z', endDate: 'x' }, weeks, now)?.week).toBe(40);
  });

  it('moves a paid week that already started to the next week', () => {
    expect(resolvePaidWeek({ week: 38, startDate: '2026-09-22T00:00:00Z', endDate: 'x' }, weeks, now)?.week).toBe(39);
    expect(resolvePaidWeek(null, weeks, now)?.week).toBe(39);
  });
});

describe('isCheckoutPaid', () => {
  it('accepts paid and $0 (100% promo) checkouts only when complete', () => {
    expect(isCheckoutPaid({ status: 'complete', payment_status: 'paid' })).toBe(true);
    expect(isCheckoutPaid({ status: 'complete', payment_status: 'no_payment_required' })).toBe(true);
    expect(isCheckoutPaid({ status: 'complete', payment_status: 'unpaid' })).toBe(false);
    expect(isCheckoutPaid({ status: 'open', payment_status: 'paid' })).toBe(false);
    expect(isCheckoutPaid({ status: 'expired', payment_status: 'no_payment_required' })).toBe(false);
  });
});
