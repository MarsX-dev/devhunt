import ProfileService from '@/utils/supabase/services/profile';
import ProductsService from '@/utils/supabase/services/products';
import UserProfileInfo from '@/components/ui/UserProfileInfo/UserProfileInfo';
import { type Comment as CommentType, type Product, type Profile } from '@/utils/supabase/types';
import { createBrowserClient } from '@/utils/supabase/browser';
import moment from 'moment';
import Link from 'next/link';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { unstable_cache } from 'next/cache';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import ToolRow from '@/components/ui/ToolRow';
import SectionLabel from '@/components/ui/SectionLabel';
import { type ProductType } from '@/type';
import { profileCacheTag } from '@/utils/routeExists';

const UPVOTED_SHOWN = 20;

// Public profile data, cached for a minute (the page was re-queried on every visit). Tagged per username so
// saving a profile (/api/profile) shows the change right away.
const getProfilePageData = (username: string) =>
  unstable_cache(
    async () => {
      const browserService = createBrowserClient();
      const profileService = new ProfileService(browserService);
      const profile = await profileService.getByUsername(username);
      if (!profile) return { profile: null, tools: null, activity: null, votedTools: null };
      const [tools, activity, votedTools] = await Promise.all([
        new ProductsService(browserService).getUserProductsById(profile.id),
        profileService.getUserActivityById(profile.id),
        profileService.getUserVoteTools(profile.id),
      ]);
      return { profile, tools, activity, votedTools };
    },
    ['profile-page', username],
    { revalidate: 60, tags: [profileCacheTag(username)] },
  )();
const stripTags = (html: string | null) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const TrendingToolsList = dynamic(() => import('@/components/ui/TrendingToolsList'), { ssr: false });

interface IComment extends CommentType {
  profiles: Profile;
  products: Product;
}

// set dynamic metadata
export async function generateMetadata({ params: { user } }: { params: { user: string } }): Promise<Metadata> {
  const decoded = decodeURIComponent(user);
  if (!decoded.startsWith('@')) return { title: 'Page not found - Dev Hunt' };
  const username = decoded.slice(1);
  const { profile } = await getProfilePageData(username); // same cached data as the page
  if (!profile) return { title: 'Page not found - Dev Hunt' };

  const name = profile?.full_name || `@${username}`;
  const title = `${name} on DevHunt`;
  const description = profile?.headline
    ? `${name} - ${profile.headline}. Dev tools they launched and upvoted on DevHunt.`
    : `Dev tools ${name} launched and upvoted on DevHunt.`;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `${decodeURIComponent(user)}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      images: [(profile?.avatar_url as string) || ''],
      url: `https://devhunt.org/${decodeURIComponent(user)}`,
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [profile?.avatar_url ?? ''],
    },
  };
}

export default async ({ params: { user } }: { params: { user: string } }) => {
  // Profiles live at /@username; anything else under this catch-all route is a real 404.
  const decoded = decodeURIComponent(user);
  if (!decoded.startsWith('@')) notFound();
  const username = decoded.slice(1);
  const { profile, tools, activity, votedTools } = await getProfilePageData(username);

  if (profile) {

    const launches = ((tools ?? []) as ProductType[]).sort((a, b) => Date.parse(b.launch_start ?? '') - Date.parse(a.launch_start ?? ''));
    const upvoted = ((votedTools ?? []) as any[])
      .filter(tool => !tool.deleted)
      .map(tool => ({ ...tool, product_categories: (tool.product_category_product ?? []).map((c: any) => c.product_categories) }) as ProductType);
    const comments = ((activity ?? []) as IComment[]).sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''));
    const stats = {
      launches: launches.length,
      upvotesReceived: launches.reduce((sum, tool) => sum + (tool.votes_count ?? 0), 0),
      upvotesGiven: upvoted.length,
      comments: comments.length,
    };

    return (
      <div className="container-custom-screen mt-10 mb-32 space-y-14 sm:mt-14">
        <UserProfileInfo profile={profile} stats={stats} />
        {launches.length > 0 && (
          <div>
            <SectionLabel title="Launches" hint={`${launches.length} ${launches.length === 1 ? 'tool' : 'tools'}`} />
            <ol className="mt-2">
              {launches.map((tool, idx) => (
                <ToolRow key={tool.id} tool={tool as any} showDate revealIndex={idx} />
              ))}
            </ol>
          </div>
        )}
        {upvoted.length > 0 && (
          <div>
            <SectionLabel title="Upvoted" hint={upvoted.length > UPVOTED_SHOWN ? `${UPVOTED_SHOWN} of ${upvoted.length} tools` : `${upvoted.length} ${upvoted.length === 1 ? 'tool' : 'tools'}`} />
            <ol className="mt-2">
              {upvoted.slice(0, UPVOTED_SHOWN).map((tool, idx) => (
                <ToolRow key={tool.id} tool={tool as any} revealIndex={idx} />
              ))}
            </ol>
          </div>
        )}
        {comments.length > 0 && (
          <div>
            <SectionLabel title="Comments" hint={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`} />
            <ol className="mt-2 divide-y divide-slate-800/70">
              {comments.map(item => (
                <li key={item.id}>
                  <Link href={`/tool/${item.products.slug}#${item.id}`} className="group flex gap-x-3 py-4">
                    <img
                      src={(item.products.logo_url || '').replace(/w=\d+/g, 'w=80')}
                      alt={item.products.name}
                      className="h-10 w-10 flex-none rounded-lg bg-slate-800 object-cover ring-1 ring-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-500">
                        Commented on <span className="font-medium text-slate-200 group-hover:text-slate-50">{item.products.name}</span> ·{' '}
                        {moment(item.created_at).format('ll')}
                      </p>
                      <p className="mt-1.5 line-clamp-3 w-fit max-w-full rounded-2xl rounded-tl-md bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                        {stripTags(item.content)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
        <MonitizorAdCards />
        <div>
          <SectionLabel title="Trending this week" />
          <TrendingToolsList />
        </div>
      </div>
    );
  } else notFound();
};
