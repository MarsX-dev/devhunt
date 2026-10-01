import { describe, expect, it } from 'vitest';
import { FREE_ALTERNATIVES, FREE_KIND_LABEL, allFreeSlugs } from '@/utils/freeAlternatives';

describe('free alternatives data', () => {
  it('has one row per paid tool, no self or duplicate alternatives, and a known kind', () => {
    const rows = FREE_ALTERNATIVES.map(r => r.slug);
    expect(new Set(rows).size).toBe(rows.length);
    for (const r of FREE_ALTERNATIVES) {
      const alts = r.alternatives.map(a => a.slug);
      expect(new Set(alts).size, r.slug).toBe(alts.length);
      expect(alts, r.slug).not.toContain(r.slug);
      for (const a of r.alternatives) {
        expect(Object.keys(FREE_KIND_LABEL), a.slug).toContain(a.kind);
        expect(a.license, `${a.slug} needs a license`).toBeTruthy();
      }
    }
  });
  it('lists every slug once for the data query', () => {
    expect(allFreeSlugs()).toEqual(Array.from(new Set(allFreeSlugs())));
  });
});
