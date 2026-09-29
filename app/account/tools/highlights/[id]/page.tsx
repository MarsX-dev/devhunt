'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { Award, Check, Copy, MessageSquareQuote, Newspaper, Sparkles } from 'lucide-react';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import SectionLabel from '@/components/ui/SectionLabel';
import PageHeader from '@/components/ui/PageHeader';
import { ListPageSkeleton } from '@/components/ui/Skeletons/PageSkeletons';
import CodeBlock from '@/components/CodeBlock';
import { bannerPreviewDoc, bannerScript } from '@/components/ui/ModalBannerCode/bannerScript';

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
  launch_start: string | null;
  launch_end: string | null;
  moderation: 'ok' | 'not_a_fit' | 'blocked' | null;
}

const SECTIONS = [
  { kind: 'award', title: 'Awards & launches', hint: 'Wins on other launchpads', icon: Award },
  { kind: 'review', title: 'What people say', hint: 'Quotes from reviews and posts', icon: MessageSquareQuote },
  { kind: 'mention', title: 'Around the web', hint: 'Articles, videos, discussions', icon: Newspaper },
  { kind: 'highlight', title: 'Highlights', hint: 'From your website', icon: Sparkles },
] as const;

const STEPS = ['Searching the web for your tool…', 'Checking which results are really about it…', 'Picking out awards, reviews and mentions…'];

