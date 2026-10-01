import { type Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { categoryPath } from '@/utils/sitemap';
import report from '@/utils/reports/stateOfDevTools2026.json';

// State of Dev Tools 2026 (seo-plan.md A7): a snapshot of DevHunt's own submission data, built to be cited
// by people and AI answers. Numbers live in utils/reports/stateOfDevTools2026.json (computed once, as of
// report.asOf), so the page never queries the database and the figures stay stable for citations.

const URL_PATH = `/reports/${report.slug}`;
const URL_FULL = `https://devhunt.org${URL_PATH}`;
const TITLE = 'State of Dev Tools 2026: What 9,400 Launches Say About Developer Tools';
const DESCRIPTION =
  'Original data from 9,409 developer tools submitted to DevHunt since 2024: AI agents rose from 1% to 9.8% of launches, MCP from 0 to 5.4%, boilerplates fell to 0.9%.';

type Year = '2024' | '2025' | '2026';
const share = (category: string, year: Year) => report.categoryShare.find(c => c.category === category)?.[year] ?? 0;
const total = report.submissionsByYear.reduce((n, y) => n + y.submitted, 0);
const byYear = Object.fromEntries(report.submissionsByYear.map(y => [y.year, y]));
const fmt = (n: number) => n.toLocaleString('en-US');
const growth = (category: string) => share(category, '2026') / Math.max(share(category, '2024'), 0.1);

// Key findings, each computed from the data above.
const findings = [
  `AI agents went from ${share('AI Agents', '2024')}% of new dev tools in 2024 to ${share(
    'AI Agents',
    '2026',
  )}% in 2026, about ${Math.round(growth('AI Agents'))}x.`,
  `None of the tools launched on DevHunt in 2024 were MCP (Model Context Protocol) tools; in 2026 they are ${share(
    'MCP',
    '2026',
  )}% of all new launches.`,
  `AI coding tools (assistants, coding agents, AI code review) grew from ${share('AI Coding', '2024')}% to ${share(
    'AI Coding',
    '2026',
  )}% of launches.`,
  `"AI" overall stayed at about a quarter of launches (${share('AI', '2024')}% → ${share(
    'AI',
    '2026',
  )}%), while agents, MCP and AI coding tools grew several times over.`,
  `Boilerplates fell from ${share('Boilerplate', '2024')}% to ${share('Boilerplate', '2026')}% of launches, and UI libraries from ${share(
    'UI Library',
    '2024',
  )}% to ${share('UI Library', '2026')}%.`,
  `CLI tools more than doubled (${share('CLI', '2024')}% → ${share('CLI', '2026')}%) and security tools nearly doubled (${share(
    'Security',
    '2024',
  )}% → ${share('Security', '2026')}%).`,
  `${byYear[2026].free}% of 2026 launches are free, ${byYear[2026].subscription}% subscriptions and ${byYear[2026].oneTime}% one-time purchases.`,
  `${byYear[2026].github}% of 2026 launches link a GitHub repository, up from ${byYear[2025].github}% in 2025.`,
  `The median #1 tool of the week had ${report.winnerVotes[2].median} upvotes in 2026 (${report.winnerVotes[0].median} in 2024).`,
];

const OG_IMAGE = { url: `https://devhunt.org/api/og/page/${report.slug}`, width: 1200, height: 630, alt: TITLE };

export const metadata: Metadata = {
  title: `${TITLE} | DevHunt`,
  description: DESCRIPTION,
  metadataBase: new URL('https://devhunt.org'),
  alternates: { canonical: URL_PATH },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: URL_FULL, images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

const Bar = ({ value, max, accent = false }: { value: number; max: number; accent?: boolean }) => (
  <span className="block h-2 rounded-full bg-slate-800" aria-hidden>
    <span
      className={`block h-2 rounded-full ${accent ? 'bg-orange-500' : 'bg-slate-500'}`}
      style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
    />
  </span>
);

export default function StateOfDevTools2026() {
  const maxShare = Math.max(...report.categoryShare.map(c => Math.max(c['2024'], c['2025'], c['2026'])));
  const maxQuarter = Math.max(...report.submissionsByQuarter.map(q => q.submitted));
  const risers = new Set(['AI Agents', 'MCP', 'AI Coding', 'CLI', 'Security']);
  const citation = `DevHunt, "${report.title}", ${new Date(report.asOf).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })}, ${URL_FULL}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Report',
        headline: TITLE,
        description: DESCRIPTION,
        url: URL_FULL,
        datePublished: report.asOf,
        dateModified: report.asOf,
        author: { '@type': 'Organization', name: 'DevHunt', url: 'https://devhunt.org' },
        publisher: { '@type': 'Organization', name: 'DevHunt', url: 'https://devhunt.org' },
      },
      {
        '@type': 'Dataset',
        name: `${report.title} dataset`,
        description: `${report.coverage}: submissions per year and quarter, category share, pricing, GitHub links and the votes behind weekly winners.`,
        url: URL_FULL,
        creator: { '@type': 'Organization', name: 'DevHunt', url: 'https://devhunt.org' },
        temporalCoverage: '2024-01-01/2026-09-30',
        variableMeasured: [
          'tools submitted',
          'category share of submissions',
          'pricing model share',
          'share linking a GitHub repository',
          'upvotes of weekly #1 tools',
        ],
        isAccessibleForFree: true,
      },
    ],
  };

  return (
    <article className="max-w-3xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <PageHeader eyebrow={`Report · data as of ${report.asOf}`} title={report.title}>
        What {fmt(total)} developer tools submitted to DevHunt since January 2024 say about where dev tools are going. All numbers come from
        DevHunt&apos;s own launch data.
      </PageHeader>

      <div className="mt-10">
        <SectionLabel title="Key findings" />
        <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-slate-300">
          {findings.map(f => (
            <li key={f} className="flex gap-x-3">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-orange-500" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <SectionLabel title="Share of new launches by category" hint="% of tools submitted that year" />
        <p className="mt-2 text-sm text-slate-400">A tool can be in several categories. 2026 covers January to September.</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 font-normal">Category</th>
              <th className="py-2 font-normal">2024</th>
              <th className="py-2 font-normal">2025</th>
              <th className="py-2 font-normal">2026</th>
              <th className="hidden w-1/3 py-2 font-normal sm:table-cell">
                <span className="sr-only">2026 bar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-slate-300">
            {report.categoryShare.map(c => (
              <tr key={c.category}>
                <td className="py-2">
                  <Link href={categoryPath(c.category)} className="hover:text-white">
                    {c.category}
                  </Link>
                </td>
                <td className="py-2 tabular-nums text-slate-400">{c['2024']}%</td>
                <td className="py-2 tabular-nums text-slate-400">{c['2025']}%</td>
                <td className={`py-2 tabular-nums ${risers.has(c.category) ? 'text-orange-400' : ''}`}>{c['2026']}%</td>
                <td className="hidden py-2 pl-3 sm:table-cell">
                  <Bar value={c['2026']} max={maxShare} accent={risers.has(c.category)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <SectionLabel title="Tools submitted per quarter" />
        <table className="mt-4 w-full text-sm">
          <tbody className="divide-y divide-slate-800/70 text-slate-300">
            {report.submissionsByQuarter.map(q => (
              <tr key={q.quarter}>
                <td className="w-24 py-2 font-mono text-xs text-slate-400">{q.quarter}</td>
                <td className="w-20 py-2 tabular-nums">{fmt(q.submitted)}</td>
                <td className="py-2 pl-3">
                  <Bar value={q.submitted} max={maxQuarter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <SectionLabel title="Pricing and open source" hint="% of tools submitted" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[340px] text-sm">
            <thead>
              <tr className="text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 font-normal">Year</th>
                <th className="py-2 font-normal">Submitted</th>
                <th className="py-2 font-normal">Free</th>
                <th className="py-2 font-normal">Subscription</th>
                <th className="py-2 font-normal">One-time</th>
                <th className="py-2 font-normal">Links GitHub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums text-slate-300">
              {report.submissionsByYear.map(y => (
                <tr key={y.year}>
                  <td className="py-2">
                    {y.year}
                    {'partial' in y && y.partial ? '*' : ''}
                  </td>
                  <td className="py-2">{fmt(y.submitted)}</td>
                  <td className="py-2">{y.free}%</td>
                  <td className="py-2">{y.subscription}%</td>
                  <td className="py-2">{y.oneTime}%</td>
                  <td className="py-2">{y.github}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">* January to September 2026.</p>
      </div>

      <div className="mt-12">
        <SectionLabel title="Upvotes behind the weekly #1" />
        <p className="mt-2 text-sm text-slate-400">How many upvotes the tool that won its launch week had. Useful to plan a launch.</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 font-normal">Year</th>
              <th className="py-2 font-normal">Weeks</th>
              <th className="py-2 font-normal">Median</th>
              <th className="py-2 font-normal">Lowest</th>
              <th className="py-2 font-normal">Highest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 tabular-nums text-slate-300">
            {report.winnerVotes.map(w => (
              <tr key={w.year}>
                <td className="py-2">
                  {w.year}
                  {'partial' in w && w.partial ? '*' : ''}
                </td>
                <td className="py-2">{w.weeks}</td>
                <td className="py-2">{w.median}</td>
                <td className="py-2">{w.min}</td>
                <td className="py-2">{w.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 text-sm leading-relaxed text-slate-400">
        <SectionLabel title="Methodology" />
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Source: every tool submitted to DevHunt from January 1, 2024 to September 30, 2026 ({fmt(total)} tools), counted by submission
            date. Removed and moderation-blocked tools are excluded.
          </li>
          <li>
            Categories come from makers and DevHunt&apos;s classifier. Newer categories (AI Agents, MCP, AI Coding) were back-filled onto
            older tools, so their earlier years are counted the same way.
          </li>
          <li>
            Pricing is the model the maker picked: free, subscription or one-time. &quot;Links GitHub&quot; means the listing includes a
            repository URL.
          </li>
          <li>Weekly winners are the most upvoted tool of each launch week; votes need a GitHub or Google sign-in.</li>
          <li>DevHunt skews toward indie makers and developer tools, so this describes launches on DevHunt, not the whole market.</li>
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
        <p className="font-medium text-slate-200">Cite this report</p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">{citation}</p>
        <p className="mt-3 text-slate-400">
          Free to quote with a link. Explore the live numbers on{' '}
          <Link href="/stats" className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white">
            DevHunt stats
          </Link>{' '}
          and the{' '}
          <Link href="/best" className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:text-white">
            best tools of each month
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
