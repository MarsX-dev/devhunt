// Posts the "new tool" message to Discord. DISCOR_TOOL_WEBHOOK is the historical (misspelled) name.
// devToolScore: JEV's 0..1 "is this a dev tool?" rating; low scores are flagged for review.
export async function announceNewTool(tool: { name: string; slug: string }, makerName: string | null, devToolScore: number | null = null) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content:
        `**${tool.name}** by ${makerName ?? 'someone'} [open the tool](https://devhunt.org/tool/${tool.slug})` +
        (devToolScore !== null && devToolScore < 0.4 ? `\n⚠️ Looks like it may not be a dev tool (JEV score ${devToolScore.toFixed(2)}) - please review.` : ''),
    }),
  }).catch((err: Error) => console.error('Discord new-tool webhook failed:', err.message));
}
