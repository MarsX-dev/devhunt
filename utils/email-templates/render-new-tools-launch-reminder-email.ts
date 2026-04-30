import baseTemplate from '@/utils/email-templates/new-tools-launch-reminder-email-template';

const START_MARKER = '<!-- START OF CONTENT -->';
const END_MARKER = '<!-- END OF CONTENT -->';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function plainDescription(htmlOrText: string | null | undefined, maxLen: number): string {
  const raw = (htmlOrText ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1)}…`;
}

export type LaunchReminderToolInput = {
  slug: string;
  name: string;
  description: string | null | undefined;
  logo_url: string | null | undefined;
};

function fillOneToolBlock(block: string, tool: LaunchReminderToolInput): string {
  const slug = escapeHtml(tool.slug) + '?utm_source=newsletter';
  const name = escapeHtml(tool.name);
  const desc = escapeHtml(plainDescription(tool.description, 220));
  const logo = tool.logo_url?.trim() || 'https://devhunt.org/favicon.ico';
  const logoSafe = escapeHtml(logo);
  return block
    .replaceAll('{linkhere}', slug)
    .replaceAll('{imageurlhere}', logoSafe)
    .replaceAll('{alttexthere}', name)
    .replaceAll('{Company Name}', name)
    .replaceAll('{Description here}', desc);
}

export function renderNewToolsLaunchReminderEmail(tools: LaunchReminderToolInput[]): string {
  const start = baseTemplate.indexOf(START_MARKER);
  const end = baseTemplate.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Launch reminder template missing content markers');
  }

  const before = baseTemplate.slice(0, start + START_MARKER.length);
  const blockWithWhitespace = baseTemplate.slice(start + START_MARKER.length, end);
  const after = baseTemplate.slice(end);
  const toolBlock = blockWithWhitespace.trim();

  const toolsHtml =
    tools.length === 0
      ? '<p style="color:#94a3b8;font-family:Helvetica,Arial,sans-serif;font-size:16px;padding:12px 15px">No tools scheduled for this launch week yet.</p>'
      : tools.map(t => fillOneToolBlock(toolBlock, t)).join('\n');

  return `${before}\n${toolsHtml}\n${after}`;
}
