import { C, Frame, Logo, MONO, clip, dataUrl, ogImage, sized } from '@/utils/og';
import { getRoundup, isCurrentMonth, monthName, parseMonth } from '@/utils/roundups';

export const revalidate = 3600;

// Share card for a monthly roundup (/best/[year]/[month]): the month's top 5 launches by upvotes.
export async function GET(_req: Request, { params }: { params: { year: string; month: string } }) {
  const m = parseMonth(params.year, params.month);
  if (!m) return new Response('Not found', { status: 404 });
  const r = await getRoundup(m);
  const top = r.top.slice(0, 5);
  const logos = await Promise.all(top.map(t => dataUrl(sized(t.logo_url, 128))));

  return ogImage(
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 22, color: C.orange, fontFamily: MONO, letterSpacing: 3 }}>
          {isCurrentMonth(m) ? 'MONTH SO FAR' : 'MONTHLY ROUNDUP'}
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: 54, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          Best new dev tools of {monthName(m)}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 26, color: C.muted, fontFamily: MONO }}>
          {r.total.toLocaleString('en-US')} launches, ranked by developer upvotes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26, gap: 6 }}>
          {top.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 50 }}>
              <span style={{ width: 30, fontSize: 22, fontFamily: MONO, color: i < 3 ? C.orange : C.dim }}>{i + 1}</span>
              <Logo src={logos[i]} name={t.name} size={42} />
              <span style={{ fontSize: 26, fontWeight: 700 }}>{clip(t.name, 28)}</span>
              <span style={{ fontSize: 22, color: C.dim, flex: 1 }}>{clip(t.slogan, 60)}</span>
              <span style={{ fontSize: 22, color: C.muted, fontFamily: MONO }}>▲ {(t.votes_count ?? 0).toLocaleString('en-US')}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>,
  );
}
