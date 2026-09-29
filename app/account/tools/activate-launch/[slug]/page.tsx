'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { trackStep } from '@/utils/funnelClient';
import moment from 'moment';
import Link from 'next/link';
import { Check, Home, Link2, Mail, Trophy, Twitter } from 'lucide-react';
import { IconLoading } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { OFFER_FREE_LAUNCH, weekKey } from '@/utils/launchWeeks';
import mergeTW from '@/utils/mergeTW';
import { prefetchRoute } from '@/utils/prefetch';

type Tool = {
  id: number;
  name: string;
  owner_id: string;
  isPaid: boolean;
  launch_start: string;
  paid_launch_date: { startDate: string } | null;
  moderation: 'ok' | 'not_a_fit' | 'blocked';
};
type Week = { startDate: Date; endDate: Date };

const PAID_WEEKS = 4;

// Numbers behind the paid launch pitch, from the database on 2026-09-29 (avg impressions of tools
// launched in the last 12 months; top 3 = weekly top-3 finishers). Refresh them now and then.
const DOMAIN_RATING = 65;
const PERKS = {
  users: '40,000+',
  xFollowers: '3,600+',
  paidImpressions: '3,000',
  freeImpressions: '700',
  winnerImpressions: '11,000+',
  daytonaImpressions: '216,000',
};
const PERK_LIST = [
  {
    icon: Home,
    stat: `~${PERKS.paidImpressions} impressions`,
    title: 'from a week on the home page',
    body: `Paid launches average ${PERKS.paidImpressions} impressions, 4x more than free listings (${PERKS.freeImpressions}), because they're featured where every visitor lands.`,
  },
  {
    icon: Mail,
    stat: PERKS.users,
    title: 'developer inboxes',
    body: 'Your launch goes out in the DevHunt newsletter to every registered developer, on your launch day.',
  },
  {
    icon: Twitter,
    stat: PERKS.xFollowers,
    title: 'followers on X',
    body: 'We post your launch on @devhunt_ to a following of founders, devs and investors.',
  },
  {
    icon: Link2,
    stat: `DR ${DOMAIN_RATING}`,
    title: 'dofollow backlink, for good',
    body: 'Helps you rank in Google and get cited by ChatGPT, Perplexity and other AI answers. Free listings get nofollow, which passes nothing.',
  },
  {
    icon: Trophy,
    stat: PERKS.winnerImpressions,
    title: 'impressions if you win',
    body: `Weekly top-3 tools average ${PERKS.winnerImpressions} impressions and keep the winner badge. Daytona won its week and has ${PERKS.daytonaImpressions} so far.`,
  },
];

