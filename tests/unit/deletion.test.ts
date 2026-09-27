import { describe, expect, it } from 'vitest';
import { anonymizedProfile, confirmMatches, isDeletedAccountError, DELETED_NAME } from '@/utils/deletion';

describe('deletion', () => {
  it('only confirms with the exact name (ignoring case, spacing and a leading @)', () => {
    expect(confirmMatches('Knecht Works', 'Knecht Works')).toBe(true);
    expect(confirmMatches('  knecht   works ', 'Knecht Works')).toBe(true);
    expect(confirmMatches('@johnrush', 'johnrush')).toBe(true);
    expect(confirmMatches('Knecht', 'Knecht Works')).toBe(false);
    expect(confirmMatches('', '')).toBe(false);
    expect(confirmMatches(undefined, 'x')).toBe(false);
    expect(confirmMatches({ name: 'x' }, 'x')).toBe(false);
    expect(confirmMatches('x', null)).toBe(false);
  });

  it('anonymizes a profile completely, with a unique username', () => {
    const p = anonymizedProfile('9eecebfe-f493-41eb-905a-4e0f6405f898', new Date('2026-09-28T00:00:00Z'));
    expect(p).toEqual({
      username: 'deleted-9eecebfef4',
      full_name: DELETED_NAME,
      avatar_url: null,
      website_url: null,
      headline: null,
      about: null,
      twitter: null,
      social_url: null,
      deleted_at: '2026-09-28T00:00:00.000Z',
    });
  });

  it('recognises the sign-in error of a deleted (banned) account', () => {
    expect(isDeletedAccountError('User is banned')).toBe(true);
    expect(isDeletedAccountError('user_banned')).toBe(true);
    expect(isDeletedAccountError('Invalid login credentials')).toBe(false);
    expect(isDeletedAccountError(null)).toBe(false);
  });
});
