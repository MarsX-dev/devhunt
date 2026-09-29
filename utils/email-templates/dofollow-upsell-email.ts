// Upsell for free submissions: their link is nofollow; $49 gets a dofollow backlink (and, for tools in
// the free queue, a launch in one of the next weeks). Sent by /api/cron/dofollow-upsell-email, 1 and 7
// days after submitting, only while the tool is still unpaid.

export type UpsellStage = 'day1' | 'day7';

export interface UpsellInput {
  stage: UpsellStage;
  firstName: string | null;
  toolName: string;
  slug: string;
  launchStart: string | null; // free queue date
  notAFit: boolean; // an "other" tool: launches in "Also launching this week", doesn't compete
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const date = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function renderUpsellEmail(input: UpsellInput): { subject: string; html: string; text: string } {
  const tool = escape(input.toolName);
  const url = `https://devhunt.org/account/tools/activate-launch/${encodeURIComponent(input.slug)}?utm_source=email&utm_medium=email&utm_campaign=dofollow-${input.stage}`;
  const upcoming = input.launchStart && Date.parse(input.launchStart) > Date.now() ? date(input.launchStart) : null;
  const launched = input.launchStart && !upcoming ? date(input.launchStart) : null;

  const where = input.notAFit
    ? upcoming
      ? `${tool} launches on DevHunt on <b>${upcoming}</b>, in the "Also launching this week" list on the home page.`
      : `${tool} is listed on DevHunt${launched ? ` (launched ${launched})` : ''}.`
    : upcoming
      ? `${tool} is in the free launch queue on DevHunt, launching on <b>${upcoming}</b>.`
      : `${tool} is listed on DevHunt${launched ? ` (launched ${launched})` : ''}.`;
  const perks = [
    '<b>A dofollow backlink</b> from DevHunt (domain rating 65), permanent',
    ...(input.notAFit
      ? [
          'A spot in the DevHunt newsletter to 40,000+ developers and a post on our X account',
          upcoming ? `<b>Launch in a week you pick</b> in the next 4 weeks` : '<b>A new launch week</b> of your choice',
        ]
      : [
          upcoming ? `<b>Launch in the next few weeks</b>, you pick the week, instead of ${upcoming}` : '<b>A new launch week</b> of your choice, with a fresh shot at tool of the week',
          'A home page spotlight and a spot in our morning newsletter',
          'A rich launch page with your awards, reviews and press',
        ]),
    'One-time $49, no subscription',
  ];

  const subject =
    input.stage === 'day1' ? `${input.toolName}'s link on DevHunt is nofollow` : `Last reminder: a dofollow backlink for ${input.toolName}`;
  const intro =
    input.stage === 'day1'
      ? `${where} One thing you should know: free listings link to your site with <code>rel="nofollow"</code>, so search engines don't count them as a backlink.`
      : `Quick last note about ${tool}: its DevHunt link is still nofollow, so it passes no SEO value to your site. Here's what $49 changes:`;
  const cta = 'Upgrade for $49';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
        <tr><td style="padding:28px 28px 8px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;">
          <p style="margin:0 0 14px;">Hi ${escape(input.firstName || 'there')},</p>
          <p style="margin:0 0 14px;">${intro}</p>
          ${input.stage === 'day1' ? '<p style="margin:0 0 10px;">Upgrade and you get:</p>' : ''}
          <ul style="margin:0 0 20px;padding-left:20px;">
            ${perks.map(p => `<li style="margin:0 0 6px;">${p}</li>`).join('\n            ')}
          </ul>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;padding:12px 22px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;">${cta}</a>
          </p>
          <p style="margin:0 0 14px;">Questions? Just reply to this email.</p>
          <p style="margin:0 0 24px;">John<br /><span style="color:#64748b;">DevHunt</span></p>
        </td></tr>
        <tr><td style="padding:0 28px 24px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;">
          You got this because you submitted ${tool} to <a href="https://devhunt.org/tool/${encodeURIComponent(input.slug)}" style="color:#94a3b8;">DevHunt</a>.
          ${input.stage === 'day1' ? 'We send one more reminder at most.' : 'This is the last one.'}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const text = [
    `Hi ${input.firstName || 'there'},`,
    '',
    strip(intro),
    '',
    ...perks.map(p => `- ${strip(p)}`),
    '',
    `${cta}: ${url}`,
    '',
    'Questions? Just reply to this email.',
    '',
    'John, DevHunt',
  ].join('\n');
  return { subject, html, text };
}
