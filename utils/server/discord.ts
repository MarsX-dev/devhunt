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
