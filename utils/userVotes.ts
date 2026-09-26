import { createBrowserClient } from '@/utils/supabase/browser';

// Every tool card asks "did this user vote for me?". Cards in a list mount together, so their
// lookups are collected for a moment and answered with one query instead of one per card.
const CHUNK = 150; // keeps the request URL short
let queue: { userId: string; productId: number; resolve: (voted: boolean) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  const batch = queue;
  queue = [];
  timer = null;
  const byUser = new Map<string, typeof batch>();
  batch.forEach(item => byUser.set(item.userId, [...(byUser.get(item.userId) ?? []), item]));

  for (const [userId, items] of Array.from(byUser)) {
    const ids = Array.from(new Set(items.map(i => i.productId)));
    const voted = new Set<number>();
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { data } = await createBrowserClient()
        .from('product_votes')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', ids.slice(i, i + CHUNK));
      (data ?? []).forEach(row => voted.add(row.product_id as number));
    }
    items.forEach(item => item.resolve(voted.has(item.productId)));
  }
}

export function hasUserVoted(userId: string, productId: number): Promise<boolean> {
  return new Promise(resolve => {
    queue.push({ userId, productId, resolve });
    if (!timer) timer = setTimeout(() => void flush(), 20);
  });
}
