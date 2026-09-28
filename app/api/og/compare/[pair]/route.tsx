import { getComparison } from '@/utils/compareData';
import { pairCandidates } from '@/utils/compare';
import { cleanName } from '@/components/ui/ToolProfile';
import { C, Frame, Logo, MONO, clip, dataUrl, ogImage, sized } from '@/utils/og';

export const revalidate = 3600;

// Share card for /compare/a-vs-b: both tools side by side.
export async function GET(_req: Request, { params }: { params: { pair: string } }) {
  let c = null;
  for (const [a, b] of pairCandidates(params.pair)) {
    c = await getComparison(...([a, b].sort() as [string, string]));
    if (c) break;
  }
  if (!c) return new Response('Not found', { status: 404 });
  const tools = [c.a, c.b];
  const logos = await Promise.all(tools.map(t => dataUrl(sized(t.logo_url, 256))));

  return ogImage(
    <Frame tagline="Dev tools compared side by side">
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start', paddingTop: 36 }}>
        {tools.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, flexDirection: i ? 'row-reverse' : 'row' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <Logo src={logos[i]} name={t.name} size={150} />
              <div style={{ display: 'flex', marginTop: 24, fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>{clip(cleanName(t.name), 20)}</div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 24, color: C.muted, textAlign: 'center', maxWidth: 420, lineHeight: 1.35 }}>{clip(t.slogan, 80)}</div>
              <div style={{ display: 'flex', marginTop: 14, fontSize: 22, color: C.dim, fontFamily: MONO }}>
                ▲ {(t.votes_count ?? 0).toLocaleString('en-US')}
                {t.pricing ? ` · ${t.pricing}` : ''}
              </div>
            </div>
            {i === 0 && (
              <div style={{ display: 'flex', width: 90, height: 90, marginTop: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.line}`, background: C.panel, fontSize: 30, fontWeight: 700, color: C.orange, fontFamily: MONO }}>
                vs
              </div>
            )}
          </div>
        ))}
      </div>
    </Frame>,
  );
}
