import { type Metadata } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { cleanName } from '@/components/ui/ToolProfile';
import { type Comparison, type CompareProduct } from '@/utils/compareData';
import { comparePath } from '@/utils/compare';
import { resolve } from './resolve';
import { compareIndexable } from '@/utils/seoIndex';
import { sectionShown } from '@/utils/toolProfile';
import { type ToolProfileView } from '@/utils/toolProfileData';
import RequestProfile from '@/components/ui/ToolProfile/RequestProfile';

// Comparisons are cached after their first visit (CDN) for 10 minutes. Nothing is built ahead (empty
// generateStaticParams); Next 14 caches a not-found page with its 404 status.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Params = { params: { pair: string } };


export async function generateMetadata({ params: { pair } }: Params): Promise<Metadata> {
  const c = await resolve(pair);
  if (!c) return { title: 'Page not found - Dev Hunt' };
  const [a, b] = [cleanName(c.a.name), cleanName(c.b.name)];
  const title = `${a} vs ${b}: features, pricing and differences | DevHunt`;
  const shareImage = { url: `https://devhunt.org/api/og/compare${comparePath(c.a.slug, c.b.slug).slice('/compare'.length)}`, width: 1200, height: 630, alt: title };
  const description = (c.difference ?? `Compare ${a} and ${b} side by side: what each does, pricing and what developers pick them for.`).slice(0, 160);
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: comparePath(c.a.slug, c.b.slug) },
    // Indexed in tested batches (utils/seoIndex.ts); the rest stay reachable for visitors.
    robots: compareIndexable(c.a, c.b) ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `https://devhunt.org${comparePath(c.a.slug, c.b.slug)}`, images: [shareImage] },
    twitter: { card: 'summary_large_image', title, description, images: [shareImage] },
  };
}

const pricingOf = (tool: CompareProduct, profile: ToolProfileView | null) => {
  const model = profile && sectionShown(profile.data, 'pricing') ? profile.data.pricing?.model : null;
  const value = model ?? tool.pricing;
  return value ? value[0].toUpperCase() + value.slice(1) : '—';
};
const plansOf = (profile: ToolProfileView | null) =>
  profile && sectionShown(profile.data, 'pricing') ? (profile.data.pricing?.plans ?? []).filter(p => p.price).map(p => `${p.name} ${p.price}${p.billing ? ` ${p.billing}` : ''}`) : [];

// Side-by-side comparison of two tools that one of them lists as an alternative to the other.
export default async function ComparePage({ params: { pair } }: Params) {
  const c = await resolve(pair);
  if (!c) notFound();
  const tools = [
    { tool: c.a, profile: c.profileA },
    { tool: c.b, profile: c.profileB },
  ];
  const [nameA, nameB] = [cleanName(c.a.name), cleanName(c.b.name)];
  // A tool without its own profile can still have a "best for" line in the other tool's alternatives.
  const bestFor = (t: CompareProduct, p: ToolProfileView | null) =>
    p?.data.best_for ?? [c.profileA, c.profileB].flatMap(x => x?.data.alternatives ?? []).find(alt => alt.id === t.id)?.best_for ?? '—';
  const allRows: { label: string; value: (t: CompareProduct, p: ToolProfileView | null) => string }[] = [
    { label: 'What it is', value: (t, p) => p?.data.summary ?? t.slogan ?? '—' },
    { label: 'Best for', value: bestFor },
    { label: 'Who it’s for', value: (t, p) => p?.data.audience ?? '—' },
    { label: 'Pricing', value: (t, p) => pricingOf(t, p) },
    { label: 'Plans', value: (t, p) => plansOf(p).join(' · ') || '—' },
    { label: 'Open source', value: (t, p) => (p?.data.github ? `Yes, ${p.data.github.stars.toLocaleString('en-US')} GitHub stars` : '—') },
    { label: 'Works with', value: (t, p) => (p && sectionShown(p.data, 'glance') ? p.data.integrations.slice(0, 8).join(', ') : '') || '—' },
    { label: 'DevHunt upvotes', value: t => t.votes_count.toLocaleString('en-US') },
    { label: 'Launched on DevHunt', value: t => (t.launch_start ? moment.utc(t.launch_start).format('MMM YYYY') : '—') },
  ];
  const rows = allRows.filter(row => tools.some(({ tool, profile }) => row.value(tool, profile) !== '—'));

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'DevHunt', item: 'https://devhunt.org/' },
      { '@type': 'ListItem', position: 2, name: nameA, item: `https://devhunt.org/tool/${c.a.slug}` },
      { '@type': 'ListItem', position: 3, name: `${nameA} vs ${nameB}`, item: `https://devhunt.org${comparePath(c.a.slug, c.b.slug)}` },
    ],
  };

  return (
    <section className="container-custom-screen mt-10 mb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData).replace(/</g, '\\u003c') }} />
      {tools.filter(t => !t.profile).map(t => (
        <RequestProfile key={t.tool.id} productId={t.tool.id} />
      ))}
      <PageHeader eyebrow="Compare" title={`${nameA} vs ${nameB}`}>
        {c.difference ?? `${nameA} and ${nameB} side by side.`}
      </PageHeader>

      <div className="mt-10 grid grid-cols-2 gap-3">
        {tools.map(({ tool }) => (
          <Link key={tool.id} href={`/tool/${tool.slug}`} className="flex items-center gap-x-3 rounded-2xl border border-slate-800 p-4 duration-150 hover:border-slate-600">
            {tool.logo_url && <img src={tool.logo_url.replace(/w=\d+/g, 'w=96')} alt="" className="h-11 w-11 flex-none rounded-xl bg-slate-800 object-cover" />}
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-50">{cleanName(tool.name)}</span>
              <span className="line-clamp-2 text-xs text-slate-500">{tool.slogan}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <SectionLabel title="Side by side" />
        <dl className="mt-2 divide-y divide-slate-800 text-sm">
          {rows.map(row => (
            <div key={row.label} className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr_1fr] sm:gap-4">
              <dt className="font-mono text-[11px] text-slate-500 sm:pt-0.5">{row.label}</dt>
              {tools.map(({ tool, profile }) => (
                <dd key={tool.id} className="text-slate-300">
                  <span className="mr-1.5 text-xs text-slate-500 sm:hidden">{cleanName(tool.name)}:</span>
                  {row.value(tool, profile)}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        {tools.map(({ tool, profile }) => {
          const features = profile && sectionShown(profile.data, 'features') ? profile.data.features : [];
          return (
            <div key={tool.id}>
              <SectionLabel title={`${cleanName(tool.name)} features`} />
              {features.length ? (
                <ul className="mt-4 space-y-3">
                  {features.map(f => (
                    <li key={f.title} className="flex items-start gap-x-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-green-400" />
                      <span>
                        <span className="text-slate-200">{f.title}.</span> <span className="text-slate-400">{f.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">{tool.slogan}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-4 text-sm">
                <Link href={`/tool/${tool.slug}`} className="text-orange-400 hover:text-orange-300">
                  {cleanName(tool.name)} on DevHunt →
                </Link>
                <Link href={`/tool/${tool.slug}/alternatives`} className="text-slate-400 hover:text-slate-200">
                  Alternatives
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-14 font-mono text-[11px] text-slate-600">Based on each tool&apos;s website and DevHunt data. Details may change; check the official sites.</p>
    </section>
  );
}
