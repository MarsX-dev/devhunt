'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import mergeTW from '@/utils/mergeTW';

export const SUBSCRIBED_KEY = 'newsletterSubscribed';

export const isSubscribed = () => {
  try {
    return localStorage.getItem(SUBSCRIBED_KEY) === '1';
  } catch {
    return false;
  }
};

// Email + Subscribe in one row (header inbox and footer).
export default function NewsletterForm({ source, className = '', onDone }: { source: string; className?: string; onDone?: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (isSubscribed()) setState('done');
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state !== 'idle') return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email');
    setError('');
    setState('loading');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalEMail: email.trim(), source }),
    }).catch(() => null);
    if (!res?.ok) {
      setState('idle');
      return setError('Something went wrong, please try again');
    }
    try {
      localStorage.setItem(SUBSCRIBED_KEY, '1');
      localStorage.setItem('isNewsletterActive', 'false');
    } catch {}
    setState('done');
    onDone?.();
  };

  if (state === 'done')
    return (
      <p className={mergeTW('flex items-center gap-x-2 text-sm text-emerald-400', className)}>
        <Check className="h-4 w-4" /> You're in. See you next Tuesday.
      </p>
    );

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className="flex rounded-lg border border-slate-700/80 bg-slate-950/40 p-1 focus-within:border-slate-500">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email"
          className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
        <button
          disabled={state === 'loading'}
          className="flex-none rounded-md bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 duration-150 hover:bg-white disabled:opacity-60"
        >
          {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </form>
  );
}
