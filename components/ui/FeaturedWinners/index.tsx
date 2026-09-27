import Link from 'next/link';
import moment from 'moment';
import { unstable_cache } from 'next/cache';
import SectionLabel from '@/components/ui/SectionLabel';
import { createBrowserClient } from '@/utils/supabase/browser';

const SHOWN = 8;

const getFeaturedWinners = unstable_cache(
  async () => {
    const { data } = await createBrowserClient()
      .from('products')
      .select('id, slug, name, slogan, logo_url, launch_start')
      .eq('is_featured', true)
      .eq('deleted', false);
    return data ?? [];
  },
  ['featured-winners'],
  { revalidate: 3600 },
);

// Well-known past winners (products.is_featured), a different shuffle on every visit.
export default async function FeaturedWinners() {
  const all = await getFeaturedWinners();
  if (!all.length) return null;
  const shown = [...all].sort(() => Math.random() - 0.5).slice(0, SHOWN);
  return (
    <div id="featured-winners" className="mt-14">
      <SectionLabel title="Featured winners" hint="Launched on DevHunt" />
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shown.map(tool => (
          <li key={tool.id}>
            <Link
              href={`/tool/${tool.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-slate-800 p-4 duration-150 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800/30"
            >
              <img
                src={(tool.logo_url || '').replace(/w=\d+/g, 'w=96')}
                alt={tool.name}
                loading="lazy"
                className="h-10 w-10 rounded-xl bg-slate-800 object-cover ring-1 ring-slate-800"
              />
              <span className="mt-3 truncate font-medium text-slate-100">{tool.name.trim()}</span>
              <span className="mt-0.5 line-clamp-2 text-xs text-slate-500">{tool.slogan}</span>
              <span className="mt-auto pt-3 font-mono text-[11px] text-orange-400/90">
                🏆 Winner · {moment.utc(tool.launch_start).format('MMM YYYY')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
