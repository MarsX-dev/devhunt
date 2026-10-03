'use client';

import { useEffect, useState } from 'react';
import ToolRow from '@/components/ui/ToolRow';
import InlineSponsor from '@/components/ui/Sponsors/InlineSponsor';
import { sponsorBefore } from '@/utils/ads';
import { RowsSkeleton } from '@/components/ui/Skeletons/PageSkeletons';
import { type ToolRowData } from '@/utils/toolRow';

const SHOWN = 8;

// Fetched once per page load and shared: the tool modal re-mounts this list on every ←/→ step.
let trending: Promise<ToolRowData[]> | null = null;
const loadTrending = (): Promise<ToolRowData[]> =>
  (trending ??= fetch('/api/trending')
    .then(res => (res.ok ? res.json() : []))
    .catch(() => {
      trending = null;
      return [];
    }));

// This week's leaders as compact ranked rows (tool page and preview modal).
export default function TrendingToolsList({ excludeId }: { excludeId?: number }) {
  const [tools, setTools] = useState<{ tool: ToolRowData; rank: number }[] | null>(null); // null while loading

  useEffect(() => {
    let alive = true;
    void loadTrending().then(list => {
      const ranked = list.map((tool, idx) => ({ tool, rank: idx + 1 })); // real week ranks
      if (alive) setTools(ranked.filter(({ tool }) => tool.id !== excludeId).slice(0, SHOWN));
    });
    return () => {
      alive = false;
    };
  }, [excludeId]);

  if (!tools) return <RowsSkeleton rows={SHOWN} className="mt-2" ranked />;
  return (
    <ol className="mt-2">
      {tools.map(({ tool, rank }, idx) => [
        sponsorBefore(idx, tools.length) >= 0 && <InlineSponsor key={`sponsor-${idx}`} n={sponsorBefore(idx, tools.length)} />,
        <ToolRow key={tool.id} tool={tool} rank={rank} revealIndex={idx} />,
      ])}
    </ol>
  );
}
