import { NextResponse } from 'next/server';
import createSlug from '@/utils/createSlug';
import { planLaunch, type SubmitType } from '@/utils/launchPlanning';
import { getRouteUser } from '@/utils/server/auth';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';
import { announceNewTool } from '@/utils/server/discord';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

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

  const { data: existing } = await serviceClient.from('products').select('id').eq('slug', slug).maybeSingle();
  if (existing) return NextResponse.json({ error: 'A tool with this name already exists, please use another name.' }, { status: 409 });

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
      asset_urls: body.assetUrls,
      demo_video_url: body.demoVideoUrl || `https://app.paracast.io/api/getPromoVideoFromSiteUrl/?project_url=${body.website}`,
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
  await announceNewTool(product, profile?.full_name ?? null);

  return NextResponse.json({ product, paid: submitType === 'paid' });
}
