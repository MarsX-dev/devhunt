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
          className="w-8 h-8 flex-none rounded-md object-cover"
          loading="lazy"
        />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-slate-100">{tool.name}</span>
          <span className="text-slate-400"> · {tool.slogan}</span>
        </span>
        <span className="hidden sm:block flex-none text-xs text-slate-500">{moment.utc(tool.launch_start).format('MMM D, YYYY')}</span>
        <span className="flex flex-none items-center gap-x-1 text-sm text-slate-300 tabular-nums">
          <IconVote className="w-4 h-4" />
          {tool.votes_count}
        </span>
      </Link>
    </li>
  );
}
