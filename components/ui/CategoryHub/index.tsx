import Link from 'next/link';
import moment from 'moment';
import SectionLabel from '@/components/ui/SectionLabel';
import { type CategoryHubStats } from '@/utils/categoryHub';
import { type ToolRowData } from '@/utils/toolRow';

// The answer-first summary and FAQ on page 1 of a category (seo-plan.md A7). Every sentence comes from
// DevHunt's own data for that category (votes, pricing, launch dates), so each page says something only it can.

interface HubProps {
  name: string;
  slug: string;
  total: number;
  top: ToolRowData[];
  stats: CategoryHubStats;
}

const votes = (n: number) => `${n.toLocaleString('en-US')} upvote${n === 1 ? '' : 's'}`;
const toolLink = (t: { slug: string; name: string }) => (
  <Link key={t.slug} href={`/tool/${t.slug}`} className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white">
    {t.name}
  </Link>
);
const n = (x: number) => x.toLocaleString('en-US');
// "26 are subscriptions and 3 are one-time purchases", leaving out zero counts.
const paidSplit = (stats: CategoryHubStats) =>
  [stats.subscription && `${n(stats.subscription)} are subscriptions`, stats.oneTime && `${n(stats.oneTime)} are one-time purchases`]
    .filter(Boolean)
    .join(' and ');
const join = (items: JSX.Element[]) => items.flatMap((el, i) => (i === 0 ? [el] : [i === items.length - 1 ? ' and ' : ', ', el]));

export function categoryFaq({ name, total, top, stats }: HubProps): { q: string; a: string }[] {
  const faq: { q: string; a: string }[] = [];
  if (top.length) {
    faq.push({
      q: `What are the best ${name} tools?`,
      a: `Ranked by developer upvotes on DevHunt, the top ${name} tools are ${top
        .slice(0, 5)
        .map(t => `${t.name} (${votes(t.votes_count)})`)
        .join(', ')}. DevHunt lists ${total.toLocaleString('en-US')} ${name} tools in total.`,
    });
  }
  const paid = paidSplit(stats);
  faq.push({
    q: `Are there free ${name} tools?`,
    a: stats.free
      ? `Yes. ${n(stats.free)} of the ${n(total)} ${name} tools on DevHunt are free${
          stats.topFree.length ? `; the most upvoted are ${stats.topFree.map(t => t.name).join(', ')}` : ''
        }.${paid ? ` ${paid}.` : ''}`
      : `None of the ${name} tools on DevHunt are listed as free${paid ? `: ${paid}` : ''}.`,
  });
  faq.push({
    q: `How are ${name} tools ranked on DevHunt?`,
    a: 'By the number of upvotes each tool got from developers on DevHunt, all-time. Voting needs a GitHub or Google sign-in, so the votes come from real accounts. New tools launch every week and can climb the list.',
  });
  if (stats.latestLaunch) {
    faq.push({
      q: `Are new ${name} tools still launching?`,
      a: `${
        stats.launched30d ? `Yes: ${stats.launched30d} ${name} tools launched on DevHunt in the last 30 days.` : 'None in the last 30 days.'
      } The most recent launched on ${moment.utc(stats.latestLaunch).format('MMMM D, YYYY')}.`,
    });
  }
  faq.push({
    q: `How do I add my ${name} tool to DevHunt?`,
    a: 'Sign in and submit it with its name, website, description and screenshots. Listing is free and every tool gets its own page; a paid launch lets you pick the launch week.',
  });
  return faq;
}

export function CategoryHubIntro({ name, total, top, stats }: HubProps) {
  const top3 = top.slice(0, 3);
  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm leading-relaxed text-slate-400">
      {top3.length > 0 && (
        <p>
          <span className="text-slate-200">The best {name} tools on DevHunt</span>, by developer upvotes: {join(top3.map(toolLink))}.
        </p>
      )}
      <p className={top3.length ? 'mt-2' : ''}>
        {n(total)} tools:{' '}
        {[
          stats.free && `${n(stats.free)} free`,
          stats.subscription && `${n(stats.subscription)} subscription`,
          stats.oneTime && `${n(stats.oneTime)} one-time`,
        ]
          .filter(Boolean)
          .join(', ')}
        .{stats.launched30d > 0 && ` ${stats.launched30d} launched in the last 30 days.`}
        {stats.topFree.length > 0 && <> Most upvoted free: {join(stats.topFree.map(toolLink))}.</>}
      </p>
      {stats.latestLaunch && (
        <p className="mt-2 font-mono text-xs text-slate-500">
          Ranked by all-time upvotes · updated {moment.utc(stats.latestLaunch).format('MMMM YYYY')}
        </p>
      )}
    </div>
  );
}

export function CategoryHubFaq({ faq, name }: { faq: { q: string; a: string }[]; name: string }) {
  return (
    <div className="mt-12">
      <SectionLabel title={`${name} tools FAQ`} />
      <div className="mt-2 divide-y divide-slate-800">
        {faq.map(f => (
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
  );
}

// FAQPage, ItemList (the visible ranking) and BreadcrumbList for the category page.
export function categoryJsonLd({
  name,
  slug,
  top,
  faq,
}: {
  name: string;
  slug: string;
  top: ToolRowData[];
  faq: { q: string; a: string }[];
}) {
  const url = `https://devhunt.org/tools/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'DevHunt', item: 'https://devhunt.org/' },
          { '@type': 'ListItem', position: 2, name: `${name} tools`, item: url },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Best ${name} tools`,
        url,
        itemListElement: top
          .slice(0, 10)
          .map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://devhunt.org/tool/${t.slug}`, name: t.name })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };
}
