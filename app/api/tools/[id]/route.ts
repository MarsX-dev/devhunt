import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { moderateSubmission } from '@/utils/server/jev';
import { reportBlockedEdit } from '@/utils/server/discord';
import { moderationDecision } from '@/utils/moderation';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import addHttpsToUrl from '@/utils/addHttpsToUrl';

export const dynamic = 'force-dynamic';

interface EditBody {
  name?: string;
  slogan?: string;
  description?: string;
  website?: string;
  githubUrl?: string | null;
  pricingType?: number;
  logoUrl?: string;
  assetUrls?: string[];
  demoVideoUrl?: string | null;
  categoryIds?: number[];
}

const isHttpUrl = (value?: string | null) => {
  try {
    return !!value && ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Owners edit their tool here (not straight from the browser), so edits get the same checks and
// moderation as a new submission: an approved tool can't be edited into a banned topic afterwards.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await withinLimit(`tool-edit:${user.id}`, 30, 3600))) return tooManyRequests('Too many edits, please try again later.');

  const id = Number(params.id);
  const { data: tool } = await serviceClient
    .from('products')
    .select('id, owner_id, name, slug, slogan, description, demo_url, logo_url, asset_urls, deleted, moderation')
    .eq('id', id)
    .maybeSingle();
  if (!tool || tool.deleted || tool.owner_id !== user.id) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as EditBody;
  const name = body.name?.trim() ?? '';
  const slogan = body.slogan?.trim() ?? '';
  const description = body.description ?? '';
  // Links without a scheme (many tools were saved as "example.com") get https://, as the site shows them.
  const web = (value?: string | null) => (value?.trim() ? addHttpsToUrl(value) : null);
  const website = web(body.website);
  const githubUrl = web(body.githubUrl);
  const demoVideoUrl = web(body.demoVideoUrl);
  // Images come from our uploader (https); older tools may keep what they already have.
  const assetUrls = Array.isArray(body.assetUrls) ? body.assetUrls : [];
  const kept = (url: string) => isHttpUrl(url) || (tool.asset_urls ?? []).includes(url);
  if (!name || name.length > 200 || !slogan || slogan.length > 500 || !description.trim() || description.length > 20000) {
    return NextResponse.json({ error: 'Please fill in the name, tagline and description.' }, { status: 400 });
  }
  if (!isHttpUrl(website)) return NextResponse.json({ error: 'Please use a valid website URL.' }, { status: 400 });
  if (!body.logoUrl || !(isHttpUrl(body.logoUrl) || body.logoUrl === tool.logo_url)) return NextResponse.json({ error: 'Please add a logo.' }, { status: 400 });
  if ((githubUrl && !isHttpUrl(githubUrl)) || (demoVideoUrl && !isHttpUrl(demoVideoUrl))) {
    return NextResponse.json({ error: 'Please use valid GitHub and video URLs.' }, { status: 400 });
  }
  if (!assetUrls.length || assetUrls.length > 20 || !assetUrls.every(kept)) {
    return NextResponse.json({ error: 'Please add at least one screenshot.' }, { status: 400 });
  }
  if (!Number.isInteger(body.pricingType)) return NextResponse.json({ error: 'Please pick a pricing type.' }, { status: 400 });

  // Only re-check what visitors read about the tool, and only when it changed.
  const textChanged = name !== tool.name || slogan !== tool.slogan || description !== tool.description || website !== web(tool.demo_url);
  if (textChanged) {
    const decision = moderationDecision(await moderateSubmission({ name, slogan, description, website }));
    if (decision.status === 'blocked') {
      const { data: profile } = await serviceClient.from('profiles').select('username').eq('id', user.id).maybeSingle();
      console.log(JSON.stringify({ event: 'tool_edit_blocked', tool: tool.id, user: user.id, reason: decision.reason }));
      await reportBlockedEdit({ kind: 'tool', username: profile?.username ?? null, toolName: tool.name, toolSlug: tool.slug, reason: decision.reason ?? 'banned topic', content: `${name} - ${slogan}\n${description}` });
      return NextResponse.json({ error: `This edit can't be saved: it looks like ${decision.reason}. Your tool keeps its current text.` }, { status: 422 });
    }
  }

  const { error } = await serviceClient
    .from('products')
    .update({
      name,
      slogan,
      description,
      demo_url: website,
      github_url: githubUrl,
      pricing_type: body.pricingType,
      logo_url: body.logoUrl,
      asset_urls: assetUrls,
      demo_video_url: demoVideoUrl,
    })
    .eq('id', tool.id);
  if (error) {
    // e.g. the database refusing scripts in the description.
    console.error('tool edit failed:', tool.id, error.message);
    return NextResponse.json({ error: error.code === '23514' ? 'The description contains something that is not allowed (scripts or links like javascript:).' : 'Could not save your changes, please try again.' }, { status: error.code === '23514' ? 400 : 500 });
  }

  // Tools that aren't developer tools stay listed in "Other" only.
  if (tool.moderation !== 'not_a_fit' && Array.isArray(body.categoryIds)) {
    const wanted = Array.from(new Set(body.categoryIds.filter(Number.isInteger))).slice(0, 10);
    const { data: valid } = wanted.length ? await serviceClient.from('product_categories').select('id').in('id', wanted) : { data: [] };
    await serviceClient.from('product_category_product').delete().eq('product_id', tool.id);
    if (valid?.length) await serviceClient.from('product_category_product').insert(valid.map(c => ({ product_id: tool.id, category_id: c.id })));
  }

  return NextResponse.json({ ok: true });
}
