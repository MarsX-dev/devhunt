import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import SectionLabel from '@/components/ui/SectionLabel';
import { createBrowserClient } from '@/utils/supabase/browser';

const getFeaturedWinners = unstable_cache(
  async () => {
    const { data } = await createBrowserClient()
      .from('products')
      .select('id, slug, name, slogan, logo_url, votes_count')
      .eq('is_featured', true)
      .eq('deleted', false)
      .order('votes_count', { ascending: false });
    return data ?? [];
  },
  ['top-winners'],
  { revalidate: 3600 },
);

// Hand-picked past winners (products.is_featured), most upvoted first.
export default async function FeaturedWinners() {
  const shown = await getFeaturedWinners();
  if (!shown.length) return null;
  return (
    <div id="top-winners" className="mt-14">
      <SectionLabel title="Top winners" hint="Launched on DevHunt" />
      <ol className="mt-2 grid gap-x-10 sm:grid-cols-2">
        {shown.map((tool, idx) => (
          <li key={tool.id} className="border-b border-slate-800/70">
            <Link href={`/tool/${tool.slug}`} className="group flex items-center gap-x-3 py-2.5 text-sm">
              <span className="w-5 flex-none font-mono text-xs text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
              <img
                src={(tool.logo_url || '').replace(/w=\d+/g, 'w=48')}
                alt=""
                loading="lazy"
                className="h-6 w-6 flex-none rounded-md bg-slate-800 object-cover"
              />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium text-slate-100 group-hover:text-white">{tool.name.replace(/^[^\p{L}\p{N}]+/u, '').trim()}</span>
                <span className="text-slate-500"> — {tool.slogan}</span>
              </span>
              <span className="flex-none font-mono text-xs text-orange-400/90 tabular-nums">▲ {tool.votes_count.toLocaleString('en-US')}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
