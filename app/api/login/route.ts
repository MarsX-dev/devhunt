import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/utils/supabase/types';

// Only accounts created this recently count as a fresh sign-up (the client calls this on first sign-in).
const NEW_SIGNUP_WINDOW_MS = 30 * 60 * 1000;

// Called by the client after a user's first sign-in: sends the welcome email and the Discord
// new-user message. Name and email come from the session, never from the request body.
export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (Date.now() - new Date(user.created_at).getTime() > NEW_SIGNUP_WINDOW_MS) {
    return NextResponse.json({ data: 'skipped' });
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single();
  const fullName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? '';

  const params = new URLSearchParams({
    apikey: process.env.WELCOME_EMAIL_API_KEY ?? '',
    name: fullName,
    tag: 'api',
    email: user.email,
    formid: process.env.SIGNUP_FORM_ID ?? '',
  });
  // Never log this URL: it carries the webhook API key.
  const welcome = await fetch(`https://cron.ventryweather.com/webhook-devhunt.php?${params.toString()}`).catch(
    (err: Error) => err,
  );
  if (welcome instanceof Error || !welcome.ok) {
    console.error('Welcome email webhook failed:', welcome instanceof Error ? welcome.message : welcome.status);
  }

  const discordWebhook = process.env.DISCORD_USER_WEBHOOK;
  if (discordWebhook && profile?.username) {
    await fetch(discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**${fullName}** [open the profile](https://devhunt.org/@${profile.username})` }),
    }).catch((err: Error) => console.error('Discord new-user webhook failed:', err.message));
  }

  return NextResponse.json({ data: 'ok' });
}
