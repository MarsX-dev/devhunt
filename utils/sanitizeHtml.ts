import DOMPurify from 'dompurify';

// Tool descriptions are HTML written by their owners: never render them unsanitized. In the browser this
// strips scripts, event handlers and javascript: links; on the server (no DOM) it falls back to plain text.
// The tool page sanitizes on the server with JSDOM instead.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
  return DOMPurify.sanitize(html);
}
