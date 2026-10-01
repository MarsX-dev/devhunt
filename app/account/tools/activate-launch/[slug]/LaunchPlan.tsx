'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { trackStep } from '@/utils/funnelClient';
import moment from 'moment';
import Link from 'next/link';
import { ArrowUp, Check, Home, Link2, Mail, Trophy, Twitter } from 'lucide-react';
import { IconLoading } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { OFFER_FREE_LAUNCH, weekKey } from '@/utils/launchWeeks';
import { prefetchRoute } from '@/utils/prefetch';
import { LAUNCH_TIERS, launchPrice, type LaunchTier } from '@/utils/launchTiers';
import { type StatsSummary } from '@/utils/publicStats';
import { type LaunchShowcase, type ShowcaseTool } from '@/utils/launchShowcase';

interface Tool {
  id: number;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  owner_id: string;
  isPaid: boolean;
  launch_start: string;
  paid_launch_date: { startDate: string } | null;
  moderation: 'ok' | 'not_a_fit' | 'blocked';
}
interface Week { startDate: Date; endDate: Date }

const PAID_WEEKS = 4;
const fmtNum = (n: number) => Math.round(n).toLocaleString('en-US');
// Rounded for ranges: 5,137 -> 5K, 1,035 -> 1K, 22,979 -> 23K.
const approx = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : fmtNum(Math.round(n / 100) * 100));
// How far off a free queue date is, in words ("about 3 years"): a date years away reads like a typo.
function queueWait(launchStart: string) {
  const months = moment.utc(launchStart).diff(moment.utc(), 'months');
  if (months < 12) return `about ${Math.max(months, 1)} month${months > 1 ? 's' : ''}`;
  const years = Math.round(months / 12);
  return `about ${years} year${years > 1 ? 's' : ''}`;
}
const short = (n: number) => (n >= 100_000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : fmtNum(n));

// Fallback numbers for the pitch when the live showcase is unavailable (from the database on
// 2026-09-29: middle half of paid launches of the last 12 months and of weekly top-3 finishers).
const DOMAIN_RATING = 65;
const PERKS = {
  users: '40,000+',
  xFollowers: '3,600+',
  paidLow: 1000,
  paidHigh: 2800,
  winnerLow: 5100,
  winnerHigh: 23100,
};
// A few @devhunt_ launch posts to show as examples (x.com/devhunt_/status/... links). Empty: only the profile link shows.
const X_POSTS: string[] = [];

