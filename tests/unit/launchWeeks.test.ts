import { afterEach, describe, expect, it } from 'vitest';
import { FREE_WEEK_CAPACITY, findNearestAvailableDate, weekKey } from '@/utils/launchWeeks';

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

describe('weekKey', () => {
  // Shapes the app sees: a Date built from the RPC, and launch_start strings from Supabase.
  const inputs = [
    new Date('2026-09-29T00:00:00+00:00'),
    '2026-09-29T00:00:00+00:00',
    '2026-09-29 00:00:00+00',
    '2026-09-29T00:00:00.000Z',
  ];

  it('gives the same key for every input shape', () => {
    expect(new Set(inputs.map(weekKey))).toEqual(new Set(['2026-09-29']));
  });

  it.each(['UTC', 'America/Los_Angeles', 'Europe/Istanbul', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'])(
    'does not depend on the local timezone (%s)',
    tz => {
      process.env.TZ = tz;
      expect(inputs.map(weekKey)).toEqual(Array(inputs.length).fill('2026-09-29'));
    },
  );

  it('keeps the same week number apart in different years', () => {
    expect(weekKey('2026-10-13T00:00:00Z')).not.toEqual(weekKey('2027-10-12T00:00:00Z'));
  });
});

describe('findNearestAvailableDate', () => {
  const now = new Date('2026-09-26T12:00:00Z');
  const week = (start: string, count: number, n = 1) => ({ week: n, startDate: start, endDate: start, count });

  it('returns null when every week is full', () => {
    expect(findNearestAvailableDate([week('2026-09-29', 24), week('2026-10-06', FREE_WEEK_CAPACITY)], now)).toBeNull();
  });

  it('picks the closest week that still has a free slot', () => {
    const result = findNearestAvailableDate([week('2026-09-29', 30), week('2029-07-31', 11), week('2029-08-07', 0)], now);
    expect(result?.startDate).toBe('2029-07-31');
  });

  it('treats a week with capacity - 1 tools as free and capacity as full', () => {
    expect(findNearestAvailableDate([week('2026-09-29', FREE_WEEK_CAPACITY - 1)], now)?.startDate).toBe('2026-09-29');
    expect(findNearestAvailableDate([week('2026-09-29', FREE_WEEK_CAPACITY)], now)).toBeNull();
  });

  it('works with Date objects as returned by getProductsCountByWeek', () => {
    const result = findNearestAvailableDate(
      [
        { week: 40, startDate: new Date('2026-10-06T00:00:00Z'), endDate: new Date('2026-10-12T23:59:59Z'), count: 3 },
        { week: 41, startDate: new Date('2026-10-13T00:00:00Z'), endDate: new Date('2026-10-19T23:59:59Z'), count: 0 },
      ],
      now,
    );
    expect(result?.week).toBe(40);
  });
});
