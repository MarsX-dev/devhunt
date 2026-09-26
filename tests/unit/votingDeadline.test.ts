import { describe, expect, it } from 'vitest';
import moment from 'moment';
import { isFinalHours, votingDeadline } from '@/utils/votingDeadline';

const at = (iso: string) => moment.utc(iso);

describe('votingDeadline', () => {
  it('closes at the end of the coming Monday (UTC)', () => {
    expect(votingDeadline(at('2026-09-27T12:00:00Z')).toISOString()).toBe('2026-09-28T23:59:59.999Z'); // Sunday
    expect(votingDeadline(at('2026-09-28T08:00:00Z')).toISOString()).toBe('2026-09-28T23:59:59.999Z'); // Monday
    expect(votingDeadline(at('2026-09-29T00:00:00Z')).toISOString()).toBe('2026-10-05T23:59:59.999Z'); // Tuesday: new week
    expect(votingDeadline(at('2026-10-02T15:00:00Z')).toISOString()).toBe('2026-10-05T23:59:59.999Z'); // Friday
  });

  it('flags the final 24 hours', () => {
    expect(isFinalHours(at('2026-09-27T12:00:00Z'))).toBe(false);
    expect(isFinalHours(at('2026-09-28T00:00:01Z'))).toBe(true);
    expect(isFinalHours(at('2026-09-29T00:00:00Z'))).toBe(false);
  });
});
