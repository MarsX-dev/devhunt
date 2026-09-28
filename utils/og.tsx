import { ImageResponse } from 'next/og';
import { type ReactNode } from 'react';

// Shared kit for the generated share images (app/api/og/*): one look for every card, with the
// DevHunt footer on all of them. 1200x630, the size every social network and messenger expects.
export const OG = { width: 1200, height: 630 };
export const C = {
  bg: '#141312',
  panel: '#0c0b0a',
  line: '#252321',
  text: '#fafaf9',
  soft: '#e4e2df',
  muted: '#a09c97',
  dim: '#78736e',
  green: '#4ade80',
  orange: '#f97316',
};
export const MONO = 'Mono';

// Google Fonts serves TTF when asked without a browser user agent (ImageResponse can't read woff2).
// Loaded once per server instance.
async function font(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}
let fontsLoading: Promise<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }[]> | null = null;
function loadFonts() {
  fontsLoading ??= Promise.all([font('Inter', 500), font('Inter', 700), font('JetBrains+Mono', 500)]).then(([regular, bold, mono]) => {
    const list = [
      regular && { name: 'Inter', data: regular, weight: 500 as const, style: 'normal' as const },
      bold && { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
      mono && { name: MONO, data: mono, weight: 500 as const, style: 'normal' as const },
    ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }[];
    if (list.length < 3) fontsLoading = null; // try again next time
    return list;
  });
  return fontsLoading;
}

// Our image host (imgix) resizes on the fly; PNG/JPEG only, since the renderer can't read WebP.
export function sized(url: string | null | undefined, width: number, format: 'png' | 'jpg' = 'png'): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('imgix.net')) {
      u.searchParams.set('w', String(width));
      u.searchParams.set('fm', format);
      u.searchParams.delete('auto'); // auto=format would pick WebP
    }
    return u.toString();
  } catch {
    return null;
  }
}

// Images as data URLs: one that fails to load is left out instead of breaking the card.
export async function dataUrl(url: string | null | undefined, timeoutMs = 5000): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^image\/(png|jpe?g|gif)/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

// A logo, or the first letter on a tile when there is none.
export function Logo({ src, name, size, radius }: { src: string | null; name: string; size: number; radius?: number }) {
  const r = radius ?? Math.round(size * 0.22);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', border: `2px solid ${C.line}`, background: C.panel }} />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: '#393633',
        color: C.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.45),
        fontWeight: 700,
      }}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </div>
  );
}

// The card: warm dark background and the DevHunt footer (brand, domain, and a short tagline).
export function Frame({ children, tagline = 'The best new dev tools, voted by developers' }: { children: ReactNode; tagline?: string }) {
  return (
    <div
      style={{
        width: OG.width,
        height: OG.height,
        display: 'flex',
        flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 0%, #2a2522 0%, ${C.bg} 62%)`,
        fontFamily: 'Inter',
        color: C.text,
      }}
    >
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '48px 60px 0', overflow: 'hidden' }}>{children}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 76,
          padding: '0 60px',
          borderTop: `2px solid ${C.line}`,
          background: 'rgba(12,11,10,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 700 }}>
          DevHunt<span style={{ color: C.orange }}>_</span>
          <span style={{ marginLeft: 16, fontSize: 22, fontWeight: 500, color: C.dim, fontFamily: MONO }}>devhunt.org</span>
        </div>
        <span style={{ fontSize: 20, color: C.dim, fontFamily: MONO }}>{tagline}</span>
      </div>
    </div>
  );
}

// Renders a card. Cached by the CDN for an hour (numbers on the cards change slowly).
export async function ogImage(element: ReactNode, maxAge = 3600) {
  const fonts = await loadFonts();
  return new ImageResponse(element as React.ReactElement, {
    ...OG,
    fonts: fonts.length ? fonts : undefined,
    emoji: 'twemoji',
    // Lowercase on purpose: ImageResponse sets its own 'cache-control' (1 year, immutable) and a
    // differently-cased key gets merged into it instead of replacing it.
    headers: { 'cache-control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400` },
  });
}

export const clip = (text: string | null | undefined, max: number) => {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).replace(/[\s,.;:-]+$/, '')}…` : t;
};
