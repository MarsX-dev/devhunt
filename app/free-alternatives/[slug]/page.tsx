import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { smallLogo } from '@/components/ui/FreeAlternatives';
import { CHECKED, FREE_KIND_LABEL, freeAlternativesPath } from '@/utils/freeAlternatives';
import { getFreeRow, type FreeRowView } from '@/utils/freeAlternativesData';

export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

type Params = { params: { slug: string } };

const year = new Date().getUTCFullYear();
const names = (r: FreeRowView) => r.alternatives.map(a => a.tool.name);
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

function faq(r: FreeRowView) {
  const oss = r.alternatives.filter(a => a.kind === 'oss');
  const out = [
    {
      q: `Is there a free alternative to ${r.tool.name}?`,
      a: `Yes. ${list(names(r))} do the same job for free${oss.length ? `; ${list(oss.map(a => a.tool.name))} ${oss.length > 1 ? 'are' : 'is'} open source` : ''}.`,
    },
  ];
  if (oss.length)
    out.push({
      q: `What is the best open-source alternative to ${r.tool.name}?`,
      a: (() => {
        const top = [...oss].sort((x, y) => y.tool.votes_count - x.tool.votes_count)[0];
        return top.tool.votes_count > 0
          ? `${top.tool.name} is the most upvoted open-source option on DevHunt (${top.tool.votes_count} upvotes). ${top.note ?? ''}`.trim()
          : `${list(oss.map(a => a.tool.name))} ${oss.length > 1 ? 'are' : 'is'} open source. ${oss[0].tool.name}: ${oss[0].note ?? ''}`.trim();
      })(),
    });
  const limited = r.alternatives.filter(a => a.kind === 'source-available');
  if (limited.length)
    out.push({
      q: `Are these ${r.tool.name} alternatives open source?`,
      a: `${list(oss.map(a => a.tool.name)) || 'None'} ${oss.length === 1 ? 'is' : 'are'} under OSI-approved licenses. ${list(
        limited.map(a => `${a.tool.name} (${a.license})`),
      )} ${limited.length === 1 ? 'is' : 'are'} source-available: free to self-host, with limits in the license.`,
    });
  return out;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = await getFreeRow(params.slug);
  if (!r) return { title: 'Page not found - Dev Hunt' };
  const title = `Free ${r.tool.name} Alternatives: ${list(names(r).slice(0, 3))} (${year})`;
  const description = `Free and open-source alternatives to ${r.tool.name}: ${list(names(r))}. What each does, its license and what developers on DevHunt think.`.slice(
    0,
    160,
  );
  return {
    title: `${title} | DevHunt`,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: freeAlternativesPath(r.row.slug) },
    openGraph: { type: 'article', title, description, url: `https://devhunt.org${freeAlternativesPath(r.row.slug)}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function FreeAlternativesFor({ params }: Params) {
  const r = await getFreeRow(params.slug);
  if (!r) notFound();
  const questions = faq(r);
  const url = `https://devhunt.org${freeAlternativesPath(r.row.slug)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: `Free alternatives to ${r.tool.name}`,
        itemListElement: r.alternatives.map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: a.tool.name, url: `https://devhunt.org/tool/${a.slug}` })),
      },
      { '@type': 'FAQPage', mainEntity: questions.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'DevHunt', item: 'https://devhunt.org/' },
          { '@type': 'ListItem', position: 2, name: 'Free alternatives', item: 'https://devhunt.org/free-alternatives' },
          { '@type': 'ListItem', position: 3, name: `Free ${r.tool.name} alternatives`, item: url },
        ],
      },
    ],
  };

  return (
    <article className="max-w-3xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/free-alternatives" className="hover:text-slate-300">
          Free alternatives
        </Link>{' '}
        / {r.tool.name}
      </nav>
      <PageHeader eyebrow={r.row.group} title={`Free ${r.tool.name} alternatives`}>
        {r.tool.name}
        {r.tool.slogan ? ` (${r.tool.slogan.replace(/\.$/, '')})` : ''} is a commercial product. These {r.alternatives.length} tools do the same job and
        are free to use or to self-host.
      </PageHeader>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm leading-relaxed text-slate-400">
        <span className="text-slate-200">Short answer:</span> the best free alternatives to {r.tool.name} are {list(names(r))}.
        {r.row.paidFrom &&
          (r.row.paidFrom.startsWith('usage') ? ` ${r.tool.name} is priced by usage.` : ` ${r.tool.name} starts at ${r.row.paidFrom}.`)}{' '}
        Self-hosting is free; you pay only for the server (a small VPS is about $4–6/mo). Licenses and prices checked {CHECKED}.
      </div>

      <ol className="mt-8 space-y-3">
        {r.alternatives.map((a, i) => (
          <li key={a.slug} className="rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <span className="w-5 font-mono text-sm text-slate-500">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {smallLogo(a.tool.logo_url, 96) ? <img src={smallLogo(a.tool.logo_url, 96)!} alt="" className="h-10 w-10 rounded-lg bg-slate-800 object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <Link href={`/tool/${a.slug}`} className="font-semibold text-slate-100 hover:text-white">
                  {a.tool.name}
                </Link>
                {a.tool.slogan && <p className="truncate text-sm text-slate-400">{a.tool.slogan}</p>}
              </div>
            </div>
            {a.note && <p className="mt-3 text-sm text-slate-300">{a.note}</p>}
            <p className="mt-2 font-mono text-xs text-slate-500">
              {a.kind === 'oss' ? 'Open source' : 'Source-available'}{a.license ? ` (${a.license})` : ''} · 
              {a.tool.votes_count > 0 ? `▲ ${a.tool.votes_count} upvotes on DevHunt · ` : ''}
              <Link href={`/tool/${a.slug}`} className="text-orange-400 hover:text-orange-300">
                details
              </Link>
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm text-slate-400">
        Want paid options too? See{' '}
        <Link href={`/tool/${r.tool.slug}/alternatives`} className="text-orange-400 hover:text-orange-300">
          all {r.tool.name} alternatives
        </Link>{' '}
        or the full{' '}
        <Link href="/free-alternatives" className="text-orange-400 hover:text-orange-300">
          free alternatives list
        </Link>
        .
      </p>

      <div className="mt-12">
        <SectionLabel title="FAQ" />
        <div className="mt-2 divide-y divide-slate-800">
          {questions.map(f => (
            <details key={f.q} className="group py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 text-sm font-medium text-slate-200 hover:text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="font-mono text-slate-500 duration-150 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-500">
        {FREE_KIND_LABEL.oss}: OSI-approved license. {FREE_KIND_LABEL['source-available']}: the code is public and free to run yourself, with
        limits in the license.
      </p>
    </article>
  );
}
