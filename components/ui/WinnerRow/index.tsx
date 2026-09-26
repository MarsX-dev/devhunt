import Link from 'next/link';
import moment from 'moment';
import { IconVote } from '@/components/Icons';
import { type ProductType } from '@/type';

// One-line row for a past weekly winner.
export default function WinnerRow({ tool }: { tool: ProductType }) {
  return (
    <li>
      <Link
        href={`/tool/${tool.slug}`}
        className="flex items-center gap-x-3 rounded-lg px-2 py-2.5 -mx-2 hover:bg-slate-800/60 duration-150"
      >
        <img
          src={(tool.logo_url || '').replace(/w=\d+/g, 'w=64')}
          alt={tool.name}
          className="w-8 h-8 flex-none rounded-lg object-cover bg-slate-800 ring-1 ring-slate-800"
          loading="lazy"
        />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-slate-100">{tool.name}</span>
          <span className="text-slate-500"> · {tool.slogan}</span>
        </span>
        <span className="hidden sm:block flex-none font-mono text-xs text-slate-600">{moment.utc(tool.launch_start).format('MMM D, YY')}</span>
        <span className="flex w-14 flex-none items-center justify-end gap-x-1 font-mono text-sm text-slate-400 tabular-nums">
          <IconVote className="w-4 h-4" />
          {tool.votes_count}
        </span>
      </Link>
    </li>
  );
}
