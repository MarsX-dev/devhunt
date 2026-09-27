'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { type ProfileSection, type ToolProfileData } from '@/utils/toolProfile';

const input =
  'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none duration-150 placeholder:text-slate-600 focus:border-slate-500';

function Section({
  title,
  section,
  data,
  setData,
  children,
}: {
  title: string;
  section?: ProfileSection;
  data: ToolProfileData;
  setData: (d: ToolProfileData) => void;
  children: ReactNode;
}) {
  const shown = !section || !data.hidden?.includes(section);
  const toggle = () =>
    section && setData({ ...data, hidden: shown ? [...(data.hidden ?? []), section] : (data.hidden ?? []).filter(h => h !== section) });
  return (
    <div className="mt-10">
      <SectionLabel
        title={title}
        hint={
          section && (
            <label className="flex cursor-pointer items-center gap-x-2 text-xs text-slate-400">
              <input type="checkbox" checked={shown} onChange={toggle} className="accent-orange-500" /> show on my page
            </label>
          )
        }
      />
      <div className={`mt-4 space-y-3 ${shown ? '' : 'opacity-40'}`}>{children}</div>
    </div>
  );
}

const RemoveButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} aria-label={label} className="flex-none rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
    <X className="h-4 w-4" />
  </button>
);

