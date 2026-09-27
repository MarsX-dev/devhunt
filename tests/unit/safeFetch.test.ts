import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertPublicUrl, safeFetch } from '@/utils/server/safeFetch';

afterEach(() => vi.unstubAllGlobals());

describe('safeFetch', () => {
  it.each([
    'http://127.0.0.1/',
    'http://localhost:3000/',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.5/',
    'http://172.16.0.1/',
    'http://192.168.1.1/',
    'http://100.64.0.1/',
    'http://0.0.0.0/',
    'http://[::1]/',
    'http://[fd00::1]/',
    'http://[::ffff:127.0.0.1]/',
    'file:///etc/passwd',
    'ftp://example.com/',
  ])('refuses %s', async url => {
    await expect(assertPublicUrl(url)).rejects.toThrow();
  });

  it('allows a public address', async () => {
    await expect(assertPublicUrl('https://8.8.8.8/')).resolves.toBeInstanceOf(URL);
  });

  it('refuses a redirect to a private address', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(safeFetch('https://8.8.8.8/start')).rejects.toThrow(/private/);
    expect(fetchMock).toHaveBeenCalledTimes(1); // the metadata address was never requested
  });

  it('follows redirects between public hosts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://1.1.1.1/final' } }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await safeFetch('https://8.8.8.8/start');
    expect(await res.text()).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
