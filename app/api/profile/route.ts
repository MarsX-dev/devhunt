import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { profileCacheTag } from '@/utils/routeExists';
import { buildLinks, normalizeUrl, type LinksInput } from '@/utils/socialLinks';
import { type Database, type UpdateProfile } from '@/utils/supabase/types';

export const dynamic = 'force-dynamic';

type Errors = Record<string, string>;
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, 20) : undefined);

// Saves the signed-in user's own profile (the id comes from the session). Links arrive as typed and are stored in
// one format (utils/socialLinks.ts). Only the fields sent are changed, so the onboarding modal can send fewer.
// Writes with the user's own client, so the profiles RLS policies still apply.
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const errors: Errors = {};
  const update: UpdateProfile = {};

  const fullName = text(body.full_name);
  if (fullName !== undefined) {
    if (fullName.length < 2) errors.full_name = 'Please enter your full name.';
    update.full_name = fullName.slice(0, 100);
  }
  const username = text(body.username);
  if (username !== undefined) {
    if (username.length < 4) errors.username = 'The username should be at least 4 characters.';
    update.username = username;
  }
  const headline = text(body.headline);
  if (headline !== undefined) update.headline = headline.slice(0, 160) || null;
  const about = text(body.about);
  if (about !== undefined) {
    if (about.length >= 500) errors.about = `Please keep it under 500 characters (now ${about.length}).`;
    update.about = about || null;
  }
  const website = text(body.website_url);
  if (website !== undefined) {
    const url = website ? normalizeUrl(website) : null;
    if (website && !url) errors.website_url = "That doesn't look like a website address.";
    update.website_url = url;
  }

  if (body.links && typeof body.links === 'object') {
    const input: LinksInput = { x: text(body.links.x), github: text(body.links.github), linkedin: text(body.links.linkedin), more: strings(body.links.more) };
    const github = user.identities?.find(identity => identity.provider === 'github')?.identity_data?.user_name;
    const built = buildLinks(input, typeof github === 'string' ? github : null);
    for (const [field, message] of Object.entries(built.errors)) errors[field] = message as string;
    // A link is what the onboarding modal asks for (social_url == null reopens it).
    if (!built.social_url && !errors.x && !errors.github && !errors.linkedin && !errors.more)
      errors.links = 'Add at least one link: X, GitHub, LinkedIn or any other profile.';
    update.social_links = built.social_links;
    update.social_url = built.social_url;
  }

  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });

  const { data: before } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
  const { data, error } = await supabase.from('profiles').update(update as never).eq('id', user.id).select().single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ errors: { username: 'This username is already taken, please pick another.' } }, { status: 409 });
    if (error.code === '23514' && /username/.test(error.message)) return NextResponse.json({ errors: { username: 'The username is too short.' } }, { status: 400 });
    console.error('profile save failed:', error.message);
    return NextResponse.json({ error: 'Could not save your profile, please try again.' }, { status: 500 });
  }
  // The public page (and its exists check) under both the old and the new username.
  const names = [(before as { username?: string | null } | null)?.username, (data as { username?: string | null } | null)?.username];
  names.forEach((name, i) => name && names.indexOf(name) === i && revalidateTag(profileCacheTag(name)));
  return NextResponse.json({ profile: data });
}
