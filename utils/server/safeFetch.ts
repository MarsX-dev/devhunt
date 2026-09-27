import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// fetch() for URLs that come from users or scraped pages (tool websites, og:image, favicons). It only
// goes to public http(s) hosts: every hop, redirects included, must resolve to a public address, so the
// server can't be pointed at itself, the cloud metadata service or a private network.
const MAX_REDIRECTS = 5;

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  // IPv4-mapped addresses, dotted (::ffff:127.0.0.1) or hex as URL parsing writes them (::ffff:7f00:1).
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const [hi, lo] = [parseInt(hex[1], 16), parseInt(hex[2], 16)];
    return isPrivateV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || /^ff/.test(v6);
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`blocked scheme ${url.protocol}`);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true })).map(a => a.address);
  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error(`blocked private address for ${host}`);
  return url;
}

export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, { ...init, redirect: 'manual' });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) return res;
    url = await assertPublicUrl(new URL(location, url).toString());
  }
  throw new Error('too many redirects');
}
