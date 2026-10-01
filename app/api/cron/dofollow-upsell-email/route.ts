import { Resend } from 'resend';
import { cronRoute, sendOnce } from '@/utils/server/cronJob';
import { renderUpsellEmail, type UpsellStage } from '@/utils/email-templates/dofollow-upsell-email';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Cron-triggered (vercel.json, daily with retries): never prerender at build time.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const JOB = 'dofollow-upsell-email';
const DAY = 86400000;
// One email only, to tools submitted 1-3 days ago (the window covers missed runs). No follow-up: we don't nag.
const STAGES: { stage: UpsellStage; from: number; to: number }[] = [{ stage: 'day1', from: 3, to: 1 }];

// Free submissions still unpaid: tell the owner their link is nofollow and offer a paid launch (from $19).
// Each person gets it once ever, keyed by email in cron_sends (even with several free tools). ?dry=1 lists who would get what, without sending.
// Not behind the EMAIL_CRONS_ENABLED switch: no old system sends this one.
export const GET = cronRoute(JOB, async () => {
  return run(false);
}, { alwaysOn: true });

export async function POST(req: Request) {
  // Manual dry run: same auth as the cron, nothing is sent.
  return cronRoute(`${JOB}-dry`, () => run(true))(req);
}

async function run(dry: boolean) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result: Record<string, unknown> = {};
  for (const { stage, from, to } of STAGES) {
    const { data, error } = await serviceClient
      .from('products')
      .select('id, name, slug, owner_id, launch_start, moderation, site_status')
      .eq('deleted', false)
      .eq('isPaid', false)
      .gte('created_at', new Date(Date.now() - from * DAY).toISOString())
      .lt('created_at', new Date(Date.now() - to * DAY).toISOString())
      .limit(300);
    if (error) throw new Error(`products query failed: ${error.message}`);
    const tools = ((data ?? []) as any[]).filter(t => t.moderation !== 'blocked' && (!t.site_status || t.site_status === 'ok'));

    const outcomes: string[] = [];
    for (const tool of tools) {
      const { data: owner } = await serviceClient.auth.admin.getUserById(tool.owner_id);
      const email = owner?.user?.email;
      if (!email) continue;
      const fullName = (owner?.user?.user_metadata?.full_name as string | undefined) ?? '';
      const mail = renderUpsellEmail({
        stage,
        firstName: fullName.split(' ')[0] || null,
        toolName: tool.name,
        slug: tool.slug,
        launchStart: tool.launch_start,
        notAFit: tool.moderation === 'not_a_fit',
      });
      if (dry) {
        outcomes.push(`${tool.slug} -> ${email}: ${mail.subject}`);
        continue;
      }
      const sent = await sendOnce(JOB, 'once', email.toLowerCase(), async () => {
        const { error: sendError } = await resend.emails.send({
          from: 'John from DevHunt <hey@devhunt.org>',
          to: email,
          replyTo: 'hey@devhunt.org',
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        if (sendError) throw new Error(`Resend (${tool.slug}): ${sendError.message}`);
      });
      outcomes.push(`${tool.slug}: ${sent}`);
    }
    result[stage] = dry ? outcomes : { candidates: tools.length, sent: outcomes.filter(o => o.endsWith(': sent')).length };
  }
  return result;
}
