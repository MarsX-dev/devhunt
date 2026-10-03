import { describe, expect, it } from 'vitest';
import { countryCode, isBot, normalizePath, seenBefore, visitState } from '@/utils/analytics';

describe('analytics', () => {
  it('counts a browser once as new, and once per day as a daily visitor', () => {
    expect(visitState(null, '2026-09-28', false)).toEqual({ newVisitor: true, newToday: true, next: '2026-09-28' });
    expect(visitState('2026-09-28', '2026-09-28', false)).toMatchObject({ newVisitor: false, newToday: false });
    expect(visitState('2026-09-27', '2026-09-28', false)).toMatchObject({ newVisitor: false, newToday: true });
    expect(visitState(null, '2026-09-28', true)).toMatchObject({ newVisitor: false, newToday: true });
  });

  it('recognises visitors from before tracking started', () => {
    expect(seenBefore('_ga=1; _clck=abc|2', [])).toBe(true);
    expect(seenBefore('', ['sb-xpdhqqwgprlqmqaqmnyx-auth-token'])).toBe(true);
    expect(seenBefore('', ['isNewsletterActive'])).toBe(true);
    expect(seenBefore('x_clck=1', ['other'])).toBe(false);
  });

  it('cleans paths and countries', () => {
    expect(normalizePath('/tool/daytona?ref=x#top')).toBe('/tool/daytona');
    expect(normalizePath('/upcoming/')).toBe('/upcoming');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('https://evil.com')).toBeNull();
    expect(normalizePath('/<script>')).toBeNull();
    expect(normalizePath(42)).toBeNull();
    expect(countryCode('DE')).toBe('DE');
    expect(countryCode('de')).toBe('XX');
    expect(countryCode(null)).toBe('XX');
  });

  it('skips bots', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBot('Mozilla/5.0 HeadlessChrome/120')).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140 Safari/537.36')).toBe(false);
  });
});
