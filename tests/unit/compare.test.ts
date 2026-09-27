import { describe, expect, it } from 'vitest';
import { comparePath, isCanonicalPair, pairCandidates } from '@/utils/compare';

describe('compare pages', () => {
  it('has one URL per pair, in alphabetical order', () => {
    expect(comparePath('supabase', 'clerk')).toBe('/compare/clerk-vs-supabase');
    expect(comparePath('clerk', 'supabase')).toBe('/compare/clerk-vs-supabase');
    expect(isCanonicalPair('clerk', 'supabase')).toBe(true);
    expect(isCanonicalPair('supabase', 'clerk')).toBe(false);
  });

  it('splits slugs that contain -vs- in every possible way', () => {
    expect(pairCandidates('clerk-vs-supabase')).toEqual([['clerk', 'supabase']]);
    expect(pairCandidates('a-vs-b-vs-c')).toEqual([
      ['a', 'b-vs-c'],
      ['a-vs-b', 'c'],
    ]);
    expect(pairCandidates('clerk')).toEqual([]);
    expect(pairCandidates('clerk-vs-clerk')).toEqual([]);
  });
});
