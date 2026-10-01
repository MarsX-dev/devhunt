'use client';

import { useState } from 'react';

const REASON: Record<string, string> = {
  crypto: 'a crypto scam',
  gambling: 'gambling',
  adult: 'adult content',
  fraud: 'fraud',
  fake: 'a fake listing',
};

// Shown above a blocked tool's page in the admin view. Unblocking makes it public again (the public
// page catches up within a minute).
export default function BlockedBanner({ id, slug, reason }: { id: number; slug: string; reason: string | null }) {
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const unblock = async () => {
    if (!confirm('Unblock this tool? It becomes public again.')) return;
    setState('saving');
    const res = await fetch(`/api/admin/tools/${id}/unblock`, { method: 'POST' }).catch(() => null);
    setState(res?.ok ? 'done' : 'error');
  };

  return (
    <div className="container-custom-screen mb-8">
      <div className="flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {state === 'done' ? (
          <p className="text-sm text-emerald-300">
            Unblocked. The public page is back within a minute:{' '}
            <a href={`/tool/${slug}`} className="underline underline-offset-2">
              /tool/{slug}
            </a>
          </p>
        ) : (
          <>
            <div className="text-sm">
              <p className="font-medium text-red-200">This tool is blocked and hidden from everyone but you.</p>
              <p className="mt-0.5 text-red-200/70">
                Moderation flagged it as {reason ? (REASON[reason] ?? reason) : 'a banned topic'}. If that&apos;s a mistake, unblock it.
              </p>
              {state === 'error' && <p className="mt-1 text-red-300">Couldn&apos;t unblock it. Try again.</p>}
            </div>
            <button
              onClick={unblock}
              disabled={state === 'saving'}
              className="shrink-0 rounded-md bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 duration-150 hover:bg-slate-200 disabled:opacity-60"
            >
              {state === 'saving' ? 'Unblocking…' : 'Unblock'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
