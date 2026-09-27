'use client';

import { useEffect, useState } from 'react';
import ToolRow from '@/components/ui/ToolRow';
import { type ProductType } from '@/type';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';

const SHOWN = 8;

// This week's leaders as compact ranked rows (tool page and preview modal).
export default function TrendingToolsList({ excludeId }: { excludeId?: number }) {
  const [tools, setTools] = useState<{ tool: ProductType; rank: number }[]>([]);

  useEffect(() => {
    const productService = new ProductsService(createBrowserClient());
    const today = new Date();
    void productService.getWeekNumber(today, 2).then(async week => {
      const [thisWeek] = await productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 1);
      const ranked = ((thisWeek?.products ?? []) as ProductType[]).map((tool, idx) => ({ tool, rank: idx + 1 })); // real week ranks
      setTools(ranked.filter(({ tool }) => tool.id !== excludeId).slice(0, SHOWN));
    });
  }, [excludeId]);

  return (
    <ol className="mt-2">
      {tools.map(({ tool, rank }, idx) => (
        <ToolRow key={tool.id} tool={tool as any} rank={rank} revealIndex={idx} />
      ))}
    </ol>
  );
}
