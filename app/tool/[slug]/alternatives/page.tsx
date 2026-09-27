import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import ToolRow from '@/components/ui/ToolRow';
import { cleanName } from '@/components/ui/ToolProfile';
import { getAlternatives } from '@/utils/compareData';
import { comparePath } from '@/utils/compare';
import RequestProfile from '@/components/ui/ToolProfile/RequestProfile';

// Alternatives pages are cached after their first visit (CDN) for 10 minutes. Nothing is built ahead (empty
// generateStaticParams); Next 14 caches a not-found page with its 404 status.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Params = { params: { slug: string } };
const year = () => new Date().getUTCFullYear();

export async function generateMetadata({ params: { slug } }: Params): Promise<Metadata> {
  const data = await getAlternatives(decodeURIComponent(slug));
  if (!data) return { title: 'Page not found - Dev Hunt' };
  const name = cleanName(data.tool.name);
  const count = (data.profile?.compare.length ?? 0) + data.more.length;
  const title = `Best ${name} Alternatives in ${year()} | DevHunt`;
  const description = `${count} ${name} alternatives developers use, with how each one compares${data.tool.slogan ? ` to ${name}: ${data.tool.slogan}` : ''}.`.slice(0, 160);
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: `/tool/${data.tool.slug}/alternatives` },
    // Thin pages (no picked alternatives and few category peers) stay out of the index.
    robots: (data.profile?.compare.length ?? 0) >= 2 || data.more.length >= 5 ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `https://devhunt.org/tool/${data.tool.slug}/alternatives`, images: ['https://devhunt.org/devhuntog.png?v=2'] },
  };
}

// "<Tool> alternatives": the similar tools its profile picked (with how they differ and a link to
// the head-to-head comparison), then more popular tools from the same categories.
export default async function AlternativesPage({ params: { slug } }: Params) {
  const data = await getAlternatives(decodeURIComponent(slug));
  if (!data) notFound();
  const { tool, profile, more } = data;
  const name = cleanName(tool.name);
  const picked = profile?.compare ?? [];
  const info = new Map(profile?.data.alternatives.map(a => [a.id, a]) ?? []);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} alternatives`,
    itemListElement: [...picked.map(p => p.slug), ...more.map(m => m.slug)].map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://devhunt.org/tool/${s}` })),
  };

  return (
    <section className="container-custom-screen mt-10 mb-20 max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      {!profile && <RequestProfile productId={tool.id} />}
      <Link href={`/tool/${tool.slug}`} className="inline-flex items-center gap-x-2 text-sm text-slate-400 hover:text-slate-200">
        {tool.logo_url && <img src={tool.logo_url.replace(/w=\d+/g, 'w=48')} alt="" className="h-5 w-5 rounded" />}← {name}
      </Link>
      <PageHeader eyebrow="Alternatives" title={`${name} alternatives`}>
        {profile?.data.summary ?? tool.slogan} Here are {picked.length + more.length} similar tools developers launched on DevHunt
        {picked.length ? ', starting with the closest matches' : ''}.
      </PageHeader>

      {!!picked.length && (
        <div className="mt-12">
          <SectionLabel title="Closest alternatives" hint={`compared with ${name}`} />
          <ul className="mt-2 divide-y divide-slate-800/70">
            {picked.map(alt => (
              <li key={alt.id} className="py-3.5">
                <div className="flex items-center gap-x-3 text-sm">
                  {alt.logo_url && <img src={alt.logo_url.replace(/w=\d+/g, 'w=48')} alt="" loading="lazy" className="h-6 w-6 flex-none rounded-md bg-slate-800 object-cover" />}
                  <Link href={`/tool/${alt.slug}`} className="font-medium text-slate-100 hover:text-white">
                    {cleanName(alt.name)}
                  </Link>
                  {info.get(alt.id)?.best_for && <span className="hidden truncate text-slate-500 sm:inline">— {info.get(alt.id)?.best_for}</span>}
                  <span className="ml-auto flex-none font-mono text-xs text-slate-500">
                    ▲ {alt.votes_count.toLocaleString('en-US')}
                    {alt.pricing && ` · ${alt.pricing}`}
                  </span>
                </div>
                <p className="mt-1.5 pl-9 text-sm leading-relaxed text-slate-400">
                  {info.get(alt.id)?.difference}{' '}
                  <Link href={comparePath(tool.slug, alt.slug)} className="whitespace-nowrap font-mono text-xs text-orange-400 hover:text-orange-300">
                    {name} vs {cleanName(alt.name)} →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!more.length && (
        <div className="mt-14">
          <SectionLabel title={`More ${tool.categories[0]?.name ?? 'similar'} tools`} hint="most upvoted on DevHunt" />
          <ol className="mt-2">
            {more.map((row, idx) => (
              <ToolRow key={row.id} tool={row} rank={idx + 1} showDate revealIndex={idx} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
