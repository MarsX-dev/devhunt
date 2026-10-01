import { type Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import report from '@/utils/reports/stateOfDevTools2026.json';

// "Product Hunt alternatives" for developer tools (seo-plan.md A7/B1). Google's AI Overview for this query already
// names DevHunt, through other sites' lists; this is our own, honest version. Every fact about another platform
// was checked on its own site on CHECKED; re-check before editing. DevHunt is ours, and the page says so.

const CHECKED = '2026-10-01';
const PATH = '/product-hunt-alternatives';
const TITLE = 'Product Hunt Alternatives for Developer Tools (2026)';
const DESCRIPTION =
  'Where to launch a developer tool besides Product Hunt: DevHunt, Show HN, Peerlist, Uneed, Microlaunch, BetaList and Fazier compared by launch cycle, cost and audience.';

interface Platform {
  name: string;
  url: string;
  cycle: string;
  cost: string;
  audience: string;
  bestFor: string;
  ours?: boolean;
}

const PLATFORMS: Platform[] = [
  {
    name: 'DevHunt',
    url: 'https://devhunt.org',
    cycle: 'Weekly launches, voted by developers',
    cost: 'Free (launch week from the queue); $19 to pick your week, $49 boosted',
    audience: 'Developers; developer tools only compete',
    bestFor: 'Developer tools, APIs, CLIs, open source, AI coding and MCP tools',
    ours: true,
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com',
    cycle: 'Daily launches; Product of the Day',
    cost: 'Free',
    audience: 'General tech and startup audience',
    bestFor: 'Consumer and broad B2B products with a big launch-day push',
  },
  {
    name: 'Hacker News (Show HN)',
    url: 'https://news.ycombinator.com/showhn.html',
    cycle: 'Post any time; ranked by votes and time',
    cost: 'Free',
    audience: 'Engineers and technical founders',
    bestFor: 'Things people can try right away, ideally without a signup. Blog posts, landing pages and lists are off-topic.',
  },
  {
    name: 'Peerlist Launchpad',
    url: 'https://peerlist.io/launchpad',
    cycle: 'Weekly; launches open Mondays (UTC), limited spots',
    cost: 'See site',
    audience: 'Developers and designers on Peerlist',
    bestFor: 'Early users and feedback from builders; top 3 get a profile badge and the newsletter',
  },
  {
    name: 'Uneed',
    url: 'https://www.uneed.best',
    cycle: 'Daily launches',
    cost: 'Free waiting line (date up to 5 months out); $14.99 fast-track; $29.99 to pick your date',
    audience: 'Indie makers and founders',
    bestFor: 'Indie products; free launches need enough upvotes to stay published',
  },
  {
    name: 'Microlaunch',
    url: 'https://microlaunch.net',
    cycle: 'Monthly leaderboard',
    cost: 'Free launch; paid Pro launches',
    audience: 'Makers and founders',
    bestFor: 'A longer window of visibility than a single launch day',
  },
  {
    name: 'BetaList',
    url: 'https://betalist.com',
    cycle: 'Featured after review; timing depends on the plan',
    cost: 'Paid only (refund if not selected)',
    audience: 'Early adopters looking for new startups',
    bestFor: 'Pre-launch and recently launched startups with their own domain',
  },
  {
    name: 'Fazier',
    url: 'https://fazier.com',
    cycle: 'Daily launches',
    cost: 'Free to submit; advertising available',
    audience: 'People looking for new software and AI tools',
    bestFor: 'AI tools and SaaS',
  },
];

const winnerMedian = report.winnerVotes.find(w => w.year === 2026)?.median;

const FAQ = [
  {
    q: 'What is the best Product Hunt alternative for developer tools?',
    a: 'For a developer tool, launch where developers vote: DevHunt (developer tools only, weekly) and Hacker News Show HN (free, very technical audience). Peerlist Launchpad is a good weekly option for builders. Many makers launch on several of these in the same month.',
  },
  {
    q: 'Is DevHunt free?',
    a: 'Yes. Listing is free and free tools get a launch week from the queue. A $19 paid launch lets you pick the week and adds the weekly newsletter; $49 is boosted. DevHunt is the site you are reading, built by the same team.',
  },
  {
    q: 'How many upvotes does it take to win a week on DevHunt?',
    a: `In 2026 the median #1 tool of the week had ${winnerMedian} upvotes (State of Dev Tools 2026 report).`,
  },
  {
    q: 'Should I still launch on Product Hunt?',
    a: 'If your product suits a broad audience and you can rally support on launch day, yes. Product Hunt is free and has the largest general audience. Developer-focused launchpads are a better fit for tools only developers use.',
  },
  {
    q: 'Can I launch on several platforms?',
    a: 'Yes. Most of these allow it. Spread the launches out so you can answer comments on each one, and follow each site’s rules (Show HN, for example, wants things people can try right away).',
  },
];

export const metadata: Metadata = {
  title: `${TITLE} | DevHunt`,
  description: DESCRIPTION,
  metadataBase: new URL('https://devhunt.org'),
  alternates: { canonical: PATH },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `https://devhunt.org${PATH}` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function ProductHuntAlternatives() {
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
        name: 'Product Hunt alternatives for developer tools',
        itemListElement: PLATFORMS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: p.url })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };

  return (
    <article className="max-w-4xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <PageHeader eyebrow="Launch guide" title="Product Hunt alternatives for developer tools">
        Product Hunt is free and huge, but a developer tool often does better where developers vote. Here is where to launch instead, or as
        well, compared by launch cycle, cost and audience.
      </PageHeader>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm leading-relaxed text-slate-400">
        <p>
          <span className="text-slate-200">Short answer:</span> for a developer tool, launch on{' '}
          <span className="text-slate-200">DevHunt</span> (developer tools only, weekly) and <span className="text-slate-200">Show HN</span>{' '}
          (free, technical audience), then add Peerlist, Uneed or Microlaunch for more reach. Use BetaList if you are pre-launch.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Disclosure: DevHunt is our site. Facts about other platforms were checked on their own websites on {CHECKED}; prices and rules
          change, so confirm before you launch.
        </p>
      </div>

      <div className="mt-10">
        <SectionLabel title="Compared" hint={`checked ${CHECKED}`} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-4 font-normal">Platform</th>
                <th className="py-2 pr-4 font-normal">Launch cycle</th>
                <th className="py-2 pr-4 font-normal">Cost</th>
                <th className="py-2 font-normal">Audience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 align-top text-slate-300">
              {PLATFORMS.map(p => (
                <tr key={p.name}>
                  <td className="py-3 pr-4 font-medium text-slate-100">
                    {p.ours
                      ? (
                      <Link href="/" className="hover:text-white">
                        {p.name}
                      </Link>
                        )
                      : (
                      <a href={p.url} rel="noopener nofollow" target="_blank" className="hover:text-white">
                        {p.name}
                      </a>
                        )}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{p.cycle}</td>
                  <td className="py-3 pr-4 text-slate-400">{p.cost}</td>
                  <td className="py-3 text-slate-400">{p.audience}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12">
        <SectionLabel title="Which one fits your tool" />
        <ul className="mt-3 divide-y divide-slate-800/70">
          {PLATFORMS.map(p => (
            <li key={p.name} className="py-3 text-sm leading-relaxed">
              <span className="font-medium text-slate-100">{p.name}</span>
              <span className="text-slate-400">: {p.bestFor}.</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 rounded-2xl border border-slate-800 p-5 text-sm leading-relaxed text-slate-400">
        <p className="font-medium text-slate-200">Launching a developer tool?</p>
        <p className="mt-2">
          Listing on DevHunt is free, and every tool gets its own page that often ranks for the tool&apos;s name. See what launched recently
          in the{' '}
          <Link href="/best" className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white">
            best tools of each month
          </Link>
          , the numbers in the{' '}
          <Link
            href="/reports/state-of-dev-tools-2026"
            className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white"
          >
            State of Dev Tools 2026
          </Link>{' '}
          report, and how launching works in the{' '}
          <Link href="/faq" className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white">
            FAQ
          </Link>
          .
        </p>
      </div>

      <div className="mt-12">
        <SectionLabel title="FAQ" />
        <div className="mt-2 divide-y divide-slate-800">
          {FAQ.map(f => (
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
    </article>
  );
}
