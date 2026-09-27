// "X vs Y" comparison pages (pure helpers, tested). A pair's URL is /compare/<a>-vs-<b> with the two
// slugs in alphabetical order, so each pair has exactly one page.

export const comparePath = (a: string, b: string) => {
  const [first, second] = [a, b].sort();
  return `/compare/${encodeURIComponent(first)}-vs-${encodeURIComponent(second)}`;
};

// All ways to split "<a>-vs-<b>" (slugs can contain "-vs-" themselves); the caller checks which exist.
export function pairCandidates(param: string): [string, string][] {
  const value = decodeURIComponent(param);
  const out: [string, string][] = [];
  for (let i = value.indexOf('-vs-'); i > 0; i = value.indexOf('-vs-', i + 1)) {
    const a = value.slice(0, i);
    const b = value.slice(i + 4);
    if (a && b && a !== b) out.push([a, b]);
  }
  return out;
}

export const isCanonicalPair = (a: string, b: string) => a < b;
