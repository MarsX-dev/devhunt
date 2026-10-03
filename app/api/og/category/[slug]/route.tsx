import categories from '@/utils/categories';
import { createBrowserClient } from '@/utils/supabase/browser';
import CategoryService from '@/utils/supabase/services/categories';
import { getLeaderboardPage } from '@/utils/toolLists';
import { C, Frame, Logo, MONO, clip, dataUrl, ogImage, sized } from '@/utils/og';

export const revalidate = 3600;

// Share card for a category page (/tools/[slug]): "Best X tools" and its top 5 by upvotes.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const name = categories.find(c => params.slug.replaceAll('-', ' ') === c.name.toLowerCase())?.name;
  if (!name) return new Response('Not found', { status: 404 });
  const found = (await new CategoryService(createBrowserClient()).search(name)) as { id: number; name: string }[] | null;
  const category = found?.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!category) return new Response('Not found', { status: 404 });
  const { rows, total } = await getLeaderboardPage(1, category.id);
  const top = rows.slice(0, 5);
  const logos = await Promise.all(top.map(t => dataUrl(sized(t.logo_url, 128))));

  return ogImage(
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 22, color: C.orange, fontFamily: MONO, letterSpacing: 3 }}>CATEGORY</div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: name.length > 20 ? 58 : 70, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Best {name} tools</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 26, color: C.muted, fontFamily: MONO }}>{total.toLocaleString('en-US')} tools, ranked by developer upvotes</div>
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
