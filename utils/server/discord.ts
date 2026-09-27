// Posts the "new tool" message to Discord. DISCOR_TOOL_WEBHOOK is the historical (misspelled) name.
export interface ModerationInfo {
  status: 'ok' | 'not_a_fit' | 'blocked';
  reason: string | null;
  devToolScore: number | null;
  topicProbability?: number | null;
}

// Posts the new-tool message; moderated submissions get a clear note for the team.
export async function announceNewTool(tool: { id?: number; name: string; slug: string }, makerName: string | null, moderation?: ModerationInfo) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  const link = `https://devhunt.org/tool/${tool.slug}`;
  const who = `**${tool.name}** by ${makerName ?? 'someone'}`;
  const score = moderation?.devToolScore != null ? ` (dev-tool score ${moderation.devToolScore.toFixed(2)})` : '';
  const content =
    moderation?.status === 'blocked'
      ? `🚫 ${who} was blocked and hidden: looks like **${moderation.reason}**${
          moderation.topicProbability != null ? ` (${Math.round(moderation.topicProbability * 100)}%)` : ''
        }. Review ${link} - to unblock: \`UPDATE products SET moderation = 'ok', deleted = false WHERE id = ${tool.id};\``
      : moderation?.status === 'not_a_fit'
        ? `ℹ️ ${who} is not a developer tool${score}: kept out of the weekly competition, offered a paid listing in "Other". ${link}`
        : `${who} [open the tool](${link})`;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch((err: Error) => console.error('Discord new-tool webhook failed:', err.message));
}

export interface SiteHealthChange {
  id: number;
  name: string;
  slug: string;
  website: string;
  from: string;
  to: 'ok' | 'dead' | 'hijacked';
  reason: string | null;
}

// Website health changes (tools hidden or restored), batched into as few messages as Discord allows.
export async function reportSiteHealth(changes: SiteHealthChange[], intro?: string) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook || !changes.length) return;
  const line = (c: SiteHealthChange) =>
    c.to === 'ok'
      ? `✅ **${c.name}** is back online, visible again: https://devhunt.org/tool/${c.slug}`
      : `${c.to === 'hijacked' ? '🏴‍☠️' : '💀'} **${c.name}** hidden, website ${c.to}: ${c.reason ?? ''} <${c.website}> · restore: \`UPDATE products SET site_status = 'ok' WHERE id = ${c.id};\``;
  const messages: string[] = intro ? [intro] : [];
  for (const text of changes.map(line)) {
    const last = messages[messages.length - 1];
    if (last && last.length + text.length + 1 <= 1900) messages[messages.length - 1] = `${last}\n${text}`;
    else messages.push(text.slice(0, 1900));
  }
  for (const content of messages) {
    await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) }).catch(
      (err: Error) => console.error('Discord site-health webhook failed:', err.message),
    );
    await new Promise(r => setTimeout(r, 800)); // stay under Discord's webhook rate limit
  }
}

// Scheduled job problems (failed runs, half-sent emails). Never throws.
export async function reportCronProblem(job: string, text: string) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `⏰ Cron **${job}**: ${text}`.slice(0, 1900), allowed_mentions: { parse: [] } }),
  }).catch((err: Error) => console.error('Discord cron webhook failed:', err.message));
}

// A comment that was shadow-blocked (the author thinks it was posted). Lets us spot false positives.
export async function reportShadowComment(info: { username: string; toolName: string; toolSlug: string; reason: string; score: number | null; content: string }) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  const score = info.score === null ? '' : ` ${info.score.toFixed(2)}`;
  const text = `🕳️ Shadow-blocked comment (${info.reason}${score}) by @${info.username} on **${info.toolName}** <https://devhunt.org/tool/${info.toolSlug}>:\n> ${info.content.slice(0, 900).replace(/\n/g, '\n> ')}`;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text.slice(0, 1900), allowed_mentions: { parse: [] } }),
  }).catch((err: Error) => console.error('Discord comment webhook failed:', err.message));
}
