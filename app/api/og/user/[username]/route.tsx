import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { C, Frame, Logo, MONO, clip, dataUrl, ogImage, sized } from '@/utils/og';

export const revalidate = 3600;

// Share card for a maker profile (/@username): avatar, name, headline, numbers and their launches.
export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^@/, '');
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, username, full_name, avatar_url, headline, deleted_at')
    .eq('username', username)
    .maybeSingle();
  if (!profile || profile.deleted_at) return new Response('Not found', { status: 404 });

  const [{ data: tools }, { count: given }] = await Promise.all([
    serviceClient.from('products').select('name, logo_url, votes_count').eq('owner_id', profile.id).eq('deleted', false).order('votes_count', { ascending: false }).limit(50),
    serviceClient.from('product_votes').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ]);
  const launches = (tools ?? []) as { name: string; logo_url: string | null; votes_count: number | null }[];
  const received = launches.reduce((sum, t) => sum + (t.votes_count ?? 0), 0);
  const [avatar, ...logos] = await Promise.all([dataUrl(sized(profile.avatar_url, 320) ?? profile.avatar_url), ...launches.slice(0, 6).map(t => dataUrl(sized(t.logo_url, 128)))]);
  const name = profile.full_name || `@${profile.username}`;
  const stats = [
    { label: 'launched', value: launches.length },
    { label: 'upvotes received', value: received },
    { label: 'upvotes given', value: given ?? 0 },
  ];

  return ogImage(
    <Frame tagline="Makers and their dev tools">
      <div style={{ display: 'flex', flex: 1, gap: 48, alignItems: 'center', paddingBottom: 30 }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} width={220} height={220} style={{ width: 220, height: 220, borderRadius: 999, objectFit: 'cover', border: `4px solid ${C.line}` }} />
        ) : (
          <Logo src={null} name={name} size={220} radius={999} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05 }}>{clip(name, 28)}</div>
          <div style={{ display: 'flex', marginTop: 8, fontSize: 26, color: C.dim, fontFamily: MONO }}>@{profile.username}</div>
          {profile.headline && <div style={{ display: 'flex', marginTop: 16, fontSize: 28, color: C.muted, lineHeight: 1.35 }}>{clip(profile.headline, 110)}</div>}
          <div style={{ display: 'flex', gap: 40, marginTop: 30, fontFamily: MONO }}>
            {stats.map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 40, color: C.text }}>{s.value.toLocaleString('en-US')}</span>
                <span style={{ fontSize: 19, color: C.dim }}>{s.label}</span>
              </div>
            ))}
          </div>
          {launches.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 30, alignItems: 'center' }}>
              {launches.slice(0, 6).map((t, i) => (
                <Logo key={i} src={logos[i]} name={t.name} size={56} />
              ))}
              {launches.length > 6 && <span style={{ fontSize: 22, color: C.dim, fontFamily: MONO, marginLeft: 6 }}>+{launches.length - 6}</span>}
            </div>
          )}
        </div>
      </div>
    </Frame>,
  );
}
