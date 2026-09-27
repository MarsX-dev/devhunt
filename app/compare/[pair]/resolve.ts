import { redirect } from 'next/navigation';
import { getComparison, type Comparison } from '@/utils/compareData';
import { comparePath, isCanonicalPair, pairCandidates } from '@/utils/compare';

// The comparison for a /compare/[pair] URL; a non-canonical order redirects to the canonical one.
export async function resolve(pair: string): Promise<Comparison | null> {
  for (const [a, b] of pairCandidates(pair)) {
    const comparison = await getComparison(...([a, b].sort() as [string, string]));
    if (comparison) {
      if (!isCanonicalPair(a, b)) redirect(comparePath(a, b));
      return comparison;
    }
  }
  return null;
}
