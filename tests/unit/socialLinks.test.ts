import { describe, expect, it } from 'vitest';
import { buildLinks, linkLabel, normalizeUrl, parseSocialLink, profileLinks } from '@/utils/socialLinks';

const parsed = (input: string, hint?: Parameters<typeof parseSocialLink>[1]) => {
  const link = parseSocialLink(input, hint);
  return link && `${link.platform} ${link.handle} ${link.url}`;
};

// Real values from profiles.social_url.
describe('parseSocialLink', () => {
  it('reads X links in every shape people typed', () => {
    expect(parsed('https://twitter.com/loicknuchel ')).toBe('x loicknuchel https://x.com/loicknuchel');
    expect(parsed('http://twitter.com/peter_kow')).toBe('x peter_kow https://x.com/peter_kow');
    expect(parsed('x.com/masticfrance')).toBe('x masticfrance https://x.com/masticfrance');
    expect(parsed('Twitter.com/mga599')).toBe('x mga599 https://x.com/mga599');
    expect(parsed('https://mobile.twitter.com/foo?s=21&t=abc')).toBe('x foo https://x.com/foo');
    expect(parsed('https://x.com/foo/status/123')).toBe('x foo https://x.com/foo');
    expect(parsed('@foo', 'x')).toBe('x foo https://x.com/foo');
    expect(parsed('foo_bar', 'x')).toBe('x foo_bar https://x.com/foo_bar');
  });

  it('reads LinkedIn, GitHub and friends', () => {
    expect(parsed('www.linkedin.com/in/ajaykale0003')).toBe('linkedin in/ajaykale0003 https://www.linkedin.com/in/ajaykale0003');
    expect(parsed('http://linkedin.com/in/karthik-kb')).toBe('linkedin in/karthik-kb https://www.linkedin.com/in/karthik-kb');
    expect(parsed('https://uk.linkedin.com/in/jane-doe/')).toBe('linkedin in/jane-doe https://www.linkedin.com/in/jane-doe');
    expect(parsed('linkedin.com/in/世杰-徐-640941285')?.split(' ').slice(0, 2).join(' ')).toBe('linkedin in/世杰-徐-640941285');
    expect(parsed('https://www.linkedin.com/company/marsx')).toBe('linkedin company/marsx https://www.linkedin.com/company/marsx');
    expect(parsed('jane-doe', 'linkedin')).toBe('linkedin in/jane-doe https://www.linkedin.com/in/jane-doe');
    expect(parsed('https://github.com/johnrushx')).toBe('github johnrushx https://github.com/johnrushx');
    expect(parsed('github.com/johnrushx/devhunt')).toBe('github johnrushx https://github.com/johnrushx');
    expect(parsed('www.facebook.com/dominik.lieboner')).toBe('facebook dominik.lieboner https://www.facebook.com/dominik.lieboner');
    expect(parsed('https://www.facebook.com/profile.php?id=1000123')).toBe('facebook profile.php?id=1000123 https://www.facebook.com/profile.php?id=1000123');
    expect(parsed('https://bsky.app/profile/pauchiner.es')).toBe('bluesky pauchiner.es https://bsky.app/profile/pauchiner.es');
    expect(parsed('jay', 'bluesky')).toBe('bluesky jay.bsky.social https://bsky.app/profile/jay.bsky.social');
    expect(parsed('https://www.producthunt.com/@daniel_hughes4')).toBe('producthunt daniel_hughes4 https://www.producthunt.com/@daniel_hughes4');
    expect(parsed('https://peerlist.io/betterantispamm')).toBe('peerlist betterantispamm https://peerlist.io/betterantispamm');
    expect(parsed('https://www.youtube.com/@fireship')).toBe('youtube @fireship https://www.youtube.com/@fireship');
    expect(parsed('Telegram: ilya_2088')).toBe('telegram ilya_2088 https://t.me/ilya_2088');
    expect(parsed('@gargron@mastodon.social')).toBe('mastodon gargron@mastodon.social https://mastodon.social/@gargron');
  });

  it('keeps other sites as websites, repairing the protocol', () => {
    expect(parsed('https:shipai.me')).toBe('website https://shipai.me https://shipai.me');
    expect(parsed('Jacques.IM')).toBe('website https://jacques.im https://jacques.im');
    expect(parsed('https://americadata.co.')).toBe('website https://americadata.co https://americadata.co');
    expect(parsed('https://www.converso.io/')).toBe('website https://www.converso.io https://www.converso.io');
    expect(parsed('http://curtsheavytowing.com/')).toBe('website http://curtsheavytowing.com http://curtsheavytowing.com');
    // A known site but not a profile: a plain link, not a wrong handle.
    expect(parsed('https://x.com/i/status/1')).toBe('website https://x.com/i/status/1 https://x.com/i/status/1');
  });

  it('drops junk', () => {
    for (const junk of ['NA', 'None', 'ss', '_', ' ', 'Twitter ', 'facebook', 'Tik tok', 'Imam wibowo ', 'I dont do social medias', 'Founder of iSwift.dev, Voice Anywhere', 'تتسمس', 'localhost:3000'])
      expect(parsed(junk), junk).toBeNull();
    // A bare handle means nothing without knowing which site it's for.
    expect(parsed('@foo')).toBeNull();
    expect(parsed('a_dead_hunter')).toBeNull();
  });
});

