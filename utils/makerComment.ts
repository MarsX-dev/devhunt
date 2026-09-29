// The maker's first comment: written on the submit form (pre-filled, editable, can be cleared) and
// posted under the maker's own account when the tool is saved.
export const MAKER_COMMENT_MAX = 1000;

// Used when the website import has no AI draft (or the form is filled in manually).
export function templateMakerComment(name?: string, slogan?: string): string {
  // "Catch broken builds." -> "catch broken builds" (acronyms like "AI" keep their case)
  const what = slogan?.trim().replace(/[.!]+$/, '').replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase());
  const built = name?.trim() ? ` We built ${name.trim()}${what ? `: ${what}` : ''}.` : '';
  return `Hey everyone 👋 I'm the maker.${built} I'd love your honest feedback, and I'm here all week to answer questions!`;
}
