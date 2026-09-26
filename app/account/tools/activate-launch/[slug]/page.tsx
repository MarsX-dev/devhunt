'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { IconLoading } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { weekKey } from '@/utils/launchWeeks';
import mergeTW from '@/utils/mergeTW';

type Tool = { id: number; name: string; owner_id: string; isPaid: boolean; launch_start: string; paid_launch_date: { startDate: string } | null };
type Week = { startDate: Date; endDate: Date };

const PAID_WEEKS = 4;

// Next step after submitting a tool (and the "Skip the queue" page): keep the free launch date, or
// pay $49 to launch in one of the next 4 weeks. The launch is only marked as paid by the server
// after Stripe confirms the payment.
export default function ActivateLaunch({ params: { slug } }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;
  const canceled = searchParams?.get('canceled') ?? null;
  const isNew = !!searchParams?.get('new');
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
      .select('id, name, owner_id, isPaid, launch_start, paid_launch_date')
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
  }, [slug, session, sessionId]);

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

  const keepFree = () => router.push(isNew ? `/tool/${slug}?banner=true` : '/account/tools');

  const freeDate = tool && new Date(tool.launch_start) > new Date() ? moment.utc(tool.launch_start) : null;
  const paidDate = week ? moment.utc(week).format('MMM D') : null;

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

      {status === 'activated' && tool && (
        <div className="text-center max-w-sm mx-auto py-24 mt-8">
          <div className="mb-4 inline-block rounded-full p-3 bg-gradient-to-br from-green-400 to-green-600">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Launch activated!</h2>
          <p className="mb-8 text-slate-300">
            {tool.name} launches on <b className="text-slate-100">{moment.utc(tool.launch_start).format('LL')}</b>.
          </p>
          <Link
            href="/account/tools"
            className="w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      )}

      {(status === 'ready' || status === 'redirecting') && tool && (
        <div className="max-w-3xl mx-auto py-12 mt-4 space-y-8">
          <div>
            {isNew && (
              <p className="inline-flex items-center gap-x-1.5 text-sm text-green-400 font-medium">
                <Check className="w-4 h-4" strokeWidth={3} /> {tool.name} is submitted
              </p>
            )}
            <h1 className="mt-2 text-2xl font-semibold text-slate-50">Pick your launch date</h1>
            <p className="mt-2 text-slate-400">
              Every launch gets a home page spotlight, a spot in our morning newsletter and a dofollow backlink (DR 57).
            </p>
          </div>
          {canceled && <p className="text-sm text-orange-300">The payment was canceled. You can try again whenever you're ready.</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {freeDate && (
              <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-800/30 p-5">
                <div className="flex items-center justify-between gap-x-2">
                  <h2 className="text-lg font-semibold text-slate-50">Free launch</h2>
                  <span className="flex-none rounded-full bg-slate-700 px-2.5 py-0.5 text-sm font-semibold text-slate-200">Free</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">Wait for the next free spot in the queue (15 free tools per week).</p>
                <div className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm">
                  <span className="block font-medium text-slate-200">{freeDate.format('LL')}</span>
                  <span className="block text-xs text-slate-400">{freeDate.fromNow()}</span>
                </div>
                <div className="mt-auto pt-5">
                  <button
                    onClick={keepFree}
                    disabled={status === 'redirecting'}
                    className="w-full rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-400 hover:text-slate-100 disabled:opacity-50 duration-150"
                  >
                    Launch for free on {freeDate.format('LL')}
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col rounded-xl border border-orange-500/70 bg-slate-800/60 p-5">
              <div className="flex items-center justify-between gap-x-2">
                <h2 className="text-lg font-semibold text-slate-50">Launch in the next 4 weeks</h2>
                <span className="flex-none rounded-full bg-orange-500 px-2.5 py-0.5 text-sm font-semibold text-white">$49</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Skip the queue and choose your week.</p>
              <fieldset className="mt-4 grid grid-cols-2 gap-2" aria-label="Launch week">
                {weeks.map((w, idx) => {
                  const key = weekKey(w.startDate);
                  const selected = key === week;
                  return (
                    <label
                      key={key}
                      className={mergeTW(
                        'cursor-pointer rounded-lg border px-3 py-2 text-sm',
                        selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500',
                      )}
                    >
                      <input type="radio" name="week" value={key} checked={selected} onChange={() => setWeek(key)} className="sr-only" />
                      <span className="block font-medium">{moment.utc(w.startDate).format('MMM D')}</span>
                      <span className={mergeTW('block text-xs', selected ? 'text-orange-100' : 'text-slate-400')}>{idx === 0 ? 'Next week' : `In ${idx + 1} weeks`}</span>
                    </label>
                  );
                })}
              </fieldset>
              <button
                onClick={() => void pay()}
                disabled={!week || status === 'redirecting'}
                className="mt-5 w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {status === 'redirecting' ? 'Opening secure checkout...' : `Pay $49${paidDate ? ` and launch on ${paidDate}` : ''}`}
              </button>
              <p className="mt-2 text-xs text-slate-500">Payments are processed securely by Stripe.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
