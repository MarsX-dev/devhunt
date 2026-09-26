// Posts the "new tool" message to Discord. DISCOR_TOOL_WEBHOOK is the historical (misspelled) name.
export async function announceNewTool(tool: { name: string; slug: string }, makerName: string | null) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `**${tool.name}** by ${makerName ?? 'someone'} [open the tool](https://devhunt.org/tool/${tool.slug})` }),
  }).catch((err: Error) => console.error('Discord new-tool webhook failed:', err.message));
}