// Owner review of what we found about their tool on the web. Nothing is public until approved.
// Right after paying (?paid=1) this is the "enrich" step: everything found is selected, one button
// publishes it, then we show what to do on launch day and the launch banner.
export default function ToolHighlights({ params: { id } }: { params: { id: string } }) {
  const { session } = useSupabase();
  const paidFlow = useSearchParams()?.get('paid') === '1';
  const [tool, setTool] = useState<Tool | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const known = useRef(new Set<number>());
  const [state, setState] = useState<'loading' | 'ready' | 'searching' | 'saving' | 'error'>('loading');
  const [view, setView] = useState<'review' | 'done'>('review');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);

  const loadItems = useCallback(async () => {
    const { data } = await createBrowserClient()
      .from('tool_enrichments' as never)
      .select('id, kind, title, body, url, source, status')
      .eq('product_id', Number(id))
      .order('id', { ascending: true });
    const list = (data ?? []) as Item[];
    setItems(list);
    // Newly found items start selected; choices already made stay as they are.
    const fresh = list.filter(item => !known.current.has(item.id));
    fresh.forEach(item => known.current.add(item.id));
    setSelected(prev => {
      const next = new Set(prev);
      fresh.filter(item => item.status !== 'hidden').forEach(item => next.add(item.id));
      return next;
    });
    return list;
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
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Something went wrong, please try again.');
    } finally {
      clearInterval(timer);
      setState('ready');
    }
  }, [id, loadItems]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const { data } = await createBrowserClient()
        .from('products')
        .select('id, name, slug, isPaid, owner_id, enriched_at, launch_start, launch_end, moderation')
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

  const toggle = (itemId: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  const finish = () => {
    setView('done');
    try {
      localStorage.removeItem('last-tool'); // the banner code is on the next screen; no need for the popup
    } catch {}
    window.scrollTo({ top: 0 });
  };

  // Selected items go on the page, the rest are hidden.
  const enrich = async () => {
    if (!items.length) return finish();
    setState('saving');
    setMessage('');
    const show = items.filter(i => selected.has(i.id)).map(i => i.id);
    const hide = items.filter(i => !selected.has(i.id)).map(i => i.id);
    const client = createBrowserClient();
    const update = (ids: number[], status: Status) =>
      ids.length ? client.from('tool_enrichments' as never).update({ status } as never).in('id', ids) : Promise.resolve({ error: null });
    const results = await Promise.all([update(show, 'approved'), update(hide, 'hidden')]);
    setState('ready');
    if (results.some(r => r.error)) return setMessage('Could not save, please try again.');
    setItems(current => current.map(item => ({ ...item, status: selected.has(item.id) ? 'approved' : 'hidden' })));
    if (paidFlow) finish();
    else setMessage(`Saved: ${show.length} shown on your page.`);
  };

  if (state === 'error') return <p className="container-custom-screen mt-20 text-slate-400">Tool not found.</p>;
  if (!tool) return <ListPageSkeleton />;
  if (view === 'done') return <LaunchGuide tool={tool} shown={items.filter(i => i.status === 'approved').length} />;

  const launchDate = tool.launch_start ? moment.utc(tool.launch_start).format('MMMM D') : null;
  const busy = state === 'searching' || state === 'saving';

  return (
    <section className="container-custom-screen mt-10 mb-40">
      {paidFlow ? (
        <PageHeader eyebrow="Launch activated ✓" title={`One more step: make ${tool.name}'s page shine`}>
          {launchDate ? `${tool.name} launches on ${launchDate}. ` : ''}We searched the web for its awards on other launchpads, reviews and mentions, and
          selected everything we found. Untick anything you don&apos;t want, then enrich your page.
        </PageHeader>
      ) : (
        <PageHeader eyebrow="Rich launch page" title={`Make ${tool.name}'s page shine`}>
          We searched the web for {tool.name}&apos;s awards on other launchpads, reviews and mentions. Pick what to show on your DevHunt page;
          nothing is public until you approve it.{' '}
          <Link href={`/tool/${tool.slug}`} className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50">
            View your page
          </Link>
        </PageHeader>
      )}

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
              disabled={busy}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 duration-150 hover:border-slate-500 hover:text-slate-50 disabled:opacity-50"
            >
              {state === 'searching' ? 'Searching…' : items.length ? 'Search again' : 'Search the web'}
            </button>
            {items.length > 0 && (
              <button
                onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
                className="text-sm text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200"
              >
                {selected.size === items.length ? 'Unselect all' : 'Select all'}
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
                  {list.map(item => {
                    const on = selected.has(item.id);
                    return (
                      <li key={item.id}>
                        <label className={`flex cursor-pointer items-start gap-x-3 py-3.5 duration-150 ${on ? '' : 'opacity-50'}`}>
                          <input type="checkbox" checked={on} onChange={() => toggle(item.id)} className="peer sr-only" />
                          <span
                            aria-hidden
                            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 ${
                              on ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-600'
                            }`}
                          >
                            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                          <Icon className="mt-0.5 h-4 w-4 flex-none text-slate-500" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-slate-100">{section.kind === 'review' ? `“${item.title}”` : item.title}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {[item.body, item.source].filter(Boolean).join(' · ')}
                              {item.url && (
                                <>
                                  {' · '}
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="nofollow noopener"
                                    onClick={e => e.stopPropagation()}
                                    className="underline decoration-slate-700 underline-offset-2 hover:text-slate-300"
                                  >
                                    source
                                  </a>
                                </>
                              )}
                              {item.status === 'approved' && <span className="ml-2 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-300">on your page</span>}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {state === 'ready' && items.length === 0 && (
            <p className="mt-10 text-sm text-slate-500">Nothing found yet. New tools often have little on the web; try again after your launch.</p>
          )}

          {/* Floating action bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
            <div className="container-custom-screen flex items-center gap-x-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm text-slate-400">
                {state === 'searching'
                  ? 'Searching the web…'
                  : items.length
                    ? `${selected.size} of ${items.length} selected`
                    : 'Nothing to add yet'}
              </p>
              {paidFlow && (
                <button onClick={finish} disabled={busy} className="text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50">
                  Skip
                </button>
              )}
              <button
                onClick={() => void enrich()}
                disabled={busy || (!paidFlow && !items.length)}
                className="flex-none rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 duration-150 hover:bg-orange-400 disabled:opacity-50"
              >
                {state === 'saving' ? 'Saving…' : items.length ? `✨ Enrich my page${selected.size ? ` (${selected.size})` : ''}` : 'Continue'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-3 pr-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-200">{url}</span>
      <button
        onClick={() =>
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
        }
        className="flex flex-none items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// After the enrich step of a paid launch: what to do on launch day, and the launch banner.
function LaunchGuide({ tool, shown }: { tool: Tool; shown: number }) {
  const url = `https://devhunt.org/tool/${tool.slug}`;
  const start = tool.launch_start ? moment.utc(tool.launch_start) : null;
  const end = tool.launch_end ? moment.utc(tool.launch_end) : null;
  const competes = tool.moderation !== 'not_a_fit';
  const steps = [
    {
      title: 'Before launch day',
      body: `Tell your users, followers and team the date${start ? ` (${start.format('dddd, MMMM D')})` : ''}, and add the launch banner below to your website so visitors find your launch.`,
    },
    {
      title: `On launch day${start ? `, ${start.format('MMMM D')} at 00:00 UTC` : ''}`,
      body: 'Share your DevHunt link everywhere you are active: X, LinkedIn, Reddit, Discord and Slack communities, your newsletter. Ask people to check it out, upvote and leave a comment.',
    },
    {
      title: 'During the week',
      body: `Be around to answer questions and feedback in the comments, and keep sharing: voting stays open${end ? ` until ${end.format('dddd, MMMM D')}, 23:59 UTC` : ' all week'}.`,
    },
    {
      title: 'Win the week',
      body: 'The top 3 tools of the week get a winner badge for their website and a spot in our winners newsletter.',
    },
  ];

  return (
    <section className="container-custom-screen mt-10 mb-24">
      <p className="inline-flex items-center gap-x-1.5 text-sm font-medium text-green-400">
        <Check className="h-4 w-4" strokeWidth={3} /> {shown ? `${shown} ${shown === 1 ? 'item' : 'items'} added to your page` : 'All set'}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
        {start ? `${tool.name} launches on ${start.format('MMMM D')}` : `${tool.name} is all set`}
      </h1>
      <p className="mt-2 text-slate-400">Here&apos;s how to get the most out of it.</p>

      {competes && (
        <ol className="mt-10 space-y-6">
          {steps.map((s, idx) => (
            <li key={s.title} className="flex gap-x-4">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-orange-500/60 font-mono text-xs text-orange-400">{idx + 1}</span>
              <div>
                <p className="font-medium text-slate-100">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12">
        <SectionLabel title="Your launch link" hint="Share this one" />
        <CopyLink url={url} />
      </div>

      {competes && (
        <div className="mt-12">
          <SectionLabel title="Launch banner" hint="For your website" />
          <p className="mt-2 text-sm text-slate-400">
            Paste this between the <code className="text-slate-200">{'<head>'}</code> tags of your website. It shows a small &quot;We are live on
            DevHunt&quot; bar linking to your launch page.
          </p>
          <iframe title="Banner preview" srcDoc={bannerPreviewDoc(tool.slug)} className="mt-4 h-14 w-full rounded-xl border-none bg-transparent" />
          <div className="mt-2">
            <CodeBlock>{bannerScript(tool.slug)}</CodeBlock>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href={`/tool/${tool.slug}`} className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white">
          View your launch page
        </Link>
        <Link href="/account/tools" className="rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100">
          Go to dashboard
        </Link>
      </div>
    </section>
  );
}
