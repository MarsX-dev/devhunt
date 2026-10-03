import { getAlternatives } from '@/utils/compareData';
import { cleanName } from '@/components/ui/ToolProfile';
import { C, Frame, Logo, MONO, clip, dataUrl, ogImage, sized } from '@/utils/og';

export const revalidate = 3600;

// Share card for /tool/[slug]/alternatives: the tool, then the logos of its alternatives.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const data = await getAlternatives(decodeURIComponent(params.slug));
  if (!data) return new Response('Not found', { status: 404 });
  const name = cleanName(data.tool.name);
  const alts = [...(data.profile?.compare ?? []), ...data.more].slice(0, 6);
  const count = (data.profile?.compare.length ?? 0) + data.more.length;
  const [logo, ...logos] = await Promise.all([dataUrl(sized(data.tool.logo_url, 192)), ...alts.map(t => dataUrl(sized(t.logo_url, 128)))]);

  return ogImage(
    <Frame tagline="Find the right dev tool">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Logo src={logo} name={name} size={110} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 22, color: C.orange, fontFamily: MONO, letterSpacing: 3 }}>ALTERNATIVES</div>
            <div style={{ display: 'flex', marginTop: 6, fontSize: name.length > 18 ? 54 : 64, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05 }}>Best {clip(name, 26)} alternatives</div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontSize: 26, color: C.muted, fontFamily: MONO }}>{count} tools developers use instead, and how they compare</div>
        <div style={{ display: 'flex', gap: 18, marginTop: 56 }}>
          {alts.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160, gap: 16 }}>
              <Logo src={logos[i]} name={t.name} size={112} />
              <span style={{ fontSize: 22, color: C.soft, textAlign: 'center' }}>{clip(cleanName(t.name), 16)}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>,
  );
}