// Next step after submitting a tool (and the "Skip the queue" page): keep the free launch date, or
// pay $49 to launch in one of the next 4 weeks. The launch is only marked as paid by the server
// after Stripe confirms the payment.
export default function ActivateLaunch({ params: { slug } }: { params: { slug: string } }) {
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
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    const browserClient = createBrowserClient();
    const { data } = await browserClient
      .from('products')
      .select('id, name, owner_id, isPaid, launch_start, paid_launch_date, moderation')
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

  const pay = async () => {
    if (!tool) return;
    setStatus('redirecting');
    try {
      const { data } = await axios.post('/api/checkout', { productId: tool.id, week: week || undefined });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not start the payment, please try again.');
      setStatus('ready');
    }
  };

  const keepFreePath = isNew ? `/tool/${slug}?banner=true` : '/account/tools';
  useEffect(() => prefetchRoute(router, keepFreePath), [keepFreePath]); // eslint-disable-line react-hooks/exhaustive-deps
  const keepFree = () => {
    if (tool) trackStep('free_chosen', { free_date: tool.launch_start }, tool.id);
    router.push(keepFreePath);
  };

  const freeDate = OFFER_FREE_LAUNCH && tool && new Date(tool.launch_start) > new Date() ? moment.utc(tool.launch_start) : null;
  const paidDate = week ? moment.utc(week).format('MMM D') : null;

  if (heldReason) {
    return (
      <section className="px-4">
        <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-800 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Held for review</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">We&apos;re taking a closer look</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {heldReason === 'fake' ? (
              <>Your submission doesn&apos;t look like a genuine listing (for example a product you don&apos;t own, or a website that doesn&apos;t match).</>
            ) : (
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

      {(status === 'ready' || status === 'redirecting') && tool && tool.moderation === 'not_a_fit' && (
        <div className="mx-auto mt-4 max-w-lg space-y-6 py-12">
          <div>
            {isNew && (
              <p className="inline-flex items-center gap-x-1.5 text-sm font-medium text-green-400">
                <Check className="h-4 w-4" strokeWidth={3} /> {tool.name} is submitted
              </p>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Not quite a dev tool</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              DevHunt&apos;s weekly launches are for developer tools, so {tool.name} won&apos;t compete this time. You can still get a
              permanent listing in our <b className="text-slate-200">Other</b> category with a dofollow backlink from DevHunt (DR 65).
            </p>
          </div>
          {canceled && <p className="text-sm text-orange-300">The payment was canceled. You can try again whenever you&apos;re ready.</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="rounded-2xl border border-orange-500/60 bg-slate-800/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-50">Listing + dofollow backlink</h2>
              <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-sm font-semibold text-white">$49</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
              <li>✓ A dofollow backlink from DevHunt, domain rating 65 (Ahrefs)</li>
              <li>✓ Listed in the Other category and the all-tools directory</li>
              <li>✓ One-time payment, no subscription</li>
            </ul>
            <button
              onClick={() => void pay()}
              disabled={status === 'redirecting'}
              className="mt-5 w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
            >
              {status === 'redirecting' ? 'Opening secure checkout...' : 'Get listed for $49'}
            </button>
            <p className="mt-2 text-xs text-slate-500">Payments are processed securely by Stripe.</p>
          </div>
          <Link href="/account/tools" className="block text-center text-sm text-slate-500 hover:text-slate-300">
            Not now
          </Link>
        </div>
      )}

      {(status === 'ready' || status === 'redirecting') && tool && tool.moderation !== 'not_a_fit' && (
        <div className="mx-auto max-w-5xl py-10 md:py-14">
          <div className="max-w-2xl">
            <p className="truncate font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Launch plan · {tool.name}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              Put it in front of {PERKS.users} developers
            </h1>
            <p className="mt-3 text-slate-400">
              A paid launch is a full week of promotion across everything DevHunt has, plus a backlink that keeps working after the week is over.
            </p>
          </div>
          {canceled && <p className="mt-6 text-sm text-orange-300">The payment was canceled. You can try again whenever you&apos;re ready.</p>}
          {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

          <div className="mt-10 grid gap-10 md:grid-cols-[1fr_360px] md:gap-12">
            <ul className="space-y-6">
              {PERK_LIST.map(({ icon: Icon, stat, title, body }) => (
                <li key={title} className="flex gap-x-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-orange-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-slate-100">
                      <span className="font-semibold text-slate-50">{stat}</span> {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="md:sticky md:top-24 md:self-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-slate-300">Pick your launch week</p>
                  <p className="text-slate-50">
                    <span className="text-2xl font-semibold">$49</span> <span className="text-sm text-slate-500">one-time</span>
                  </p>
                </div>
                <fieldset className="mt-4 grid grid-cols-2 gap-2" aria-label="Launch week">
                  {weeks.map((w, idx) => {
                    const key = weekKey(w.startDate);
                    const selected = key === week;
                    return (
                      <label
                        key={key}
                        className={mergeTW(
                          'cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors',
                          selected ? 'border-orange-500 bg-orange-500/10 text-slate-50 ring-1 ring-orange-500' : 'border-slate-800 text-slate-300 hover:border-slate-600',
                        )}
                      >
                        <input
                          type="radio"
                          name="week"
                          value={key}
                          checked={selected}
                          onChange={() => {
                            setWeek(key);
                            if (tool) trackStep('week_picked', { week: key }, tool.id);
                          }}
                          className="sr-only"
                        />
                        <span className="block font-medium">{moment.utc(w.startDate).format('MMM D')}</span>
                        <span className={mergeTW('block text-xs', selected ? 'text-orange-300' : 'text-slate-500')}>
                          {idx === 0 ? 'Next week' : `In ${idx + 1} weeks`}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
                <button
                  onClick={() => void pay()}
                  disabled={!week || status === 'redirecting'}
                  className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
                >
                  {status === 'redirecting' ? 'Opening secure checkout...' : `Launch on ${paidDate ?? 'your week'} for $49`}
                </button>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                  {['Home page for the whole week', `Newsletter to ${PERKS.users} developers`, `Post on X to ${PERKS.xFollowers} followers`, `Dofollow backlink, DR ${DOMAIN_RATING}`].map(
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
                {freeDate ? (
                  <button
                    onClick={keepFree}
                    disabled={status === 'redirecting'}
                    className="text-sm text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline disabled:opacity-50"
                  >
                    Launch for free on {freeDate.format('LL')}
                  </button>
                ) : (
                  <Link href="/account/tools" className="text-sm text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
                    Not now
                  </Link>
                )}
                <p className="mt-1 text-xs text-slate-600">Free listings get a nofollow link and no newsletter or X post.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
