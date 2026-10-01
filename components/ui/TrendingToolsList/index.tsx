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

const rankedList = (list: ToolRowData[], excludeId?: number) =>
  list
    .map((tool, idx) => ({ tool, rank: idx + 1 })) // real week ranks
    .filter(({ tool }) => tool.id !== excludeId)
    .slice(0, SHOWN);

// This week's leaders as compact ranked rows (tool page and preview modal). `initial` comes from the server
// (tool page), so the rows and their links are in the HTML; without it the list loads after mount.
export default function TrendingToolsList({ excludeId, initial }: { excludeId?: number; initial?: ToolRowData[] }) {
  const [tools, setTools] = useState<{ tool: ToolRowData; rank: number }[] | null>(initial ? rankedList(initial, excludeId) : null); // null while loading

  useEffect(() => {
    if (initial) return;
    let alive = true;
    void loadTrending().then(list => {
      if (alive) setTools(rankedList(list, excludeId));
    });
    return () => {
      alive = false;
    };
  }, [excludeId, initial]);

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
