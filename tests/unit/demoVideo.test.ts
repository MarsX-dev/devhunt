import { describe, expect, it } from 'vitest';
import { usableVideoUrl } from '@/utils/demoVideo';

describe('usableVideoUrl', () => {
  it('drops the auto-generated paracast promo videos and keeps real ones', () => {
    expect(usableVideoUrl('https://app.paracast.io/api/getPromoVideoFromSiteUrl/?project_url=https://x.dev')).toBeUndefined();
    expect(usableVideoUrl('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube.com/watch?v=abc');
    expect(usableVideoUrl('')).toBeUndefined();
    expect(usableVideoUrl(null)).toBeUndefined();
  });
});
