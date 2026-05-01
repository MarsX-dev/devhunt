/**
 * Aggressive HTML shrinking for Gmail's ~102 KB decoded-body clip limit.
 * Safe for table-based templates: compacts whitespace only (no semantic changes).
 */
export function minifyEmailHtml(html: string): string {
  let h = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => {
    const compact = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `<style${attrs}>${compact}</style>`;
  });

  h = h.replace(/style="([\s\S]*?)"/gi, (_, inner) => {
    const collapsed = inner.replace(/\s+/g, ' ').trim();
    return `style="${collapsed}"`;
  });

  h = h.replace(/>\s+</g, '><');

  const junkComments = [
    '<!-- COPY -->',
    '<!-- LEFT COLUMN -->',
    '<!-- 2 COLUMNS -->',
    '<!-- BUTTON -->',
    '<!-- END BUTTON -->',
    '<!--  -->',
  ];
  for (const j of junkComments) {
    h = h.replaceAll(j, '');
  }

  return h;
}
