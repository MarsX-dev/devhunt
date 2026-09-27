import Link from 'next/link';
import moment from 'moment';
import { IconVote } from '@/components/Icons';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import { type ToolRowData } from '@/utils/toolRow';

interface Props {
  tool: ToolRowData;
  rank?: number;
  rankDigits?: number; // widest rank in the list, so every row's logo sits at the same x
  showDate?: boolean; // launch date on the right (desktop)
  revealIndex?: number;
}

const isLive = (tool: ToolRowData, now = Date.now()) =>
  !!tool.launch_start && Date.parse(tool.launch_start) <= now && !!tool.launch_end && Date.parse(tool.launch_end) >= now;

// One line per tool: [rank] logo · name · tagline · [date] · votes. Tools in their launch week get
// a small upvote button; the rest show their final count. The whole row links to the tool page.
export default function ToolRow({ tool, rank, rankDigits = 2, showDate = false, revealIndex }: Props) {
  const live = isLive(tool);
  return (
    <li
      className={revealIndex === undefined ? '' : 'motion-safe:animate-slide-up'}
      style={revealIndex === undefined ? undefined : { animationDelay: `${Math.min(revealIndex, 14) * 40}ms` }}
    >
      <div className="group relative -mx-2 flex items-center gap-x-3 rounded-lg px-2 py-2.5 duration-150 hover:bg-slate-800/50">
        {rank !== undefined && (
          // Left-aligned and just as wide as the longest rank, so the digits start on the heading's edge.
          <span
            className={`flex-none text-left font-mono text-xs tabular-nums ${rank <= 3 ? 'text-orange-500' : 'text-slate-600'}`}
            style={{ width: `${rankDigits}ch` }}
          >
            {rank}
          </span>
        )}
        <img
          src={(tool.logo_url || '').replace(/w=\d+/g, 'w=64')}
          alt={tool.name}
          className="h-8 w-8 flex-none rounded-lg bg-slate-800 object-cover ring-1 ring-slate-800"
          loading="lazy"
        />
        <Link href={`/tool/${tool.slug}`} className="min-w-0 flex-1 truncate text-sm after:absolute after:inset-0 after:content-['']">
          <span className="font-medium text-slate-100">{tool.name}</span>
          {tool.slogan && <span className="text-slate-500"> · {tool.slogan}</span>}
        </Link>
        {live && <span className="hidden flex-none font-mono text-[11px] text-green-400 sm:block">live</span>}
        {showDate && tool.launch_start && (
          <span className="hidden flex-none font-mono text-xs text-slate-600 sm:block">{moment.utc(tool.launch_start).format('MMM D, YY')}</span>
        )}
        {live ? (
          <span className="relative z-10 flex-none">
            <Votes variant="inline" className="w-14 justify-center" count={tool.votes_count} productId={tool.id} launchDate={tool.launch_date ?? ''} launchEnd={tool.launch_end ?? ''} />
          </span>
        ) : (
          <span className="flex w-14 flex-none items-center justify-end gap-x-1 font-mono text-xs text-slate-400 tabular-nums">
            <IconVote className="h-3.5 w-3.5" />
            {tool.votes_count}
          </span>
        )}
      </div>
    </li>
  );
}
