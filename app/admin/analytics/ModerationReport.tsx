import Link from 'next/link';
import moment from 'moment';
import SectionLabel from '@/components/ui/SectionLabel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

interface Entry {
  id: number;
  created_at: string;
  kind: string;
  action: string;
  reason: string | null;
  subject: string | null;
  url: string | null;
  score: number | null;
  details: Record<string, unknown>;
  email: string | null;
  slug: string | null;
}

const KIND: Record<string, string> = {
  tool_submission: 'tool',
  tool_edit: 'tool edit',
  comment: 'comment',
  comment_edit: 'comment edit',
  ad: 'ad',
  ad_edit: 'ad edit',
};
const ACTION: Record<string, { label: string; cls: string }> = {
  refused: { label: 'refused', cls: 'text-red-300' },
  blocked: { label: 'blocked', cls: 'text-red-300' },
  shadow: { label: 'shadow-blocked', cls: 'text-amber-300' },
  not_a_fit: { label: 'not a dev tool', cls: 'text-slate-400' },
};
const fmt = (n: number) => Number(n).toLocaleString('en-US');

// Moderation log (DevHunt team only): everything refused, blocked or downgraded, the same events that
// go to Discord. `days` = 1 means the last 24 hours.
export default async function ModerationReport({ days }: { days: number }) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await serviceClient.rpc('get_moderation_log' as never, { _since: since } as never);
  const log = data as unknown as { counts: { kind: string; action: string; n: number }[]; entries: Entry[] } | null;
  if (!log) return null;
  const range = days === 1 ? 'last 24 hours' : `last ${days} days`;

  return (
    <div className="mt-16">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Moderation</h2>
      <p className="mt-2 text-sm text-slate-500">Everything refused, blocked or kept out of the weekly launches ({range}). Each one was also sent to Discord.</p>
      {log.counts.length ? (
        <p className="mt-3 font-mono text-[11px] text-slate-400">
          {log.counts.map(c => `${KIND[c.kind] ?? c.kind} ${ACTION[c.action]?.label ?? c.action} ${fmt(c.n)}`).join(' · ')}
        </p>
      ) : null}
      <div className="mt-6">
        <SectionLabel title="Log" hint="newest first" />
        {log.entries.length ? (
          <ul className="mt-2 divide-y divide-slate-800/70 text-xs">
            {log.entries.map(e => {
              const content = typeof e.details?.content === 'string' ? e.details.content : null;
              const attempted = typeof e.details?.attempted === 'string' ? e.details.attempted : null;
              return (
                <li key={e.id} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[7rem_1fr_auto]">
                  <span className="font-mono text-slate-500" title={e.created_at}>
                    {moment(e.created_at).fromNow()}
                  </span>
                  <span className="min-w-0 text-slate-300">
                    {e.slug ? (
                      <Link href={`/tool/${e.slug}`} className="text-slate-100 underline decoration-slate-700 underline-offset-2">
                        {e.subject}
                      </Link>
                    ) : (
                      <span className="text-slate-100">{e.subject ?? '—'}</span>
                    )}
                    {e.url && <span className="text-slate-500"> · {e.url.replace(/^https?:\/\//, '').slice(0, 60)}</span>}
                    {e.email && <span className="block text-slate-500">{e.email}</span>}
                    {content && <span className="mt-0.5 block truncate text-slate-500">“{content}”</span>}
                    {attempted && <span className="mt-0.5 block truncate text-slate-500">→ {attempted}</span>}
                  </span>
                  <span className="font-mono text-slate-400 sm:text-right">
                    {KIND[e.kind] ?? e.kind} · <span className={ACTION[e.action]?.cls}>{ACTION[e.action]?.label ?? e.action}</span>
                    <span className="block text-slate-500">
                      {e.reason ?? ''}
                      {e.score != null ? ` · ${Number(e.score).toFixed(2)}` : ''}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Nothing in this period.</p>
        )}
      </div>
    </div>
  );
}