function Examples({ tools, label }: { tools: ShowcaseTool[]; label: string }) {
  if (!tools.length) return null;
  return (
    <div className="mt-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {tools.map(t => (
          <li key={t.slug}>
            <a
              href={`/tool/${t.slug}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-x-2.5 rounded-lg border border-slate-800 px-2.5 py-2 duration-150 hover:border-slate-600"
            >
              <img src={(t.logo_url || '').replace(/w=\d+/g, 'w=64')} alt="" className="h-7 w-7 flex-none rounded-md bg-slate-800 object-cover" loading="lazy" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{t.name}</span>
              <span className="flex-none font-mono text-xs text-orange-300">{short(t.views)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A mock of the launch-week newsletter with the maker's own tool in the list and the others blurred.
function EmailPreview({ tool }: { tool: { name: string; slogan: string | null; logo_url: string | null } }) {
  const [open, setOpen] = useState(false);
  const blurred = (idx: number) => (
    <div key={idx} className="flex items-center gap-x-3 px-4 py-3">
      <span className="h-10 w-10 flex-none rounded-lg bg-slate-600/60 blur-[2px]" />
      <div className="flex-1 space-y-1.5 blur-[3px]">
        <span className="block h-3 rounded bg-slate-400/60" style={{ width: `${40 + ((idx * 17) % 30)}%` }} />
        <span className="block h-2.5 rounded bg-slate-600/60" style={{ width: `${65 + ((idx * 11) % 25)}%` }} />
      </div>
    </div>
  );
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(v => !v)} className="text-sm text-orange-400 hover:text-orange-300" aria-expanded={open}>
        {open ? 'Hide the email ↑' : 'See your tool in the email ↓'}
      </button>
      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-800 bg-[#11172c]">
          <div className="border-b border-slate-700/60 px-4 py-2.5 text-xs text-slate-400">
            <span className="font-medium text-slate-200">DevHunt</span> · 🏆 Who will be tool of the week?
          </div>
          <div className="px-4 pt-4 text-center">
            <p className="font-semibold text-slate-50">
              DevHunt<span className="text-orange-500">_</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">This week&apos;s launches</p>
          </div>
          <div className="mt-2 divide-y divide-slate-700/40">
            {blurred(1)}
            <div className="flex items-center gap-x-3 bg-orange-500/[0.08] px-4 py-3 ring-1 ring-inset ring-orange-500/50">
              {tool.logo_url ? (
                <img src={tool.logo_url.replace(/w=\d+/g, 'w=80')} alt="" className="h-10 w-10 flex-none rounded-lg bg-slate-800 object-cover" />
              ) : (
                <span className="h-10 w-10 flex-none rounded-lg bg-orange-500/30" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-50">{tool.name}</p>
                {tool.slogan && <p className="truncate text-sm text-slate-400">{tool.slogan}</p>}
              </div>
              <span className="flex-none rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-semibold text-white">You</span>
            </div>
            {blurred(2)}
            {blurred(3)}
            {blurred(4)}
          </div>
        </div>
      )}
    </div>
  );
}

interface Perk {
  icon: typeof Home;
  stat: string;
  title: string;
  body: string;
  extra?: ReactNode;
}

// What a paid launch gets. Dev tools compete for the weekly top 3 (listed first); "other" tools don't
// compete and are listed on the home page for free, so their pitch is the newsletter, X and the link.
function buildPerks({ showcase, users, other, tool }: { showcase: LaunchShowcase | null; users: string; other: boolean; tool: Tool }): Perk[] {
  const audience = other ? 'users' : 'startup builders and developers'; // non-dev makers want users, not developers
  const paid = showcase?.paid ?? { low: PERKS.paidLow, high: PERKS.paidHigh, best: [] };
  const winners = showcase?.winners ?? { low: PERKS.winnerLow, high: PERKS.winnerHigh, best: [] };
  const newsletter: Perk = {
    icon: Mail,
    stat: users,
    title: 'inboxes',
    body: `Your launch goes out in the DevHunt newsletter to all ${users} registered ${audience} at the start of your launch week.`,
    extra: <EmailPreview tool={tool} />,
  };
  const x: Perk = {
    icon: Twitter,
    stat: PERKS.xFollowers,
    title: 'followers on X',
    body: 'We post your launch on @devhunt_ to a following of founders, devs and investors.',
    extra: (
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {X_POSTS.map((url, idx) => (
          <a key={url} href={url} target="_blank" rel="noopener" className="text-orange-400 hover:text-orange-300">
            Example post {idx + 1} ↗
          </a>
        ))}
        <a href="https://x.com/devhunt_" target="_blank" rel="noopener" className="text-orange-400 hover:text-orange-300">
          See @devhunt_ on X ↗
        </a>
      </p>
    ),
  };
  const boost: Perk = {
    icon: ArrowUp,
    stat: 'Boosted',
    title: 'to the top of the list',
    body: other
      ? 'Boosted tools are listed first in "Also launching this week", on the home page and in the newsletter, ahead of basic and free listings.'
      : `Lists are ranked by votes, and on equal votes boosted tools come first, then basic launches, then free ones. Every tool starts its week with one vote, from its maker, so a boosted launch opens the week at the top of the home page, and leads the email that announces the week's launches to ${users} ${audience}.`,
  };
  const backlink: Perk = {
    icon: Link2,
    stat: `DR ${DOMAIN_RATING}`,
    title: 'dofollow backlink, for good',
    body: `A dofollow link from a DR ${DOMAIN_RATING} site usually costs $150+ on its own. It helps you rank in Google and get cited by ChatGPT, Perplexity and other AI answers. Free listings get nofollow, which passes nothing.`,
  };
  if (other) return [boost, newsletter, x, backlink];
  return [
    {
      icon: Trophy,
      stat: `${approx(winners.low)}–${approx(winners.best[0]?.views ?? 216000)} impressions`,
      title: 'if you finish top 3',
      body: "Top-3 tools stay on the home page under Past winners for a year, and the #1 of the week stays there for good, so the impressions keep coming long after launch week. Here's where the best ones are now:",
      extra: <Examples tools={winners.best} label="Top-3 tools, impressions so far" />,
    },
    boost,
    {
      icon: Home,
      stat: `${approx(paid.low)}–${approx(paid.high)} impressions`,
      title: 'from a week on the home page',
      body: 'The typical range for a paid launch, featured where every visitor lands. The best recent ones went far beyond:',
      extra: <Examples tools={paid.best} label="Best paid launches, last 12 months" />,
    },
    newsletter,
    x,
    backlink,
  ];
}

// Next step after submitting a tool (and the "Skip the queue" page): pay $49 for a boosted launch or
// $19 for a basic one in one of the next 4 weeks, or do nothing and keep the free queue date. The launch is only marked as paid by the server
// after Stripe confirms the payment.
export default function LaunchPlan({
  params: { slug },
  stats,
  showcase,
  regionalCountry,
}: {
  params: { slug: string };
  stats: StatsSummary | null;
  showcase: LaunchShowcase | null;
  regionalCountry: string | null; // set when the visitor gets the regional price
}) {
  const regional = !!regionalCountry;
  const boostPrice = launchPrice('boost', regional);
  const basicPrice = launchPrice('basic', regional);
  const countryName = regionalCountry ? countryDisplayName(regionalCountry) : null;
  // Live registered-developer count (they all get the newsletter); the hard-coded figure if stats are down.
  const users = stats ? fmtNum(stats.users) : PERKS.users;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;
  const canceled = searchParams?.get('canceled') ?? null;
  const isNew = !!searchParams?.get('new');
  const heldReason = searchParams?.get('held') ?? null; // set when the submission was blocked for review
  const { session } = useSupabase();

  const [tool, setTool] = useState<Tool | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [week, setWeek] = useState<string>(searchParams?.get('week') ?? '');
  const [status, setStatus] = useState<'loading' | 'ready' | 'redirecting' | 'confirming' | 'activated' | 'error'>('loading');
  const [paying, setPaying] = useState<LaunchTier>('boost');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    const browserClient = createBrowserClient();
    const { data } = await browserClient
      .from('products')
      .select('id, name, slogan, logo_url, owner_id, isPaid, launch_start, paid_launch_date, moderation')
      .eq('slug', slug)
      .eq('deleted', false)
      .single();
    const product = data as Tool | null;
    if (!product || (session && product.owner_id !== session.user.id)) {
      setError('Tool not found.');
      setStatus('error');
      return;
    }
    setTool(product);

    if (sessionId) {
      setStatus('confirming');
      try {
        const { data: result } = await axios.get(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`);
        if (result.status === 'activated' || result.status === 'already-activated') {
          setTool({ ...product, isPaid: true, launch_start: result.launchStart });
          setStatus('activated');
          router.replace(`/account/tools/highlights/${product.id}?paid=1`);
          return;
        }
        setError('We could not confirm the payment yet. If you completed it, refresh this page in a minute.');
      } catch {
        setError('We could not confirm the payment. If you were charged, contact us and we will sort it out.');
      }
      setStatus('error');
      return;
    }

    if (product.isPaid) {
      setStatus('activated');
      router.replace(`/account/tools/highlights/${product.id}?paid=1`);
      return;
    }

    const productsService = new ProductsService(browserClient);
    const now = new Date();
    const currentWeek = await productsService.getWeekNumber(now, 2);
    const upcoming = await productsService.getProductsCountByWeek(currentWeek + 1, currentWeek + PAID_WEEKS, now.getFullYear());
    setWeeks(upcoming);
    const keys = upcoming.map(w => weekKey(w.startDate));
    setWeek(current => {
      if (keys.includes(current)) return current;
      const saved = product.paid_launch_date ? weekKey(product.paid_launch_date.startDate) : '';
      return keys.includes(saved) ? saved : keys[0] ?? '';
    });
    setStatus('ready');
    trackStep(
      'launch_view',
      {
        moderation: (product as any).moderation ?? 'ok',
        is_new: isNew,
        free_date: product.launch_start ?? undefined,
        weeks_open: upcoming.length,
        free_offered: OFFER_FREE_LAUNCH,
        from: searchParams?.get('from') ?? searchParams?.get('utm_campaign') ?? undefined,
      },
      product.id,
    );
    if (canceled) trackStep('checkout_canceled', {}, product.id);
  }, [slug, session, sessionId, isNew, canceled, router]);

  useEffect(() => {
    if (session) void load();
    else {
      setError('Please sign in to continue.');
      setStatus('error');
    }
  }, [session, load]);

  const pay = async (tier: LaunchTier) => {
    if (!tool) return;
    setPaying(tier);
    setStatus('redirecting');
    try {
      const { data } = await axios.post('/api/checkout', { productId: tool.id, week: week || undefined, tier });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not start the payment, please try again.');
      setStatus('ready');
    }
  };

  const keepFreePath = isNew ? `/tool/${slug}?banner=true` : '/account/tools';
  useEffect(() => { prefetchRoute(router, keepFreePath); }, [keepFreePath]); // eslint-disable-line react-hooks/exhaustive-deps
  const keepFree = () => {
    if (tool) trackStep('free_chosen', { free_date: tool.launch_start }, tool.id);
    router.push(keepFreePath);
  };

  // "Other" tools (not for developers) don't compete: they launch free in their own queue, and pay for reach.
  const other = tool?.moderation === 'not_a_fit';
  const freeDate = (OFFER_FREE_LAUNCH || other) && tool && new Date(tool.launch_start) > new Date() ? moment.utc(tool.launch_start) : null;
  const queued = !!tool && new Date(tool.launch_start) > new Date();
  const perks = tool ? buildPerks({ showcase, users, other, tool }) : [];
  const audience = other ? 'users' : 'startup builders and developers';
  const paidDate = week ? moment.utc(week).format('MMM D') : null;

  if (heldReason) {
    return (
      <section className="px-4">
        <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-800 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Held for review</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">We&apos;re taking a closer look</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {heldReason === 'fake'
              ? (
              <>Your submission doesn&apos;t look like a genuine listing (for example a product you don&apos;t own, or a website that doesn&apos;t match).</>
                )
              : (
              <>
                Your submission looks like it may be about <b className="text-slate-200">{heldReason}</b>, which DevHunt doesn&apos;t list
                (crypto trading, gambling, adult content or anything deceptive).
              </>
                )} It&apos;s hidden for now and our team has been notified. If
            we got it wrong, we&apos;ll unblock it after review - no need to resubmit.
          </p>
          <Link href="/account/tools" className="mt-6 inline-block rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500">
            Go to dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      {status === 'error' && (
        <div className="py-12 mt-8 text-center">
          <div className="mb-4 inline-block rounded-full p-3 bg-gradient-to-br from-red-400 to-red-600">
            <span className="h-12 w-12 inline-flex items-center justify-center text-white text-xl">!</span>
          </div>
          <h2 className="mb-3 text-xl font-bold text-white">Something went wrong</h2>
          <p className="mb-8 text-slate-300">{error}</p>
          <button
            onClick={() => void load()}
            className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {(status === 'loading' || status === 'confirming') && (
        <div className="py-24 mt-8 text-center">
          <IconLoading className="mx-auto text-orange-500 w-8 h-8" />
          <h1 className="text-xl text-white mt-6">{status === 'confirming' ? 'Confirming your payment...' : 'Checking your tool...'}</h1>
        </div>
      )}

      {/* Paid: we go straight on to the enrich step (highlights page); this shows for a moment meanwhile. */}
      {status === 'activated' && tool && (
        <div className="text-center max-w-sm mx-auto py-24 mt-8">
          <div className="mb-4 inline-block rounded-full p-3 bg-gradient-to-br from-green-400 to-green-600">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Launch activated!</h2>
          <p className="text-slate-300">
            {tool.name} launches on <b className="text-slate-100">{moment.utc(tool.launch_start).format('LL')}</b>.
          </p>
          <p className="mt-6 inline-flex items-center gap-x-2 text-sm text-slate-400">
            <IconLoading className="h-4 w-4 text-orange-500" /> One more step…
          </p>
        </div>
      )}

      {(status === 'ready' || status === 'redirecting') && tool && (
        <div className="mx-auto max-w-5xl py-10 md:py-14">
          <div className="max-w-2xl">
            <p className="truncate font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Launch plan · {tool.name}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              Put it in front of {users} {audience}
            </h1>
            <p className="mt-3 text-slate-400">
              {other && freeDate
                ? `${tool.name} gets a free line in "Also launching this week" on the home page on ${freeDate.format('MMM D')}. Upgrade to reach every user's inbox and our X followers, with a backlink that keeps working after the week is over.`
                : 'A paid launch is a full week of promotion across everything DevHunt has, plus a backlink that keeps working after the week is over.'}
            </p>
          </div>
          {canceled && <p className="mt-6 text-sm text-orange-300">The payment was canceled. You can try again whenever you&apos;re ready.</p>}
          {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

          <div className="mt-10 grid gap-10 md:grid-cols-[1fr_360px] md:gap-12">
            <ul className="min-w-0 space-y-6">
              {perks.map(({ icon: Icon, stat, title, body, extra }) => (
                <li key={title} className="flex gap-x-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-orange-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-100">
                      <span className="font-semibold text-slate-50">{stat}</span> {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
                    {extra}
                  </div>
                </li>
              ))}
              {stats && (
                <li className="pt-2">
                  <div className="flex items-baseline justify-between gap-x-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">DevHunt, last 30 days</p>
                    <a href="/stats" target="_blank" rel="noopener" className="text-xs text-orange-400 hover:text-orange-300">
                      Full stats ↗
                    </a>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
                    {[
                      { label: 'tool_impressions', value: short(stats.toolImpressions30d) },
                      { label: 'visitors', value: short(stats.visitors30d) },
                      { label: 'new_developers', value: `+${fmtNum(stats.signups30d)}` },
                      { label: 'tools_launched', value: fmtNum(stats.tools30d) },
                    ].map(t => (
                      <div key={t.label} className="bg-slate-900 px-3 py-2.5">
                        <dt className="text-[11px] text-slate-500">{t.label}</dt>
                        <dd className="mt-0.5 text-lg font-semibold text-slate-50">{t.value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              )}
            </ul>

            <div className="md:sticky md:top-24 md:self-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-slate-300">Boosted launch</p>
                  <p className="text-slate-50">
                    {regional && <s className="mr-1.5 text-base text-slate-500">${LAUNCH_TIERS.boost.price}</s>}
                    <span className="text-2xl font-semibold">${boostPrice}</span> <span className="text-sm text-slate-500">one-time</span>
                  </p>
                </div>
                {regional && <p className="mt-1 text-right text-xs font-medium text-emerald-400">Regional price for {countryName}</p>}
                <p className="mt-3 text-xs font-medium text-slate-400">Pick your launch week</p>
                <fieldset className="mt-3 divide-y divide-slate-800/70" aria-label="Launch week">
                  {weeks.map((w, idx) => {
                    const key = weekKey(w.startDate);
                    const selected = key === week;
                    return (
                      <label key={key} className="flex cursor-pointer items-center gap-x-3 py-2 text-sm">
                        <input
                          type="radio"
                          name="week"
                          value={key}
                          checked={selected}
                          onChange={() => {
                            setWeek(key);
                            if (tool) trackStep('week_picked', { week: key }, tool.id);
                          }}
                          className="h-4 w-4 flex-none accent-orange-500"
                        />
                        <span className={selected ? 'font-medium text-slate-50' : 'text-slate-300'}>{moment.utc(w.startDate).format('MMM D')}</span>
                        <span className="ml-auto text-xs text-slate-500">{idx === 0 ? 'next week' : `in ${idx + 1} weeks`}</span>
                      </label>
                    );
                  })}
                </fieldset>
                <button
                  onClick={() => void pay('boost')}
                  disabled={!week || status === 'redirecting'}
                  className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
                >
                  {status === 'redirecting' && paying === 'boost' ? 'Opening secure checkout...' : `Launch on ${paidDate ?? 'your week'} for $${boostPrice}`}
                </button>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                  {[
                    other ? 'Listed first, above basic and free listings' : 'On top on equal votes, on the site and in the email',
                    other ? 'A launch week you pick' : 'Home page for the whole week',
                    `Newsletter to ${users} ${audience}`,
                    `Dedicated post on X to ${PERKS.xFollowers} followers`,
                    `Dofollow backlink, DR ${DOMAIN_RATING}`,
                  ].map(
                    item => (
                      <li key={item} className="flex items-center gap-x-2">
                        <Check className="h-3.5 w-3.5 flex-none text-orange-400" strokeWidth={3} /> {item}
                      </li>
                    ),
                  )}
                </ul>
                <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Secure payment by Stripe. No subscription.</p>
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => void pay('basic')}
                  disabled={!week || status === 'redirecting'}
                  className="text-sm text-slate-300 underline underline-offset-4 decoration-slate-600 hover:text-slate-100 hover:decoration-slate-400 disabled:opacity-50"
                >
                  {status === 'redirecting' && paying === 'basic'
                    ? 'Opening secure checkout...'
                    : (
                    <>
                      List without a boost for {regional && <s className="text-slate-500">${LAUNCH_TIERS.basic.price}</s>} ${basicPrice}
                    </>
                      )}
                </button>
                <p className="mt-1 text-xs text-slate-500">Same week, newsletter and dofollow link. No boost, no dedicated post on X.</p>
                {freeDate && other
                  ? (
                  <button onClick={keepFree} disabled={status === 'redirecting'} className="mt-6 text-xs text-slate-600 hover:text-slate-400 disabled:opacity-50">
                    Or keep the free listing on {freeDate.format('LL')}: one line on the home page, a nofollow link.
                  </button>
                    )
                  : (
                  <p className="mt-6 text-xs text-slate-600">
                    {queued ? `Free tools wait in the queue, ${queueWait(tool.launch_start)} right now, with a nofollow link.` : 'Free listings get a nofollow link.'}{' '}
                    <button onClick={keepFree} disabled={status === 'redirecting'} className="underline underline-offset-2 hover:text-slate-400 disabled:opacity-50">
                      {queued ? 'Keep my free spot' : 'Not now'}
                    </button>
                  </p>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// "India" for IN; the code itself if the runtime has no country names.
function countryDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
