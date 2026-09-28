import { ImageResponse } from 'next/og';
import { getSiteStats, DOMAIN_RATING, formatStat } from '@/utils/siteStats';

// The site's share image (social cards, messengers): the home page hero with live numbers. Regenerated
// at most once an hour. Referenced from app/layout.tsx (openGraph/twitter images).
export const revalidate = 3600;

const W = 1200;
const H = 630;
const C = { bg: '#141312', panel: '#0c0b0a', line: '#252321', text: '#fafaf9', dim: '#78736e', muted: '#a09c97', green: '#4ade80', orange: '#f97316' };

// A few of the makers shown in the hero (see components/ui/CountdownPanel).
const AVATARS = [
  'https://pbs.twimg.com/profile_images/1466385933612240901/qNMrMDlG_200x200.jpg',
  'https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/a90fe249-313d-4546-8dd7-39028bdb8cbf/picture',
  'https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/daa6aea5-8b32-4c4a-9f31-9e2183ba7fb2/picture',
  'https://avatars.githubusercontent.com/u/26512078?v=4',
  'https://avatars.githubusercontent.com/u/41970?v=4',
  'https://avatars.githubusercontent.com/u/155965955?v=4',
  'https://avatars.githubusercontent.com/u/773673?v=4',
  'https://avatars.githubusercontent.com/u/17927972?v=4',
];

// Google Fonts serves TTF when asked without a browser user agent; ImageResponse can't read woff2.
async function font(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

// Avatars as data URLs: one that fails to load is left out instead of breaking the image.
async function avatar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const [stats, inter, interBold, mono, ...faces] = await Promise.all([
    getSiteStats(),
    font('Inter', 500),
    font('Inter', 700),
    font('JetBrains+Mono', 500),
    ...AVATARS.map(avatar),
  ]);
  const tiles = [
    { label: 'impressions', value: stats ? formatStat(stats.total_views) : '24M+', sub: stats?.views_today ? `▲ +${stats.views_today.toLocaleString('en-US')} today` : '', green: true },
    { label: 'domain_rating', value: DOMAIN_RATING, sub: 'ahrefs', green: false },
    { label: 'tools_launched', value: stats ? stats.tools_launched.toLocaleString('en-US') : '7,000+', sub: stats?.tools_this_week ? `▲ +${stats.tools_this_week} this week` : '', green: true },
    { label: 'developers', value: stats ? stats.users.toLocaleString('en-US') : '40,000+', sub: stats?.users_today ? `▲ +${stats.users_today} today` : '', green: true },
  ];
  const fonts = [
    inter && { name: 'Inter', data: inter, weight: 500 as const, style: 'normal' as const },
    interBold && { name: 'Inter', data: interBold, weight: 700 as const, style: 'normal' as const },
    mono && { name: 'Mono', data: mono, weight: 500 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }[];
  const monoFamily = mono ? 'Mono' : 'monospace';

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: `radial-gradient(ellipse at 50% 0%, #2a2522 0%, ${C.bg} 60%)`,
          fontFamily: 'Inter',
          color: C.text,
          padding: '44px 56px 0',
        }}
      >
        {/* Badge (the hero's countdown, without a time that would be stale in a shared card) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 22px',
            borderRadius: 999,
            border: '2px solid rgba(244,114,182,0.45)',
            background: 'rgba(76,29,43,0.55)',
            fontSize: 24,
            color: '#f3f2f0',
          }}
        >
          <span style={{ color: '#f472b6', fontSize: 26 }}>♥</span>
          Vote for the best new dev tool of the week
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 26, fontWeight: 700, fontSize: 84, lineHeight: 1.05, letterSpacing: -3 }}>
          <span>The best new dev tools,</span>
          <span style={{ color: C.dim }}>voted by developers.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 26, gap: 18 }}>
          <div style={{ display: 'flex' }}>
            {faces.filter(Boolean).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src!} width={44} height={44} style={{ borderRadius: 999, border: `3px solid ${C.bg}`, marginLeft: i ? -12 : 0, objectFit: 'cover' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 24, color: C.muted, fontFamily: monoFamily }}>
            <span style={{ color: C.text }}>{stats ? stats.unique_visitors.toLocaleString('en-US') : '450,000+'}</span>
            <span style={{ marginLeft: 12 }}>unique visitors since launch</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            marginTop: 34,
            borderRadius: 18,
            border: `2px solid ${C.line}`,
            background: 'rgba(12,11,10,0.6)',
            fontFamily: monoFamily,
          }}
        >
          {tiles.map((t, i) => (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '22px 26px', borderLeft: i ? `2px solid ${C.line}` : 'none' }}>
              <span style={{ fontSize: 20, color: C.dim }}>{t.label}</span>
              <span style={{ fontSize: 44, marginTop: 6, color: C.text }}>{t.value}</span>
              <span style={{ fontSize: 19, marginTop: 6, color: t.green ? C.green : C.dim }}>{t.sub || ' '}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', marginBottom: 22, fontSize: 26, fontWeight: 700 }}>
          DevHunt<span style={{ color: C.orange }}>_</span>
          <span style={{ marginLeft: 14, fontSize: 22, fontWeight: 500, color: C.dim, fontFamily: monoFamily }}>devhunt.org</span>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
}
