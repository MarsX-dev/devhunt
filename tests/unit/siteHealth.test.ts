import { describe, expect, it } from 'vitest';
import { directVerdict, goneReason, hijackVerdict, htmlToSnapshot, mentionsTool } from '@/utils/siteHealth';

const page = (over: Partial<Parameters<typeof goneReason>[0]> = {}) => ({ status: 200, error: null, finalUrl: 'https://acme.dev', title: '', text: '', ...over });

describe('site health', () => {
  it('treats DNS failures, 404s and server errors as dead, bot walls as unknown', () => {
    expect(directVerdict(page({ status: null, error: 'ENOTFOUND: getaddrinfo ENOTFOUND acme.dev' }))).toEqual({ dead: 'domain does not resolve' });
    expect(directVerdict(page({ status: 404 }))).toEqual({ dead: 'HTTP 404' });
    expect(directVerdict(page({ status: 502 }))).toEqual({ dead: 'HTTP 502' });
    expect(directVerdict(page({ status: 403 }))).toBeNull();
    expect(directVerdict(page({ status: 503 }))).toBeNull();
    expect(directVerdict(page({ status: null, error: 'TimeoutError' }))).toBe('suspicious');
  });

  it('recognises parked, expired and placeholder pages', () => {
    expect(goneReason(page({ title: 'acme.dev', text: 'This domain is for sale! Make an offer.' }))).toMatch(/for sale/);
    expect(goneReason(page({ title: 'Site not found · GitHub Pages', text: '' }))).not.toBeNull();
    expect(goneReason(page({ title: '404: NOT_FOUND', text: 'Code: DEPLOYMENT_NOT_FOUND' }))).not.toBeNull();
    expect(goneReason(page({ title: 'Welcome to nginx!', text: '' }))).not.toBeNull();
    expect(goneReason(page({ title: 'Acme - deploy faster', text: 'Pricing Docs Sign up' }))).toBeNull();
  });

  it('skips JEV when the page names the tool or its domain brand', () => {
    expect(mentionsTool(page({ title: 'Clerk | Authentication and User Management' }), 'Clerk', 'https://clerk.com')).toBe(true);
    expect(mentionsTool(page({ title: 'Home', text: 'Welcome to langfuse' }), '🪢 Langfuse', 'langfuse.com')).toBe(true);
    expect(mentionsTool(page({ title: 'Xoilac TV | Trực Tiếp Bóng Đá' }), 'Neurelo', 'https://www.neurelo.com')).toBe(false);
  });

  it('only calls a site hijacked when JEV is confident', () => {
    expect(hijackVerdict({ same: { noul: 0.03 }, kind: { choice: 'gambling' } })).toBe('the domain now shows gambling content');
    expect(hijackVerdict({ same: { noul: 0.05 }, kind: { choice: 'parked' } })).toBe('the domain is parked or for sale');
    expect(hijackVerdict({ same: { noul: 0.4 }, kind: { choice: 'gambling' } })).toBeNull();
    expect(hijackVerdict({ same: { noul: 0.02 }, kind: { choice: 'product' } })).toBeNull();
    expect(hijackVerdict(null)).toBeNull();
  });

  it('extracts title and visible text from HTML', () => {
    const snap = htmlToSnapshot('<html><head><title>Acme &amp; Co</title><style>x{}</style></head><body><script>var a</script><h1>Hi</h1> there</body></html>', 200, 'https://acme.dev/');
    expect(snap.title).toBe('Acme & Co');
    expect(snap.text).toBe('Acme & Co Hi there');
  });
});

import { siteVariants } from '@/utils/siteHealth';
describe('siteVariants', () => {
  it('tries the home page, www/bare hosts and the parent domain', () => {
    expect(siteVariants('https://www.aimlapi.com/?utm_source=devhunt')).toEqual(['https://aimlapi.com/']);
    expect(siteVariants('https://app.superagi.com/')).toEqual(['https://app.superagi.com/', 'https://superagi.com/', 'https://www.superagi.com/'].filter(u => u !== 'https://app.superagi.com/'));
    expect(siteVariants('shop.example.co.uk/x')).toContain('https://example.co.uk/');
  });
});
