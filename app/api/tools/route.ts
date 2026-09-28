import { NextResponse } from 'next/server';
import createSlug from '@/utils/createSlug';
import { planLaunch, type SubmitType } from '@/utils/launchPlanning';
import { getRouteUser } from '@/utils/server/auth';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';
import { announceNewTool } from '@/utils/server/discord';
import { trackFunnel } from '@/utils/server/funnel';
import { moderateSubmission } from '@/utils/server/jev';
import { incompleteReason, moderationDecision } from '@/utils/moderation';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';

export const dynamic = 'force-dynamic';

interface SubmitBody {
  name?: string;
  slogan?: string;
  website?: string;
  githubUrl?: string;
  description?: string;
  pricingType?: number;
  logoUrl?: string;
  assetUrls?: string[];
  demoVideoUrl?: string;
  categoryIds?: number[];
  week?: string; // weekKey (YYYY-MM-DD) of the chosen week
  submitType?: SubmitType;
}

const isHttpUrl = (value?: string) => {
  try {
    return !!value && ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Submits a new tool. The launch week is decided here (not in the browser), so nobody can pick
// an arbitrary slot or mark a tool as paid.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await withinLimit(`submit:${user.id}`, 10, 86400))) return tooManyRequests('Too many submissions today, please try again tomorrow.');

  const body = (await req.json().catch(() => ({}))) as SubmitBody;
  const name = body.name?.trim();
  const slug = name ? createSlug(name) : '';
  if (!name || !slug || !body.slogan?.trim() || !body.description?.trim() || !isHttpUrl(body.website) || !body.logoUrl || !body.pricingType) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  if (!Array.isArray(body.assetUrls) || body.assetUrls.length === 0) {
    return NextResponse.json({ error: 'Please add at least one screenshot.' }, { status: 400 });
  }
  const submitType: SubmitType = ['free', 'normal', 'paid'].includes(body.submitType as string) ? (body.submitType as SubmitType) : 'free';

  // Placeholder/test submissions are refused before anything is saved, so the maker can fix and resubmit.
  const incomplete = incompleteReason({ name, slogan: body.slogan!.trim(), description: body.description!, website: body.website! });
  if (incomplete) return NextResponse.json({ error: incomplete }, { status: 400 });

  const { data: existing } = await serviceClient.from('products').select('id').eq('slug', slug).maybeSingle();
  if (existing) return NextResponse.json({ error: 'A tool with this name already exists, please use another name.' }, { status: 409 });

  // Moderation (JEV), before saving: an obvious placeholder is refused here; banned topics and fake
  // listings are saved blocked and hidden until reviewed; non-dev tools stay out of the weekly
  // competition (and the free queue) and can pay for a listing in "Other".
  const answers = await moderateSubmission({ name, slogan: body.slogan, description: body.description, website: body.website });
  const decision = moderationDecision(answers);
  if (decision.status === 'incomplete') {
    console.log(JSON.stringify({ event: 'tool_refused', reason: 'incomplete', name, url: body.website, p: answers.listingProbability }));
    return NextResponse.json(
      { error: "This looks like a test or an unfinished submission. Please enter your tool's real name, website and a description of what it does." },
      { status: 400 },
    );
  }

  const plan = planLaunch(await getUpcomingWeeks(), body.week, submitType);
  if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 });

  const { data: product, error } = await serviceClient
    .from('products')
    .insert({
      name,
      slug,
      slogan: body.slogan!.trim(),
      description: body.description!,
      demo_url: body.website,
      github_url: body.githubUrl || null,
      pricing_type: body.pricingType,
      logo_url: body.logoUrl,
      asset_urls: body.assetUrls.slice(0, 3), // the tool page shows at most 3 media
      demo_video_url: body.demoVideoUrl?.trim() || null,
      owner_id: user.id,
      is_draft: false,
      isPaid: false,
      comments_count: 0,
      votes_count: 0,
      launch_date: plan.launch.startDate,
      launch_start: plan.launch.startDate,
      launch_end: plan.launch.endDate,
      week: plan.launch.week,
      paid_launch_date: plan.paidWeek,
    })
    .select('id, name, slug, launch_date, launch_end')
    .single();
  if (error || !product) {
    console.error('tool insert failed:', error?.message);
    return NextResponse.json({ error: 'Could not save the tool, please try again.' }, { status: 500 });
  }

  const categoryIds = (body.categoryIds ?? []).filter(id => Number.isInteger(id));
  if (categoryIds.length) {
    await serviceClient.from('product_category_product').insert(categoryIds.map(category_id => ({ product_id: product.id, category_id })));
  }

  const { data: profile } = await serviceClient.from('profiles').select('full_name').eq('id', user.id).single();
  await serviceClient
    .from('products')
    .update({
      dev_tool_score: answers.devToolScore,
      moderation: decision.status,
      moderation_reason: decision.reason,
      ...(decision.status === 'blocked' ? { deleted: true, deleted_at: new Date().toISOString() } : {}),
    } as never)
    .eq('id', product.id);
  if (decision.status === 'not_a_fit') {
    const { data: other } = await serviceClient.from('product_categories').select('id').eq('name', 'Other').maybeSingle();
    await serviceClient.from('product_category_product').delete().eq('product_id', product.id);
    if (other) await serviceClient.from('product_category_product').insert({ product_id: product.id, category_id: other.id });
  }
  const status = decision.status as Exclude<typeof decision.status, 'incomplete'>; // incomplete returned above
  await announceNewTool(product, profile?.full_name ?? null, {
    ...decision,
    status,
    devToolScore: answers.devToolScore,
    topicProbability: decision.reason === 'fake' ? answers.listingProbability : answers.topicProbability,
  });
  await trackFunnel({
    step: 'tool_created',
    userId: user.id,
    productId: product.id,
    props: { name: product.name, url: body.website, moderation: decision.status, reason: decision.reason ?? undefined, dev_score: answers.devToolScore ?? undefined },
  });
  console.log(JSON.stringify({ event: 'tool_submitted', tool: product.id, moderation: decision.status, reason: decision.reason, score: answers.devToolScore }));

  return NextResponse.json({ product, paid: submitType === 'paid', moderation: decision.status, moderationReason: decision.reason });

}
