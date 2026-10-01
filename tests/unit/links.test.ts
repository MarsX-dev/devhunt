import { describe, expect, it } from 'vitest';
import { blogLinkRels, hostOf, isInternal, isOwnProduct, relFor, withLinkRels } from '@/utils/links';

describe('hostOf', () => {
  it('reads hosts, with or without a scheme', () => {
    expect(hostOf('https://www.SEObotAI.com/pricing')).toBe('seobotai.com');
    expect(hostOf('example.com/x')).toBe('example.com');
    expect(hostOf('/tool/x')).toBeNull();
    expect(hostOf('javascript:alert(1)')).toBeNull();
    expect(hostOf(null)).toBeNull();
  });
});

describe('isInternal / isOwnProduct', () => {
  it('treats relative and devhunt.org links as internal', () => {
    expect(isInternal('/tools/ai')).toBe(true);
    expect(isInternal('#comments')).toBe(true);
    expect(isInternal('https://devhunt.org/blog')).toBe(true);
    expect(isInternal('//evil.com')).toBe(false);
    expect(isInternal('https://notdevhunt.org')).toBe(false);
  });
  it("matches John's products and their subdomains only", () => {
    expect(isOwnProduct('https://listingbott.com/')).toBe(true);
    expect(isOwnProduct('https://guide.johnrush.me/x')).toBe(true);
    expect(isOwnProduct('https://fakelistingbott.com')).toBe(false);
    expect(isOwnProduct('https://listingbott.com.evil.io')).toBe(false);
  });
});

describe('relFor', () => {
  it('follows paid tools and own products, nofollows free tools', () => {
    expect(relFor('https://tool.dev', { paid: true })).toBe('noopener');
    expect(relFor('https://tool.dev')).toBe('nofollow noopener');
    expect(relFor('https://seobotai.com')).toBe('noopener');
    expect(relFor('https://x.com/someone', { ugc: true })).toBe('nofollow ugc noopener');
    expect(relFor('https://ad.dev', { sponsored: true })).toBe('sponsored noopener');
    expect(relFor('/tool/x')).toBeUndefined();
  });
});

describe('withLinkRels', () => {
  it('replaces author rels on description links', () => {
    const html = '<p><a href="https://tool.dev" rel="follow">x</a> <a href="/tools/ai">y</a> <abbr>z</abbr></p>';
    expect(withLinkRels(html)).toBe('<p><a href="https://tool.dev" target="_blank" rel="nofollow noopener">x</a> <a href="/tools/ai">y</a> <abbr>z</abbr></p>');
    expect(withLinkRels('<a href="https://tool.dev">x</a>', { paid: true })).toBe('<a href="https://tool.dev" target="_blank" rel="noopener">x</a>');
  });
});

describe('blogLinkRels', () => {
  it("follows only John's products; every other outside link becomes nofollow", () => {
    expect(blogLinkRels('<a href="https://seobotai.com" rel="nofollow noopener">a</a>')).toBe('<a href="https://seobotai.com" target="_blank" rel="noopener">a</a>');
    expect(blogLinkRels('<a href="https://www.floatui.com/x">a</a>')).toBe('<a href="https://www.floatui.com/x" target="_blank" rel="noopener">a</a>');
    expect(blogLinkRels('<a href="https://other.dev">a</a>')).toBe('<a href="https://other.dev" target="_blank" rel="nofollow noopener">a</a>');
    expect(blogLinkRels('<a href="/blog/x">a</a>')).toBe('<a href="/blog/x">a</a>');
  });
});
