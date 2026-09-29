import baseTemplate from '@/utils/email-templates/new-tools-launch-reminder-email-template';
import { applyEmailSponsorAd, type EmailSponsorAdConfig } from '@/utils/email-templates/email-sponsor-ad';
import { minifyEmailHtml } from '@/utils/email-templates/minify-email-html';

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
  const desc = escapeHtml(plainDescription(tool.description, 140));
  const logo = tool.logo_url?.trim() || 'https://devhunt.org/favicon.ico';
  const logoSafe = escapeHtml(logo);
  return block
    .replaceAll('{linkhere}', slug)
    .replaceAll('{imageurlhere}', logoSafe)
    .replaceAll('{alttexthere}', name)
    .replaceAll('{Company Name}', name)
    .replaceAll('{Description here}', desc);
}

// Paid "other" tools (not for developers, not in the vote): one compact line each, under the contestants.
function othersBlock(others: LaunchReminderToolInput[]): string {
  if (!others.length) return '';
  const rows = others
    .map(t => {
      const href = `https://devhunt.org/tool/${escapeHtml(t.slug)}?utm_source=newsletter`;
      return `<tr><td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5"><a href="${href}" style="color:#f1f5f9;font-weight:bold;text-decoration:none">${escapeHtml(t.name)}</a><span style="color:#94a3b8"> · ${escapeHtml(plainDescription(t.description, 90))}</span></td></tr>`;
    })
    .join('');
  // Same dark 600px band as the tool blocks above.
  return `<table role="presentation" bgcolor="#11172c" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" class="responsive-table" bgcolor="#11172c" width="600" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 15px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#f97316">Also launching this week</td></tr>${rows}</table></td></tr></table></td></tr></table><br/>`;
}

// `sponsor`: a paid newsletter ad; without one the saved house ad (ListingBott) is used.
// `others`: paid "other" tools launching this week, listed after the contestants.
export function renderNewToolsLaunchReminderEmail(tools: LaunchReminderToolInput[], sponsor?: EmailSponsorAdConfig, others: LaunchReminderToolInput[] = []): string {
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
      : tools.map(t => fillOneToolBlock(toolBlock, t)).join('');

  return minifyEmailHtml(applyEmailSponsorAd(`${before}${toolsHtml}${othersBlock(others)}${after}`, sponsor));
}
