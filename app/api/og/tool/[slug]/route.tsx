import { getToolPageData } from '@/utils/toolPageData';
import { getWeekRank } from '@/utils/weekRank';
import { C, Frame, Logo, MONO, clip, dataUrl, image, ogImage, sized } from '@/utils/og';

export const revalidate = 3600;

const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(new Date(iso).getUTCFullYear() !== new Date().getUTCFullYear() ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });

// Share card for a tool page: logo, name, slogan, where it stands (winner / live / launching), and its
// first screenshot framed on the right.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const data = await getToolPageData(decodeURIComponent(params.slug));
  if (!data) return new Response('Not found', { status: 404 });
  const tool = data.product;
  const now = Date.now();
  const start = tool.launch_start ? Date.parse(tool.launch_start) : NaN;
  const end = tool.launch_end ? Date.parse(tool.launch_end as string) : NaN;
  const [rank, logo, shot] = await Promise.all([
    getWeekRank(tool as any).catch(() => undefined),
    dataUrl(sized(tool.logo_url, 192)),
    image(sized(tool.asset_urls?.[0], 1200, 'jpg'), 8000),
  ]);
  // The whole screenshot, scaled to fit the right column at its own aspect ratio (a fixed box with
  // objectFit cover cut the sides off most of them). Unknown size: assume 16:10.
  const box = { w: 566, h: 490 };
  const ratio = shot && shot.width && shot.height ? shot.width / shot.height : 1.6;
  const shotW = Math.round(Math.min(box.w, box.h * ratio));
  const shotH = Math.round(shotW / ratio);
  const votes = `▲ ${(tool.votes_count ?? 0).toLocaleString('en-US')} upvote${tool.votes_count === 1 ? '' : 's'}`;
  const chips: { text: string; tone: 'win' | 'live' | 'plain' }[] =
    end < now && rank && rank <= 3
      ? [{ text: `🏆 #${rank} Tool of the week`, tone: 'win' }, { text: votes, tone: 'plain' }]
      : start <= now && end >= now
        ? [{ text: `● Live now${rank ? ` · #${rank} this week` : ''}`, tone: 'live' }, { text: votes, tone: 'plain' }]
        : start > now
          ? [{ text: `Launching ${date(tool.launch_start!)}`, tone: 'plain' }]
          : [{ text: votes, tone: 'plain' }];
  const tone = { win: { color: '#fdba74', border: 'rgba(249,115,22,0.6)', bg: 'rgba(249,115,22,0.12)' }, live: { color: C.green, border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.08)' }, plain: { color: C.soft, border: C.line, bg: 'rgba(12,11,10,0.6)' } };

  return ogImage(
    <Frame tagline="Vote for the best new dev tools">
      <div style={{ display: 'flex', flex: 1, gap: 44 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: shot ? 470 : 1080, paddingTop: 8 }}>
          <Logo src={logo} name={tool.name} size={104} />
          <div style={{ display: 'flex', marginTop: 26, fontSize: tool.name.length > 22 ? 48 : 60, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{clip(tool.name, 40)}</div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 28, lineHeight: 1.35, color: C.muted }}>{clip(tool.slogan, shot ? 95 : 160)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 'auto', marginBottom: 34 }}>
            {chips.map(c => (
              <div key={c.text} style={{ display: 'flex', padding: '9px 18px', borderRadius: 999, fontSize: 22, fontFamily: MONO, color: tone[c.tone].color, border: `2px solid ${tone[c.tone].border}`, background: tone[c.tone].bg }}>
                {c.text}
              </div>
            ))}
          </div>
        </div>
        {shot && (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.src}
              width={shotW}
              height={shotH}
              style={{ width: shotW, height: shotH, borderRadius: 16, border: `2px solid #393633`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
          </div>
        )}
      </div>
    </Frame>,
  );
}
