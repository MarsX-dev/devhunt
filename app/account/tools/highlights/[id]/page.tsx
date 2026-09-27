'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Award, Check, EyeOff, MessageSquareQuote, Newspaper, Sparkles } from 'lucide-react';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import SectionLabel from '@/components/ui/SectionLabel';
import PageHeader from '@/components/ui/PageHeader';

type Status = 'pending' | 'approved' | 'hidden';
interface Item {
  id: number;
  kind: 'award' | 'review' | 'mention' | 'highlight';
  title: string;
  body: string | null;
  url: string | null;
  source: string | null;
  status: Status;
}
interface Tool {
  id: number;
  name: string;
  slug: string;
  isPaid: boolean;
  owner_id: string;
  enriched_at: string | null;
}

const SECTIONS = [
  { kind: 'award', title: 'Awards & launches', hint: 'Wins on other launchpads', icon: Award },
  { kind: 'review', title: 'What people say', hint: 'Quotes from reviews and posts', icon: MessageSquareQuote },
  { kind: 'mention', title: 'Around the web', hint: 'Articles, videos, discussions', icon: Newspaper },
  { kind: 'highlight', title: 'Highlights', hint: 'From your website', icon: Sparkles },
] as const;

const STEPS = ['Searching the web for your tool…', 'Checking which results are really about it…', 'Picking out awards, reviews and mentions…'];

// Owner review of what we found about their tool on the web. Nothing is public until approved.
export default function ToolHighlights({ params: { id } }: { params: { id: string } }) {
  const { session } = useSupabase();
  const [tool, setTool] = useState<Tool | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'searching' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);

  const loadItems = useCallback(async () => {
    const { data } = await createBrowserClient()
      .from('tool_enrichments' as never)
      .select('id, kind, title, body, url, source, status')
      .eq('product_id', Number(id))
      .order('id', { ascending: true });
    setItems((data ?? []) as Item[]);
    return (data ?? []) as Item[];
  }, [id]);

  const search = useCallback(async () => {
    setState('searching');
    setMessage('');
    setStep(0);
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 5000);
    try {
      const { data } = await axios.post(`/api/tools/${id}/enrich`);
      await loadItems();
      setMessage(data.found ? `Found ${data.found} new ${data.found === 1 ? 'item' : 'items'}.` : 'Nothing new this time.');
      setState('ready');
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Something went wrong, please try again.');
      setState('ready');
    } finally {
      clearInterval(timer);
    }
  }, [id, loadItems]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const { data } = await createBrowserClient()
        .from('products')
        .select('id, name, slug, isPaid, owner_id, enriched_at')
        .eq('id', Number(id))
        .maybeSingle();
      const product = data as Tool | null;
      if (!product || product.owner_id !== session.user.id) {
        setState('error');
        return;
      }
      setTool(product);
      const found = await loadItems();
      // First visit of a paid tool: start the search right away.
      if (product.isPaid && !product.enriched_at && found.length === 0) void search();
      else setState('ready');
    })();
  }, [session, id, loadItems, search]);

  const setStatus = async (ids: number[], status: Status) => {
    setItems(current => current.map(item => (ids.includes(item.id) ? { ...item, status } : item)));
    await createBrowserClient()
      .from('tool_enrichments' as never)
      .update({ status } as never)
      .in('id', ids);
  };

  if (state === 'error') return <p className="container-custom-screen mt-20 text-slate-400">Tool not found.</p>;
  if (!tool) return null;

  const pending = items.filter(i => i.status === 'pending');

  return (
    <section className="container-custom-screen mt-10 mb-32">
      <PageHeader eyebrow="Rich launch page" title={`Make ${tool.name}'s page shine`}>
        We searched the web for {tool.name}&apos;s awards on other launchpads, reviews and mentions. Pick what to show on your DevHunt page;
        nothing is public until you approve it.{' '}
        <Link href={`/tool/${tool.slug}`} className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50">
          View your page
        </Link>
      </PageHeader>

      {!tool.isPaid ? (
        <div className="mt-10 rounded-2xl border border-orange-500/30 bg-orange-500/[0.04] p-5">
          <p className="font-medium text-slate-100">Rich launch pages come with paid launches</p>
          <p className="mt-1 text-sm text-slate-400">Pick a launch week and we&apos;ll add your awards, reviews and press to your page.</p>
          <Link href={`/account/tools/activate-launch/${tool.slug}`} className="mt-4 inline-block rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">
            Launch for $49
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void search()}
              disabled={state === 'searching'}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 duration-150 hover:border-slate-500 hover:text-slate-50 disabled:opacity-50"
            >
              {state === 'searching' ? 'Searching…' : items.length ? 'Search again' : 'Search the web'}
            </button>
            {pending.length > 0 && (
              <button
                onClick={() => void setStatus(pending.map(i => i.id), 'approved')}
                className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
              >
                Show all {pending.length} new
              </button>
            )}
            {message && <span className="text-sm text-slate-400">{message}</span>}
          </div>

          {state === 'searching' && (
            <div className="mt-8 flex items-center gap-x-3 rounded-2xl border border-slate-800 p-5 text-sm text-slate-300" aria-live="polite">
              <span className="h-2 w-2 flex-none rounded-full bg-orange-500 motion-safe:animate-ping" />
              {STEPS[step]}
            </div>
          )}

          {SECTIONS.map(section => {
            const list = items.filter(i => i.kind === section.kind);
            if (!list.length) return null;
            const Icon = section.icon;
            return (
              <div key={section.kind} className="mt-12">
                <SectionLabel title={section.title} hint={section.hint} />
                <ul className="mt-2 divide-y divide-slate-800/70">
                  {list.map(item => (
                    <li key={item.id} className={`flex items-start gap-x-3 py-3.5 ${item.status === 'hidden' ? 'opacity-50' : ''}`}>
                      <Icon className="mt-0.5 h-4 w-4 flex-none text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-100">{section.kind === 'review' ? `“${item.title}”` : item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[item.body, item.source].filter(Boolean).join(' · ')}
                          {item.url && (
                            <>
                              {' · '}
                              <a href={item.url} target="_blank" rel="nofollow noopener" className="underline decoration-slate-700 underline-offset-2 hover:text-slate-300">
                                source
                              </a>
                            </>
                          )}
                          {item.status === 'pending' && <span className="ml-2 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-300">new</span>}
                        </p>
                      </div>
                      <div className="flex flex-none items-center gap-1">
                        <button
                          onClick={() => void setStatus([item.id], 'approved')}
                          aria-pressed={item.status === 'approved'}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs duration-150 ${
                            item.status === 'approved' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-slate-700 text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" /> Show
                        </button>
                        <button
                          onClick={() => void setStatus([item.id], 'hidden')}
                          aria-pressed={item.status === 'hidden'}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs duration-150 ${
                            item.status === 'hidden' ? 'border-slate-500 bg-slate-800 text-slate-200' : 'border-slate-700 text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          <EyeOff className="h-3.5 w-3.5" /> Hide
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {state === 'ready' && items.length === 0 && (
            <p className="mt-10 text-sm text-slate-500">Nothing found yet. New tools often have little on the web; try again after your launch.</p>
          )}
        </>
      )}
    </section>
  );
}
