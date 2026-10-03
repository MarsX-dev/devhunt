import { Frame, MONO, dataUrl, ogImage } from '@/utils/og';
import { getSiteStats, DOMAIN_RATING, formatStat } from '@/utils/siteStats';

// The site's share image (social cards, messengers): the home page hero with live numbers. Regenerated
// at most once an hour. Referenced from app/layout.tsx (openGraph/twitter images).
export const revalidate = 3600;

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

export async function GET() {
  const [stats, ...faces] = await Promise.all([getSiteStats(), ...AVATARS.map(url => dataUrl(url, 4000))]);
  const tiles = [
    { label: 'impressions', value: stats ? formatStat(stats.total_views) : '24M+', sub: stats?.views_today ? `▲ +${stats.views_today.toLocaleString('en-US')} today` : '', green: true },
    { label: 'domain_rating', value: DOMAIN_RATING, sub: 'ahrefs', green: false },
    { label: 'tools_launched', value: stats ? stats.tools_launched.toLocaleString('en-US') : '7,000+', sub: stats?.tools_this_week ? `▲ +${stats.tools_this_week} this week` : '', green: true },
    { label: 'developers', value: stats ? stats.users.toLocaleString('en-US') : '40,000+', sub: stats?.users_today ? `▲ +${stats.users_today} today` : '', green: true },
  ];
  const monoFamily = MONO;

  return ogImage(
    <Frame tagline="Launch your dev tool, win the week">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -20 }}>
        {/* Badge (the hero's countdown, without a time that would be stale in a shared card) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px',
            borderRadius: 999,
            border: '2px solid rgba(244,114,182,0.45)',
            background: 'rgba(76,29,43,0.55)',
            fontSize: 22,
            color: '#f3f2f0',
          }}
        >
          <span style={{ color: '#f472b6', fontSize: 26 }}>♥</span>
          Vote for the best new dev tool of the week
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, fontWeight: 700, fontSize: 74, lineHeight: 1.05, letterSpacing: -2.5 }}>
          <span>The best new dev tools,</span>
          <span style={{ color: C.dim }}>voted by developers.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 20, gap: 18 }}>
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
            marginTop: 24,
            borderRadius: 18,
            border: `2px solid ${C.line}`,
            background: 'rgba(12,11,10,0.6)',
            fontFamily: monoFamily,
          }}
        >
          {tiles.map((t, i) => (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 26px', borderLeft: i ? `2px solid ${C.line}` : 'none' }}>
              <span style={{ fontSize: 20, color: C.dim }}>{t.label}</span>
              <span style={{ fontSize: 40, marginTop: 4, color: C.text }}>{t.value}</span>
              <span style={{ fontSize: 19, marginTop: 4, color: t.green ? C.green : C.dim }}>{t.sub || ' '}</span>
            </div>
          ))}
        </div>

      </div>
    </Frame>,
  );
}
