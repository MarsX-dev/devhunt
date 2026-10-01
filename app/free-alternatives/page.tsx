import { type Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { KindBadge, ToolChip } from '@/components/ui/FreeAlternatives';
import { CHECKED, freeAlternativesPath } from '@/utils/freeAlternatives';
import { getFreeRows } from '@/utils/freeAlternativesData';

// The free-alternatives matrix: well-known paid dev tools down the left, their genuinely free or open-source
// alternatives on the right (utils/freeAlternatives.ts, curated by hand).
export const revalidate = 3600;

const PATH = '/free-alternatives';
const TITLE = 'Free & Open-Source Alternatives to Popular Dev Tools (2026)';
const DESCRIPTION =
  'Free and open-source alternatives to Postman, Heroku, Auth0, Datadog, Zapier, Retool, Notion, GitHub Copilot and more, with the license of each.';
const OG_IMAGE = { url: 'https://devhunt.org/api/og/page/free-alternatives', width: 1200, height: 630, alt: TITLE };

export const metadata: Metadata = {
  title: `${TITLE} | DevHunt`,
  description: DESCRIPTION,
  metadataBase: new URL('https://devhunt.org'),
  alternates: { canonical: PATH },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `https://devhunt.org${PATH}`, images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

export default async function FreeAlternatives() {
  const rows = await getFreeRows();
  const groups = Array.from(new Set(rows.map(r => r.row.group)));
  const altCount = new Set(rows.flatMap(r => r.alternatives.map(a => a.slug))).size;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: TITLE,
        description: DESCRIPTION,
        url: `https://devhunt.org${PATH}`,
        dateModified: CHECKED,
        author: { '@type': 'Organization', name: 'DevHunt', url: 'https://devhunt.org' },
      },
      {
        '@type': 'ItemList',
        name: 'Free alternatives to popular developer tools',
        itemListElement: rows.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `Free ${r.tool.name} alternatives`,
          url: `https://devhunt.org${freeAlternativesPath(r.row.slug)}`,
        })),
      },
    ],
  };

  return (
    <article className="max-w-5xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <PageHeader eyebrow="Free alternatives" title="Free and open-source alternatives to popular dev tools">
        {rows.length} well-known paid tools and {altCount} free or open-source tools that do the same job. Free here means free to use or to
        self-host, not a free trial or a limited tier of a paid product.
      </PageHeader>

      <p className="mt-6 text-xs text-slate-500">
        All open source unless marked <span className="text-amber-400/80">*</span> (source-available: free to self-host, with limits in the
        license). Licenses checked {CHECKED}; hover a mark for the license.
      </p>

      {groups.map(group => (
        <section key={group} className="mt-10">
          <SectionLabel title={group} />
          <div className="mt-2 divide-y divide-slate-800/70">
            {rows
              .filter(r => r.row.group === group)
              .map(r => (
                <div key={r.row.slug} className="grid gap-3 py-4 sm:grid-cols-[13rem_1fr] sm:items-center">
                  <div className="flex items-center gap-2">
                    <ToolChip slug={r.tool.slug} name={r.tool.name} logo={r.tool.logo_url} />
                    <span className="text-slate-600" aria-hidden>
                      →
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.alternatives.map(a => (
                      <span key={a.slug} className="inline-flex items-center gap-0.5">
                        <ToolChip slug={a.tool.slug} name={a.tool.name} logo={a.tool.logo_url} />
                        <KindBadge kind={a.kind} license={a.license} />
                      </span>
                    ))}
                    <Link href={freeAlternativesPath(r.row.slug)} className="ml-1 text-xs text-orange-400 hover:text-orange-300">
                      Compare →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

      <p className="mt-12 text-xs leading-relaxed text-slate-500">
        Missing a tool or spotted a wrong license? Tell us on{' '}
        <a href="https://x.com/devhunt_" className="text-slate-300 underline" target="_blank" rel="noopener">
          X
        </a>
        . Open-source tools can still sell a hosted version; the label is about the code you can run yourself.
      </p>
    </article>
  );
}
