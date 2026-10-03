'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconSearch } from '@/components/Icons';
import BlurBackground from '../BlurBackground/BlurBackground';
import SearchItem, { type SearchResult } from './SearchItem';
import EmptyState from './EmptyState';
import { createBrowserClient } from '@/utils/supabase/browser';
import { prefetchRoute } from '@/utils/prefetch';

const DEBOUNCE_MS = 120;

type Props = {
  isCommandActive: boolean;
  setCommandActive?: (val: boolean) => void;
};

// Search palette (⌘K or "/"): ranked results from search_tools(), this week's leaders while empty.
// Nothing is fetched until it opens; out-of-date responses are dropped while typing.
export default function CommandPalette({ isCommandActive, setCommandActive = () => false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const latest = useRef(0);
  const pathname = usePathname();

  const close = () => {
    setCommandActive(false);
    setQuery('');
    setResults([]);
  };

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isCommandActive);
    if (!isCommandActive || trending.length) return;
    const now = new Date().toISOString();
    void createBrowserClient()
      .from('products')
      .select('id, slug, name, slogan, logo_url, votes_count, launch_start')
      .eq('deleted', false)
      .lte('launch_start', now)
      .gte('launch_end', now)
      .order('votes_count', { ascending: false })
      .limit(6)
      .then(({ data }) => setTrending((data ?? []) as SearchResult[]));
  }, [isCommandActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => close(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- any link inside navigates away

  useEffect(() => {
    const term = query.trim();
    setSelected(0);
    if (!term) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      const { data } = await createBrowserClient().rpc('search_tools' as never, { q: term, max_results: 8 } as never);
      if (id !== latest.current) return; // a newer search is running
      setResults((data ?? []) as SearchResult[]);
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const list = query.trim() ? results : trending;

  // Enter opens the highlighted result: keep it prefetched so its skeleton shows instantly.
  const selectedSlug = list[selected]?.slug;
  useEffect(() => {
    if (selectedSlug) prefetchRoute(router, `/tool/${selectedSlug}`);
  }, [selectedSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(i => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && list[selected]) {
      e.preventDefault();
      router.push(`/tool/${list[selected].slug}`);
      close();
    }
  };

  if (!isCommandActive) return null;

  return (
    <div className="fixed z-30 w-full h-full inset-0 flex items-start justify-center px-4 pt-[12vh]">
      <BlurBackground isActive={true} setActive={close} />
      <div className="relative z-30 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-x-3 border-b border-slate-800 px-4 py-3.5">
          <IconSearch className="flex-none text-slate-500" />
          <input
            type="text"
            autoFocus
            onChange={e => setQuery(e.target.value)}
            value={query}
            placeholder="Search dev tools..."
            aria-label="Search dev tools"
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <kbd className="hidden rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">esc</kbd>
        </div>
        <div className="max-h-[360px] overflow-auto p-2">
          {!query.trim() && <p className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Leading this week</p>}
          {query.trim() && !searching && results.length === 0 ? (
            <EmptyState onNavigate={close} />
          ) : (
            <ul>
              {list.map((item, idx) => (
                <li key={item.id} onMouseEnter={() => setSelected(idx)}>
                  <SearchItem onClick={close} item={item} active={idx === selected} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
