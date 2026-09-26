'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { IconLoading } from '@/components/Icons';
import SelectLaunchDate from '@/components/ui/SelectLaunchDate';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import { weekKey } from '@/utils/launchWeeks';

type Tool = { id: number; name: string; owner_id: string; isPaid: boolean; launch_start: string; paid_launch_date: { startDate: string } | null };

// Paid launch checkout: pick a week, pay with Stripe, and come back here to see the launch confirmed.
// The launch is only marked as paid by the server after Stripe confirms the payment.
export default function ActivateLaunch({ params: { slug } }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;
  const canceled = searchParams?.get('canceled') ?? null;
  const { session } = useSupabase();

  const [tool, setTool] = useState<Tool | null>(null);
  const [week, setWeek] = useState<string>(searchParams?.get('week') ?? '');
  const [status, setStatus] = useState<'loading' | 'ready' | 'redirecting' | 'confirming' | 'activated' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    const { data } = await createBrowserClient()
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
    if (!week && product.paid_launch_date) setWeek(weekKey(product.paid_launch_date.startDate));
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

  const launchDate = week ? moment.utc(week).format('LL') : null;

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
        <div className="max-w-lg mx-auto py-16 mt-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Launch {tool.name} for $49</h1>
            <p className="mt-2 text-slate-400">Skip the free queue and launch in the week you choose.</p>
          </div>
          {canceled && <p className="text-sm text-orange-300">The payment was canceled. You can try again whenever you're ready.</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <SelectLaunchDate
            label="Launch week"
            className="w-full"
            value={week}
            onChange={e => setWeek((e.target as HTMLSelectElement).value)}
          />
          <button
            onClick={() => void pay()}
            disabled={!week || status === 'redirecting'}
            className="w-full rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {status === 'redirecting' ? 'Opening secure checkout...' : `Pay $49${launchDate ? ` and launch on ${launchDate}` : ''}`}
          </button>
          <p className="text-xs text-slate-500">Payments are processed securely by Stripe.</p>
        </div>
      )}
    </section>
  );
}
