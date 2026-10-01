import { describe, expect, it } from 'vitest';
import { isRecurring, monthlySaving, planLabel, planPrice, weeklyPlan } from '@/utils/ads';

describe('ad plans', () => {
  it('prices a week and a month of each product', () => {
    expect([planPrice('rail', 'weekly'), planPrice('inline', 'weekly'), planPrice('newsletter', 'single')]).toEqual([149, 89, 299]);
    expect([planPrice('rail'), planPrice('inline'), planPrice('newsletter')]).toEqual([499, 299, 999]);
  });
  it('weekly is one-time, a newsletter week is one edition', () => {
    expect(weeklyPlan('rail')).toBe('weekly');
    expect(weeklyPlan('newsletter')).toBe('single');
    expect(isRecurring('rail', 'weekly')).toBe(false);
    expect(isRecurring('rail', 'monthly')).toBe(true);
    expect(planLabel('inline', 'weekly')).toBe('$89 once · 1 week');
    expect(planLabel('newsletter', 'single')).toBe('$299 once · 1 edition');
  });
  it('monthly is cheaper than 4 weeks', () => {
    for (const k of ['rail', 'inline', 'newsletter'] as const) expect(monthlySaving(k)).toBeGreaterThan(10);
  });
});
