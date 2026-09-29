'use client';

import Link from 'next/link';
import moment from 'moment';
import { trackStep } from '@/utils/funnelClient';
import { useSupabase } from '@/components/supabase/provider';

export interface UpsellTool {
  id: number;
  slug: string;
  isPaid?: boolean | null;
  launch_start?: string | null;
  moderation?: string | null;
}

// Free listings link out with rel="nofollow"; $49 (the paid launch) makes it dofollow. Shown to the
// tool's owner only, in their dashboard, edit page and on their own tool page. `from` says where, for
// the funnel (upsell_click, then launch_view on the launch page).
export default function DofollowUpsell({ tool, from, compact = false }: { tool: UpsellTool; from: string; compact?: boolean }) {
  if (tool.isPaid || tool.moderation === 'blocked') return null;
  const queued = !!tool.launch_start && Date.parse(tool.launch_start) > Date.now();
  const listedOnly = tool.moderation === 'not_a_fit';
  const href = `/account/tools/activate-launch/${tool.slug}?from=${from}`;
  const track = () => trackStep('upsell_click', { from, queued }, tool.id);

  const pitch = listedOnly
    ? 'Get a permanent dofollow backlink from DevHunt (DR 65) for $49.'
    : queued
      ? `Get a dofollow backlink from DevHunt (DR 65) and launch in a week you pick instead of ${moment.utc(tool.launch_start).format('MMM D, YYYY')}. $49, one time.`
      : 'Get a dofollow backlink from DevHunt (DR 65) and a new launch week with a home page spotlight. $49, one time.';

  if (compact)
    return (
      <Link
        href={href}
        onClick={track}
        className="mt-3 flex items-center gap-x-2 rounded-lg border border-orange-500/30 bg-orange-500/[0.06] px-3 py-2 text-xs text-slate-300 duration-150 hover:border-orange-500/60"
      >
        <span className="flex-none rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">nofollow</span>
        <span className="min-w-0 flex-1">Your link is nofollow, so it passes no SEO value. {pitch}</span>
        <span className="flex-none font-medium text-orange-300">Upgrade →</span>
      </Link>
    );
  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.05] p-4 sm:flex sm:items-center sm:gap-x-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100">
          Your link on DevHunt is <span className="font-mono text-orange-300">nofollow</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Free listings don&apos;t pass SEO value to your site. {pitch}{' '}
          <Link href="/stats" className="whitespace-nowrap text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white">
            See our traffic
          </Link>
        </p>
      </div>
      <Link
        href={href}
        onClick={track}
        className="mt-3 inline-block flex-none rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white duration-150 hover:bg-orange-400 sm:mt-0"
      >
        Get the dofollow link
      </Link>
    </div>
  );
}

// On a tool page: the upsell for its owner only (pages are cached and the same for everyone, so the
// owner check runs in the browser).
export function OwnerDofollowUpsell({ tool }: { tool: UpsellTool & { owner_id?: string | null } }) {
  const { session } = useSupabase();
  if (!session?.user || session.user.id !== tool.owner_id) return null;
  return (
    <div className="mt-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Only you see this</p>
      <DofollowUpsell tool={tool} from="tool_page" />
    </div>
  );
}