// The tool's AI-written fact sheet (features, pricing, FAQ, alternatives): owners can reword it,
// remove items, hide sections or the whole thing, and rebuild it from their website.
export default function EditToolProfile({ params: { id } }: { params: { id: string } }) {
  const { session } = useSupabase();
  const [tool, setTool] = useState<{ id: number; name: string; slug?: string } | null>(null);
  const [data, setData] = useState<ToolProfileData | null>(null);
  const [visible, setVisible] = useState(true);
  const [altNames, setAltNames] = useState<Record<number, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'rebuilding' | 'missing' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data: res } = await axios.get(`/api/tools/${id}/profile`);
      const { data: product } = await createBrowserClient().from('products').select('slug').eq('id', Number(id)).maybeSingle();
      setTool({ ...res.tool, slug: product?.slug });
      if (!res.profile?.data) return setState('missing');
      setData(res.profile.data);
      setVisible(res.profile.status !== 'hidden');
      const ids = (res.profile.data as ToolProfileData).alternatives.map(a => a.id);
      if (ids.length) {
        const { data: alts } = await createBrowserClient().from('products').select('id, name').in('id', ids);
        setAltNames(Object.fromEntries((alts ?? []).map(a => [a.id, a.name])));
      }
      setState('ready');
    } catch (err: any) {
      setState('error');
      setMessage(err?.response?.data?.error ?? 'Could not load your tool.');
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session, id]);

  const save = async (patch: { visible?: boolean } = {}) => {
    setState('saving');
    setMessage('');
    try {
      const { data: res } = await axios.put(`/api/tools/${id}/profile`, { data, ...patch });
      setData(res.data);
      setVisible(res.status !== 'hidden');
      setMessage('Saved. Your tool page updates within a minute.');
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Could not save, please try again.');
    }
    setState('ready');
  };

  const rebuild = async () => {
    if (!confirm('Rebuild from your website? This replaces your edits.')) return;
    setState('rebuilding');
    setMessage('');
    try {
      await axios.post(`/api/tools/${id}/profile?regenerate=1`);
      await load();
      setMessage('Rebuilt from your website.');
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Could not rebuild right now.');
      setState('ready');
    }
  };

  if (state === 'loading') return <p className="mt-24 text-center text-sm text-slate-500">Loading…</p>;
  if (state === 'error' || state === 'missing' || !data || !tool) {
    return (
      <section className="container-custom-screen mt-14 max-w-2xl">
        <PageHeader eyebrow="Your tool page" title={tool?.name ?? 'Tool page'}>
          {state === 'missing'
            ? 'We haven’t written the fact sheet for your tool yet. It’s built automatically from your website within a day of your tool page being visited.'
            : message}
        </PageHeader>
        <Link href="/account/tools" className="mt-6 inline-block text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200">
          ← Back to your launches
        </Link>
      </section>
    );
  }

  const set = <K extends keyof ToolProfileData>(key: K, value: ToolProfileData[K]) => setData({ ...data, [key]: value });
  const update = <T,>(list: T[], idx: number, value: T) => list.map((item, i) => (i === idx ? value : item));
  const remove = <T,>(list: T[], idx: number) => list.filter((_, i) => i !== idx);
  const busy = state === 'saving' || state === 'rebuilding';

  return (
    <section className="container-custom-screen mt-14 mb-24 max-w-2xl">
      <PageHeader eyebrow="Your tool page" title={`${tool.name.trim()} fact sheet`}>
        We wrote this from your website. Reword anything, remove what&apos;s wrong, or hide sections you don&apos;t want on your page.
      </PageHeader>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-x-2 rounded-full border border-slate-800 px-3.5 py-1.5 text-sm text-slate-300">
          <input type="checkbox" checked={visible} onChange={e => save({ visible: e.target.checked })} disabled={busy} className="accent-orange-500" />
          Show the fact sheet on my tool page
        </label>
        <button
          type="button"
          onClick={rebuild}
          disabled={busy}
          className="inline-flex items-center gap-x-2 rounded-full border border-slate-800 px-3.5 py-1.5 text-sm text-slate-300 hover:border-slate-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state === 'rebuilding' ? 'animate-spin' : ''}`} />
          {state === 'rebuilding' ? 'Reading your website…' : 'Rebuild from website'}
        </button>
        {tool.slug && (
          <Link href={`/tool/${tool.slug}`} className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200">
            View page
          </Link>
        )}
      </div>

      <Section title="At a glance" section="glance" data={data} setData={setData}>
        <textarea className={input} rows={2} value={data.summary} onChange={e => set('summary', e.target.value)} placeholder="One sentence on what it does" />
        <input className={input} value={data.audience ?? ''} onChange={e => set('audience', e.target.value)} placeholder="Who it's for" />
        <input className={input} value={data.best_for ?? ''} onChange={e => set('best_for', e.target.value)} placeholder="Best for (short, shown in comparisons)" />
        <input
          className={input}
          value={data.integrations.join(', ')}
          onChange={e => set('integrations', e.target.value.split(',').map(s => s.trim()))}
          placeholder="Works with (comma separated)"
        />
      </Section>

      <Section title="Key features" section="features" data={data} setData={setData}>
        {data.features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input className={input} value={f.title} onChange={e => set('features', update(data.features, i, { ...f, title: e.target.value }))} />
              <textarea className={input} rows={2} value={f.description} onChange={e => set('features', update(data.features, i, { ...f, description: e.target.value }))} />
            </div>
            <RemoveButton label={`Remove ${f.title}`} onClick={() => set('features', remove(data.features, i))} />
          </div>
        ))}
        {data.features.length < 8 && (
          <button type="button" onClick={() => set('features', [...data.features, { title: '', description: '' }])} className="inline-flex items-center gap-x-1.5 text-sm text-slate-400 hover:text-slate-200">
            <Plus className="h-4 w-4" /> Add a feature
          </button>
        )}
      </Section>

      <Section title="Use cases" section="use_cases" data={data} setData={setData}>
        {data.use_cases.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input className={input} value={u} onChange={e => set('use_cases', update(data.use_cases, i, e.target.value))} />
            <RemoveButton label="Remove use case" onClick={() => set('use_cases', remove(data.use_cases, i))} />
          </div>
        ))}
        {data.use_cases.length < 5 && (
          <button type="button" onClick={() => set('use_cases', [...data.use_cases, ''])} className="inline-flex items-center gap-x-1.5 text-sm text-slate-400 hover:text-slate-200">
            <Plus className="h-4 w-4" /> Add a use case
          </button>
        )}
      </Section>

      <Section title="Pricing" section="pricing" data={data} setData={setData}>
        {(data.pricing?.plans ?? []).map((p, i) => {
          const plans = data.pricing!.plans;
          const setPlan = (plan: typeof p) => set('pricing', { ...data.pricing!, plans: update(plans, i, plan) });
          return (
            <div key={i} className="flex gap-2">
              <div className="grid flex-1 grid-cols-3 gap-2">
                <input className={input} value={p.name} onChange={e => setPlan({ ...p, name: e.target.value })} placeholder="Plan" />
                <input className={input} value={p.price} onChange={e => setPlan({ ...p, price: e.target.value })} placeholder="$20" />
                <input className={input} value={p.billing ?? ''} onChange={e => setPlan({ ...p, billing: e.target.value })} placeholder="per month" />
                <textarea
                  className={`${input} col-span-3`}
                  rows={2}
                  value={p.highlights.join('\n')}
                  onChange={e => setPlan({ ...p, highlights: e.target.value.split('\n') })}
                  placeholder="Highlights, one per line"
                />
              </div>
              <RemoveButton label={`Remove ${p.name}`} onClick={() => set('pricing', { ...data.pricing!, plans: remove(plans, i) })} />
            </div>
          );
        })}
        {(data.pricing?.plans.length ?? 0) < 5 && (
          <button
            type="button"
            onClick={() => set('pricing', { model: data.pricing?.model ?? null, free_trial: data.pricing?.free_trial ?? null, plans: [...(data.pricing?.plans ?? []), { name: '', price: '', billing: null, highlights: [] }] })}
            className="inline-flex items-center gap-x-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            <Plus className="h-4 w-4" /> Add a plan
          </button>
        )}
      </Section>

      <Section title="Alternatives" section="compare" data={data} setData={setData}>
        <p className="text-xs text-slate-500">Similar tools on DevHunt that your page compares with. You can remove the ones that don&apos;t fit.</p>
        {data.alternatives.map((a, i) => (
          <div key={a.id} className="flex items-start gap-2 rounded-lg border border-slate-800 px-3 py-2">
            <p className="flex-1 text-sm text-slate-300">
              <span className="font-medium text-slate-100">{altNames[a.id] ?? `Tool #${a.id}`}</span> · {a.difference}
            </p>
            <RemoveButton label="Remove alternative" onClick={() => set('alternatives', remove(data.alternatives, i))} />
          </div>
        ))}
      </Section>

      <Section title="FAQ" section="faq" data={data} setData={setData}>
        {data.faq.map((f, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input className={input} value={f.q} onChange={e => set('faq', update(data.faq, i, { ...f, q: e.target.value }))} />
              <textarea className={input} rows={2} value={f.a} onChange={e => set('faq', update(data.faq, i, { ...f, a: e.target.value }))} />
            </div>
            <RemoveButton label="Remove question" onClick={() => set('faq', remove(data.faq, i))} />
          </div>
        ))}
        {data.faq.length < 6 && (
          <button type="button" onClick={() => set('faq', [...data.faq, { q: '', a: '' }])} className="inline-flex items-center gap-x-1.5 text-sm text-slate-400 hover:text-slate-200">
            <Plus className="h-4 w-4" /> Add a question
          </button>
        )}
      </Section>

      <div className="sticky bottom-4 mt-12 flex items-center gap-x-4 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => save()}
          disabled={busy}
          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white duration-150 hover:bg-orange-400 disabled:opacity-50"
        >
          {state === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
    </section>
  );
}
