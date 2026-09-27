import { Award, Check } from 'lucide-react';
import SectionLabel from '@/components/ui/SectionLabel';
import { type ToolExtra } from '@/utils/toolExtras';

const hostIcon = (url: string | null) => {
  try {
    return url ? `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32` : null;
  } catch {
    return null;
  }
};

// Award badges under the tool header (wins on other launchpads).
export function ToolAwards({ extras }: { extras: ToolExtra[] }) {
  const awards = extras.filter(e => e.kind === 'award');
  if (!awards.length) return null;
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Awards">
      {awards.map(award => (
        <li key={award.id}>
          <a
            href={award.url ?? undefined}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex items-center gap-x-2 rounded-full border border-orange-500/30 bg-orange-500/[0.06] px-3 py-1.5 text-xs text-orange-200 duration-150 hover:border-orange-500/60"
          >
            <Award className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-medium">{award.title}</span>
            {award.source && <span className="text-orange-300/70">· {award.source}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ToolHighlights({ extras }: { extras: ToolExtra[] }) {
  const highlights = extras.filter(e => e.kind === 'highlight');
  if (!highlights.length) return null;
  return (
    <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Highlights">
      {highlights.map(h => (
        <li key={h.id} className="flex items-start gap-x-2.5 rounded-xl border border-slate-800 px-3.5 py-2.5 text-sm text-slate-300">
          <Check className="mt-0.5 h-4 w-4 flex-none text-green-400" />
          {h.title}
        </li>
      ))}
    </ul>
  );
}

export function ToolReviews({ extras }: { extras: ToolExtra[] }) {
  const reviews = extras.filter(e => e.kind === 'review');
  if (!reviews.length) return null;
  return (
    <div id="reviews">
      <SectionLabel title="What people say" hint={`${reviews.length} ${reviews.length === 1 ? 'quote' : 'quotes'} from around the web`} />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {reviews.map(review => (
          <li key={review.id} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm leading-relaxed text-slate-200">“{review.title}”</p>
            <a
              href={review.url ?? undefined}
              target="_blank"
              rel="nofollow noopener"
              className="mt-auto flex items-center gap-x-2 pt-4 text-xs text-slate-500 hover:text-slate-300"
            >
              {hostIcon(review.url) && <img src={hostIcon(review.url)!} alt="" className="h-4 w-4 rounded" loading="lazy" />}
              {[review.body, review.source].filter(Boolean).join(' · ')}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolMentions({ extras }: { extras: ToolExtra[] }) {
  const mentions = extras.filter(e => e.kind === 'mention');
  if (!mentions.length) return null;
  return (
    <div id="mentions">
      <SectionLabel title="Around the web" hint="Articles, videos and discussions" />
      <ul className="mt-2">
        {mentions.map(m => (
          <li key={m.id}>
            <a
              href={m.url ?? undefined}
              target="_blank"
              rel="nofollow noopener"
              className="-mx-2 flex items-center gap-x-3 rounded-lg px-2 py-2.5 duration-150 hover:bg-slate-800/50"
            >
              {hostIcon(m.url) ? (
                <img src={hostIcon(m.url)!} alt="" className="h-5 w-5 flex-none rounded" loading="lazy" />
              ) : (
                <span className="h-5 w-5 flex-none rounded bg-slate-800" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{m.title}</span>
              <span className="flex-none text-xs text-slate-500">{m.source}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
