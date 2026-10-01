'use client';

import { useState } from 'react';

// "Suggest a free alternative" on /free-alternatives. Needs a signed-in account (the API answers 401 otherwise).
export default function SuggestForm({ defaultPaid = '' }: { defaultPaid?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const input = 'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-600 focus:outline-none';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setState('sending');
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/free-alternatives/suggest', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
    if (res.ok) return setState('done');
    const { error: message } = await res.json().catch(() => ({ error: 'Something went wrong' }));
    setError(res.status === 401 ? 'Please sign in first, then send it again.' : message);
    setState('idle');
  }

  if (state === 'done') return <p className="text-sm text-emerald-400">Thanks! We review every suggestion by hand.</p>;
  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <input name="paid_tool" required maxLength={80} defaultValue={defaultPaid} placeholder="Paid tool (e.g. Jira)" className={input} />
      <input name="alternative" required maxLength={80} placeholder="Free alternative (e.g. Plane)" className={input} />
      <input name="url" type="url" maxLength={300} placeholder="Link to it (optional)" className={`${input} sm:col-span-2`} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Suggest'}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