describe('normalizeUrl', () => {
  it('adds https and drops tracking', () => {
    expect(normalizeUrl('marsx.dev')).toBe('https://marsx.dev');
    expect(normalizeUrl(' https://Marsx.dev/blog?utm_source=x&page=2 ')).toBe('https://marsx.dev/blog?page=2');
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});

describe('buildLinks', () => {
  it('stores handles and the first link as social_url', () => {
    const built = buildLinks({ x: '@johnrush', linkedin: 'linkedin.com/in/johnrush', more: ['bsky.app/profile/john.dev', 'marsx.dev'] });
    expect(built.errors).toEqual({});
    expect(built.social_links).toEqual({ x: 'johnrush', linkedin: 'in/johnrush', bluesky: 'john.dev', other: ['https://marsx.dev'] });
    expect(built.social_url).toBe('https://x.com/johnrush');
  });

  it('flags a link typed into the wrong field', () => {
    expect(buildLinks({ x: 'linkedin.com/in/foo' }).errors.x).toMatch(/LinkedIn link/);
    expect(buildLinks({ github: 'not valid!!' }).errors.github).toMatch(/GitHub profile/);
    expect(buildLinks({ more: ['NA'] }).errors.more).toMatch(/isn't a link/);
  });

  it('uses the GitHub account from sign-in over what was typed', () => {
    expect(buildLinks({ github: 'someoneelse' }, 'johnrushx').social_links?.github).toBe('johnrushx');
    expect(buildLinks({}, 'johnrushx').social_url).toBe('https://github.com/johnrushx');
  });

  it('is empty when nothing is entered', () => {
    expect(buildLinks({ x: '', more: [''] })).toEqual({ social_links: null, social_url: null, errors: {} });
  });
});

describe('profileLinks', () => {
  it('falls back to the legacy social_url', () => {
    expect(profileLinks({ social_links: null, social_url: 'x.com/foo' }).map(linkLabel)).toEqual(['@foo']);
    expect(profileLinks({ social_links: null, social_url: 'NA' })).toEqual([]);
  });
  it('orders stored links', () => {
    const links = profileLinks({ social_links: { other: ['https://marsx.dev'], github: 'johnrushx', x: 'johnrush' } });
    expect(links.map(l => l.platform)).toEqual(['x', 'github', 'website']);
    expect(links.map(linkLabel)).toEqual(['@johnrush', 'johnrushx', 'marsx.dev']);
  });
});

describe('profileLinks safety', () => {
  it('never returns a non-http link, whatever is stored', () => {
    const links = profileLinks({ social_links: { x: 'foo"><script>', github: '../../evil', other: ['javascript:alert(1)', 'data:text/html,hi', 'https://ok.dev'] } });
    expect(links.map(l => l.url)).toEqual(['https://ok.dev']);
    expect(profileLinks({ social_links: 'garbage', social_url: null })).toEqual([]);
    expect(profileLinks({ social_links: { other: 'https://not-an-array.dev' } })).toEqual([]);
  });
});

describe('more typing mistakes from the data', () => {
  it('reads platform/handle and a missing colon', () => {
    expect(parsed('x/chcuhga')).toBe('x chcuhga https://x.com/chcuhga');
    expect(parsed('instagram/riyadinesh')).toBe('instagram riyadinesh https://www.instagram.com/riyadinesh');
    expect(parsed('https//linkedin.com/in/tata')).toBe('linkedin in/tata https://www.linkedin.com/in/tata');
    expect(parsed('sabrishobi263@gmail.com')).toBeNull();
    expect(parsed('Twitter.com/mga599')).toBe('x mga599 https://x.com/mga599');
  });
});
