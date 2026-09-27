import { describe, expect, it } from 'vitest';
import { timeAgo } from '@/utils/activity';

describe('timeAgo', () => {
  const now = Date.parse('2026-09-27T12:00:00Z');
  it('uses short relative times', () => {
    expect(timeAgo('2026-09-27T11:59:45Z', now)).toBe('just now');
    expect(timeAgo('2026-09-27T11:55:00Z', now)).toBe('5m ago');
    expect(timeAgo('2026-09-27T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-09-25T12:00:00Z', now)).toBe('2d ago');
    expect(timeAgo('2026-07-27T12:00:00Z', now)).toBe('2mo ago');
    expect(timeAgo('2024-09-27T12:00:00Z', now)).toBe('2y ago');
    expect(timeAgo('2026-09-27T12:00:30Z', now)).toBe('just now'); // clock skew
  });
});
