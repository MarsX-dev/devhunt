import Link from 'next/link';
import { IconVote } from '@/components/Icons';

export interface SearchResult {
  id: number;
  slug: string;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  votes_count: number | null;
  launch_start: string | null;
}

export default function SearchItem({ item, active, onClick }: { item: SearchResult; active?: boolean; onClick: () => void }) {
  return (
    <Link
      onClick={onClick}
      href={'/tool/' + item.slug}
      className={`flex items-center gap-x-3 rounded-xl px-3 py-2.5 duration-100 ${active ? 'bg-slate-800/70' : ''}`}
    >
      <img
        src={(item.logo_url || '').replace(/w=\d+/g, 'w=64')}
        alt=""
        className="h-8 w-8 flex-none rounded-lg bg-slate-800 object-cover ring-1 ring-slate-800"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-100">{item.name}</span>
        <span className="block truncate text-xs text-slate-500">{item.slogan}</span>
      </span>
      <span className="flex flex-none items-center gap-x-1 font-mono text-xs text-slate-500">
        <IconVote className="h-3.5 w-3.5" />
        {item.votes_count ?? 0}
      </span>
    </Link>
  );
}
