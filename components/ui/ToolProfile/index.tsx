import Link from 'next/link';
import moment from 'moment';
import { Check, GitFork, Star } from 'lucide-react';
import SectionLabel from '@/components/ui/SectionLabel';
import { type CompareTool, type ToolProfileView } from '@/utils/toolProfileData';

type Self = { name: string; logo_url: string | null; votes_count: number; launch_start: string | null; pricing: string | null; slug: string };

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const logo = (url: string | null) => (url ?? '').replace(/w=\d+/g, 'w=64');

// "At a glance": who it's for, pricing model, open source stats and integrations.
export function ToolGlance({ profile }: { profile: ToolProfileView }) {
  const { data } = profile;
  const facts = [
    data.audience && { label: 'for', value: data.audience },
    data.pricing?.model && { label: 'pricing', value: `${data.pricing.model}${data.pricing.free_trial ? ' · free trial' : ''}` },
    data.github && { label: 'license', value: data.github.license ?? 'open source' },
  ].filter(Boolean) as { label: string; value: string }[];
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
      <p className="border-b border-slate-800 px-4 py-3 text-[15px] leading-relaxed text-slate-200">{data.summary}</p>
      {!!facts.length && (
        <dl className={`grid gap-px bg-slate-800 ${['', '', 'sm:grid-cols-2', 'sm:grid-cols-3'][facts.length]}`}>
          {facts.map(f => (
            <div key={f.label} className="bg-slate-900 px-4 py-3">
              <dt className="font-mono text-[11px] text-slate-500">{f.label}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-slate-300 first-letter:uppercase">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {data.github && (
        <a
          href={`https://github.com/${data.github.repo}`}
          target="_blank"
          rel="nofollow noopener"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 px-4 py-2.5 font-mono text-xs text-slate-400 hover:text-slate-200"
        >
          <span className="text-slate-300">{data.github.repo}</span>
          <span className="inline-flex items-center gap-x-1">
            <Star className="h-3.5 w-3.5 text-yellow-400" /> {compact(data.github.stars)}
          </span>
          <span className="inline-flex items-center gap-x-1">
            <GitFork className="h-3.5 w-3.5" /> {compact(data.github.forks)}
          </span>
          {data.github.language && <span>{data.github.language}</span>}
          {data.github.pushed_at && <span className="text-slate-500">updated {moment(data.github.pushed_at).fromNow()}</span>}
        </a>
      )}
      {!!data.integrations.length && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 px-4 py-3">
          <span className="mr-1 font-mono text-[11px] text-slate-500">works with</span>
          {data.integrations.map(i => (
            <span key={i} className="rounded-md border border-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolFeatures({ profile, name }: { profile: ToolProfileView; name: string }) {
  const { features, use_cases } = profile.data;
  if (!features.length && !use_cases.length) return null;
  return (
    <div id="features" className="scroll-mt-32 space-y-10">
      {!!features.length && (
        <div>
          <SectionLabel title="Key features" hint={`${features.length} features of ${name}`} />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map(f => (
              <li key={f.title} className="rounded-xl border border-slate-800 px-4 py-3.5">
                <h3 className="text-sm font-medium text-slate-100">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!use_cases.length && (
        <div>
          <SectionLabel title="Use cases" />
          <ul className="mt-4 space-y-2">
            {use_cases.map(u => (
              <li key={u} className="flex items-start gap-x-2.5 text-sm text-slate-300">
                <Check className="mt-0.5 h-4 w-4 flex-none text-green-400" />
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ToolPricing({ profile, name }: { profile: ToolProfileView; name: string }) {
  const plans = profile.data.pricing?.plans ?? [];
  if (plans.length < 2) return null;
  const source = profile.sources.find(s => /pric|plan/i.test(s));
  return (
    <div id="pricing" className="scroll-mt-32">
      <SectionLabel
        title={`${name} pricing`}
        hint={
          source ? (
            <a href={source} target="_blank" rel="nofollow noopener" className="hover:text-slate-300">
              from {hostOf(source)} ↗
            </a>
          ) : undefined
        }
      />
      <ul className={`mt-4 grid gap-3 ${plans.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {plans.map(p => (
          <li key={p.name} className="flex flex-col rounded-xl border border-slate-800 p-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{p.name}</span>
            <span className="mt-2 text-2xl font-semibold text-slate-50">
              {p.price}
              {p.billing && <span className="ml-1 text-xs font-normal text-slate-500">{p.billing}</span>}
            </span>
            {!!p.highlights.length && (
              <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                {p.highlights.map(h => (
                  <li key={h} className="flex items-start gap-x-2">
                    <Check className="mt-px h-3.5 w-3.5 flex-none text-slate-500" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Comparison with similar DevHunt tools: a table (best for, pricing, upvotes, launch) and how each differs.
export function ToolCompare({ profile, self }: { profile: ToolProfileView; self: Self }) {
  const alts = profile.compare;
  if (!alts.length) return null;
  const altInfo = new Map(profile.data.alternatives.map(a => [a.id, a]));
  const columns: (CompareTool & { best_for: string | null; self?: boolean })[] = [
    // The tool's own pricing model from its site is more precise than the maker's pricing label.
    { id: 0, ...self, pricing: profile.data.pricing?.model ?? self.pricing, best_for: profile.data.best_for, self: true },
    ...alts.map(a => ({ ...a, best_for: altInfo.get(a.id)?.best_for ?? null })),
  ];
  const rows: { label: string; value: (c: (typeof columns)[number]) => string }[] = [
    { label: 'Best for', value: c => c.best_for ?? '—' },
    { label: 'Pricing', value: c => (c.pricing ? c.pricing[0].toUpperCase() + c.pricing.slice(1) : '—') },
    { label: 'DevHunt upvotes', value: c => c.votes_count.toLocaleString('en-US') },
    { label: 'Launched', value: c => (c.launch_start ? moment.utc(c.launch_start).format('MMM YYYY') : '—') },
  ];
  return (
    <div id="compare" className="scroll-mt-32">
      <SectionLabel title={`${self.name} vs alternatives`} hint="similar tools on DevHunt" />
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="w-32 px-4 py-3" />
              {columns.map(c => (
                <th key={c.id} scope="col" className={`px-4 py-3 align-top font-medium ${c.self ? 'bg-slate-800/40' : ''}`}>
                  {c.self ? (
                    <span className="flex items-center gap-x-2 text-slate-50">
                      {c.logo_url && <img src={logo(c.logo_url)} alt="" className="h-6 w-6 rounded-md bg-slate-800 object-cover" />}
                      {c.name.trim()}
                    </span>
                  ) : (
                    <Link href={`/tool/${c.slug}`} className="flex items-center gap-x-2 text-slate-200 hover:text-white">
                      {c.logo_url && <img src={logo(c.logo_url)} alt="" loading="lazy" className="h-6 w-6 rounded-md bg-slate-800 object-cover" />}
                      {c.name.trim()}
                    </Link>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-normal text-slate-500">
                  {r.label}
                </th>
                {columns.map(c => (
                  <td key={c.id} className={`px-4 py-3 align-top text-xs text-slate-300 ${c.self ? 'bg-slate-800/40' : ''}`}>
                    {r.value(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 space-y-2.5">
        {alts.map(a => (
          <li key={a.id} className="text-sm leading-relaxed text-slate-400">
            <Link href={`/tool/${a.slug}`} className="font-medium text-slate-200 hover:text-white">
              {self.name.trim()} vs {a.name.trim()}:
            </Link>{' '}
            {altInfo.get(a.id)?.difference}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolFaq({ profile, name }: { profile: ToolProfileView; name: string }) {
  const { faq } = profile.data;
  if (!faq.length) return null;
  return (
    <div id="faq" className="scroll-mt-32">
      <SectionLabel title={`${name} FAQ`} />
      <div className="mt-2 divide-y divide-slate-800">
        {faq.map(f => (
          <details key={f.q} className="group py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 text-sm font-medium text-slate-200 hover:text-white [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="font-mono text-slate-500 duration-150 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function ProfileSource({ profile }: { profile: ToolProfileView }) {
  return (
    <p className="font-mono text-[11px] text-slate-600">
      Summarized by DevHunt from {Array.from(new Set(profile.sources.map(hostOf))).join(', ')}
      {profile.generated_at && ` · ${moment(profile.generated_at).format('MMM D, YYYY')}`}. Details may change; check the official site.
    </p>
  );
}

export const faqJsonLd = (profile: ToolProfileView) =>
  profile.data.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: profile.data.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null;
