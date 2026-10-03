// What happens to a new submission, from JEV's answers (see utils/server/jev.ts moderateSubmission).
export type Moderation = 'ok' | 'not_a_fit' | 'blocked';
export const BANNED_TOPICS = ['crypto', 'gambling', 'adult', 'fraud'] as const;
export type BannedTopic = (typeof BANNED_TOPICS)[number];

export const BLOCK_THRESHOLD = 0.6; // probability of a banned topic
export const NOT_A_FIT_THRESHOLD = 0.35; // "useful to a developer or builder" score below this
export const LISTING_THRESHOLD = 0.8; // JEV sure it's a placeholder/test or a fake listing

// 'incomplete' is refused before saving (the maker fixes it and submits again); the others are saved.
export function moderationDecision(input: {
  devToolScore: number | null;
  topic: string | null;
  topicProbability: number | null;
  listing?: string | null;
  listingProbability?: number | null;
}): {
  status: Moderation | 'incomplete';
  reason: string | null;
} {
  const { devToolScore, topic, topicProbability, listing, listingProbability } = input;
  if (topic && (BANNED_TOPICS as readonly string[]).includes(topic) && (topicProbability ?? 0) >= BLOCK_THRESHOLD) {
    return { status: 'blocked', reason: topic };
  }
  const sure = (listingProbability ?? 0) >= LISTING_THRESHOLD;
  if (listing === 'fake' && sure) return { status: 'blocked', reason: 'fake' };
  if (listing === 'placeholder' && sure) return { status: 'incomplete', reason: 'incomplete' };
  if (devToolScore !== null && devToolScore < NOT_A_FIT_THRESHOLD) return { status: 'not_a_fit', reason: 'not a developer tool' };
  return { status: 'ok', reason: null };
}

// Obvious placeholder/test submissions, checked before anything is saved (no JEV needed). Returns a
// message for the maker, or null. Texts are the submit form's own placeholders and example values.
const FORM_PLACEHOLDERS = ['tool name', 'my awesome dev tool', 'supercharge your development workflow!', 'catchy slogan', 'quick description', 'briefly explain what your tool does'];
const OWN_HOSTS = /^(www\.)?(devhunt\.org|localhost|127\.0\.0\.1|example\.(com|org|net))$/i;
export function incompleteReason(tool: { name: string; slogan: string; description: string; website: string }): string | null {
  const plain = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const fields = [tool.name, tool.slogan, plain(tool.description)].map(s => s.toLowerCase());
  if (fields.some(f => FORM_PLACEHOLDERS.some(p => f === p || f.startsWith(`${p} `) || f.includes(`${p}${p}`) || f === `${p} ${p}`)))
    return 'Please replace the example text with your own tool name, slogan and description.';
  try {
    if (OWN_HOSTS.test(new URL(tool.website).hostname)) return "Please enter your tool's own website.";
  } catch {}
  if (plain(tool.description).length < 40) return 'Please describe what your tool does in a sentence or two.';
  return null;
}

// Comments. A comment judged spam is shadow-blocked: the author is told it was posted (and keeps
// seeing it), but it is never saved, so nobody else sees it and spammers don't learn to work around
// the filter. Owners commenting on their own tool are never blocked.
export type CommentModeration = { status: 'ok' | 'shadow'; reason: string | null };

export const COMMENT_SPAM_THRESHOLD = 0.8; // JEV spam + scam probability (calibrated on 2026-09-28 spam)
export const TEMPLATE_REPEATS = 2; // the same text already posted on this many other tools
const TEMPLATE_MIN_LETTERS = 60; // shorter texts ("Great project, good luck!") repeat innocently

const URL_OR_EMAIL = /(https?:\/\/\S+|www\.\S+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\b[a-z0-9-]+\.(?:com|io|ai|app|dev|site|space|net|org|co|xyz|me)\b\S*)/gi;

// Comparable form of a comment: the tool's name removed (spam rings paste it in), letters only.
export function commentTemplateKey(content: string, toolName = ''): string {
  let text = content.toLowerCase();
  const name = toolName.trim().toLowerCase();
  if (name) text = text.split(name).join(' ');
  return text.replace(URL_OR_EMAIL, ' ').replace(/[^a-z]+/g, '');
}

// How many of `previous` (the author's other comments, each with its tool's name) share this template.
export function templateRepeats(content: string, toolName: string, previous: { content: string; toolName: string }[]): number {
  const key = commentTemplateKey(content, toolName);
  if (key.length < TEMPLATE_MIN_LETTERS) return 0;
  const head = key.slice(0, 80);
  return previous.filter(p => commentTemplateKey(p.content, p.toolName).slice(0, 80) === head).length;
}

// Just a link or an email address, with at most one word around it ("Correct link: …" is real).
export function isLinkDrop(content: string): boolean {
  const links = content.match(URL_OR_EMAIL);
  if (!links?.length) return false;
  const words = content.replace(URL_OR_EMAIL, ' ').match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return words.length <= 1;
}

export function commentDecision(input: { isOwner: boolean; repeats: number; linkDrop: boolean; spamProbability: number | null; choice: string | null }): CommentModeration {
  if (input.isOwner) return { status: 'ok', reason: null };
  if (input.repeats >= TEMPLATE_REPEATS) return { status: 'shadow', reason: 'template' };
  if (input.linkDrop) return { status: 'shadow', reason: 'link_drop' };
  if (input.spamProbability !== null && input.spamProbability >= COMMENT_SPAM_THRESHOLD) return { status: 'shadow', reason: input.choice === 'scam' ? 'scam' : 'spam' };
  return { status: 'ok', reason: null };
}
